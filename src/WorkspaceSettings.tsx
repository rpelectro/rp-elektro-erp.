import { useState } from "react";
import {
  type Context,
  Text,
  Amount,
  Select,
  Check,
  Form,
  useAction,
  saveEntry,
  Upload,
  DocumentList,
} from "./ui";
import {
  type Entry,
  type PayloadOf,
  defaultPreferences,
  today,
} from "./business";
import { type Repository } from "./domain";
import {
  createPackage,
  encryptPackage,
  verifyPackage,
  previewImport,
  type BusinessPackage,
} from "./backup";
import { download } from "./transfer";
import { openLocal } from "./local";
import { OfflineSettings } from "./offline";
import { Account } from "./Account";
export function WorkspaceSettings({
  ctx,
  onRestore,
}: {
  ctx: Context;
  onRestore?: (repo: Repository) => void;
}) {
  const [tab, setTab] = useState("templates");
  return (
    <section className="panel workspace-settings">
      <div className="tabs">
        {Object.entries({
          templates: "Bank, logó és sablonok",
          recipes: "Anyagreceptek",
          backup: "Adatok és mentések",
          offline: "Offline és kapcsolatok",
          account: "Fiók és tartalék hitelesítő",
        }).map(([id, label]) => (
          <button
            className={tab === id ? "active" : ""}
            key={id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "templates" ? (
        <Templates ctx={ctx} />
      ) : tab === "recipes" ? (
        <Recipes ctx={ctx} />
      ) : tab === "backup" ? (
        <Backups ctx={ctx} onRestore={onRestore} />
      ) : tab === "account" ? (
        <Account ctx={ctx} />
      ) : (
        <OfflineSettings ctx={ctx} />
      )}
    </section>
  );
}
function Templates({ ctx }: { ctx: Context }) {
  const entry = ctx.data.entries.find((e) => e.payload.type === "preferences"),
    [p, set] = useState<PayloadOf<"preferences">>(
      (entry?.payload as PayloadOf<"preferences">) ?? defaultPreferences(),
    );
  const action = useAction();
  return (
    <>
      {action.feedback}
      <Form
        busy={action.busy}
        onSave={() =>
          void action.act(async () => {
            const latest = (await ctx.repo.load()).entries.find(
              (e) => e.payload.type === "preferences",
            );
            await saveEntry({ ...ctx, projectId: null }, p, latest);
            await ctx.reload();
            action.setMessage("Bankadatok és sablonok mentve.");
          })
        }
      >
        <div className="form-grid">
          <Text
            label="Bank neve"
            value={p.bank_name}
            onChange={(bank_name) => set({ ...p, bank_name })}
          />
          <Text
            label="Bankszámlaszám"
            value={p.bank_account}
            onChange={(bank_account) => set({ ...p, bank_account })}
          />
        </div>
        <Text
          label="Ajánlat fizetési és vállalási feltételei"
          rows={5}
          value={p.quote_terms}
          onChange={(quote_terms) => set({ ...p, quote_terms })}
        />
        <Text
          label="Jegyzőkönyv kiegészítő sablonszövege"
          rows={4}
          value={p.handover_terms}
          onChange={(handover_terms) => set({ ...p, handover_terms })}
        />
        <label>
          Alapértelmezett áfa százalék
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={p.vat_basis_points / 100}
            onChange={(e) =>
              set({
                ...p,
                vat_basis_points: Math.round(Number(e.target.value) * 100),
              })
            }
          />
        </label>
        <Select
          label="PDF-logó"
          value={p.logo_id ?? ""}
          onChange={(v) => set({ ...p, logo_id: v || null })}
          options={[
            ["", "Logó nélkül"],
            ...ctx.data.entries
              .filter(
                (e) =>
                  e.payload.type === "document" &&
                  e.payload.category === "logo",
              )
              .map(
                (e) =>
                  [e.id, (e.payload as PayloadOf<"document">).name] as [
                    string,
                    string,
                  ],
              ),
          ]}
        />
      </Form>
      <Upload ctx={{ ...ctx, projectId: null }} category="logo" />
    </>
  );
}
function Recipes({ ctx }: { ctx: Context }) {
  const [work, choose] = useState(""),
    [materialName, setMaterialName] = useState(""),
    [unit, setUnit] = useState("db"),
    [addId, setAddId] = useState("");
  const action = useAction();
  const recipe = ctx.data.entries.find(
      (e) => e.payload.type === "recipe" && e.payload.work_id === work,
    ),
    materials = ctx.data.entries.filter((e) => e.payload.type === "material");
  const [lines, setLines] = useState<PayloadOf<"recipe">["lines"]>([]);
  return (
    <>
      {action.feedback}
      <h3>Anyagtörzs – ár és készlet nélkül</h3>
      <Form
        busy={action.busy}
        label="Anyag felvétele"
        onSave={() =>
          void action.act(async () => {
            await saveEntry(
              { ...ctx, projectId: null },
              { type: "material", name: materialName, unit, archived: false },
            );
            setMaterialName("");
            await ctx.reload();
          })
        }
      >
        <div className="form-grid">
          <Text
            label="Anyag neve"
            required
            value={materialName}
            onChange={setMaterialName}
          />
          <Text
            label="Anyag egysége"
            required
            value={unit}
            onChange={setUnit}
          />
        </div>
      </Form>
      <h3 className="space-top">Munkatípus anyagreceptje</h3>
      <Select
        label="Recept munkatétele"
        value={work}
        onChange={(id) => {
          choose(id);
          const r = ctx.data.entries.find(
            (e) => e.payload.type === "recipe" && e.payload.work_id === id,
          )?.payload as PayloadOf<"recipe"> | undefined;
          setLines(structuredClone(r?.lines ?? []));
        }}
        options={[
          ["", "Munkatétel kiválasztása"],
          ...ctx.data.work_items.map((w) => [w.id, w.name] as [string, string]),
        ]}
      />
      {work && (
        <Form
          busy={action.busy}
          label="Recept mentése"
          onSave={() =>
            void action.act(async () => {
              await saveEntry(
                { ...ctx, projectId: null },
                { type: "recipe", work_id: work, lines },
                recipe,
              );
              await ctx.reload();
              action.setMessage(
                "Recept mentve. A korábbi ajánlatok receptpillanatfelvétele nem változott.",
              );
            })
          }
        >
          {lines.map((line, i) => (
            <div className="line-card" key={`${line.material_id}/${i}`}>
              <strong>
                {line.name} · {line.unit}
              </strong>
              <Amount
                label="Szükséges mennyiség 1 munkaegységhez"
                quantity
                value={line.quantity_milli}
                onChange={(quantity_milli) =>
                  setLines(
                    lines.map((l, n) =>
                      n === i ? { ...l, quantity_milli } : l,
                    ),
                  )
                }
              />
              <button
                className="text-button"
                type="button"
                onClick={() => setLines(lines.filter((_, n) => n !== i))}
              >
                Eltávolítás a receptből
              </button>
            </div>
          ))}
          <Select
            label="Recepthez adandó anyag"
            value={addId}
            onChange={setAddId}
            options={[
              ["", "Anyag kiválasztása"],
              ...materials.map(
                (e) =>
                  [
                    e.id,
                    `${(e.payload as PayloadOf<"material">).name} · ${(e.payload as PayloadOf<"material">).unit}`,
                  ] as [string, string],
              ),
            ]}
          />
          <button
            type="button"
            className="secondary"
            disabled={!addId}
            onClick={() => {
              const m = materials.find((e) => e.id === addId)!
                .payload as PayloadOf<"material">;
              setLines([
                ...lines,
                {
                  material_id: addId,
                  name: m.name,
                  unit: m.unit,
                  quantity_milli: 1000,
                },
              ]);
              setAddId("");
            }}
          >
            Anyag hozzáadása a recepthez
          </button>
        </Form>
      )}
    </>
  );
}
function Backups({
  ctx,
  onRestore,
}: {
  ctx: Context;
  onRestore?: (repo: Repository) => void;
}) {
  const [password, setPassword] = useState(""),
    [restorePass, setRestorePass] = useState(""),
    [pack, setPack] = useState<BusinessPackage | null>(null),
    [verified, setVerified] = useState<BusinessPackage | null>(null),
    [importPreview, setImportPreview] = useState("");
  const action = useAction();
  const prefEntry = ctx.data.entries.find(
      (e) => e.payload.type === "preferences",
    ),
    prefs = (prefEntry?.payload ??
      defaultPreferences()) as PayloadOf<"preferences">;
  const overdue =
    !prefs.last_verified_backup ||
    Date.now() - Date.parse(prefs.last_verified_backup) > 86400000;
  return (
    <>
      {action.feedback}
      <h3>Teljes üzleti mentés</h3>
      <div className={overdue ? "notice" : "notice success"}>
        {overdue
          ? "Esedékes az ellenőrzött üzleti mentés."
          : "Az utolsó ellenőrzött mentés 24 órán belüli."}
        <br />
        Utolsó ellenőrzés:{" "}
        {prefs.last_verified_backup
          ? new Date(prefs.last_verified_backup).toLocaleString("hu-HU")
          : "Még nincs"}
      </div>
      <p className="small muted">
        A csomag üzleti adatokat és minden hivatkozott eredeti fájlt tartalmaz.
        Nem tartalmaz belépési jelszót, munkamenetet vagy API-titkot. Más
        offline eszközök feltöltetlen munkáját előbb szinkronizálni kell. A
        böngészős csomag legfeljebb 100 MB eredeti fájlt kezel.
      </p>
      <Text
        label="Külön mentési jelszó (legalább 12 karakter)"
        type="password"
        value={password}
        onChange={setPassword}
      />
      <button
        className="primary"
        disabled={action.busy || password.length < 12}
        onClick={() =>
          void action.act(async () => {
            const result = await createPackage(ctx.repo);
            const encrypted = await encryptPackage(result, password);
            setPack(result);
            download(
              encrypted,
              `ERP-uzleti-mentes-${today()}-${Date.now()}.erpbackup`,
              "application/octet-stream",
            );
            action.setMessage(
              "A csomag elkészült, a letöltés elindult. A mentett fájlt még vissza kell olvasni az ellenőrzéshez.",
            );
          })
        }
      >
        Teljes üzleti mentés készítése
      </button>
      {pack && (
        <p>
          {pack.manifest.records} rekord · {pack.manifest.files} eredeti fájl ·{" "}
          {(pack.manifest.bytes / 1024 / 1024).toFixed(2)} MB. A letöltés még
          nem igazolt mentés.
        </p>
      )}
      <label className="space-top">
        Mentési fájl ellenőrzése
        <input
          type="file"
          accept=".erpbackup"
          disabled={action.busy || !password}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f)
              void action.act(async () => {
                const result = await verifyPackage(
                  new Uint8Array(await f.arrayBuffer()),
                  password,
                );
                setVerified(result);
                if (result.snapshot.company.id === ctx.data.company.id) {
                  const latest = (await ctx.repo.load()).entries.find(
                    (e) => e.payload.type === "preferences",
                  );
                  await saveEntry(
                    { ...ctx, projectId: null },
                    {
                      ...((latest?.payload as PayloadOf<"preferences">) ??
                        defaultPreferences()),
                      last_verified_backup: new Date().toISOString(),
                    },
                    latest,
                  );
                  await ctx.reload();
                }
                action.setMessage(
                  `A számítógépről visszaolvasott fájl ellenőrzése sikeres. A csomag kelte: ${result.created_at}`,
                );
              });
          }}
        />
      </label>
      {verified && (
        <section className="restore-preview">
          <h3>Visszaállítás előnézete</h3>
          <p>
            {verified.snapshot.company.name} · {verified.manifest.records}{" "}
            rekord · {verified.manifest.files} ellenőrzött fájl
          </p>
          <p>
            A jelenlegi adatok érintetlenek maradnak. A visszaállítás külön,
            titkosított helyi próbaadattárba kerül. Az éles felhőbe visszatöltés
            külön adminisztrátori művelet.
          </p>
          <Text
            label="Új próbaadattár feloldó jelszava"
            type="password"
            value={restorePass}
            onChange={setRestorePass}
          />
          <button
            className="secondary"
            disabled={action.busy || restorePass.length < 12}
            onClick={() =>
              void action.act(async () => {
                const name = `rp-elektro-restore-${crypto.randomUUID()}`;
                const repo = await openLocal(restorePass, true, {
                  name,
                  seed: verified.snapshot,
                  files: verified.files,
                });
                const check = await createPackage(repo);
                if (
                  check.manifest.records !== verified.manifest.records ||
                  check.manifest.files !== verified.manifest.files
                )
                  throw new Error("A próba-visszaállítás ellenőrzése hibás.");
                localStorage.setItem("erp-active-vault", name);
                const list = JSON.parse(
                  localStorage.getItem("erp-vaults") ?? "[]",
                ) as string[];
                localStorage.setItem(
                  "erp-vaults",
                  JSON.stringify([...new Set([...list, name])]),
                );
                onRestore?.(repo);
                action.setMessage(
                  "Külön próbaadattár létrejött. A helyreállított adatok megnyithatók. Az eredeti adattár nem változott.",
                );
              })
            }
          >
            Elkülönített próba-visszaállítás
          </button>
        </section>
      )}
      <h3 className="space-top">
        Régi adatok importja – ellenőrzés írás nélkül
      </h3>
      <p className="small muted">
        A valódi régi export még nincs megadva. Ismeretlen formátumot nem
        találgatunk. Az E-RP exchange v2 csomag előnézete sem indít
        számlakiállítást vagy Google-szinkront.
      </p>
      <label>
        Exportfájl előnézete
        <input
          type="file"
          accept="application/json,.json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
              void action.act(async () => {
                const preview = previewImport(
                  JSON.parse(await file.text()),
                  ctx.data,
                );
                setImportPreview(
                  `${preview.valid.partners.length} ügyfél, ${preview.valid.projects.length} projekt, ${preview.valid.entries.length} dokumentumrekord.\nIsmétlődő forrásazonosítók: ${preview.duplicates.join(", ") || "nincs"}\nHiányok/ütközések:\n${preview.errors.join("\n") || "nincs"}`,
                );
              });
          }}
        />
      </label>
      {importPreview && <pre>{importPreview}</pre>}
    </>
  );
}
