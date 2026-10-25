import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Undo2,
  Redo2,
} from "lucide-react";

export interface RichTextHandle {
  selectText: (start: number, end: number) => void;
}
export const RichTextField = forwardRef<
  RichTextHandle,
  {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onPlainText?: (value: string) => void;
    onScroll?: (top: number) => void;
    initialScroll?: number;
    onFind?: () => void;
    disabled?: boolean;
    name?: string;
    required?: boolean;
    maxLength?: number;
  }
>(function RichTextField(
  {
    label,
    value,
    onChange,
    onPlainText,
    onScroll,
    initialScroll = 0,
    onFind,
    disabled = false,
    name,
    required = false,
    maxLength = 10000,
  },
  ref,
) {
  const scroll = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onChange, onPlainText, onFind });
  callbacks.current = { onChange, onPlainText, onFind };
  const loaded = useRef(value);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
        strike: false,
        code: false,
        codeBlock: false,
        trailingNode: false,
      }),
      Markdown,
    ],
    content: value,
    contentType: "markdown",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text-content",
        role: "textbox",
        "aria-label": label,
        "aria-multiline": "true",
        "aria-required": String(required),
        spellcheck: "true",
      },
      handleKeyDown: (_, event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "f" &&
          callbacks.current.onFind
        ) {
          event.preventDefault();
          callbacks.current.onFind();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.getMarkdown();
      loaded.current = markdown;
      callbacks.current.onChange(markdown);
      callbacks.current.onPlainText?.(plainText(editor.state.doc).text);
      scroll.current?.dispatchEvent(new Event("input", { bubbles: true }));
    },
  });
  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            h1: editor.isActive("heading", { level: 1 }),
            h2: editor.isActive("heading", { level: 2 }),
            bullets: editor.isActive("bulletList"),
            numbers: editor.isActive("orderedList"),
            undo: editor.can().undo(),
            redo: editor.can().redo(),
          }
        : null,
  });
  useEffect(() => {
    if (!editor) return;
    if (loaded.current !== value) {
      editor.commands.setContent(value, {
        contentType: "markdown",
        emitUpdate: false,
      });
      loaded.current = value;
    }
    callbacks.current.onPlainText?.(plainText(editor.state.doc).text);
  }, [editor, value]);
  useEffect(() => {
    if (!editor) return;
    if (scroll.current) scroll.current.scrollTop = initialScroll;
    const fieldset = editor.view.dom.closest("fieldset");
    const sync = () => {
      const editable = !disabled && !fieldset?.disabled;
      if (editor.isEditable !== editable) editor.setEditable(editable, false);
    };
    sync();
    const observer = new MutationObserver(sync);
    if (fieldset)
      observer.observe(fieldset, {
        attributes: true,
        attributeFilter: ["disabled"],
      });
    return () => observer.disconnect();
  }, [editor, disabled]);
  useImperativeHandle(
    ref,
    () => ({
      selectText: (start, end) => {
        if (!editor) return;
        const { positions } = plainText(editor.state.doc),
          from = positions[start],
          last = positions[end - 1];
        if (from === undefined || last === undefined) return;
        editor
          .chain()
          .focus()
          .setTextSelection({ from, to: last + 1 })
          .scrollIntoView()
          .run();
      },
    }),
    [editor],
  );
  const buttons = [
    {
      label: "Félkövér",
      hint: "Ctrl+B",
      Icon: Bold,
      active: state?.bold,
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: "Dőlt",
      hint: "Ctrl+I",
      Icon: Italic,
      active: state?.italic,
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: "Címsor 1",
      Icon: Heading1,
      active: state?.h1,
      run: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "Címsor 2",
      Icon: Heading2,
      active: state?.h2,
      run: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Felsorolás",
      Icon: List,
      active: state?.bullets,
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Számozott lista",
      Icon: ListOrdered,
      active: state?.numbers,
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Visszavonás",
      hint: "Ctrl+Z",
      Icon: Undo2,
      disabled: !state?.undo,
      run: () => editor?.chain().focus().undo().run(),
    },
    {
      label: "Ismétlés",
      hint: "Ctrl+Shift+Z",
      Icon: Redo2,
      disabled: !state?.redo,
      run: () => editor?.chain().focus().redo().run(),
    },
  ];
  return (
    <div className="rich-text-field">
      <div className="survey-editor-label">{label}</div>
      <div className="rich-toolbar" role="toolbar" aria-label="Szövegformázás">
        {buttons.map(
          ({ label, hint, Icon, active, run, disabled: unavailable }) => (
            <button
              type="button"
              key={label}
              title={hint ? `${label} (${hint})` : label}
              aria-label={label}
              aria-pressed={active === undefined ? undefined : active}
              disabled={!editor || disabled || unavailable}
              onMouseDown={(event) => event.preventDefault()}
              onClick={run}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ),
        )}
      </div>
      <div
        ref={scroll}
        className="rich-editor-scroll"
        onScroll={(event) => onScroll?.(event.currentTarget.scrollTop)}
        onMouseDown={(event) => {
          if (editor && !editor.view.dom.contains(event.target as Node))
            editor.commands.focus("end");
        }}
      >
        <EditorContent editor={editor} />
      </div>
      {name && <input type="hidden" name={name} value={value} />}
      <div className="small muted survey-editor-hint">
        {value.length} / {maxLength} karakter · A szöveg a Mentés gombbal
        rögzíthető.
      </div>
      {value.length > maxLength && (
        <div role="alert" className="notice error">
          A szöveg a formázással együtt túl hosszú. A mentéshez rövidítsd{" "}
          {maxLength} karakter alá.
        </div>
      )}
    </div>
  );
});

// Search positions refer to visible characters, not Markdown formatting markers.
function plainText(doc: import("@tiptap/pm/model").Node) {
  let text = "";
  const positions: number[] = [];
  let firstBlock = true;
  doc.descendants((node, pos) => {
    if (node.isTextblock) {
      if (!firstBlock) {
        text += "\n";
        positions.push(pos);
      }
      firstBlock = false;
    }
    if (node.isText && node.text) {
      for (let index = 0; index < node.text.length; index++) {
        text += node.text[index];
        positions.push(pos + index);
      }
    }
    if (node.type.name === "hardBreak") {
      text += "\n";
      positions.push(pos);
    }
  });
  return { text, positions };
}
