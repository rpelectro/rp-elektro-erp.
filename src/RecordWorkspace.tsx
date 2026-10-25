import { createPortal } from "react-dom";
import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { RecordWorkspaceContext } from "./RecordWorkspaceContext";

export function WorkspaceSection({
  id,
  title,
  children,
}: {
  id: string;
  title?: string;
  children: ReactNode;
}) {
  const context = useContext(RecordWorkspaceContext);
  return (
    <section data-record-section={id} hidden={context?.active !== id}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}

export function RecordWorkspace({
  title,
  dirty = false,
  busy = false,
  onClose,
  sections,
  children,
  saveLabel,
  toolbar,
}: {
  title: string;
  dirty?: boolean;
  busy?: boolean;
  onClose: () => void;
  sections: { id: string; label: string }[];
  children: ReactNode;
  saveLabel?: string;
  toolbar?: ReactNode;
}) {
  const [selected, setSelected] = useState(sections[0]?.id ?? "");
  const active = sections.some((section) => section.id === selected)
    ? selected
    : (sections[0]?.id ?? "");
  const [validation, setValidation] = useState("");
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    root.current?.scrollIntoView({ block: "start" });
  }, [active]);
  function navigateSection(id: string) {
    setValidation("");
    setSelected(id);
  }
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty || busy) event.preventDefault();
    };
    const navigate = (event: MouseEvent) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest(".sidebar button, .sidebar a")
      )
        return;
      if (
        busy ||
        (dirty &&
          !window.confirm(
            "A módosítások nincsenek elmentve. Elhagyod mentés nélkül?",
          ))
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty, busy]);
  function reveal(node: HTMLElement) {
    const section = node.closest<HTMLElement>("[data-record-section]")?.dataset
      .recordSection;
    if (section) setSelected(section);
    setValidation(
      "Ellenőrizd a kijelölt mezőt. A módosítások még nincsenek elmentve.",
    );
    requestAnimationFrame(() => {
      node.focus();
    });
  }
  const host = document.querySelector("main.content");
  if (!host) return null;
  return createPortal(
    <RecordWorkspaceContext.Provider
      value={{ active, reveal, navigate: navigateSection }}
    >
      <section
        ref={root}
        className="survey-workspace record-workspace"
        aria-label={title}
        data-header-save={saveLabel ? "true" : undefined}
      >
        <header className="survey-workspace-header">
          <div>
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => {
                if (
                  !dirty ||
                  window.confirm(
                    "A módosítások nincsenek elmentve. Visszalépsz mentés nélkül?",
                  )
                )
                  onClose();
              }}
            >
              ← Vissza a listához
            </button>
            <h1>{title}</h1>
          </div>
          <div className="row">
            <span className={dirty ? "survey-unsaved" : "muted"}>
              {busy
                ? "Művelet folyamatban…"
                : dirty
                  ? "Nem mentett módosítások"
                  : "Szerkesztőnézet"}
            </span>
            {toolbar}
            {saveLabel && (
              <button
                type="button"
                className="primary"
                disabled={busy}
                onClick={() => {
                  setValidation("");
                  root.current
                    ?.querySelector<HTMLFormElement>("form")
                    ?.requestSubmit();
                }}
              >
                {saveLabel}
              </button>
            )}
          </div>
        </header>
        {validation && (
          <div className="notice error" role="alert">
            {validation}
          </div>
        )}
        <div className="survey-mobile-nav">
          <label>
            Dokumentum részei
            <select
              aria-label="Dokumentum részei"
              disabled={busy}
              value={active}
              onChange={(event) => navigateSection(event.target.value)}
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="survey-workspace-grid">
          <nav className="survey-section-nav" aria-label="Dokumentum részei">
            <strong>Dokumentum részei</strong>
            {sections.map((section) => (
              <button
                type="button"
                key={section.id}
                disabled={busy}
                className={active === section.id ? "active" : ""}
                aria-current={active === section.id ? "page" : undefined}
                onClick={() => navigateSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>
          <div className="survey-workspace-main record-workspace-content">
            <fieldset disabled={busy} className="survey-workspace-fields">
              {children}
            </fieldset>
          </div>
        </div>
      </section>
    </RecordWorkspaceContext.Provider>,
    host,
  );
}
