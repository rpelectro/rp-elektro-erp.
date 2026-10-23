import { useState } from "react";
import {
  type Context,
  useAction,
  saveEntry,
  Text,
  Select,
  Check,
  Form,
  Modal,
} from "./ui";
import { today, overlaps, type PayloadOf, type Entry } from "./business";
const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("hu-HU", {
    timeZone: "Europe/Budapest",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
// datetime-local is displayed explicitly as Budapest wall time, independent of device timezone.
export function budapestInput(iso: string) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  return parts.replace(" ", "T");
}
export function budapestToIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("Hiányzó vagy hibás időpont.");
  const naive = new Date(`${value}Z`).getTime();
  const candidates = [naive - 3600000, naive - 7200000].filter(
    (t) => budapestInput(new Date(t).toISOString()) === value,
  );
  if (candidates.length !== 1)
    throw new Error(
      "Ez az időpont óraátállítás miatt nem létezik vagy kétszer fordul elő. Válassz másik időpontot.",
    );
  return new Date(candidates[0]).toISOString();
}
export function Calendar({ ctx }: { ctx: Context }) {
  const [edit, setEdit] = useState<Entry | null | undefined>(),
    [day, setDay] = useState(""),
    [showPast, setShowPast] = useState(false);
  const rows = ctx.data.entries
    .filter(
      (e) =>
        e.payload.type === "event" &&
        (ctx.projectId === undefined || e.project_id === ctx.projectId) &&
        (!day || budapestInput(e.payload.starts_at).startsWith(day)) &&
        (showPast || e.payload.ends_at >= new Date().toISOString()),
    )
    .sort((a, b) =>
      (a.payload as PayloadOf<"event">).starts_at.localeCompare(
        (b.payload as PayloadOf<"event">).starts_at,
      ),
    );
  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Időpontok · Europe/Budapest</h2>
        <button className="primary" onClick={() => setEdit(null)}>
          Új időpont
        </button>
      </div>
      <div className="toolbar">
        <Text label="Dátumszűrő" type="date" value={day} onChange={setDay} />
        <Check
          label="Korábbi időpontok is"
          value={showPast}
          onChange={setShowPast}
        />
      </div>
      {rows.map((e) => {
        const p = e.payload as PayloadOf<"event">;
        const conflicting = overlaps(
          p,
          ctx.data.entries.filter((r) => r.id !== e.id),
        );
        return (
          <div className="document-row" key={e.id}>
            <div>
              <strong>
                {p.title}
                {p.cancelled ? " · Lemondva" : ""}
              </strong>
              <small>
                {dateTime(p.starts_at)} – {dateTime(p.ends_at)} · {p.location}
              </small>
              <small>
                {ctx.data.projects.find((pr) => pr.id === e.project_id)
                  ?.title ?? "Projekt nélkül"}
                {conflicting.length && !p.cancelled ? " · Átfedő időpont!" : ""}
                {p.google_enabled ? " · Google-szinkron engedélyezve" : ""}
              </small>
            </div>
            <button className="secondary" onClick={() => setEdit(e)}>
              Szerkesztés
            </button>
          </div>
        );
      })}
      {!rows.length && (
        <p className="muted">Nincs időpont a kiválasztott időszakban.</p>
      )}
      {edit !== undefined && (
        <EventEditor
          ctx={ctx}
          entry={edit ?? undefined}
          onClose={() => setEdit(undefined)}
        />
      )}
    </section>
  );
}
function EventEditor({
  ctx,
  entry,
  onClose,
}: {
  ctx: Context;
  entry?: Entry;
  onClose: () => void;
}) {
  const [p, set] = useState<PayloadOf<"event">>(
    (entry?.payload as PayloadOf<"event">) ?? {
      type: "event",
      title: "",
      category: "work",
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 3600000).toISOString(),
      location: "",
      notes: "",
      cancelled: false,
      google_enabled: false,
    },
  );
  const [start, setStart] = useState(budapestInput(p.starts_at)),
    [end, setEnd] = useState(budapestInput(p.ends_at)),
    [projectId, setProject] = useState(
      entry?.project_id ?? ctx.projectId ?? "",
    ),
    [dirty, mark] = useState(false),
    [confirmed, setConfirmed] = useState(false);
  const action = useAction();
  const patch = (v: Partial<typeof p>) => {
    set({ ...p, ...v });
    mark(true);
    setConfirmed(false);
  };
  let overlap: Entry[] = [];
  try {
    overlap = overlaps(
      { ...p, starts_at: budapestToIso(start), ends_at: budapestToIso(end) },
      ctx.data.entries.filter((e) => e.id !== entry?.id),
    );
  } catch {}
  return (
    <Modal title="Időpont" dirty={dirty} onClose={onClose}>
      {action.feedback}
      <Form
        busy={action.busy}
        onSave={() =>
          void action.act(async () => {
            if (overlap.length && !p.cancelled && !confirmed)
              throw new Error("Az átfedés elfogadását külön jelöld.");
            await saveEntry(
              { ...ctx, projectId: projectId || null },
              {
                ...p,
                starts_at: budapestToIso(start),
                ends_at: budapestToIso(end),
              },
              entry,
              projectId || null,
            );
            await ctx.reload();
            mark(false);
            onClose();
          })
        }
      >
        <Text
          label="Időpont neve"
          required
          value={p.title}
          onChange={(title) => patch({ title })}
        />
        <Select
          label="Projekt"
          value={projectId}
          onChange={(v) => {
            setProject(v);
            mark(true);
          }}
          options={[
            ["", "Nincs projekt"],
            ...ctx.data.projects
              .filter((p) => !p.archived)
              .map((p) => [p.id, p.title] as [string, string]),
          ]}
        />
        <Select
          label="Időpont típusa"
          value={p.category}
          onChange={(category) =>
            patch({ category: category as typeof p.category })
          }
          options={Object.entries({
            survey: "Felmérés",
            work: "Munkavégzés",
            return: "Visszatérés",
          })}
        />
        <Text
          label="Kezdés (budapesti idő)"
          type="datetime-local"
          required
          value={start}
          onChange={(v) => {
            setStart(v);
            mark(true);
            setConfirmed(false);
          }}
        />
        <Text
          label="Befejezés (budapesti idő)"
          type="datetime-local"
          required
          value={end}
          onChange={(v) => {
            setEnd(v);
            mark(true);
            setConfirmed(false);
          }}
        />
        <Text
          label="Helyszín"
          value={p.location}
          onChange={(location) => patch({ location })}
        />
        <Text
          label="Időpont megjegyzése"
          rows={3}
          value={p.notes}
          onChange={(notes) => patch({ notes })}
        />
        <Check
          label="Időpont lemondva"
          value={p.cancelled}
          onChange={(cancelled) => patch({ cancelled })}
        />
        <Check
          label="Google Naptár-szinkron engedélyezése ehhez az eseményhez"
          value={p.google_enabled}
          onChange={(google_enabled) => patch({ google_enabled })}
        />
        {overlap.length > 0 && !p.cancelled && (
          <div className="notice">
            Átfedés:{" "}
            {overlap
              .map((e) => (e.payload as PayloadOf<"event">).title)
              .join(", ")}
            <Check
              label="Az átfedést tudomásul veszem"
              value={confirmed}
              onChange={setConfirmed}
            />
          </div>
        )}
        <p className="small muted">
          A mentés nem küld ügyfélmeghívót, és az időpont vége nem zárja le a
          projektet.
        </p>
      </Form>
    </Modal>
  );
}
