import { PDFDocument, rgb, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Repository, Snapshot } from "./domain";
import type { ReportBlock } from "./projectReport";
import { documentBytes, picture } from "./documents";

export async function makeReportPdf(
  blocks: ReportBlock[],
  repo: Repository,
  data: Snapshot,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const response = await fetch(
    `${import.meta.env.BASE_URL}fonts/DejaVuSans.ttf`,
  );
  if (!response.ok) throw new Error("A magyar betűkészlet nem tölthető be.");
  const font = await pdf.embedFont(await response.arrayBuffer(), {
    subset: true,
  });
  let page!: PDFPage;
  let y = 0;
  const newPage = () => {
    page = pdf.addPage([595.28, 841.89]);
    y = 790;
    page.drawText(`E-RP · ${pdf.getPageCount()}. oldal`, {
      x: 42,
      y: 28,
      font,
      size: 8,
      color: rgb(0.4, 0.4, 0.4),
    });
  };
  const ensure = (height: number) => {
    if (y - height < 55) newPage();
  };
  const text = (value: string, heading = false) => {
    // Respect line breaks and present pasted Markdown headings as headings.
    for (const paragraph of value
      .replace(/\r/g, "")
      .replace(/\t/g, "    ")
      .split("\n")) {
      const isHeading = heading || /^\s*#{1,6}\s/.test(paragraph);
      const size = isHeading ? 12 : 10;
      const clean = paragraph
        .replace(/^\s*#{1,6}\s+/, "")
        .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
      if (isHeading) {
        ensure(52);
        y -= 7;
      }
      let line = "";
      const draw = () => {
        ensure(size + 6);
        page.drawText(line, {
          x: 42,
          y,
          size,
          font,
          color: rgb(0.12, 0.16, 0.2),
        });
        y -= size + 6;
      };
      for (const char of clean) {
        if (font.widthOfTextAtSize(line + char, size) > 510) {
          draw();
          line = "";
        }
        line += char;
      }
      draw();
    }
    y -= 5;
  };
  newPage();
  for (const block of blocks) {
    if ("text" in block) {
      text(block.text, block.heading);
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
    const bytes = await documentBytes(repo, entry);
    const converted = await picture(bytes, entry.payload.mime);
    const image =
      entry.payload.mime === "image/jpeg"
        ? await pdf.embedJpg(converted)
        : await pdf.embedPng(converted);
    const scale = Math.min(510 / image.width, 230 / image.height);
    const width = image.width * scale,
      height = image.height * scale;
    ensure(height + 60);
    text(entry.payload.name);
    ensure(height + 12);
    page.drawImage(image, { x: 42, y: y - height, width, height });
    y -= height + 16;
  }
  return pdf.save();
}
