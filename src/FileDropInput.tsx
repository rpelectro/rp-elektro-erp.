import { useRef, useState } from "react";

export function FileDropInput({
  label,
  accept,
  disabled = false,
  multiple = true,
  onFiles,
}: {
  label: string;
  accept: string;
  disabled?: boolean;
  multiple?: boolean;
  onFiles: (files: File[]) => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  async function submit(files: File[]) {
    if (disabled || pending.current || !files.length) return;
    setError("");
    if (!multiple && files.length > 1) {
      setError("Itt egyszerre egy fájl tölthető fel.");
      return;
    }
    pending.current = true;
    setSending(true);
    try {
      await onFiles(files);
    } catch {
      setError(
        "A feltöltés nem sikerült. Ellenőrizd a feltöltött fájlok listáját, majd próbáld újra.",
      );
    } finally {
      pending.current = false;
      setSending(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div
      role="group"
      aria-label="Fájlok behúzása"
      className={`upload-box file-drop${dragging && !disabled && !sending ? " is-dragging" : ""}${disabled || sending ? " is-disabled" : ""}`}
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        event.stopPropagation();
        depth.current++;
        setDragging(true);
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect =
          disabled || pending.current ? "none" : "copy";
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        event.stopPropagation();
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        depth.current = 0;
        setDragging(false);
        void submit(Array.from(event.dataTransfer.files));
      }}
    >
      <p className="drop-prompt">
        {dragging && !disabled && !sending
          ? "Engedd el itt a fájlokat"
          : multiple
            ? "Húzd ide a képeket vagy fájlokat, akár többet egyszerre"
            : "Húzd ide a fájlt"}
      </p>
      <label>
        {label}
        <input
          ref={input}
          type="file"
          multiple={multiple}
          accept={accept}
          disabled={disabled || sending}
          onChange={(event) =>
            void submit(Array.from(event.currentTarget.files ?? []))
          }
        />
      </label>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
