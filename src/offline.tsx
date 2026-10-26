import { useState, useEffect } from "react";
import {
  type Repository,
  type Tables,
  type Kind,
  type SyncConflict,
  friendly,
  ConflictError,
} from "./domain";
import { type LocalRepository, openLocal } from "./local";
import { type Context, useAction, Text, Check } from "./ui";
import { bytesToBase64 } from "./transfer";
import { documentBytes } from "./documents";
export function wrapOffline(
  local: LocalRepository,
  provider: () => Promise<Repository>,
): Repository {
  let conflicts: SyncConflict[] = [],
    lastSync = localStorage.getItem("erp-last-sync") ?? "";
  let running: Promise<void> | null = null;
  const run = async () => {
    if (!navigator.onLine)
      throw new Error("Nincs internet. A helyi mentések megmaradtak.");
    const remote = await provider();
    if (!remote.applyOperation)
      throw new Error("A szerver nem támogatja a műveletsort.");
    const ops = await local.operations();
    conflicts = [];
    const blocked = new Set<string>();
    for (const operation of ops) {
      const recordKey = `${operation.table_name}/${operation.record_id}`;
      if (blocked.has(recordKey)) continue;
      try {
        const payload = operation.data.payload as
          { type?: string; file_key?: string; mime?: string } | undefined;
        if (
          operation.table_name === "entries" &&
          payload?.type === "document" &&
          payload.file_key
        ) {
          const bytes = await local.getFile(payload.file_key);
          const stored = await remote.putFile(bytes, payload.mime!);
          if (stored !== payload.file_key)
            throw new Error("A feltöltött fájl azonosítója megváltozott.");
        }
        await remote.applyOperation(operation);
        await local.acknowledge(operation.operation_id);
      } catch (error) {
        if (error instanceof ConflictError) {
          const snapshot = await remote.load(),
            localSnapshot = await local.load();
          const rows =
            operation.table_name === "companies"
              ? [snapshot.company]
              : snapshot[operation.table_name];
          const locals =
            operation.table_name === "companies"
              ? [localSnapshot.company]
              : localSnapshot[operation.table_name];
          conflicts.push({
            operation,
            server: rows.find((r) => r.id === operation.record_id) ?? null,
            local: locals.find((r) => r.id === operation.record_id) ?? null,
            message: friendly(error),
          });
          blocked.add(recordKey);
          continue;
        }
        throw error;
      }
    }
    if ((await local.operations()).length === 0) {
      await local.refresh(await remote.load());
      lastSync = new Date().toISOString();
      localStorage.setItem("erp-last-sync", lastSync);
      window.dispatchEvent(new Event("erp-sync-complete"));
    }
  };
  const repo: Repository = {
    mode: "cloud",
    load: () => local.load(),
    async save(kind, data, id, version) {
      const saved = await local.save(kind, data, id, version);
      window.dispatchEvent(new Event("erp-local-saved"));
      return saved;
    },
    async deleteWorkItems(items) {
      if (!navigator.onLine)
        throw new Error("A törléshez internetkapcsolat szükséges.");
      if (running) await running;
      if ((await local.operations()).length || conflicts.length)
        throw new Error(
          "Törlés előtt szinkronizáld a helyi módosításokat és rendezd az ütközéseket.",
        );
      const remote = await provider();
      if (!remote.deleteWorkItems)
        throw new Error("Az adattár nem támogatja a törlést.");
      await remote.deleteWorkItems(items);
      await local.refresh(await remote.load());
      window.dispatchEvent(new Event("erp-sync-complete"));
    },
    putFile: (...args) => local.putFile(...args),
    async getFile(key) {
      try {
        return await local.getFile(key);
      } catch {
        if (!navigator.onLine)
          throw new Error("Ez a fájl nincs előkészítve offline használatra.");
        const remote = await provider(),
          bytes = await remote.getFile(key);
        await local.putFile(bytes, "application/pdf");
        return bytes;
      }
    },
    close: () => local.close(),
    sync: {
      async run() {
        if (running) return running;
        running = run().finally(() => {
          running = null;
        });
        return running;
      },
      async status() {
        return {
          pending: (await local.operations()).length,
          conflicts,
          lastSync,
        };
      },
      async resolve(conflict, choice) {
        await local.resolveOperations(
          conflict.operation,
          conflict.server,
          choice,
        );
        conflicts = conflicts.filter(
          (c) => c.operation.record_id !== conflict.operation.record_id,
        );
      },
    },
  };
  return repo;
}
export function OfflineSettings({ ctx }: { ctx: Context }) {
  const [pass, setPass] = useState(""),
    [selected, setSelected] = useState<string[]>(
      ctx.data.projects.filter((p) => !p.archived).map((p) => p.id),
    ),
    [state, setState] = useState<{
      pending: number;
      conflicts: SyncConflict[];
      lastSync: string;
    } | null>(null),
    [storage, setStorage] = useState("");
  const action = useAction();
  useEffect(() => {
    ctx.repo.sync?.status().then(setState);
    navigator.storage
      ?.estimate()
      .then((s) =>
        setStorage(
          `${((s.usage ?? 0) / 1024 / 1024).toFixed(1)} MB használt / ${((s.quota ?? 0) / 1024 / 1024).toFixed(0)} MB becsült keret`,
        ),
      );
  }, [ctx.repo, ctx.data]);
  return (
    <>
      {action.feedback}
      <h3>Saját eszköz és titkosított offline munkavégzés</h3>
      <p className="muted">
        {storage || "A böngésző tárhelybecslése nem érhető el."}
      </p>
      {ctx.repo.sync ? (
        <>
          <div className="notice">
            {state?.pending ?? 0} feltöltésre váró művelet ·{" "}
            {state?.conflicts.length ?? 0} egyeztetés
            <br />
            Utolsó teljes szinkron:{" "}
            {state?.lastSync
              ? new Date(state.lastSync).toLocaleString("hu-HU")
              : "Még nincs"}
          </div>
          <button
            className="primary"
            disabled={action.busy}
            onClick={() =>
              void action.act(async () => {
                await ctx.repo.sync!.run();
                setState(await ctx.repo.sync!.status());
                await ctx.reload();
                action.setMessage(
                  (await ctx.repo.sync!.status()).pending
                    ? "Maradt egyeztetendő vagy függő művelet."
                    : "Az adott eszköz minden műveletét és fájlját visszaigazolta a szerver.",
                );
              })
            }
          >
            Szinkronizálás
          </button>
          {state?.conflicts.map((c) => (
            <section className="conflict-card" key={c.operation.record_id}>
              <h3>Egyeztetés szükséges · {c.operation.table_name}</h3>
              <p>
                {c.message} · Kiinduló szerververzió:{" "}
                {c.operation.expected_version}
              </p>
              <div className="form-grid">
                <div>
                  <strong>Helyi változat</strong>
                  <pre>{JSON.stringify(c.local, null, 2)}</pre>
                </div>
                <div>
                  <strong>Szerver változata</strong>
                  <pre>{JSON.stringify(c.server, null, 2)}</pre>
                </div>
              </div>
              <div className="row">
                <button
                  className="secondary"
                  disabled={action.busy}
                  onClick={() =>
                    void action.act(async () => {
                      await ctx.repo.sync!.resolve(c, "server");
                      setState(await ctx.repo.sync!.status());
                      await ctx.reload();
                    })
                  }
                >
                  Szerverváltozat megtartása
                </button>
                <button
                  className="secondary"
                  disabled={action.busy}
                  onClick={() =>
                    void action.act(async () => {
                      await ctx.repo.sync!.resolve(c, "local");
                      setState(await ctx.repo.sync!.status());
                      await ctx.reload();
                    })
                  }
                >
                  Helyi változat új feltöltése
                </button>
              </div>
              <p className="small muted">
                A döntés és mindkét változat titkosított ütközési előzményként
                megmarad az eszközön. Lezárt dokumentum felülírását a szerver
                továbbra is tiltja.
              </p>
            </section>
          ))}
        </>
      ) : ctx.repo.mode === "cloud" ? (
        <>
          <p>
            Csak saját, képernyőzárral védett eszközön engedélyezd. A feloldó
            jelszó különbözik a fiók jelszavától. A kiválasztott projektek
            eredeti fájljait is letöltjük; a többi fájl nem lesz elérhető
            offline.
          </p>
          <Text
            label="Eszköz feloldó jelszava (legalább 12 karakter)"
            type="password"
            value={pass}
            onChange={setPass}
          />
          {ctx.data.projects
            .filter((p) => !p.archived)
            .map((p) => (
              <Check
                key={p.id}
                label={`${p.title} – fájlok letöltése offline használatra`}
                value={selected.includes(p.id)}
                onChange={(v) =>
                  setSelected(
                    v
                      ? [...selected, p.id]
                      : selected.filter((id) => id !== p.id),
                  )
                }
              />
            ))}
          <button
            className="primary"
            disabled={action.busy || pass.length < 12}
            onClick={() =>
              void action.act(async () => {
                if (!navigator.onLine)
                  throw new Error(
                    "Az első előkészítéshez internet és AAL2 belépés kell.",
                  );
                const data = await ctx.repo.load();
                const files: Record<string, string> = {};
                for (const e of data.entries)
                  if (
                    e.payload.type === "document" &&
                    (e.project_id === null || selected.includes(e.project_id))
                  )
                    files[e.payload.file_key] = bytesToBase64(
                      await documentBytes(ctx.repo, e),
                    );
                const name = `rp-elektro-offline-${crypto.randomUUID()}`;
                const local = await openLocal(pass, true, {
                  name,
                  seed: data,
                  files,
                  queue: true,
                });
                const granted = await navigator.storage?.persist?.();
                localStorage.setItem("erp-active-vault", name);
                const list = JSON.parse(
                  localStorage.getItem("erp-vaults") ?? "[]",
                ) as string[];
                localStorage.setItem(
                  "erp-vaults",
                  JSON.stringify([...new Set([...list, name])]),
                );
                const remote = ctx.repo;
                ctx.switchRepo?.(wrapOffline(local, async () => remote));
                action.setMessage(
                  `Saját eszköz előkészítve. Tartós tárolás: ${granted ? "engedélyezve" : "a böngésző nem engedélyezte; adattörlés lehetséges"}.`,
                );
              })
            }
          >
            Saját eszköz engedélyezése és előkészítése
          </button>
        </>
      ) : (
        <div className="notice">
          A helyi próbamód már internet nélkül tárol. Felhős szinkronhoz előbb a
          saját Supabase-projektet kell bekötni és kétlépcsős azonosítással
          belépni.
        </div>
      )}
      <h3 className="space-top">Google Naptár</h3>
      <GoogleConnection ctx={ctx} />
    </>
  );
}
function GoogleConnection({ ctx }: { ctx: Context }) {
  const action = useAction();
  const [url, setUrl] = useState(
      import.meta.env.VITE_CALENDAR_WORKER_URL ?? "",
    ),
    [status, setStatus] = useState("Nincs ellenőrzött Google-kapcsolat.");
  return (
    <>
      {action.feedback}
      <p className="small muted">
        Csak az E-RP-ből engedélyezett események szinkronizálhatók.
        Ügyfélmeghívót nem küldünk. A frissítőtoken kizárólag a szerveren
        tárolódik.
      </p>
      <Text
        label="Naptár háttérszolgáltatás címe"
        value={url}
        onChange={setUrl}
        disabled
      />
      <p className="small muted">
        Ezt a címet a saját telepítés beállítása rögzíti. Belépési tokent nem
        küldünk tetszőlegesen megadott címre.
      </p>
      <p>{status}</p>
      <button
        className="secondary"
        disabled={action.busy || ctx.repo.mode !== "cloud" || !url}
        onClick={() =>
          void action.act(async () => {
            const { calendarRequest } = await import("./integrations");
            const response = await calendarRequest(url, "status");
            setStatus(
              response.connected
                ? "Google-kapcsolat beállítva."
                : "Nincs Google-kapcsolat.",
            );
          })
        }
      >
        Kapcsolat ellenőrzése
      </button>
      <button
        className="secondary"
        disabled={action.busy || ctx.repo.mode !== "cloud" || !url}
        onClick={() =>
          void action.act(async () => {
            const { calendarRequest } = await import("./integrations");
            const r = await calendarRequest(url, "connect");
            window.location.assign(r.url);
          })
        }
      >
        Google-fiók összekapcsolása
      </button>
      <button
        className="primary"
        disabled={action.busy || ctx.repo.mode !== "cloud" || !url}
        onClick={() =>
          void action.act(async () => {
            if (ctx.repo.sync) await ctx.repo.sync.run();
            const { calendarRequest } = await import("./integrations");
            const r = await calendarRequest(url, "sync");
            setStatus(
              `${r.synced ?? 0} E-RP-esemény szinkronizálva. ${r.message ?? ""}`,
            );
          })
        }
      >
        Engedélyezett események szinkronja
      </button>
    </>
  );
}
