import { useState } from "react";
import { friendly, formatMoney, type WorkData } from "./domain";
import {
  basicCatalog,
  catalogKey,
  parseCatalog,
  decodeCatalogFile,
} from "./catalogImport";
import { type Context } from "./ui";

export function CatalogImport({ repo, data, reload }: Context) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [rows, setRows] = useState<WorkData[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const existing = new Set(data.work_items.map(catalogKey));
  const pending = rows.filter((row) => !existing.has(catalogKey(row)));
  function edit(value: string) {
    setFileName("");
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
      setFileName("");
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
            Válassz CSV-fájlt, vagy másolj be Excelből. Az oszlopsorrend:
            megnevezés; egység; egységár (Ft); kategória; leírás. Az utolsó
            három oszlop elhagyható. Legfeljebb 500 tétel, 2 MB. Excelben a
            munkatételeket tartalmazó munkalapot mentsd „CSV UTF-8” formátumban.
          </p>
          <label style={{ display: "block", marginBottom: "1rem" }}>
            CSV-fájl feltöltése
            <input
              type="file"
              accept=".csv,.tsv,text/csv,text/tab-separated-values"
              disabled={busy}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                setBusy(true);
                edit("");
                try {
                  if (!/\.(csv|tsv)$/i.test(file.name))
                    throw new Error(
                      "CSV-fájlt válassz. Az Excel-fájlt előbb mentsd CSV UTF-8 formátumban.",
                    );
                  if (file.size > 2 * 1024 * 1024)
                    throw new Error(
                      "Legfeljebb 2 MB-os CSV-fájl tölthető fel.",
                    );
                  const content = decodeCatalogFile(
                    new Uint8Array(await file.arrayBuffer()),
                  );
                  setText(content);
                  setFileName(file.name);
                  setRows(parseCatalog(content));
                } catch (e) {
                  setError(friendly(e));
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          {fileName && (
            <p>
              Beolvasott fájl: <strong>{fileName}</strong>. Ellenőrizd az
              előnézetet, majd kattints a mentésre.
            </p>
          )}
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
                      <th>Kategória</th>
                      <th>Leírás</th>
                      <th>Állapot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={catalogKey(row)}>
                        <td>{row.name}</td>
                        <td>{row.unit}</td>
                        <td>{formatMoney(row.price_minor)}</td>
                        <td>{row.category || "—"}</td>
                        <td style={{ whiteSpace: "pre-wrap", minWidth: 240 }}>
                          {row.description || "—"}
                        </td>
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
