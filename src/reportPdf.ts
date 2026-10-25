import { PDFDocument, rgb, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Repository, Snapshot } from "./domain";
import type { ReportBlock } from "./projectReport";
import { documentBytes, picture } from "./documents";
import {
  reportInline,
  reportParagraphs,
  wrapReportRuns,
  type InlineRun,
} from "./reportTypography";

export async function makeReportPdf(
  blocks: ReportBlock[],
  repo: Repository,
  data: Snapshot,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [regular, bold] = await Promise.all(
    ["DejaVuSans.ttf", "DejaVuSans-Bold.ttf"].map(async (name) => {
      const response = await fetch(`${import.meta.env.BASE_URL}fonts/${name}`);
      if (!response.ok)
        throw new Error("A magyar betűkészlet nem tölthető be.");
      return pdf.embedFont(await response.arrayBuffer(), { subset: true });
    }),
  );
  const ink = rgb(0.1, 0.15, 0.19),
    muted = rgb(0.39, 0.44, 0.48),
    gold = rgb(0.94, 0.73, 0.2),
    pale = rgb(0.95, 0.96, 0.97),
    border = rgb(0.85, 0.88, 0.9);
  const left = 48,
    width = 499.28,
    bottom = 62;
  const title = blocks.find((b) => "text" in b && b.role === "title");
  const subtitle = blocks.find((b) => "text" in b && b.role === "subtitle");
  const documentTitle =
    title && "text" in title ? title.text : "Projektkivonat";
  const projectTitle = subtitle && "text" in subtitle ? subtitle.text : "";
  pdf.setTitle(`${documentTitle} – ${projectTitle}`);
  pdf.setAuthor(data.company.name);
  pdf.setCreator("E-RP · RP Elektro");
  let page!: PDFPage,
    y = 0;
  const ellipsis = (text: string, max: number, size: number) => {
    let value = text.replace(/\s+/g, " ");
    if (regular.widthOfTextAtSize(value, size) <= max) return value;
    while (value && regular.widthOfTextAtSize(value + "…", size) > max)
      value = value.slice(0, -1);
    return value + "…";
  };
  const newPage = () => {
    page = pdf.addPage([595.28, 841.89]);
    y = 754;
    page.drawRectangle({ x: left, y: 798, width: 8, height: 8, color: gold });
    page.drawText("E-RP", {
      x: left + 15,
      y: 797,
      font: bold,
      size: 10,
      color: ink,
    });
    const company = ellipsis(data.company.name, 250, 9);
    page.drawText(company, {
      x: left + width - regular.widthOfTextAtSize(company, 9),
      y: 798,
      font: regular,
      size: 9,
      color: muted,
    });
    page.drawLine({
      start: { x: left, y: 784 },
      end: { x: left + width, y: 784 },
      thickness: 0.7,
      color: border,
    });
    if (pdf.getPageCount() > 1) {
      page.drawText(ellipsis(`${documentTitle} · ${projectTitle}`, width, 8), {
        x: left,
        y: 768,
        font: regular,
        size: 8,
        color: muted,
      });
      y = 740;
    }
  };
  const ensure = (height: number) => {
    if (y - height < bottom) newPage();
  };
  const wrapped = (text: string, size: number, strong = false, max = width) =>
    wrapReportRuns(
      strong
        ? [{ text: text.replace(/\*\*/g, ""), bold: true }]
        : reportInline(text),
      max,
      (value, strong) =>
        (strong ? bold : regular).widthOfTextAtSize(value, size),
    );
  const drawLine = (
    runs: InlineRun[],
    size: number,
    x: number,
    color = ink,
  ) => {
    for (const run of runs) {
      const font = run.bold ? bold : regular;
      page.drawText(run.text, { x, y, size, font, color });
      x += font.widthOfTextAtSize(run.text, size);
    }
  };
  const paragraph = (
    text: string,
    options: {
      size?: number;
      strong?: boolean;
      inset?: number;
      marker?: string;
      after?: number;
      color?: ReturnType<typeof rgb>;
    } = {},
  ) => {
    const {
      size = 10,
      strong = false,
      inset = 0,
      marker,
      after = 8,
      color = ink,
    } = options;
    const lines = wrapped(text, size, strong, width - inset),
      height = size * 1.5;
    ensure(Math.min(2, lines.length) * height);
    for (const [index, line] of lines.entries()) {
      if (lines.length - index === 2) ensure(2 * height);
      ensure(height);
      if (marker && index === 0)
        page.drawText(marker, { x: left, y, font: regular, size, color: gold });
      drawLine(line, size, left + inset, color);
      y -= height;
    }
    y -= after;
  };
  const heading = (text: string, section = false, level = 3) => {
    const size = section ? 13 : level <= 2 ? 12 : 10.5;
    const lines = wrapped(text, size, true, width - (section ? 24 : 0));
    const height = lines.length * (size * 1.4) + (section ? 22 : 15);
    ensure(Math.min(height + 36, 650));
    y -= section ? 10 : 6;
    if (section) {
      page.drawRectangle({
        x: left,
        y: y - (height - 10),
        width,
        height: height - 10,
        color: pale,
      });
      page.drawRectangle({
        x: left,
        y: y - (height - 10),
        width: 3,
        height: height - 10,
        color: gold,
      });
      y -= 17;
    }
    for (const line of lines) {
      ensure(20);
      drawLine(line, size, left + (section ? 12 : 0));
      y -= size * 1.4;
    }
    y -= section ? 12 : 5;
  };
  newPage();
  paragraph(documentTitle.toLocaleUpperCase("hu"), {
    size: 25,
    strong: true,
    after: 2,
  });
  if (projectTitle)
    paragraph(projectTitle, { size: 14, color: muted, after: 18 });
  const metadata = blocks.filter(
    (b): b is Extract<ReportBlock, { text: string }> =>
      "text" in b && b.role === "meta",
  );
  if (metadata.length) {
    const rows = metadata.map((b) => {
      const split = b.text.indexOf(":");
      return {
        label: split < 0 ? "" : b.text.slice(0, split),
        lines: wrapped(
          split < 0 ? b.text : b.text.slice(split + 1).trim(),
          9.5,
          false,
          width - 150,
        ),
      };
    });
    const height = rows.reduce(
      (sum, row) => sum + Math.max(1, row.lines.length) * 15 + 7,
      20,
    );
    if (height > 500) for (const block of metadata) paragraph(block.text);
    else {
      ensure(height + 12);
      page.drawRectangle({
        x: left,
        y: y - height,
        width,
        height,
        color: pale,
      });
      y -= 18;
      for (const row of rows) {
        page.drawText(row.label, {
          x: left + 12,
          y,
          font: bold,
          size: 8.5,
          color: muted,
        });
        for (const line of row.lines) {
          drawLine(line, 9.5, left + 138);
          y -= 15;
        }
        y -= 7;
      }
      y -= 12;
    }
  }
  for (const block of blocks) {
    if ("text" in block) {
      if (
        block.role === "title" ||
        block.role === "subtitle" ||
        block.role === "meta"
      )
        continue;
      if (block.heading || block.role === "section") {
        heading(block.text, block.role === "section");
        continue;
      }
      for (const item of reportParagraphs(block.text)) {
        if (item.kind === "heading") heading(item.text, false, item.level);
        else if (item.kind === "rule") {
          ensure(20);
          page.drawLine({
            start: { x: left, y },
            end: { x: left + width, y },
            thickness: 0.5,
            color: border,
          });
          y -= 12;
        } else
          paragraph(
            item.text,
            item.kind === "list"
              ? { inset: 22, marker: item.marker, after: 4 }
              : {},
          );
      }
      continue;
    }
    const entry = data.entries.find((e) => e.id === block.photoId);
    if (
      !entry ||
      entry.payload.type !== "document" ||
      !entry.payload.mime.startsWith("image/")
    )
      throw new Error(
        "Egy kiválasztott fénykép hiányzik vagy nem kép. A PDF nem készült el.",
      );
    const bytes = await documentBytes(repo, entry),
      converted = await picture(bytes, entry.payload.mime);
    const image =
      entry.payload.mime === "image/jpeg"
        ? await pdf.embedJpg(converted)
        : await pdf.embedPng(converted);
    const scale = Math.min((width - 20) / image.width, 230 / image.height),
      w = image.width * scale,
      h = image.height * scale;
    const caption = wrapped(entry.payload.name, 8, false, width - 20);
    ensure(h + caption.length * 12 + 38);
    page.drawRectangle({
      x: left,
      y: y - h - 14,
      width,
      height: h + 14,
      color: pale,
    });
    page.drawImage(image, {
      x: left + (width - w) / 2,
      y: y - h - 7,
      width: w,
      height: h,
    });
    y -= h + 28;
    for (const line of caption) {
      drawLine(line, 8, left + 10, muted);
      y -= 12;
    }
    y -= 12;
  }
  const pages = pdf.getPages();
  for (const [index, sheet] of pages.entries()) {
    sheet.drawLine({
      start: { x: left, y: 44 },
      end: { x: left + width, y: 44 },
      thickness: 0.6,
      color: border,
    });
    sheet.drawText(ellipsis(projectTitle || documentTitle, width - 120, 8), {
      x: left,
      y: 29,
      font: regular,
      size: 8,
      color: muted,
    });
    const number = `${index + 1} / ${pages.length}`;
    sheet.drawText(number, {
      x: left + width - regular.widthOfTextAtSize(number, 8),
      y: 29,
      font: regular,
      size: 8,
      color: muted,
    });
  }
  return pdf.save();
}
