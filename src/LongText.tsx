import { useLayoutEffect, useEffect, useRef, useState, useId } from "react";
import { createPortal } from "react-dom";

export function LongText({
  label,
  value,
  onChange,
  rows = 4,
  disabled,
  required,
  name,
  maxLength = 10000,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  maxLength?: number;
}) {
  const field = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [expanded, setExpanded] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const resize = () => {
      const node = field.current;
      if (!node || !node.getClientRects().length) return;
      node.style.height = "auto";
      node.style.height = `${Math.max(120, node.scrollHeight + 2)}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    // Collapsed room contents need measuring when opened too.
    const details = field.current?.closest("details");
    details?.addEventListener("toggle", resize);
    return () => {
      window.removeEventListener("resize", resize);
      details?.removeEventListener("toggle", resize);
    };
  }, [value]);
  useEffect(() => {
    if (!expanded) return;
    const node = dialog.current;
    node?.showModal();
    return () => {
      node?.close();
      opener.current?.focus();
    };
  }, [expanded]);
  return (
    <div className="long-text-field">
      <label htmlFor={fieldId}>{label}</label>
      <textarea
        id={fieldId}
        ref={field}
        className="auto-textarea"
        name={name}
        value={value}
        rows={Math.max(rows, 4)}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        ref={opener}
        type="button"
        className="text-button"
        disabled={disabled}
        title={`${label} – nagyobb szerkesztőnézet`}
        onClick={() => setExpanded(true)}
      >
        Nagyobb szerkesztőnézet
      </button>
      {expanded &&
        createPortal(
          <dialog
            ref={dialog}
            className="text-editor-dialog"
            aria-label={`Szöveg szerkesztése: ${label}`}
            onCancel={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setExpanded(false);
            }}
          >
            <div className="dialog-heading">
              <h2>{label}</h2>
              <button
                type="button"
                className="secondary"
                onClick={() => setExpanded(false)}
              >
                Vissza az űrlaphoz
              </button>
            </div>
            <p className="small muted">
              A módosítások az űrlapra azonnal átkerülnek. Véglegesítéshez az
              űrlap Mentés gombját használd.
            </p>
            <textarea
              autoFocus
              aria-label={label}
              value={value}
              maxLength={maxLength}
              onChange={(event) => onChange(event.target.value)}
            />
          </dialog>,
          document.body,
        )}
    </div>
  );
}
