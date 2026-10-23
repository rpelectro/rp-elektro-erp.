import { useState } from "react";
import { friendly, formatMoney, type WorkData } from "./domain";
import { basicCatalog, catalogKey, parseCatalog } from "./catalogImport";
import { type Context } from "./ui";

export function CatalogImport({ repo, data, reload }: Context) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<WorkData[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const existing = new Set(data.work_items.map(catalogKey));
  const pending = rows.filter((row) => !existing.has(catalogKey(row)));
  function edit(value: string) {
    setText(value);
    setRows([]);
    setError("");
    setMessage("");
  }
  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    let saved = 0;
    try {
      // Recheck persisted items so retries also skip previous successful saves.
      const keys = new Set((await repo.load()).work_items.map(catalogKey));
      for (const row of rows) {
        if (keys.has(catalogKey(row))) continue;
        await repo.save("work_items", row);
        keys.add(catalogKey(row));
        saved++;
        setMessage(`${saved} tétel mentve…`);
      }
      setMessage(
        `${saved} új munkatétel mentve. A meglévő tételeket kihagytuk.`,
      );
      setRows([]);
      setText("");
    } catch (e) {
      setMessage("");
      setError(
        `${saved} tétel mentése sikerült. ${friendly(e)} Újrapróbáláskor a már mentett tételeket kihagyjuk.`,
      );
    } finally {
      await reload();
      setBusy(false);
    }
  }
  return (
    <section
      className="panel"
      style={{ padding: "1rem", marginBottom: "1rem" }}
    >
      <button
        className="secondary"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen(!open)}
      >
        Tömeges munkatétel-felvitel
      </button>
      {open && (
        <>
          <p>
            Másolj be Excelből, vagy használj pontosvesszővel elválasztott
            sorokat: név; egység; munkadíj (Ft); kategória; leírás. Az utolsó
            három oszlop elhagyható.
          </p>
          <p>
            A hiányzó munkadíj 0 Ft lesz; ajánlatkészítés előtt add meg az
            áraidat. Az azonos nevű és egységű meglévő tételeket, az
            archiváltakat is, kihagyjuk.
          </p>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => edit(basicCatalog)}
          >
            50 alapvető villanyszerelési munka betöltése
          </button>
          <label style={{ display: "block", marginTop: "1rem" }}>
            Munkatételek bemásolása
            <textarea
              rows={10}
              value={text}
              disabled={busy}
              onChange={(e) => edit(e.target.value)}
              placeholder={"Dugalj felszerelése;db;3500;Szerelvényezés"}
            />
          </label>
          <button
            className="secondary"
            disabled={busy || !text.trim()}
            onClick={() => {
              setError("");
              setMessage("");
              setRows([]);
              try {
                setRows(parseCatalog(text));
              } catch (e) {
                setError(friendly(e));
              }
            }}
          >
            Előnézet és ellenőrzés
          </button>
          {rows.length > 0 && (
            <>
              <p>
                {pending.length} új tétel, {rows.length - pending.length}{" "}
                meglévő tétel kihagyva.
              </p>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Név</th>
                      <th>Egység</th>
                      <th>Munkadíj</th>
                      <th>Állapot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={catalogKey(row)}>
                        <td>{row.name}</td>
                        <td>{row.unit}</td>
                        <td>{formatMoney(row.price_minor)}</td>
                        <td>
                          {existing.has(catalogKey(row)) ? "Kihagyva" : "Új"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                className="primary"
                disabled={busy || !pending.length}
                onClick={() => void save()}
              >
                {busy
                  ? "Mentés folyamatban…"
                  : `${pending.length} munkatétel mentése`}
              </button>
            </>
          )}
        </>
      )}
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="notice success" role="status">
          {message}
        </div>
      )}
    </section>
  );
}
