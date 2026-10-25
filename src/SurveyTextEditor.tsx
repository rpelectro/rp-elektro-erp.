import { useId, useMemo, useRef, useState } from "react";
import { RichTextField, type RichTextHandle } from "./RichTextField";

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
  const editor = useRef<RichTextHandle>(null);
  const [visibleText, setVisibleText] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const positions = useRef<Record<string, number>>({});
  const id = useId();
  const field = fields.find((field) => field.key === active) ?? fields[0];
  const matches = useMemo(() => {
    const result: number[] = [];
    if (!query) return result;
    const value = visibleText.toLocaleLowerCase("hu"),
      term = query.toLocaleLowerCase("hu");
    for (
      let at = value.indexOf(term);
      at !== -1;
      at = value.indexOf(term, at + term.length)
    )
      result.push(at);
    return result;
  }, [visibleText, query]);
  function find(direction: number) {
    if (!matches.length || !editor.current) return;
    const next =
      match < 0
        ? direction > 0
          ? 0
          : matches.length - 1
        : (match + direction + matches.length) % matches.length;
    setMatch(next);
    editor.current.selectText(matches[next], matches[next] + query.length);
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
        <RichTextField
          key={field.key}
          ref={editor}
          label={field.label}
          value={field.value}
          onChange={(value) => {
            onChange(field.key, value);
            setMatch(-1);
          }}
          onPlainText={setVisibleText}
          initialScroll={positions.current[field.key] ?? 0}
          onScroll={(top) => {
            positions.current[field.key] = top;
          }}
          onFind={() => search.current?.focus()}
        />
      </div>
    </div>
  );
}
