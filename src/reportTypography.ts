export type InlineRun = { text: string; bold: boolean };
export function reportInline(text: string): InlineRun[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) => ({
      text:
        part.startsWith("**") && part.endsWith("**")
          ? part.slice(2, -2)
          : part.replace(/\*\*/g, ""),
      bold: part.startsWith("**") && part.endsWith("**"),
    }));
}
export function reportParagraphs(
  text: string,
): {
  text: string;
  kind: "body" | "heading" | "list" | "rule";
  level?: number;
  marker?: string;
}[] {
  const paragraphs: ReturnType<typeof reportParagraphs> = [];
  let pending: string[] = [];
  const flush = () => {
    if (pending.length)
      paragraphs.push({ text: pending.join(" "), kind: "body" });
    pending = [];
  };
  for (const line of text.replace(/\r/g, "").split("\n")) {
    const clean = line.trim().replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
    const heading = clean.match(/^(#{1,6})\s+(.+)$/),
      list = clean.match(/^([-+*•]|\d+[.)])\s+(.+)$/);
    if (!clean) {
      flush();
      continue;
    }
    if (/^([-*_])\1{2,}$/.test(clean)) {
      flush();
      paragraphs.push({ text: "", kind: "rule" });
    } else if (heading) {
      flush();
      paragraphs.push({
        text: heading[2],
        kind: "heading",
        level: heading[1].length,
      });
    } else if (list) {
      flush();
      paragraphs.push({
        text: list[2],
        kind: "list",
        marker: /^\d/.test(list[1]) ? list[1] : "•",
      });
    } else pending.push(clean);
  }
  flush();
  return paragraphs;
}
// Keep whole words together, including words that cross a bold style boundary.
export function wrapReportRuns(
  runs: InlineRun[],
  width: number,
  measure: (text: string, bold: boolean) => number,
): InlineRun[][] {
  const lines: InlineRun[][] = [],
    words: InlineRun[][] = [];
  let line: InlineRun[] = [],
    word: InlineRun[] = [],
    used = 0;
  const append = (text: string, bold: boolean) => {
    const last = line.at(-1);
    if (last?.bold === bold) last.text += text;
    else line.push({ text, bold });
    used += measure(text, bold);
  };
  const flush = () => {
    if (line.length) lines.push(line);
    line = [];
    used = 0;
  };
  for (const run of runs)
    for (const token of run.text.split(/(\s+)/)) {
      if (!token) continue;
      if (/^\s+$/.test(token)) {
        if (word.length) words.push(word);
        word = [];
      } else word.push({ text: token, bold: run.bold });
    }
  if (word.length) words.push(word);
  for (const word of words) {
    const wordWidth = word.reduce(
      (sum, run) => sum + measure(run.text, run.bold),
      0,
    );
    if (line.length && used + measure(" ", false) + wordWidth > width) flush();
    if (line.length) append(" ", false);
    for (const run of word) {
      if (wordWidth <= width) append(run.text, run.bold);
      else
        for (const char of run.text) {
          if (used + measure(char, run.bold) > width && line.length) flush();
          append(char, run.bold);
        }
    }
  }
  flush();
  return lines.length ? lines : [[]];
}
