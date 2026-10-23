import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import {
  friendly,
  parseMoney,
  moneyInput,
  type Snapshot,
  type Repository,
} from "./domain";
import { today, parseQuantity, type Payload, type Entry } from "./business";
export interface Context {
  repo: Repository;
  data: Snapshot;
  reload: () => Promise<void>;
  projectId?: string | null;
  switchRepo?: (repo: Repository) => void;
}
export function useAction() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
      return true;
    } catch (e) {
      setError(friendly(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return {
    error,
    busy,
    message,
    setMessage,
    act,
    feedback: (
      <>
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
      </>
    ),
  };
}
export async function saveEntry(
  ctx: Context,
  payload: Payload,
  previous?: Entry,
  projectId = ctx.projectId ?? null,
) {
  return ctx.repo.save(
    "entries",
    {
      project_id: projectId,
      payload,
      source_system: previous?.source_system ?? "",
      source_id: previous?.source_id ?? "",
    },
    previous?.id,
    previous?.version,
  );
}
export function Text({
  label,
  value,
  onChange,
  required = false,
  rows,
  disabled = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  rows?: number;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label>
      {label}
      {rows ? (
        <textarea
          value={value}
          required={required}
          rows={rows}
          disabled={disabled}
          maxLength={10000}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          value={value}
          required={required}
          type={type}
          disabled={disabled}
          maxLength={10000}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
export function Amount({
  label,
  value,
  onChange,
  quantity = false,
  signed = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  quantity?: boolean;
  signed?: boolean;
}) {
  return (
    <label>
      {label}
      <input
        required
        inputMode="decimal"
        defaultValue={
          quantity
            ? String(value / 1000).replace(".", ",")
            : moneyInput(Math.abs(value)).replace(
                /^/,
                signed && value < 0 ? "-" : "",
              )
        }
        onChange={(e) => {
          try {
            let s = e.target.value;
            const neg = signed && s.startsWith("-");
            if (neg) s = s.slice(1);
            const n = quantity ? parseQuantity(s) : parseMoney(s);
            onChange(neg ? -n : n);
            e.target.setCustomValidity("");
          } catch (error) {
            e.target.setCustomValidity(friendly(error));
          }
        }}
      />
    </label>
  );
}
export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Check({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="checkbox module-check">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
export function Form({
  children,
  onSave,
  busy,
  label = "Mentés",
}: {
  children: ReactNode;
  onSave: () => void;
  busy: boolean;
  label?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      {children}
      <div className="form-actions">
        <button className="primary" disabled={busy}>
          {busy ? "Folyamatban…" : label}
        </button>
      </div>
    </form>
  );
}
export function Modal({
  title,
  children,
  onClose,
  dirty = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  dirty?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const close = () => (dirty ? setConfirm(true) : onClose());
  return (
    <dialog
      className="editor-dialog module-dialog"
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button className="icon-button" onClick={close} aria-label="Bezárás">
          ×
        </button>
      </div>
      <div className="dialog-body">
        {confirm && (
          <div className="notice error">
            A nem mentett változtatások elvesznek.
            <div className="row">
              <button className="secondary" onClick={() => setConfirm(false)}>
                Folytatás
              </button>
              <button className="secondary" onClick={onClose}>
                Elvetés és bezárás
              </button>
            </div>
          </div>
        )}
        {children}
      </div>
    </dialog>
  );
}
export function DocumentList({
  ctx,
  entityId,
  photos = false,
}: {
  ctx: Context;
  entityId?: string;
  photos?: boolean;
}) {
  const action = useAction();
  const rows = ctx.data.entries.filter(
    (e) =>
      e.project_id === (ctx.projectId ?? null) &&
      e.payload.type === "document" &&
      (!entityId || e.payload.entity_id === entityId) &&
      (!photos || e.payload.mime.startsWith("image/")),
  );
  return (
    <>
      {action.feedback}
      <div className="document-list">
        {rows.map(
          (e) =>
            e.payload.type === "document" && (
              <div className="document-row" key={e.id}>
                <div>
                  <strong>{e.payload.name}</strong>
                  <small>
                    {e.payload.category} · {(e.payload.size / 1024).toFixed(1)}{" "}
                    kB · eredeti fájl
                  </small>
                </div>
                <button
                  className="secondary"
                  disabled={action.busy}
                  onClick={() =>
                    void action.act(async () => {
                      const { openDocument } = await import("./documents");
                      await openDocument(ctx.repo, e);
                    })
                  }
                >
                  Letöltés
                </button>
              </div>
            ),
        )}
      </div>
      {!rows.length && <p className="muted">Még nincs csatolt dokumentum.</p>}
    </>
  );
}
export function Upload({
  ctx,
  category = "other",
  entityId,
  onDone,
}: {
  ctx: Context;
  category?: "photo" | "other" | "invoice" | "logo";
  entityId?: string;
  onDone?: (entry: Entry) => void;
}) {
  const action = useAction();
  return (
    <div className="upload-box">
      {action.feedback}
      <label>
        {category === "photo" ? "Fénykép csatolása" : "Eredeti fájl csatolása"}
        <input
          type="file"
          accept={
            category === "photo" || category === "logo"
              ? "image/png,image/jpeg,image/webp"
              : "application/pdf,image/png,image/jpeg,image/webp"
          }
          disabled={action.busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void action.act(async () => {
              const { attach } = await import("./documents");
              const entry = await attach(
                ctx.repo,
                ctx.projectId ?? null,
                file,
                category,
                entityId ?? null,
              );
              await ctx.reload();
              onDone?.(entry);
              action.setMessage("Az eredeti fájl és kapcsolata elmentve.");
              e.target.value = "";
            });
          }}
        />
      </label>
      <small className="muted">
        PDF, JPEG, PNG vagy WebP · legfeljebb 10 MB · a felvétel nem jelent
        kiküldést.
      </small>
    </div>
  );
}
