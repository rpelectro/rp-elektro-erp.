import { type Context } from "./ui";
import { type PayloadOf } from "./business";
export function Upcoming({ ctx }: { ctx: Context }) {
  const events = ctx.data.entries
    .filter(
      (e) =>
        e.payload.type === "event" &&
        !e.payload.cancelled &&
        e.payload.ends_at >= new Date().toISOString() &&
        (ctx.projectId === undefined || e.project_id === ctx.projectId),
    )
    .sort((a, b) =>
      (a.payload as PayloadOf<"event">).starts_at.localeCompare(
        (b.payload as PayloadOf<"event">).starts_at,
      ),
    )
    .slice(0, 5);
  return (
    <section className="panel dashboard-events">
      <h3>Következő időpontok</h3>
      {events.length ? (
        events.map((e) => {
          const p = e.payload as PayloadOf<"event">;
          return (
            <div key={e.id} className="document-row">
              <strong>{p.title}</strong>
              <small>
                {new Intl.DateTimeFormat("hu-HU", {
                  timeZone: "Europe/Budapest",
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(p.starts_at))}{" "}
                · {p.location}
              </small>
            </div>
          );
        })
      ) : (
        <p className="muted">
          Nincs rögzített következő időpont. A Naptárban adhatsz hozzá.
        </p>
      )}
    </section>
  );
}
