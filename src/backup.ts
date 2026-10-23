import { z } from "zod";
import { schemas, type Repository, type Snapshot, type Meta } from "./domain";
import { validateBusiness, type Entry } from "./business";
import { base64ToBytes, bytesToBase64, sha256 } from "./transfer";
import { documentBytes } from "./documents";
const meta = z.object({
  id: z.uuid(),
  company_id: z.uuid(),
  version: z.number().int().positive(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
});
export function cleanSnapshot(snapshot: Snapshot): Snapshot {
  const record = (kind: keyof typeof schemas, value: unknown) => ({
    ...schemas[kind].parse(value),
    ...meta.parse(value),
  });
  const result = {
    company: record("companies", snapshot.company),
    partners: snapshot.partners.map((p) => record("partners", p)),
    projects: snapshot.projects.map((p) => record("projects", p)),
    work_items: snapshot.work_items.map((w) => record("work_items", w)),
    entries: (snapshot.entries ?? []).map((e) => record("entries", e)),
  } as Snapshot;
  const ids = new Set<string>();
  for (const row of [
    result.company,
    ...result.partners,
    ...result.projects,
    ...result.work_items,
    ...result.entries,
  ]) {
    if (ids.has(row.id))
      throw new Error("Ismétlődő belső azonosító a csomagban.");
    ids.add(row.id);
    if (row.company_id !== result.company.id)
      throw new Error("Több vállalkozás adatai keverednek.");
  }
  for (const p of result.projects)
    if (p.customer_id && !result.partners.some((c) => c.id === p.customer_id))
      throw new Error("Hiányzó ügyfélkapcsolat.");
  for (const e of result.entries) {
    if (e.project_id && !result.projects.some((p) => p.id === e.project_id))
      throw new Error("Hiányzó projektkapcsolat.");
    if (
      e.payload.type === "document" &&
      !e.payload.file_key.startsWith(`${result.company.id}/`)
    )
      throw new Error("Idegen fájlterület a csomagban.");
    validateBusiness(e, result.entries, undefined, e.id);
  }
  return result;
}
export interface BusinessPackage {
  format: "erp-business";
  version: 2;
  created_at: string;
  snapshot: Snapshot;
  files: Record<string, string>;
  manifest: {
    records: number;
    files: number;
    bytes: number;
    sha256: Record<string, string>;
  };
}
export async function createPackage(
  repo: Repository,
): Promise<BusinessPackage> {
  const snapshot = cleanSnapshot(await repo.load());
  const files: Record<string, string> = {},
    hashes: Record<string, string> = {};
  let bytes = 0;
  for (const e of snapshot.entries) {
    if (e.payload.type !== "document" || files[e.payload.file_key]) continue;
    const raw = await documentBytes(repo, e);
    bytes += raw.length;
    if (bytes > 100 * 1024 * 1024)
      throw new Error(
        "Ez a böngészős mentési csomag legfeljebb 100 MB eredeti fájlt támogat. A teljes mentés nem készült el.",
      );
    files[e.payload.file_key] = bytesToBase64(raw);
    hashes[e.payload.file_key] = await sha256(raw);
  }
  return {
    format: "erp-business",
    version: 2,
    created_at: new Date().toISOString(),
    snapshot,
    files,
    manifest: {
      records:
        1 +
        snapshot.partners.length +
        snapshot.projects.length +
        snapshot.work_items.length +
        snapshot.entries.length,
      files: Object.keys(files).length,
      bytes,
      sha256: hashes,
    },
  };
}
async function key(pass: string, salt: Uint8Array) {
  const source = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pass),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new Uint8Array(salt),
      iterations: 310000,
    },
    source,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function encryptPackage(pack: BusinessPackage, pass: string) {
  if (pass.length < 12)
    throw new Error("A mentési jelszó legalább 12 karakter legyen.");
  const salt = crypto.getRandomValues(new Uint8Array(16)),
    iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode("erp-business-v2"),
    },
    await key(pass, salt),
    new TextEncoder().encode(JSON.stringify(pack)),
  );
  return new TextEncoder().encode(
    JSON.stringify({
      format: "erp-encrypted",
      version: 2,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      cipher: bytesToBase64(new Uint8Array(bytes)),
    }),
  );
}
export async function verifyPackage(
  bytes: Uint8Array,
  pass: string,
): Promise<BusinessPackage> {
  if (bytes.length > 180 * 1024 * 1024)
    throw new Error("Túl nagy mentési fájl.");
  const envelope = z
    .object({
      format: z.literal("erp-encrypted"),
      version: z.literal(2),
      salt: z.string(),
      iv: z.string(),
      cipher: z.string(),
    })
    .parse(JSON.parse(new TextDecoder().decode(bytes)));
  let pack: BusinessPackage;
  try {
    const plain = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToBytes(envelope.iv),
        additionalData: new TextEncoder().encode("erp-business-v2"),
      },
      await key(pass, base64ToBytes(envelope.salt)),
      base64ToBytes(envelope.cipher),
    );
    pack = JSON.parse(new TextDecoder().decode(plain));
  } catch {
    throw new Error("Hibás mentési jelszó vagy sérült csomag.");
  }
  if (pack.format !== "erp-business" || pack.version !== 2)
    throw new Error("Nem támogatott üzleti mentés.");
  pack.snapshot = cleanSnapshot(pack.snapshot);
  let size = 0;
  const expected = new Set<string>();
  for (const e of pack.snapshot.entries) {
    if (e.payload.type !== "document") continue;
    expected.add(e.payload.file_key);
    const content = pack.files[e.payload.file_key];
    if (!content) throw new Error(`Hiányzó fájl: ${e.payload.name}`);
    const raw = base64ToBytes(content),
      hash = await sha256(raw);
    if (
      hash !== e.payload.sha256 ||
      raw.length !== e.payload.size ||
      pack.manifest.sha256[e.payload.file_key] !== hash
    )
      throw new Error(`Hibás fájlellenőrző összeg: ${e.payload.name}`);
  }
  for (const k of expected) size += base64ToBytes(pack.files[k]).length;
  const count =
    1 +
    pack.snapshot.partners.length +
    pack.snapshot.projects.length +
    pack.snapshot.work_items.length +
    pack.snapshot.entries.length;
  if (
    pack.manifest.records !== count ||
    pack.manifest.files !== expected.size ||
    pack.manifest.bytes !== size ||
    Object.keys(pack.files).length !== expected.size
  )
    throw new Error("A mentési jegyzék nem egyezik a tartalommal.");
  return pack;
}
export interface ImportPlan {
  valid: Snapshot;
  errors: string[];
  duplicates: string[];
}
// Explicit exchange format. Unknown legacy formats are previewed/rejected, never guessed.
export function previewImport(value: unknown, current: Snapshot): ImportPlan {
  const object = value as {
    format?: string;
    version?: number;
    snapshot?: Snapshot;
  };
  if (
    object?.format !== "erp-exchange" ||
    object.version !== 2 ||
    !object.snapshot
  )
    throw new Error(
      "Ismeretlen exportformátum. A régi rendszer mezőit külön meg kell feleltetni; automatikus találgatás nincs.",
    );
  const candidate = cleanSnapshot(object.snapshot),
    duplicates: string[] = [],
    errors: string[] = [];
  if (candidate.company.id !== current.company.id)
    errors.push(
      "Más vállalkozás azonosítója: csak elkülönített próbavisszaállítás engedélyezett, nem éles összevonás.",
    );
  for (const e of candidate.entries) {
    if (!e.source_system || !e.source_id)
      errors.push(`Hiányzik a forrásazonosító: ${e.id}`);
    const old = current.entries.find(
      (r) =>
        r.source_system === e.source_system &&
        r.source_id === e.source_id &&
        e.source_id,
    );
    if (old) {
      duplicates.push(e.source_id);
      if (JSON.stringify(old.payload) !== JSON.stringify(e.payload))
        errors.push(`Módosult, egyeztetendő forrásrekord: ${e.source_id}`);
    }
  }
  return { valid: candidate, errors, duplicates };
}
