import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  type Project,
  formatMoney,
  type Snapshot,
  type Repository,
} from "./domain";
import {
  type Context,
  useAction,
  saveEntry,
  Text,
  Amount,
  Select,
  Check,
  Form,
  Modal,
  Upload,
  DocumentList,
} from "./ui";
import {
  type Entry,
  type PayloadOf,
  type WorkLine,
  today,
  emptyParty,
  defaultPreferences,
  quoteTotals,
  lineTotal,
  quantity,
  aggregateMaterials,
  refreshMaterials,
} from "./business";
import { Invoices } from "./Invoices";
import { PhotoPreview } from "./PhotoPreview";
import { RoomPhotos } from "./RoomPhotos";
const tabs = [
  "Áttekintés",
  "Felmérés",
  "Árajánlat",
  "Anyagok",
  "Jegyzőkönyv",
  "Számlák",
  "Dokumentumok",
];
export function ProjectModules({
  ctx,
  project,
  children,
}: {
  ctx: Context;
  project: Project;
  children: ReactNode;
}) {
  const [tab, setTab] = useState(0);
  return (
    <>
      <div className="tabs project-tabs">
        {tabs.map((label, i) => (
          <button
            key={label}
            className={tab === i ? "active" : ""}
            onClick={() => setTab(i)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 0 ? (
        <>
          <ProjectOffline ctx={ctx} />
          {children}
        </>
      ) : tab === 1 ? (
        <Surveys ctx={ctx} />
      ) : tab === 2 ? (
        <Quotes ctx={ctx} project={project} />
      ) : tab === 3 ? (
        <Materials ctx={ctx} />
      ) : tab === 4 ? (
        <Handovers ctx={ctx} project={project} />
      ) : tab === 5 ? (
        <Invoices ctx={ctx} />
      ) : (
        <section className="panel">
          <h2>Projekt dokumentumai</h2>
          <Upload ctx={ctx} />
          <DocumentList ctx={ctx} />
        </section>
      )}
    </>
  );
}
function entries<T extends Entry["payload"]["type"]>(ctx: Context, type: T) {
  return ctx.data.entries
    .filter(
      (e) =>
        e.project_id === (ctx.projectId ?? null) && e.payload.type === type,
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
function party(ctx: Context, project: Project) {
  const c = ctx.data.company,
    p = ctx.data.partners.find((p) => p.id === project.customer_id);
  return {
    company: {
      name: c.name,
      address: c.address,
      tax_number: c.tax_number,
      email: c.email,
      phone: c.phone,
    },
    customer: p
      ? {
          name: p.name,
          address: p.billing_address,
          tax_number: "",
          email: p.email,
          phone: p.phone,
        }
      : emptyParty(),
    site: project.site_address,
  };
}
export function Lines({
  ctx,
  value,
  onChange,
}: {
  ctx: Context;
  value: WorkLine[];
  onChange: (v: WorkLine[]) => void;
}) {
  const [chosen, setChosen] = useState("");
  const add = () => {
    const w = ctx.data.work_items.find((w) => w.id === chosen);
    const recipe = ctx.data.entries.find(
      (e) => e.payload.type === "recipe" && e.payload.work_id === chosen,
    )?.payload as PayloadOf<"recipe"> | undefined;
    onChange([
      ...value,
      {
        id: crypto.randomUUID(),
        work_id: w?.id ?? null,
        name: w?.name ?? "",
        unit: w?.unit ?? "db",
        quantity_milli: 1000,
        price_minor: w?.price_minor ?? 0,
        location: "",
        notes: "",
        recipe: structuredClone(recipe?.lines ?? []),
      },
    ]);
  };
  const update = (i: number, patch: Partial<WorkLine>) =>
    onChange(value.map((line, n) => (n === i ? { ...line, ...patch } : line)));
  return (
    <div className="line-editor">
      {value.map((line, i) => (
        <section className="line-card" key={line.id}>
          <div className="row between">
            <strong>{i + 1}. munkatétel</strong>
            <button
              type="button"
              className="text-button"
              onClick={() => onChange(value.filter((_, n) => n !== i))}
            >
              Tétel eltávolítása
            </button>
          </div>
          <Text
            label="Munka megnevezése"
            required
            value={line.name}
            onChange={(name) => update(i, { name })}
          />
          <div className="three-columns">
            <Amount
              label="Mennyiség"
              quantity
              value={line.quantity_milli}
              onChange={(quantity_milli) => update(i, { quantity_milli })}
            />
            <Text
              label="Egység"
              required
              value={line.unit}
              onChange={(unit) => update(i, { unit })}
            />
            <Amount
              label="Egység munkadíja (Ft)"
              value={line.price_minor}
              onChange={(price_minor) => update(i, { price_minor })}
            />
          </div>
          <Text
            label="Elhelyezés / helyiség"
            value={line.location}
            onChange={(location) => update(i, { location })}
          />
          <Text
            label="Ügyfélnek megjelenő tételmegjegyzés"
            value={line.notes}
            onChange={(notes) => update(i, { notes })}
          />
          <div className="row between">
            <small>{line.recipe.length} recepttétel pillanatfelvétele</small>
            <strong>{formatMoney(lineTotal(line))}</strong>
          </div>
        </section>
      ))}
      <div className="row add-line">
        <select
          aria-label="Munkakatalógusból"
          value={chosen}
          onChange={(e) => setChosen(e.target.value)}
        >
          <option value="">Egyedi munkatétel</option>
          {ctx.data.work_items
            .filter((w) => !w.archived)
            .map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
        </select>
        <button type="button" className="secondary" onClick={add}>
          Tétel hozzáadása
        </button>
      </div>
    </div>
  );
}
function Surveys({ ctx }: { ctx: Context }) {
  const [edit, setEdit] = useState<Entry | null | undefined>();
  const action = useAction();
  const surveys = entries(ctx, "survey");
  return (
    <section className="panel">
      {action.feedback}
      <div className="section-heading">
        <h2>Felmérések</h2>
        <button className="primary" onClick={() => setEdit(null)}>
          Új felmérés
        </button>
      </div>
      {surveys.map(
        (e) =>
          e.payload.type === "survey" && (
            <div className="document-row" key={e.id}>
              <div>
                <strong>{e.payload.name}</strong>
                <small>
                  {e.payload.surveyed_on} · {e.payload.rooms.length} helyiség ·
                  v{e.version}
                </small>
              </div>
              <div className="row">
                <button className="secondary" onClick={() => setEdit(e)}>
                  Megnyitás
                </button>
              </div>
            </div>
          ),
      )}
      {!surveys.length && (
        <p className="muted">
          Kis munkánál felmérés nélkül is készíthetsz ajánlatot.
        </p>
      )}
      {edit !== undefined && (
        <SurveyEditor
          key={edit?.id ?? "new"}
          ctx={ctx}
          entry={edit ?? undefined}
          onClose={() => setEdit(undefined)}
        />
      )}
    </section>
  );
}
function SurveyEditor({
  ctx,
  entry,
  onClose,
}: {
  ctx: Context;
  entry?: Entry;
  onClose: () => void;
}) {
  const [p, set] = useState<PayloadOf<"survey">>(
    (entry?.payload as PayloadOf<"survey">) ?? {
      type: "survey",
      name: "",
      surveyed_on: today(),
      existing: "",
      planned: "",
      unknown: "",
      internal_notes: "",
      rooms: [],
      whole_property: [],
      photo_ids: [],
    },
  );
  const [dirty, mark] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [roomPreset, setRoomPreset] = useState("Nappali");
  const action = useAction();
  const patch = (v: Partial<typeof p>) => {
    mark(true);
    set((previous) => ({ ...previous, ...v }));
  };
  return (
    <Modal
      title="Felmérés"
      onClose={() => {
        if (!uploadBusy) onClose();
      }}
      dirty={dirty}
    >
      {action.feedback}
      <Form
        busy={action.busy || uploadBusy}
        onSave={() =>
          !uploadBusy &&
          void action.act(async () => {
            await saveEntry(ctx, p, entry);
            await ctx.reload();
            mark(false);
            onClose();
          })
        }
      >
        <Text
          label="Felmérés neve"
          required
          value={p.name}
          onChange={(name) => patch({ name })}
        />
        <Text
          label="Felmérés dátuma"
          type="date"
          required
          value={p.surveyed_on}
          onChange={(surveyed_on) => patch({ surveyed_on })}
        />
        <Text
          label="Meglévő állapot"
          rows={3}
          value={p.existing}
          onChange={(existing) => patch({ existing })}
        />
        <Text
          label="Tervezett munka"
          rows={3}
          value={p.planned}
          onChange={(planned) => patch({ planned })}
        />
        <Text
          label="Ismeretlen / nem vizsgált adatok"
          rows={2}
          value={p.unknown}
          onChange={(unknown) => patch({ unknown })}
        />
        <Text
          label="Belső megjegyzés – nem kerül az ügyfél PDF-jére"
          rows={2}
          value={p.internal_notes}
          onChange={(internal_notes) => patch({ internal_notes })}
        />
        <h3>Teljes ingatlanra vonatkozó munkák</h3>
        <Lines
          ctx={ctx}
          value={p.whole_property}
          onChange={(whole_property) => patch({ whole_property })}
        />
        <h3>Helyiségek</h3>
        <div className="row">
          <Select
            label="Választható helyiség"
            value={roomPreset}
            onChange={setRoomPreset}
            options={[
              "Nappali",
              "Konyha",
              "Étkező",
              "Hálószoba",
              "Gyerekszoba",
              "Fürdőszoba",
              "WC",
              "Előszoba",
              "Folyosó",
              "Dolgozószoba",
              "Kamra",
              "Háztartási helyiség",
              "Garázs",
              "Pince",
              "Padlás",
              "Terasz",
              "Kert",
            ].map((name) => [name, name])}
          />
          <button
            type="button"
            className="secondary"
            disabled={uploadBusy}
            onClick={() => {
              const count = p.rooms.filter(
                (r) =>
                  r.name === roomPreset || r.name.startsWith(`${roomPreset} `),
              ).length;
              patch({
                rooms: [
                  ...p.rooms,
                  {
                    id: crypto.randomUUID(),
                    name: count ? `${roomPreset} ${count + 1}` : roomPreset,
                    existing: "",
                    planned: "",
                    lines: [],
                    photo_ids: [],
                  },
                ],
              });
            }}
          >
            Kiválasztott helyiség hozzáadása
          </button>
        </div>
        {p.rooms.map((room, i) => (
          <section
            className="line-card"
            key={room.id}
            aria-label={`Helyiség: ${room.name || "Névtelen"}`}
          >
            <Text
              label="Helyiség neve"
              required
              value={room.name}
              onChange={(name) =>
                patch({
                  rooms: p.rooms.map((r, n) => (n === i ? { ...r, name } : r)),
                })
              }
            />
            <Text
              label="Helyiség meglévő állapota"
              rows={2}
              value={room.existing}
              onChange={(existing) =>
                patch({
                  rooms: p.rooms.map((r, n) =>
                    n === i ? { ...r, existing } : r,
                  ),
                })
              }
            />
            <Text
              label="Helyiség tervezett munkája"
              rows={2}
              value={room.planned}
              onChange={(planned) =>
                patch({
                  rooms: p.rooms.map((r, n) =>
                    n === i ? { ...r, planned } : r,
                  ),
                })
              }
            />
            <Lines
              ctx={ctx}
              value={room.lines}
              onChange={(lines) =>
                patch({
                  rooms: p.rooms.map((r, n) => (n === i ? { ...r, lines } : r)),
                })
              }
            />
            <button
              type="button"
              className="text-button"
              disabled={uploadBusy}
              onClick={() => {
                if (
                  window.confirm(
                    "Eltávolítod a helyiséget a munkáival és fotó-hozzárendeléseivel? Az eredeti képek megmaradnak a Dokumentumok között.",
                  )
                )
                  patch({ rooms: p.rooms.filter((_, n) => n !== i) });
              }}
            >
              Helyiség eltávolítása
            </button>
            <RoomPhotos
              ctx={ctx}
              name={room.name}
              ids={room.photo_ids ?? []}
              entityId={entry?.id}
              onBusy={setUploadBusy}
              locked={uploadBusy || action.busy}
              onAdd={(id) => {
                mark(true);
                set((previous) => ({
                  ...previous,
                  rooms: previous.rooms.map((r) =>
                    r.id === room.id
                      ? {
                          ...r,
                          photo_ids: [...new Set([...(r.photo_ids ?? []), id])],
                        }
                      : r,
                  ),
                }));
              }}
              onRemove={(id) =>
                patch({
                  rooms: p.rooms.map((r) =>
                    r.id === room.id
                      ? {
                          ...r,
                          photo_ids: (r.photo_ids ?? []).filter(
                            (photo) => photo !== id,
                          ),
                        }
                      : r,
                  ),
                })
              }
            />
          </section>
        ))}
        <button
          type="button"
          className="secondary"
          onClick={() =>
            patch({
              rooms: [
                ...p.rooms,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  existing: "",
                  planned: "",
                  lines: [],
                  photo_ids: [],
                },
              ],
            })
          }
        >
          Helyiség hozzáadása
        </button>
        <h3 className="space-top">
          Teljes ingatlan / korábbi felmérés fényképei
        </h3>
        <p>
          A szobák képeit fent, közvetlenül a helyiségnél töltsd fel. Itt a
          helyiséghez nem rendelt, általános képeket választhatod ki.
        </p>
        <PhotoPicker
          ctx={ctx}
          value={p.photo_ids}
          excluded={p.rooms
            .flatMap((room) => room.photo_ids ?? [])
            .filter((id) => !p.photo_ids.includes(id))}
          onChange={(photo_ids) => patch({ photo_ids })}
        />
      </Form>
      <Upload ctx={ctx} category="photo" entityId={entry?.id} />
    </Modal>
  );
}
function PhotoPicker({
  ctx,
  value,
  onChange,
  excluded = [],
}: {
  ctx: Context;
  value: string[];
  onChange: (v: string[]) => void;
  excluded?: string[];
}) {
  return (
    <div>
      {entries(ctx, "document")
        .filter(
          (e) =>
            e.payload.type === "document" &&
            !excluded.includes(e.id) &&
            e.payload.mime.startsWith("image/"),
        )
        .map((e) => (
          <Check
            key={e.id}
            label={(e.payload as PayloadOf<"document">).name}
            value={value.includes(e.id)}
            onChange={(checked) =>
              onChange(
                checked ? [...value, e.id] : value.filter((id) => id !== e.id),
              )
            }
          />
        ))}
      <p className="small muted">
        Az eredeti fotók a Dokumentumok fülön vagy a felmérés alatt tölthetők
        fel.
      </p>
    </div>
  );
}
function newQuote(ctx: Context, project: Project): PayloadOf<"quote"> {
  const uuid = crypto.randomUUID(),
    prefs = (ctx.data.entries.find((e) => e.payload.type === "preferences")
      ?.payload ?? defaultPreferences()) as PayloadOf<"preferences">;
  return {
    type: "quote",
    series_id: uuid,
    revision: 1,
    sealed: false,
    number: `AJ-${today().replaceAll("-", "")}-${uuid.toUpperCase()}`,
    title: project.title,
    issued_on: today(),
    valid_until: today(),
    ...party(ctx, project),
    tax_mode: ctx.data.company.tax_mode,
    vat_basis_points: prefs.vat_basis_points,
    lines: [],
    materials_minor: 0,
    discount_minor: 0,
    terms: prefs.quote_terms,
    pdf_id: null,
  };
}
function Quotes({ ctx, project }: { ctx: Context; project: Project }) {
  const [edit, setEdit] = useState<{
    entry?: Entry;
    p: PayloadOf<"quote">;
  } | null>(null);
  const action = useAction();
  return (
    <section className="panel">
      {action.feedback}
      <div className="section-heading">
        <h2>Ajánlatverziók</h2>
        <button
          className="primary"
          onClick={() => setEdit({ p: newQuote(ctx, project) })}
        >
          Új ajánlat
        </button>
      </div>
      {entries(ctx, "quote").map((e) => {
        const p = e.payload as PayloadOf<"quote">;
        const decision = entries(ctx, "decision").find(
          (d) => (d.payload as PayloadOf<"decision">).quote_id === e.id,
        )?.payload as PayloadOf<"decision"> | undefined;
        return (
          <div className="document-row" key={e.id}>
            <div>
              <strong>
                {p.title} · {p.revision}. verzió
              </strong>
              <small>
                {p.number} · {p.sealed ? "PDF-pillanatfelvétel" : "Tervezet"} ·{" "}
                {decision
                  ? {
                      sent: "Elküldött",
                      changes: "Módosításkérés",
                      accepted: "Elfogadott",
                      rejected: "Elutasított",
                    }[decision.state]
                  : "Nincs döntés"}{" "}
                · {formatMoney(quoteTotals(p).gross)}
              </small>
            </div>
            <button
              className="secondary"
              onClick={() => setEdit({ entry: e, p })}
            >
              Megnyitás
            </button>
          </div>
        );
      })}
      {edit && (
        <QuoteEditor
          key={edit.entry?.id ?? edit.p.series_id}
          ctx={ctx}
          initial={edit.p}
          entry={edit.entry}
          onClose={() => setEdit(null)}
        />
      )}
    </section>
  );
}
function QuoteEditor({
  ctx,
  initial,
  entry,
  onClose,
}: {
  ctx: Context;
  initial: PayloadOf<"quote">;
  entry?: Entry;
  onClose: () => void;
}) {
  const [p, set] = useState(structuredClone(initial));
  const [record, setRecord] = useState(entry);
  const [dirty, mark] = useState(false);
  const [state, setState] = useState("sent"),
    [decisionNote, setDecisionNote] = useState("");
  const action = useAction();
  const patch = (v: Partial<typeof p>) => {
    mark(true);
    set({ ...p, ...v });
  };
  async function persist() {
    const saved = await saveEntry(ctx, p, record);
    setRecord(saved);
    mark(false);
    await ctx.reload();
    action.setMessage("Ajánlattervezet elmentve.");
    return saved;
  }
  const totals = (() => {
    try {
      return quoteTotals(p);
    } catch {
      return null;
    }
  })();
  return (
    <Modal
      title={`Árajánlat · ${p.revision}. verzió`}
      onClose={onClose}
      dirty={dirty}
    >
      {action.feedback}
      {p.sealed ? (
        <>
          <div className="notice">
            A PDF és a hozzá tartozó adatok változatlan pillanatfelvétel. Az
            elkészítés nem jelenti, hogy elküldted vagy az ügyfél elfogadta.
          </div>
          <SummaryQuote p={p} />
          <DocumentList ctx={ctx} entityId={record?.id} />
          <button
            className="secondary"
            disabled={action.busy}
            onClick={() => {
              set({
                ...p,
                sealed: false,
                revision:
                  Math.max(
                    ...entries(ctx, "quote")
                      .filter(
                        (e) =>
                          (e.payload as PayloadOf<"quote">).series_id ===
                          p.series_id,
                      )
                      .map((e) => (e.payload as PayloadOf<"quote">).revision),
                  ) + 1,
                pdf_id: null,
              });
              setRecord(undefined);
              mark(true);
            }}
          >
            Új verzió szerkesztése
          </button>
          <h3 className="space-top">Küldés / ügyféldöntés külön rögzítése</h3>
          <Form
            busy={action.busy}
            label="Esemény rögzítése"
            onSave={() =>
              void action.act(async () => {
                if (!record) throw new Error("Az ajánlat nincs mentve.");
                await saveEntry(ctx, {
                  type: "decision",
                  quote_id: record.id,
                  state: state as PayloadOf<"decision">["state"],
                  decided_on: today(),
                  notes: decisionNote,
                });
                await ctx.reload();
                action.setMessage(
                  "Az esemény rögzítve. Nem történt e-mail-küldés.",
                );
              })
            }
          >
            <Select
              label="Állapot"
              value={state}
              onChange={setState}
              options={Object.entries({
                sent: "Elküldtem",
                changes: "Módosítást kért",
                accepted: "Elfogadta",
                rejected: "Elutasította",
              })}
            />
            <Text
              label="Döntés megjegyzése / igazolása"
              rows={2}
              value={decisionNote}
              onChange={setDecisionNote}
            />
          </Form>
        </>
      ) : (
        <>
          <Form busy={action.busy} onSave={() => void action.act(persist)}>
            <Text
              label="Ajánlat címe"
              required
              value={p.title}
              onChange={(title) => patch({ title })}
            />
            <div className="form-grid">
              <Text
                label="Keltezés"
                type="date"
                required
                value={p.issued_on}
                onChange={(issued_on) => patch({ issued_on })}
              />
              <Text
                label="Érvényesség"
                type="date"
                required
                value={p.valid_until}
                onChange={(valid_until) => patch({ valid_until })}
              />
            </div>
            <PartyEditor
              p={p.customer}
              label="Ügyfél akkori adatai"
              onChange={(customer) => patch({ customer })}
            />
            <PartyEditor
              p={p.company}
              label="Vállalkozás akkori adatai"
              onChange={(company) => patch({ company })}
            />
            <Text
              label="Munkavégzés helye"
              value={p.site}
              onChange={(site) => patch({ site })}
            />
            <Select
              label="Adózási mód"
              value={p.tax_mode}
              onChange={(tax_mode) =>
                patch({ tax_mode: tax_mode as typeof p.tax_mode })
              }
              options={Object.entries({
                unknown: "Nincs megadva",
                aam: "Alanyi adómentes",
                vat: "Áfás",
              })}
            />
            {p.tax_mode === "vat" && (
              <label>
                Áfa százalék
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={p.vat_basis_points / 100}
                  onChange={(e) =>
                    patch({
                      vat_basis_points: Math.round(
                        Number(e.target.value) * 100,
                      ),
                    })
                  }
                />
              </label>
            )}
            <h3>Tételek felmérésből</h3>
            <select
              aria-label="Felmérés kiválasztása"
              defaultValue=""
              onChange={(e) => {
                const s = ctx.data.entries.find((s) => s.id === e.target.value)
                  ?.payload as PayloadOf<"survey"> | undefined;
                if (s)
                  patch({
                    lines: [
                      ...p.lines,
                      ...structuredClone([
                        ...s.whole_property,
                        ...s.rooms.flatMap((r) =>
                          r.lines.map((l) => ({
                            ...l,
                            location:
                              r.name + (l.location ? " / " + l.location : ""),
                          })),
                        ),
                      ]).map((l) => ({ ...l, id: crypto.randomUUID() })),
                    ],
                  });
                e.target.value = "";
              }}
            >
              <option value="">Felmérés tételeinek hozzáadása…</option>
              {entries(ctx, "survey").map((s) => (
                <option value={s.id} key={s.id}>
                  {(s.payload as PayloadOf<"survey">).name}
                </option>
              ))}
            </select>
            <Lines
              ctx={ctx}
              value={p.lines}
              onChange={(lines) => patch({ lines })}
            />
            <div className="form-grid">
              <Amount
                label="Kézi anyagköltség (Ft)"
                value={p.materials_minor}
                onChange={(materials_minor) => patch({ materials_minor })}
              />
              <Amount
                label="Kifejezett kedvezmény (Ft)"
                value={p.discount_minor}
                onChange={(discount_minor) => patch({ discount_minor })}
              />
            </div>
            <Text
              label="Fizetési és vállalási feltételek"
              rows={5}
              value={p.terms}
              onChange={(terms) => patch({ terms })}
            />
            {totals ? (
              <div className="notice">
                Munkadíj: {formatMoney(totals.labor)} · Nettó:{" "}
                {formatMoney(totals.net)} · Adó: {formatMoney(totals.tax)} ·
                Végösszeg: <strong>{formatMoney(totals.gross)}</strong>
              </div>
            ) : (
              <div className="notice error">Az összegek nem érvényesek.</div>
            )}
          </Form>
          <button
            className="primary wide space-top"
            disabled={
              action.busy ||
              !p.lines.length ||
              p.tax_mode === "unknown" ||
              !p.customer.address ||
              !p.company.address
            }
            onClick={() =>
              void action.act(async () => {
                const record = await persist();
                const final = { ...p, sealed: true };
                const { makePdf } = await import("./pdf");
                const bytes = await makePdf(final, ctx.repo, ctx.data);
                const { attach } = await import("./documents");
                const doc = await attach(
                  ctx.repo,
                  ctx.projectId ?? null,
                  new File(
                    [new Uint8Array(bytes)],
                    `${p.number}-v${p.revision}.pdf`,
                    { type: "application/pdf" },
                  ),
                  "quote",
                  record.id,
                );
                const saved = await saveEntry(
                  ctx,
                  { ...final, pdf_id: doc.id },
                  record,
                );
                setRecord(saved);
                set(saved.payload as typeof p);
                mark(false);
                await ctx.reload();
                action.setMessage(
                  "A végleges ajánlat és eredeti PDF elmentve. Kiküldés nem történt.",
                );
              })
            }
          >
            Végleges PDF-pillanatfelvétel készítése
          </button>
          <p className="small muted">
            Véglegesítés előtt szükséges: legalább egy tétel, a két fél címe és
            az adózási mód.
          </p>
        </>
      )}
    </Modal>
  );
}
export function PartyEditor({
  p,
  label,
  onChange,
}: {
  p: PayloadOf<"quote">["customer"];
  label: string;
  onChange: (p: PayloadOf<"quote">["customer"]) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <Text
        label={`${label} – név`}
        value={p.name}
        onChange={(name) => onChange({ ...p, name })}
      />
      <Text
        label={`${label} – cím`}
        value={p.address}
        onChange={(address) => onChange({ ...p, address })}
      />
      <div className="form-grid">
        <Text
          label={`${label} – adószám`}
          value={p.tax_number}
          onChange={(tax_number) => onChange({ ...p, tax_number })}
        />
        <Text
          label={`${label} – e-mail`}
          value={p.email}
          onChange={(email) => onChange({ ...p, email })}
        />
      </div>
    </fieldset>
  );
}
function SummaryQuote({ p }: { p: PayloadOf<"quote"> }) {
  return (
    <>
      <h3>{p.title}</h3>
      <p>
        {p.company.name} → {p.customer.name} · {p.site}
      </p>
      <ul>
        {p.lines.map((l) => (
          <li key={l.id}>
            {l.name} · {quantity(l.quantity_milli)} {l.unit} ·{" "}
            {formatMoney(lineTotal(l))}
          </li>
        ))}
      </ul>
      <p>
        <strong>{formatMoney(quoteTotals(p).gross)}</strong> · érvényes{" "}
        {p.valid_until}
      </p>
      <p className="prewrap">{p.terms}</p>
    </>
  );
}
function Materials({ ctx }: { ctx: Context }) {
  const plans = entries(ctx, "materials");
  const [chosen, choose] = useState("");
  const action = useAction();
  const [preview, setPreview] = useState<{
    old?: Entry;
    next: PayloadOf<"materials">;
  } | null>(null);
  return (
    <section className="panel">
      {action.feedback}
      <h2>Szükséges anyagok</h2>
      <p className="muted">
        Mennyiségek egy kiválasztott ajánlatverzióból. Nincs beszerzés, készlet
        vagy anyagár.
      </p>
      <div className="row">
        <select
          aria-label="Anyaglista ajánlatverziója"
          value={chosen}
          onChange={(e) => choose(e.target.value)}
        >
          <option value="">Válassz ajánlatverziót…</option>
          {entries(ctx, "quote").map((e) => (
            <option key={e.id} value={e.id}>
              {(e.payload as PayloadOf<"quote">).title} v
              {(e.payload as PayloadOf<"quote">).revision}
            </option>
          ))}
        </select>
        <button
          className="primary"
          disabled={!chosen || action.busy}
          onClick={() => {
            const q = ctx.data.entries.find((e) => e.id === chosen)!
              .payload as PayloadOf<"quote">;
            const old = plans[0];
            setPreview({
              old,
              next: old
                ? refreshMaterials(
                    old.payload as PayloadOf<"materials">,
                    chosen,
                    q,
                  )
                : {
                    type: "materials",
                    quote_id: chosen,
                    lines: aggregateMaterials(q),
                  },
            });
          }}
        >
          Eltérések előnézete
        </button>
      </div>
      {preview && (
        <div className="notice">
          <h3>Frissítés előnézete</h3>
          {preview.next.lines.map((l, i) => (
            <p key={i}>
              {l.name} · számított {quantity(l.calculated_milli)} {l.unit}
              {l.override_milli !== null
                ? ` · kézi érték megőrizve: ${quantity(l.override_milli)}`
                : ""}
              {l.manual ? " · kézi tétel" : ""}
            </p>
          ))}
          <button
            className="primary"
            disabled={action.busy}
            onClick={() =>
              void action.act(async () => {
                await saveEntry(ctx, preview.next, preview.old);
                setPreview(null);
                await ctx.reload();
              })
            }
          >
            Frissítés jóváhagyása
          </button>
          <button className="secondary" onClick={() => setPreview(null)}>
            Mégse
          </button>
        </div>
      )}
      {plans[0] && (
        <MaterialPlan
          key={`${plans[0].id}/${plans[0].version}`}
          ctx={ctx}
          entry={plans[0]}
        />
      )}
    </section>
  );
}
function MaterialPlan({ ctx, entry }: { ctx: Context; entry: Entry }) {
  const [p, set] = useState(entry.payload as PayloadOf<"materials">);
  const action = useAction();
  const current = ctx.data.entries.find((e) => e.id === p.quote_id);
  const newer = entries(ctx, "quote").some(
    (e) =>
      (e.payload as PayloadOf<"quote">).series_id ===
        (current?.payload as PayloadOf<"quote">)?.series_id &&
      (e.payload as PayloadOf<"quote">).revision >
        ((current?.payload as PayloadOf<"quote">)?.revision ?? 0),
  );
  return (
    <>
      {newer && (
        <div className="notice">
          Újabb ajánlatverzió van. A lista nem változott automatikusan; válaszd
          ki az új verziót és nézd át az eltéréseket.
        </div>
      )}
      {action.feedback}
      <Form
        busy={action.busy}
        onSave={() =>
          void action.act(async () => {
            await saveEntry(ctx, p, entry);
            await ctx.reload();
            action.setMessage("Anyaglista mentve.");
          })
        }
      >
        {p.lines.map((l, i) => (
          <div className="line-card" key={`${l.material_id}/${i}`}>
            <strong>
              {l.name} · {l.unit}
              {l.manual ? " · kézi tétel" : ""}
            </strong>
            <p className="small muted">
              Számított: {quantity(l.calculated_milli)} {l.unit}
            </p>
            <Amount
              label="Ténylegesen szükséges mennyiség"
              quantity
              value={l.override_milli ?? l.calculated_milli}
              onChange={(override_milli) =>
                set({
                  ...p,
                  lines: p.lines.map((r, n) =>
                    n === i ? { ...r, override_milli } : r,
                  ),
                })
              }
            />
            <Text
              label="Anyag megjegyzése"
              value={l.notes}
              onChange={(notes) =>
                set({
                  ...p,
                  lines: p.lines.map((r, n) => (n === i ? { ...r, notes } : r)),
                })
              }
            />
          </div>
        ))}
        <button
          type="button"
          className="secondary"
          onClick={() =>
            set({
              ...p,
              lines: [
                ...p.lines,
                {
                  material_id: crypto.randomUUID(),
                  name: "",
                  unit: "db",
                  calculated_milli: 0,
                  override_milli: 1000,
                  manual: true,
                  notes: "",
                },
              ],
            })
          }
        >
          Kézi kiegészítés
        </button>
        {p.lines
          .filter((l) => l.manual)
          .map((l) => (
            <div key={l.material_id}>
              <Text
                label="Kézi anyag neve"
                required
                value={l.name}
                onChange={(name) =>
                  set({
                    ...p,
                    lines: p.lines.map((r) => (r === l ? { ...r, name } : r)),
                  })
                }
              />
              <Text
                label="Kézi anyag mértékegysége"
                required
                value={l.unit}
                onChange={(unit) =>
                  set({
                    ...p,
                    lines: p.lines.map((r) => (r === l ? { ...r, unit } : r)),
                  })
                }
              />
            </div>
          ))}
      </Form>
    </>
  );
}
function Handovers({ ctx, project }: { ctx: Context; project: Project }) {
  const [edit, setEdit] = useState<{
    entry?: Entry;
    p: PayloadOf<"handover">;
  } | null>(null);
  const create = () => {
    const id = crypto.randomUUID();
    setEdit({
      p: {
        type: "handover",
        series_id: id,
        revision: 1,
        sealed: false,
        number: `AT-${today().replaceAll("-", "")}-${id.toUpperCase()}`,
        performed_on: today(),
        ...party(ctx, project),
        work: "",
        deviations: "",
        extras: "",
        remaining: "",
        terms:
          (
            ctx.data.entries.find((e) => e.payload.type === "preferences")
              ?.payload as PayloadOf<"preferences"> | undefined
          )?.handover_terms ?? "",
        checks: { tidy: false, informed: false, documents: false },
        photo_ids: [],
        customer_signature: "",
        contractor_signature: "",
        signed_at: "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        pdf_id: null,
      },
    });
  };
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Átadási jegyzőkönyvek</h2>
        <button className="primary" onClick={create}>
          Új jegyzőkönyv
        </button>
      </div>
      {entries(ctx, "handover").map((e) => {
        const p = e.payload as PayloadOf<"handover">;
        return (
          <div className="document-row" key={e.id}>
            <div>
              <strong>
                {p.number} · v{p.revision}
              </strong>
              <small>
                {p.performed_on} · {p.sealed ? "Végleges" : "Tervezet"} ·{" "}
                {p.customer_signature && p.contractor_signature
                  ? "Mindkét fél aláírta"
                  : p.customer_signature || p.contractor_signature
                    ? "Részben aláírt"
                    : "Aláíratlan"}
              </small>
            </div>
            <button
              className="secondary"
              onClick={() => setEdit({ entry: e, p })}
            >
              Megnyitás
            </button>
          </div>
        );
      })}
      {edit && (
        <HandoverEditor
          ctx={ctx}
          initial={edit.p}
          entry={edit.entry}
          onClose={() => setEdit(null)}
        />
      )}
    </section>
  );
}
function HandoverEditor({
  ctx,
  initial,
  entry,
  onClose,
}: {
  ctx: Context;
  initial: PayloadOf<"handover">;
  entry?: Entry;
  onClose: () => void;
}) {
  const [p, set] = useState(structuredClone(initial));
  const [record, setRecord] = useState(entry),
    [dirty, mark] = useState(false),
    [signing, setSigning] = useState(false);
  const action = useAction();
  const patch = (v: Partial<typeof p>) => {
    mark(true);
    set({
      ...p,
      ...v,
      customer_signature: "",
      contractor_signature: "",
      signed_at: "",
    });
  };
  async function persist(value = p, expected = record) {
    const saved = await saveEntry(ctx, value, expected);
    setRecord(saved);
    set(saved.payload as typeof p);
    mark(false);
    await ctx.reload();
    return saved;
  }
  return (
    <Modal title="Átadási jegyzőkönyv" dirty={dirty} onClose={onClose}>
      {action.feedback}
      {p.sealed ? (
        <>
          <HandoverSummary p={p} />
          <PhotoPreview ctx={ctx} ids={p.photo_ids} />
          <DocumentList ctx={ctx} entityId={record?.id} />
          <button
            className="secondary"
            onClick={() => {
              set({
                ...p,
                sealed: false,
                pdf_id: null,
                customer_signature: "",
                contractor_signature: "",
                signed_at: "",
                revision:
                  Math.max(
                    ...entries(ctx, "handover")
                      .filter(
                        (e) =>
                          (e.payload as PayloadOf<"handover">).series_id ===
                          p.series_id,
                      )
                      .map(
                        (e) => (e.payload as PayloadOf<"handover">).revision,
                      ),
                  ) + 1,
              });
              setRecord(undefined);
              mark(true);
            }}
          >
            Új verzió – új aláírásokkal
          </button>
        </>
      ) : signing ? (
        <>
          <HandoverSummary p={p} />
          <PhotoPreview ctx={ctx} ids={p.photo_ids} />
          <div className="notice">
            Az aláírások ehhez az itt látható tartalomhoz kapcsolódnak. A
            tartalom módosítása törli az új változat aláírásait.
          </div>
          <Signature
            label="Ügyfél aláírása"
            value={p.customer_signature}
            onChange={(customer_signature) => {
              mark(true);
              set({
                ...p,
                customer_signature,
                signed_at: new Date().toISOString(),
              });
            }}
          />
          <Signature
            label="Vállalkozó aláírása"
            value={p.contractor_signature}
            onChange={(contractor_signature) => {
              mark(true);
              set({
                ...p,
                contractor_signature,
                signed_at: new Date().toISOString(),
              });
            }}
          />
          <div className="row">
            <button
              className="secondary"
              disabled={action.busy}
              onClick={() => setSigning(false)}
            >
              Vissza a tartalomhoz
            </button>
            <button
              className="primary"
              disabled={action.busy}
              onClick={() =>
                void action.act(async () => {
                  const record = await persist();
                  const final = { ...p, sealed: true };
                  const { makePdf } = await import("./pdf");
                  const bytes = await makePdf(final, ctx.repo, ctx.data);
                  const { attach } = await import("./documents");
                  const doc = await attach(
                    ctx.repo,
                    ctx.projectId ?? null,
                    new File(
                      [new Uint8Array(bytes)],
                      `${p.number}-v${p.revision}.pdf`,
                      { type: "application/pdf" },
                    ),
                    "handover",
                    record.id,
                  );
                  await persist({ ...final, pdf_id: doc.id }, record);
                  setSigning(false);
                  action.setMessage(
                    "A jegyzőkönyv és eredeti PDF véglegesen elmentve.",
                  );
                })
              }
            >
              Végleges jegyzőkönyv és PDF
            </button>
          </div>
        </>
      ) : (
        <Form
          busy={action.busy}
          onSave={() =>
            void action.act(async () => {
              await persist();
              action.setMessage("Jegyzőkönyvtervezet mentve.");
            })
          }
        >
          <Text
            label="Munkavégzés dátuma"
            type="date"
            value={p.performed_on}
            required
            onChange={(performed_on) => patch({ performed_on })}
          />
          <PartyEditor
            label="Ügyfél"
            p={p.customer}
            onChange={(customer) => patch({ customer })}
          />
          <Text
            label="Munkavégzés helye"
            value={p.site}
            onChange={(site) => patch({ site })}
          />
          <Text
            label="Ténylegesen elvégzett munka"
            required
            rows={5}
            value={p.work}
            onChange={(work) => patch({ work })}
          />
          <Text
            label="Eltérések"
            rows={3}
            value={p.deviations}
            onChange={(deviations) => patch({ deviations })}
          />
          <Text
            label="Pótmunkák"
            rows={3}
            value={p.extras}
            onChange={(extras) => patch({ extras })}
          />
          <Text
            label="Fennmaradó feladatok"
            rows={3}
            value={p.remaining}
            onChange={(remaining) => patch({ remaining })}
          />
          <Text
            label="Kiegészítő átadási feltételek"
            rows={4}
            value={p.terms ?? ""}
            onChange={(terms) => patch({ terms })}
          />
          <h3>Lezárási ellenőrzések</h3>
          <Check
            label="Rendezett munkaterület"
            value={p.checks.tidy}
            onChange={(tidy) => patch({ checks: { ...p.checks, tidy } })}
          />
          <Check
            label="Ügyfél tájékoztatása"
            value={p.checks.informed}
            onChange={(informed) =>
              patch({ checks: { ...p.checks, informed } })
            }
          />
          <Check
            label="Dokumentumok átadása"
            value={p.checks.documents}
            onChange={(documents) =>
              patch({ checks: { ...p.checks, documents } })
            }
          />
          <PhotoPicker
            ctx={ctx}
            value={p.photo_ids}
            onChange={(photo_ids) => patch({ photo_ids })}
          />
          <button
            type="button"
            className="secondary space-top"
            disabled={!p.work.trim() || !Object.values(p.checks).every(Boolean)}
            onClick={() => setSigning(true)}
          >
            Tartalom áttekintése és aláírás
          </button>
        </Form>
      )}
    </Modal>
  );
}
function HandoverSummary({ p }: { p: PayloadOf<"handover"> }) {
  return (
    <div className="handover-preview">
      <h3>
        {p.number} · {p.revision}. verzió
      </h3>
      <p>
        {p.company.name} → {p.customer.name}
        <br />
        {p.site} · {p.performed_on}
      </p>
      {[
        ["Elvégzett munka", p.work],
        ["Eltérések", p.deviations],
        ["Pótmunkák", p.extras],
        ["Fennmaradó", p.remaining],
        ["Kiegészítő átadási feltételek", p.terms],
      ].map(([name, v]) => (
        <div key={name}>
          <strong>{name}</strong>
          <p className="prewrap">{v || "Nincs rögzítve."}</p>
        </div>
      ))}
      <p>
        {Object.values(p.checks).every(Boolean)
          ? "Mindhárom lezárási ellenőrzés rendben."
          : "Hiányzó lezárási ellenőrzés."}
      </p>
      <p>
        {p.photo_ids.length} kiválasztott fotó ·{" "}
        {p.customer_signature && p.contractor_signature
          ? "Mindkét fél aláírta"
          : p.customer_signature || p.contractor_signature
            ? "Részben aláírt"
            : "Aláíratlan"}
      </p>
    </div>
  );
}
function Signature({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    drawing = useRef(false);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, c.width, c.height);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height);
      img.src = value;
    }
  }, []);
  return (
    <div className="signature">
      <strong>{label}</strong>
      <canvas
        ref={ref}
        width="700"
        height="200"
        aria-label={label}
        onPointerDown={(e) => {
          const c = e.currentTarget;
          c.setPointerCapture(e.pointerId);
          drawing.current = true;
          const r = c.getBoundingClientRect(),
            ctx = c.getContext("2d")!;
          ctx.beginPath();
          ctx.moveTo(
            ((e.clientX - r.left) * c.width) / r.width,
            ((e.clientY - r.top) * c.height) / r.height,
          );
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const c = e.currentTarget,
            r = c.getBoundingClientRect(),
            ctx = c.getContext("2d")!;
          ctx.strokeStyle = "#222";
          ctx.lineWidth = 2;
          ctx.lineTo(
            ((e.clientX - r.left) * c.width) / r.width,
            ((e.clientY - r.top) * c.height) / r.height,
          );
          ctx.stroke();
        }}
        onPointerUp={(e) => {
          if (drawing.current) {
            drawing.current = false;
            onChange(e.currentTarget.toDataURL("image/png"));
          }
        }}
      />
      <button
        type="button"
        className="text-button"
        onClick={() => {
          const c = ref.current!,
            ctx = c.getContext("2d")!;
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, c.width, c.height);
          onChange("");
        }}
      >
        Aláírás törlése
      </button>
    </div>
  );
}

