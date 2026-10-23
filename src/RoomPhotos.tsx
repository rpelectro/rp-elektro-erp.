import { useState } from "react";
import { type Context } from "./ui";
import { attach } from "./documents";
import { friendly } from "./domain";
import { PhotoPreview } from "./PhotoPreview";

export function RoomPhotos({
  ctx,
  name,
  ids,
  entityId,
  onAdd,
  onRemove,
  onBusy,
  locked,
}: {
  ctx: Context;
  name: string;
  ids: string[];
  entityId?: string;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onBusy: (busy: boolean) => void;
  locked: boolean;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <h4>Helyiség fényképei ({ids.length})</h4>
      <PhotoPreview
        ctx={ctx}
        ids={ids.filter((id) => ctx.data.entries.some((e) => e.id === id))}
      />
      {ids.map((id) => {
        const entry = ctx.data.entries.find((e) => e.id === id);
        const fileName =
          entry?.payload.type === "document"
            ? entry.payload.name
            : "Hiányzó fotó";
        return (
          <div className="row between" key={id}>
            <span>{fileName}</span>
            <button
              type="button"
              className="text-button"
              disabled={busy || locked}
              onClick={() => onRemove(id)}
            >
              Fotó leválasztása: {fileName}
            </button>
          </div>
        );
      })}
      <label className="upload-box">
        {name || "Névtelen helyiség"} – képek feltöltése
        <input
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          disabled={busy || locked}
          onChange={(event) => {
            const input = event.currentTarget;
            const files = Array.from(input.files ?? []);
            if (!files.length) return;
            setBusy(true);
            onBusy(true);
            setError("");
            void (async () => {
              let saved = 0;
              try {
                for (const file of files) {
                  if (!file.type.startsWith("image/"))
                    throw new Error("Csak JPEG, PNG vagy WebP képet válassz.");
                  const entry = await attach(
                    ctx.repo,
                    ctx.projectId ?? null,
                    file,
                    "photo",
                    entityId ?? null,
                  );
                  onAdd(entry.id);
                  saved++;
                }
              } catch (e) {
                setError(
                  `${saved} kép feltöltve. ${friendly(e)} A már feltöltött képek megmaradtak.`,
                );
              } finally {
                try {
                  await ctx.reload();
                } finally {
                  input.value = "";
                  setBusy(false);
                  onBusy(false);
                }
              }
            })();
          }}
        />
      </label>
      <p className="small muted">
        Több kép is kiválasztható. JPEG, PNG, WebP · képenként legfeljebb 10 MB.
        A helyiséghez rendelést a felmérés mentése rögzíti. Leválasztáskor az
        eredeti fájl megmarad a Dokumentumok között.
      </p>
      {busy && <p role="status">Képek feltöltése…</p>}
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
