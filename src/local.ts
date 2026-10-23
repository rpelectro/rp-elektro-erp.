import {
  ConflictError,
  validate,
  type Company,
  type Data,
  type Kind,
  type Meta,
  type Repository,
  type Snapshot,
  type Tables,
  type SyncOperation,
} from "./domain";
import { validateBusiness, type Entry, immutable } from "./business";
import { bytesToBase64, base64ToBytes, sha256 } from "./transfer";

const DB_NAME = "rp-elektro-local-v1";
const ITERATIONS = 310000;
type Cipher = { iv: Uint8Array<ArrayBuffer>; bytes: ArrayBuffer };
type Row = Cipher & { key: string; version: number };
type Header = {
  key: "header";
  salt: Uint8Array<ArrayBuffer>;
  verifier: Cipher;
  iterations: number;
  companyId: string;
  queue?: boolean;
};
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const request = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
const done = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error ?? new Error("A helyi mentés megszakadt."));
  });
async function database(
  name = localStorage.getItem("erp-active-vault") ?? DB_NAME,
): Promise<IDBDatabase> {
  const req = indexedDB.open(name, 1);
  req.onupgradeneeded = () => {
    req.result.createObjectStore("meta", { keyPath: "key" });
    req.result.createObjectStore("records", { keyPath: "key" });
  };
  return request(req);
}
async function derive(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
) {
  const base = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
async function encrypt(
  key: CryptoKey,
  value: unknown,
  aad: string,
): Promise<Cipher> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(aad) },
    key,
    encoder.encode(JSON.stringify(value)),
  );
  return { iv, bytes };
}
async function decrypt<T>(
  key: CryptoKey,
  cipher: Cipher,
  aad: string,
): Promise<T> {
  const bytes = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: cipher.iv, additionalData: encoder.encode(aad) },
    key,
    cipher.bytes,
  );
  return JSON.parse(decoder.decode(bytes)) as T;
}
export async function localExists() {
  const db = await database();
  try {
    return !!(await request(
      db.transaction("meta").objectStore("meta").get("header"),
    ));
  } finally {
    db.close();
  }
}
export interface LocalRepository extends Repository {
  operations(): Promise<SyncOperation[]>;
  acknowledge(id: string): Promise<void>;
  refresh(snapshot: Snapshot): Promise<void>;
  resolveOperations(
    operation: SyncOperation,
    server: Tables[Kind] | null,
    choice: "local" | "server",
  ): Promise<void>;
}
export async function openLocal(
  passphrase: string,
  create = false,
  options: {
    name?: string;
    seed?: Snapshot;
    files?: Record<string, string>;
    queue?: boolean;
  } = {},
): Promise<LocalRepository> {
  if (create && passphrase.length < 12)
    throw new Error("Legalább 12 karakteres jelszó szükséges.");
  const db = await database(options.name);
  try {
    let header: Header | undefined = await request(
      db.transaction("meta").objectStore("meta").get("header"),
    );
    let key: CryptoKey;
    if (create) {
      if (header)
        throw new Error(
          "Már létezik helyi adattár. A meglévő jelszóval nyisd meg.",
        );
      const salt = crypto.getRandomValues(new Uint8Array(16));
      key = await derive(passphrase, salt, ITERATIONS);
      const companyId = options.seed?.company.id ?? crypto.randomUUID();
      header = {
        key: "header",
        salt,
        iterations: ITERATIONS,
        companyId,
        queue: options.queue ?? false,
        verifier: await encrypt(key, "RP-ELEKTRO-LOCAL-V1", "verifier"),
      };
      const now = new Date().toISOString();
      const company: Company = {
        id: companyId,
        company_id: companyId,
        version: 1,
        created_at: now,
        updated_at: now,
        name: "RP Elektro · próba",
        email: "",
        phone: "",
        address: "",
        tax_number: "",
        tax_mode: "unknown",
        billing_mode: "manual",
      };
      const initial = options.seed?.company ?? company;
      const encrypted = await encrypt(key, initial, `companies/${companyId}`);
      const seeded = options.seed
        ? await Promise.all(
            (
              ["partners", "projects", "work_items", "entries"] as const
            ).flatMap((kind) =>
              options.seed![kind].map(async (value) => ({
                key: `${kind}/${value.id}`,
                version: value.version,
                ...(await encrypt(key, value, `${kind}/${value.id}`)),
              })),
            ),
          )
        : [];
      const files = await Promise.all(
        Object.entries(options.files ?? {}).map(async ([fileKey, value]) => ({
          key: `file/${fileKey}`,
          version: 1,
          ...(await encrypt(key, value, `file/${fileKey}`)),
        })),
      );
      const tx = db.transaction(["meta", "records"], "readwrite");
      const complete = done(tx);
      // add is deliberate: a simultaneous tab must not replace a newly created vault.
      tx.objectStore("meta").add(header);
      tx.objectStore("records").add({
        key: `companies/${companyId}`,
        version: initial.version,
        ...encrypted,
      });
      for (const row of [...seeded, ...files])
        tx.objectStore("records").add(row);
      await complete;
    } else {
      if (!header)
        throw new Error("Még nincs helyi adattár. Először hozd létre.");
      key = await derive(passphrase, header.salt, header.iterations);
      try {
        if (
          (await decrypt(key, header.verifier, "verifier")) !==
          "RP-ELEKTRO-LOCAL-V1"
        )
          throw new Error();
      } catch {
        throw new Error("Hibás jelszó vagy sérült helyi adattár.");
      }
    }
    const companyId = header.companyId;
    let closed = false;
    const assertOpen = () => {
      if (closed) throw new Error("Az adattár zárolva van.");
    };
    return {
      mode: header.queue ? "cloud" : "local",
      async load() {
        assertOpen();
        const rows: Row[] = await request(
          db.transaction("records").objectStore("records").getAll(),
        );
        const values = await Promise.all(
          rows
            .filter((row) =>
              [
                "companies",
                "partners",
                "projects",
                "work_items",
                "entries",
              ].includes(row.key.split("/")[0]),
            )
            .map(async (row) => {
              try {
                return {
                  kind: row.key.split("/")[0] as Kind,
                  value: await decrypt<Tables[Kind]>(key, row, row.key),
                };
              } catch {
                throw new Error(
                  "Egy helyi rekord sérült. A betöltés megszakadt.",
                );
              }
            }),
        );
        const company = values.find((v) => v.kind === "companies")?.value as
          Company | undefined;
        if (!company) throw new Error("Hiányzik a vállalkozás rekordja.");
        return {
          entries: values
            .filter((v) => v.kind === "entries")
            .map((v) => v.value),
          company,
          partners: values
            .filter((v) => v.kind === "partners")
            .map((v) => v.value),
          projects: values
            .filter((v) => v.kind === "projects")
            .map((v) => v.value),
          work_items: values
            .filter((v) => v.kind === "work_items")
            .map((v) => v.value),
        } as Snapshot;
      },
      async save<K extends Kind>(
        kind: K,
        input: Data<K>,
        id?: string,
        expectedVersion?: number,
      ): Promise<Tables[K]> {
        assertOpen();
        const data = validate(kind, input);
        const revision = (await request(
          db.transaction("meta").objectStore("meta").get("revision"),
        )) as { value: number } | undefined;
        if (kind === "entries") {
          const rows: Row[] = await request(
            db.transaction("records").objectStore("records").getAll(),
          );
          const entries = await Promise.all(
            rows
              .filter((r) => r.key.startsWith("entries/"))
              .map((r) => decrypt<Entry>(key, r, r.key)),
          );
          validateBusiness(
            data as Data<"entries">,
            entries,
            entries.find((e) => e.id === id),
            id,
          );
          const p = (data as Data<"entries">).payload;
          if (p.type === "document" && !p.file_key.startsWith(`${companyId}/`))
            throw new Error("A fájl más vállalkozás területére mutat.");
        }
        if (
          kind === "projects" &&
          (data as Data<"projects">).status === "completed"
        ) {
          const rows: Row[] = await request(
            db.transaction("records").objectStore("records").getAll(),
          );
          const entries = await Promise.all(
            rows
              .filter((r) => r.key.startsWith("entries/"))
              .map((r) => decrypt<Entry>(key, r, r.key)),
          );
          if (
            !entries.some(
              (e) =>
                e.project_id === id &&
                e.payload.type === "handover" &&
                e.payload.sealed &&
                Object.values(e.payload.checks).every(Boolean),
            )
          )
            throw new Error(
              "A lezáráshoz végleges, ellenőrzött átadási jegyzőkönyv szükséges.",
            );
        }
        if (kind === "companies" && id !== companyId)
          throw new Error("Érvénytelen vállalkozás.");
        const recordId = id ?? crypto.randomUUID();
        const recordKey = `${kind}/${recordId}`;
        const current: Row | undefined = await request(
          db.transaction("records").objectStore("records").get(recordKey),
        );
        if (
          id &&
          (expectedVersion === 0
            ? !!current
            : !current || current.version !== expectedVersion)
        )
          throw new ConflictError();
        const previous = current
          ? await decrypt<Meta>(key, current, recordKey)
          : undefined;
        const now = new Date().toISOString();
        const value = {
          ...data,
          id: recordId,
          company_id: companyId,
          version: (current?.version ?? 0) + 1,
          created_at: previous?.created_at ?? now,
          updated_at: now,
        } as Tables[K];
        const cipher = await encrypt(key, value, recordKey);
        const operation: SyncOperation = {
          operation_id: crypto.randomUUID(),
          table_name: kind,
          record_id: recordId,
          expected_version: current?.version ?? 0,
          data: data as Record<string, unknown>,
          sequence: (revision?.value ?? 0) + 1,
        };
        const opKey = `op/${operation.operation_id}`;
        const opCipher = header.queue
          ? await encrypt(key, operation, opKey)
          : null;
        const tx = db.transaction(["records", "meta"], "readwrite");
        const complete = done(tx);
        const store = tx.objectStore("records");
        let failure: Error | undefined;
        const fail = (error: Error) => {
          failure = error;
          tx.abort();
        };
        const check = store.get(recordKey);
        check.onsuccess = () => {
          const latest = check.result as Row | undefined;
          if ((latest?.version ?? 0) !== (current?.version ?? 0)) {
            fail(new ConflictError());
            return;
          }
          const guard = tx.objectStore("meta").get("revision");
          guard.onsuccess = () => {
            if ((guard.result?.value ?? 0) !== (revision?.value ?? 0)) {
              fail(new ConflictError());
              return;
            }
            tx.objectStore("meta").put({
              key: "revision",
              value: (revision?.value ?? 0) + 1,
            });
            if (opCipher)
              store.add({
                key: opKey,
                version: operation.sequence,
                ...opCipher,
              });
            if (kind === "entries" && (data as Data<"entries">).project_id) {
              const parent = store.get(
                `projects/${(data as Data<"entries">).project_id}`,
              );
              parent.onsuccess = () => {
                if (!parent.result) fail(new Error("A projekt nem található."));
                else
                  store.put({
                    key: recordKey,
                    version: value.version,
                    ...cipher,
                  });
              };
              return;
            }
            if (kind === "projects" && (data as Data<"projects">).customer_id) {
              const parent = store.get(
                `partners/${(data as Data<"projects">).customer_id}`,
              );
              parent.onsuccess = () => {
                if (!parent.result) fail(new Error("Az ügyfél nem található."));
                else
                  store.put({
                    key: recordKey,
                    version: value.version,
                    ...cipher,
                  });
              };
            } else
              store.put({ key: recordKey, version: value.version, ...cipher });
          };
        };
        try {
          await complete;
        } catch (error) {
          throw failure ?? error;
        }
        return value;
      },
      async putFile(bytes, mime) {
        assertOpen();
        if (bytes.byteLength > 10485760 || !bytes.byteLength)
          throw new Error("A fájl legfeljebb 10 MB lehet.");
        if (
          ![
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/webp",
          ].includes(mime)
        )
          throw new Error("Nem támogatott fájltípus.");
        const hash = await sha256(bytes);
        const name = `${companyId}/${hash}`;
        const recordKey = `file/${name}`;
        const cipher = await encrypt(key, bytesToBase64(bytes), recordKey);
        const tx = db.transaction("records", "readwrite");
        const complete = done(tx);
        tx.objectStore("records").put({
          key: recordKey,
          version: 1,
          ...cipher,
        });
        await complete;
        return name;
      },
      async getFile(name) {
        assertOpen();
        const row: Row | undefined = await request(
          db.transaction("records").objectStore("records").get(`file/${name}`),
        );
        if (!row) throw new Error("A fájl nincs ezen az eszközön.");
        return base64ToBytes(await decrypt<string>(key, row, `file/${name}`));
      },
      async operations() {
        assertOpen();
        const rows: Row[] = await request(
          db.transaction("records").objectStore("records").getAll(),
        );
        return Promise.all(
          rows
            .filter((r) => r.key.startsWith("op/"))
            .sort((a, b) => a.version - b.version)
            .map((r) => decrypt<SyncOperation>(key, r, r.key)),
        );
      },
      async acknowledge(id) {
        assertOpen();
        const tx = db.transaction("records", "readwrite");
        const complete = done(tx);
        tx.objectStore("records").delete(`op/${id}`);
        await complete;
      },
      async refresh(snapshot) {
        assertOpen();
        if (snapshot.company.id !== companyId)
          throw new Error(
            "Más vállalkozás adatai nem tölthetők ebbe az adattárba.",
          );
        const rev = await request(
          db.transaction("meta").objectStore("meta").get("revision"),
        );
        const records: [Kind, Tables[Kind]][] = [
          ["companies", snapshot.company],
          ...(
            ["partners", "projects", "work_items", "entries"] as const
          ).flatMap((kind) =>
            snapshot[kind].map((r) => [kind, r] as [Kind, Tables[Kind]]),
          ),
        ];
        const encrypted = await Promise.all(
          records.map(async ([kind, value]) => ({
            key: `${kind}/${value.id}`,
            version: value.version,
            ...(await encrypt(key, value, `${kind}/${value.id}`)),
          })),
        );
        const tx = db.transaction(["records", "meta"], "readwrite");
        const complete = done(tx);
        let error: Error | undefined;
        const check = tx.objectStore("meta").get("revision");
        check.onsuccess = () => {
          if ((check.result?.value ?? 0) !== (rev?.value ?? 0)) {
            error = new ConflictError();
            tx.abort();
            return;
          }
          const all = tx.objectStore("records").getAllKeys();
          all.onsuccess = () => {
            if (all.result.some((k) => String(k).startsWith("op/"))) {
              error = new Error(
                "Feltöltetlen munka mellett a helyi másolat nem cserélhető le.",
              );
              tx.abort();
              return;
            }
            for (const k of all.result)
              if (
                [
                  "companies",
                  "partners",
                  "projects",
                  "work_items",
                  "entries",
                ].includes(String(k).split("/")[0])
              )
                tx.objectStore("records").delete(k);
            for (const r of encrypted) tx.objectStore("records").put(r);
            tx.objectStore("meta").put({
              key: "revision",
              value: (rev?.value ?? 0) + 1,
            });
          };
        };
        try {
          await complete;
        } catch (e) {
          throw error ?? e;
        }
      },
      async resolveOperations(operation, server, choice) {
        assertOpen();
        const rows: Row[] = await request(
          db.transaction("records").objectStore("records").getAll(),
        );
        const ops = await Promise.all(
          rows
            .filter((r) => r.key.startsWith("op/"))
            .map((r) => decrypt<SyncOperation>(key, r, r.key)),
        );
        const related = ops.filter(
          (op) =>
            op.table_name === operation.table_name &&
            op.record_id === operation.record_id,
        );
        const recordKey = `${operation.table_name}/${operation.record_id}`,
          row = rows.find((r) => r.key === recordKey);
        const local = row
          ? await decrypt<Tables[Kind]>(key, row, recordKey)
          : null;
        if (!related.length || !local)
          throw new Error(
            "Az ütközés már megváltozott. Frissítsd az állapotot.",
          );
        const rev = await request(
          db.transaction("meta").objectStore("meta").get("revision"),
        );
        const next =
          choice === "server"
            ? server
            : {
                ...local,
                version: (server?.version ?? 0) + 1,
                updated_at: new Date().toISOString(),
              };
        const newOp: SyncOperation = {
          ...related[related.length - 1],
          operation_id: crypto.randomUUID(),
          expected_version: server?.version ?? 0,
          sequence: (rev?.value ?? 0) + 1,
        };
        const historyKey = `conflict/${crypto.randomUUID()}`,
          history = await encrypt(
            key,
            {
              local,
              server,
              operations: related,
              choice,
              date: new Date().toISOString(),
            },
            historyKey,
          );
        const replacement = next ? await encrypt(key, next, recordKey) : null;
        const opKey = `op/${newOp.operation_id}`,
          opCipher =
            choice === "local" ? await encrypt(key, newOp, opKey) : null;
        const tx = db.transaction(["records", "meta"], "readwrite");
        const complete = done(tx);
        let failure: Error | undefined;
        const check = tx.objectStore("meta").get("revision");
        check.onsuccess = () => {
          if ((check.result?.value ?? 0) !== (rev?.value ?? 0)) {
            failure = new ConflictError();
            tx.abort();
            return;
          }
          const store = tx.objectStore("records");
          for (const op of related) store.delete(`op/${op.operation_id}`);
          store.put({ key: historyKey, version: 1, ...history });
          if (next && replacement)
            store.put({
              key: recordKey,
              version: next.version,
              ...replacement,
            });
          else store.delete(recordKey);
          if (opCipher)
            store.put({ key: opKey, version: newOp.sequence, ...opCipher });
          tx.objectStore("meta").put({
            key: "revision",
            value: (rev?.value ?? 0) + 1,
          });
        };
        try {
          await complete;
        } catch (e) {
          throw failure ?? e;
        }
      },
      close() {
        closed = true;
        db.close();
      },
    };
  } catch (error) {
    db.close();
    throw error;
  }
}
