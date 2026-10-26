import { useState } from "react";
import type { Context } from "./ui";
import {
  type WorkLine,
  type PayloadOf,
  parseQuantity,
  lineTotal,
} from "./business";
import { formatMoney } from "./domain";

type Candidate = { key: string; group: string; line: WorkLine };
export function QuoteWorkPicker({
  ctx,
  onAdd,
}: {
  ctx: Context;
  onAdd: (lines: WorkLine[]) => void;
}) {
  const [source, setSource] = useState("catalog");
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");
  const [location, setLocation] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const surveys = ctx.data.entries.filter(
    (e) =>
      e.project_id === (ctx.projectId ?? null) && e.payload.type === "survey",
  );
  const rooms = [
    ...new Set(
      surveys.flatMap((e) =>
        (e.payload as PayloadOf<"survey">).rooms.map((r) => r.name),
      ),
    ),
  ];
  const survey = surveys.find((e) => e.id === source)?.payload as
    PayloadOf<"survey"> | undefined;
  const candidates: Candidate[] =
    source === "catalog"
      ? ctx.data.work_items
          .filter((w) => !w.archived)
          .map((w) => {
            const recipe = ctx.data.entries.find(
              (e) => e.payload.type === "recipe" && e.payload.work_id === w.id,
            )?.payload as PayloadOf<"recipe"> | undefined;
            return {
              key: w.id,
              group: w.category || "Egyéb",
              line: {
                id: w.id,
                work_id: w.id,
                name: w.name,
                unit: w.unit,
                quantity_milli: 1000,
                price_minor: w.price_minor,
                location,
                notes: w.description,
                recipe: structuredClone(recipe?.lines ?? []),
              },
            };
          })
      : survey
        ? [
            ...survey.whole_property.map((line, i) => ({
              key: `whole-${i}`,
              group: "Egész ingatlan",
              line,
            })),
            ...survey.rooms.flatMap((r) =>
              r.lines.map((line, i) => ({
                key: `${r.id}-${i}`,
                group: r.name,
                line: {
                  ...line,
                  location:
                    r.name + (line.location ? ` / ${line.location}` : ""),
                },
              })),
            ),
          ]
        : [];
  const groups = [...new Set(candidates.map((c) => c.group))].sort((a, b) =>
    a.localeCompare(b, "hu"),
  );
  const visible = candidates.filter(
    (c) =>
      (!group || c.group === group) &&
      `${c.line.name} ${c.line.notes} ${c.group}`
        .toLocaleLowerCase("hu")
        .includes(search.toLocaleLowerCase("hu").trim()),
  );
  const chosen = candidates.filter((c) => selected[c.key] !== undefined);
  let total = 0,
    invalid = false,
    textPrices = false;
  for (const c of chosen) {
    try {
      const count = parseQuantity(selected[c.key]);
      if (count <= 0 || count > 1000000000) throw new Error();
      if (c.line.price_text !== undefined) textPrices = true;
      else total += lineTotal({ ...c.line, quantity_milli: count });
    } catch {
      invalid = true;
    }
  }
  function toggle(c: Candidate) {
    setMessage("");
    setSelected((prev) => {
      const next = { ...prev };
      if (next[c.key] !== undefined) delete next[c.key];
      else next[c.key] = String(c.line.quantity_milli / 1000);
      return next;
    });
  }
  return (
    <section className="quote-work-picker" aria-label="Munkák kiválasztása">
      <h3>Munkák kiválasztása</h3>
      <p>
        Keresd meg és pipáld be a munkákat, állítsd be a mennyiséget, majd add
        hozzá őket egyszerre. A hozzáadott tételek lent módosíthatók.
      </p>
      <div className="form-grid">
        <label>
          Tételek forrása
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setSelected({});
              setGroup("");
              setSearch("");
              setMessage("");
            }}
          >
            <option value="catalog">Munkakatalógus</option>
            {surveys.map((e) => (
              <option key={e.id} value={e.id}>
                {(e.payload as PayloadOf<"survey">).name}
              </option>
            ))}
          </select>
        </label>
        {source === "catalog" && (
          <label>
            Helyiség a hozzáadott munkákhoz
            <input
              list="quote-picker-rooms"
              value={location}
              maxLength={10000}
              placeholder="Egész ingatlan"
              onChange={(e) => setLocation(e.target.value)}
            />
            <datalist id="quote-picker-rooms">
              {rooms.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </label>
        )}
        <label>
          Munka keresése
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Például dugalj vagy vezetékezés"
          />
        </label>
        <label>
          {source === "catalog" ? "Kategória" : "Helyiség"}
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">Összes</option>
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="row between">
        <small>
          {visible.length} találat · {chosen.length} kijelölve
        </small>
        <div className="row">
          <button
            type="button"
            className="secondary"
            disabled={!visible.length}
            onClick={() =>
              setSelected((prev) => ({
                ...prev,
                ...Object.fromEntries(
                  visible.map((c) => [
                    c.key,
                    prev[c.key] ?? String(c.line.quantity_milli / 1000),
                  ]),
                ),
              }))
            }
          >
            Találatok kijelölése
          </button>
          <button
            type="button"
            className="text-button"
            disabled={!chosen.length}
            onClick={() => setSelected({})}
          >
            Kijelölés törlése
          </button>
        </div>
      </div>
      <div className="work-picker-results">
        {visible.map((c) => (
          <div className="work-picker-row" key={c.key}>
            <label className="work-picker-choice">
              <input
                type="checkbox"
                checked={selected[c.key] !== undefined}
                onChange={() => toggle(c)}
              />
              <span>
                <strong>{c.line.name}</strong>
                <small>
                  {c.group} ·{" "}
                  {c.line.price_text ?? formatMoney(c.line.price_minor)} /{" "}
                  {c.line.unit}
                  {c.line.price_minor === 0 && c.line.price_text === undefined
                    ? " · Ár megadása szükséges"
                    : ""}
                </small>
              </span>
            </label>
            <label>
              Mennyiség ({c.line.unit})
              <input
                aria-label={`${c.line.name} mennyisége`}
                inputMode="decimal"
                disabled={selected[c.key] === undefined}
                value={selected[c.key] ?? String(c.line.quantity_milli / 1000)}
                onChange={(e) =>
                  setSelected((prev) => ({ ...prev, [c.key]: e.target.value }))
                }
              />
            </label>
          </div>
        ))}
        {!visible.length && (
          <p>
            {source === "catalog"
              ? "Nincs találat. Vegyél fel munkákat a Beállítások munkakatalógusában, vagy adj hozzá egyedi tételt lent."
              : "Ebben a felmérésben vagy szűrésben nincs munkatétel."}
          </p>
        )}
      </div>
      <div className="work-picker-footer">
        <div>
          <strong>
            {chosen.length} kijelölt munka · {formatMoney(total)}
          </strong>
          <small>
            Munkadíj, áfa és kedvezmény nélkül.
            {textPrices
              ? " A szöveges árak nincsenek beleszámítva; ezeket az ajánlatban számszerűsíteni kell."
              : ""}
          </small>
        </div>
        <button
          type="button"
          className="primary"
          disabled={!chosen.length || invalid}
          onClick={() => {
            onAdd(
              chosen.map((c) => ({
                ...structuredClone(c.line),
                id: crypto.randomUUID(),
                quantity_milli: parseQuantity(selected[c.key]),
                location:
                  source === "catalog"
                    ? location.trim() || "Egész ingatlan"
                    : c.line.location,
              })),
            );
            setMessage(`${chosen.length} munkatétel hozzáadva az ajánlathoz.`);
            setSelected({});
          }}
        >
          Kijelöltek hozzáadása
        </button>
      </div>
      {invalid && (
        <p role="alert">
          Minden kijelölt munkánál adj meg pozitív mennyiséget, legfeljebb három
          tizedesjeggyel.
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
