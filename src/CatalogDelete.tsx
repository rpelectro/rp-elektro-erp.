import { useState } from "react";
import type { Repository, Work } from "./domain";
import { useAction } from "./ui";
export function CatalogDelete({
  repo,
  items,
  reload,
  all = false,
}: {
  repo: Repository;
  items: Work[];
  reload: () => Promise<void>;
  all?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const action = useAction();
  return (
    <div className="catalog-delete">
      <button
        type="button"
        className="secondary"
        disabled={!items.length || action.busy}
        onClick={() => {
          setConfirming(!confirming);
          setConfirmation("");
        }}
        aria-label={
          all ? "Teljes munkakatalógus ürítése" : `${items[0]?.name} törlése`
        }
      >
        {all ? "Teljes munkakatalógus ürítése" : "Törlés"}
      </button>
      {confirming && (
        <div
          className="notice"
          role="group"
          aria-label="Munkatételek törlésének megerősítése"
        >
          <p>
            {all
              ? `Mind a(z) ${items.length} aktív és archivált munkatétel végleg törlődik.`
              : `Végleg törlöd ezt a munkát: ${items[0]?.name}?`}{" "}
            A korábbi felmérések és ajánlatok tételei megmaradnak. A törlés nem
            vonható vissza.
          </p>
          {all && (
            <label>
              A megerősítéshez írd be: TÖRLÉS
              <input
                value={confirmation}
                disabled={action.busy}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
          )}
          <div className="row">
            <button
              type="button"
              className="primary"
              disabled={action.busy || (all && confirmation !== "TÖRLÉS")}
              onClick={() =>
                void action.act(async () => {
                  if (!repo.deleteWorkItems)
                    throw new Error("Az adattár nem támogatja a törlést.");
                  await repo.deleteWorkItems(
                    items.map(({ id, version }) => ({ id, version })),
                  );
                  setConfirming(false);
                  setConfirmation("");
                  await reload();
                  action.setMessage(
                    `${items.length} munkatétel végleg törölve.`,
                  );
                })
              }
            >
              {action.busy ? "Törlés folyamatban…" : "Végleges törlés"}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={action.busy}
              onClick={() => setConfirming(false)}
            >
              Mégse
            </button>
          </div>
        </div>
      )}
      {action.feedback}
    </div>
  );
}