function ProjectOffline({ ctx }: { ctx: Context }) {
  const action = useAction();
  const docs = ctx.data.entries.filter(
    (e) => e.project_id === ctx.projectId && e.payload.type === "document",
  );
  return (
    <div className="project-offline">
      {action.feedback}
      <button
        className="secondary"
        disabled={action.busy}
        onClick={() =>
          void action.act(async () => {
            if (ctx.repo.mode === "cloud" && !ctx.repo.sync)
              throw new Error(
                "Előbb engedélyezd a saját eszközt a Beállítások / Offline és kapcsolatok alatt.",
              );
            for (const e of docs) {
              const { documentBytes } = await import("./documents");
              await documentBytes(ctx.repo, e);
            }
            const persistent = await navigator.storage?.persist?.();
            action.setMessage(
              `A projekt adatai és ${docs.length} eredeti fájlja elérhető ezen az eszközön. Tartós tárolás: ${persistent ? "engedélyezve" : "nem garantált"}. Ez nem külön biztonsági mentés.`,
            );
          })
        }
      >
        Előkészítés offline használatra
      </button>
      <p className="small muted">
        {docs.length} hivatkozott eredeti fájl. A művelet minden fájl elérését
        és ellenőrzőösszegét ellenőrzi.
      </p>
    </div>
  );
}
