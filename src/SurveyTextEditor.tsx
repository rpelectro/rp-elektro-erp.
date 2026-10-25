import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";

export function SurveyTextEditor({
  fields,
  onChange,
}: {
  fields: { key: string; label: string; tab: string; value: string }[];
  onChange: (key: string, value: string) => void;
}) {
  const [active, setActive] = useState(fields[0].key);
  const [query, setQuery] = useState("");
  const [match, setMatch] = useState(-1);
  const editor = useRef<HTMLTextAreaElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const positions = useRef<Record<string, number>>({});
  const id = useId();
  const field = fields.find((field) => field.key === active) ?? fields[0];
  const matches = useMemo(() => {
    const result: number[] = [];
    if (!query) return result;
    const value = field.value.toLocaleLowerCase("hu"),
      term = query.toLocaleLowerCase("hu");
    for (
      let at = value.indexOf(term);
      at !== -1;
      at = value.indexOf(term, at + term.length)
    )
      result.push(at);
    return result;
  }, [field.value, query]);
  useLayoutEffect(() => {
    if (editor.current)
      editor.current.scrollTop = positions.current[field.key] ?? 0;
  }, [field.key]);
  function find(direction: number) {
    if (!matches.length || !editor.current) return;
    const next =
      match < 0
        ? direction > 0
          ? 0
          : matches.length - 1
        : (match + direction + matches.length) % matches.length;
    setMatch(next);
    editor.current.focus({ preventScroll: true });
    editor.current.setSelectionRange(
      matches[next],
      matches[next] + query.length,
    );
    // Selection is preserved; approximate scrolling also works in browsers that do not scroll to setSelectionRange.
    const prefix = field.value.slice(0, matches[next]);
    const style = getComputedStyle(editor.current),
      lineHeight = parseFloat(style.lineHeight);
    const canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = style.font;
      const width =
        editor.current.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      const lines = prefix
        .split("\n")
        .reduce(
          (sum, line) =>
            sum +
            Math.max(
              1,
              Math.ceil(ctx.measureText(line).width / Math.max(1, width)),
            ),
          0,
        );
      editor.current.scrollTop = Math.max(0, (lines - 3) * lineHeight);
    }
  }
  return (
    <div className="survey-text-editor">
      <div
        role="tablist"
        aria-label="Leírás kiválasztása"
        className="survey-text-tabs"
      >
        {fields.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            id={`${id}-tab-${item.key}`}
            aria-controls={`${id}-panel`}
            aria-selected={field.key === item.key}
            tabIndex={field.key === item.key ? 0 : -1}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const index = fields.findIndex((f) => f.key === field.key);
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? fields.length - 1
                    : (index +
                        (event.key === "ArrowRight" ? 1 : -1) +
                        fields.length) %
                      fields.length;
              setActive(fields[next].key);
              setMatch(-1);
              document.getElementById(`${id}-tab-${fields[next].key}`)?.focus();
            }}
            onClick={() => {
              setActive(item.key);
              setMatch(-1);
            }}
          >
            {item.tab}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${field.key}`}
      >
        <div className="survey-search">
          <label>
            Keresés a szövegben
            <input
              ref={search}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setMatch(-1);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  find(event.shiftKey ? -1 : 1);
                }
              }}
            />
          </label>
          <button
            type="button"
            className="secondary"
            disabled={!matches.length}
            onClick={() => find(-1)}
          >
            Előző találat
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!matches.length}
            onClick={() => find(1)}
          >
            Következő találat
          </button>
          <span className="small" aria-live="polite">
            {query
              ? `${match < 0 ? 0 : match + 1} / ${matches.length} találat`
              : ""}
          </span>
        </div>
        <label className="survey-editor-label" htmlFor={`${id}-text`}>
          {field.label}
        </label>
        <textarea
          id={`${id}-text`}
          ref={editor}
          className="survey-editor-text"
          value={field.value}
          maxLength={10000}
          onScroll={(event) => {
            positions.current[field.key] = event.currentTarget.scrollTop;
          }}
          onChange={(event) => {
            onChange(field.key, event.target.value);
            setMatch(-1);
          }}
          onKeyDown={(event) => {
            if (
              (event.ctrlKey || event.metaKey) &&
              event.key.toLowerCase() === "f"
            ) {
              event.preventDefault();
              search.current?.focus();
            }
          }}
        />
        <div className="small muted survey-editor-hint">
          {field.value.length} / 10 000 karakter · A szöveg a Mentés gombbal
          rögzíthető.
        </div>
      </div>
    </div>
  );
}
