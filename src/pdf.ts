import {
  reportInline,
  reportParagraphs,
  wrapReportRuns,
} from "./reportTypography";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {
  quoteTotals,
  lineTotal,
  quantity,
  type PayloadOf,
  type Entry,
  defaultPreferences,
} from "./business";
import type { Repository, Snapshot } from "./domain";
import { formatMoney } from "./domain";
import { documentBytes, picture } from "./documents";
import { base64ToBytes } from "./transfer";
export async function makePdf(
  payload: PayloadOf<"quote"> | PayloadOf<"handover">,
  repo: Repository,
  data: Snapshot,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const response = await fetch(
    `${import.meta.env.BASE_URL}fonts/DejaVuSans.ttf`,
  );
  if (!response.ok)
    throw new Error("A helyi magyar betűkészlet nem tölthető be.");
  const font = await pdf.embedFont(await response.arrayBuffer(), {
    subset: true,
  });
  const [boldFont, italicFont, boldItalicFont] = await Promise.all(
    [
      "DejaVuSans-Bold.ttf",
      "DejaVuSans-Oblique.ttf",
      "DejaVuSans-BoldOblique.ttf",
    ].map(async (name) => {
      const response = await fetch(`${import.meta.env.BASE_URL}fonts/${name}`);
      if (!response.ok)
        throw new Error("A magyar betűkészlet nem tölthető be.");
      return pdf.embedFont(await response.arrayBuffer(), { subset: true });
    }),
  );
  const pickFont = (bold: boolean, italic?: boolean) =>
    italic ? (bold ? boldItalicFont : italicFont) : bold ? boldFont : font;
  let page: PDFPage,
    y = 0;
  let pageNo = 0;
  const newPage = () => {
    page = pdf.addPage([595.28, 841.89]);
    y = 785;
    pageNo++;
    page.drawText(`RP Elektro · E-RP | ${payload.number} | ${pageNo}. oldal`, {
      x: 42,
      y: 28,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  };
  const ensure = (height: number) => {
    if (y - height < 60) newPage();
  };
  const text = (value: string, size = 10, bold = false) => {
    for (const para of reportParagraphs(value)) {
      if (para.kind === "rule") {
        ensure(18);
        page.drawLine({
          start: { x: 42, y },
          end: { x: 552, y },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        });
        y -= 14;
        continue;
      }
      const heading = bold || para.kind === "heading",
        fontSize =
          para.kind === "heading"
            ? Math.max(size, para.level! <= 2 ? 13 : 11)
            : size;
      const inset = para.kind === "list" ? 20 : 0;
      const runs = reportInline(para.text).map((run) => ({
        ...run,
        bold: heading || run.bold,
      }));
      const lines = wrapReportRuns(runs, 510 - inset, (text, bold, italic) =>
        pickFont(bold, italic).widthOfTextAtSize(text, fontSize),
      );
      if (heading) ensure(fontSize * lines.length + 45);
      for (const [index, line] of lines.entries()) {
        ensure(fontSize + 7);
        let x = 42 + inset;
        if (index === 0 && para.marker)
          page.drawText(para.marker, {
            x: 42,
            y,
            font,
            size: fontSize,
            color: rgb(0.25, 0.29, 0.32),
          });
        for (const run of line) {
          const selected = pickFont(run.bold, run.italic);
          page.drawText(run.text, {
            x,
            y,
            size: fontSize,
            font: selected,
            color: rgb(0.12, 0.16, 0.18),
          });
          x += selected.widthOfTextAtSize(run.text, fontSize);
        }
        y -= fontSize + 7;
      }
      y -= para.kind === "list" ? 3 : 7;
    }
  };
  const image = async (bytes: Uint8Array, mime: string, height = 150) => {
    const converted = await picture(bytes, mime);
    const embed =
      mime === "image/jpeg"
        ? await pdf.embedJpg(converted)
        : await pdf.embedPng(converted);
    const scale = Math.min(510 / embed.width, height / embed.height);
    const w = embed.width * scale,
      h = embed.height * scale;
    ensure(h + 15);
    page.drawImage(embed, { x: 42, y: y - h, width: w, height: h });
    y -= h + 15;
  };
  newPage();
  const prefs = (data.entries.find((e) => e.payload.type === "preferences")
    ?.payload ?? defaultPreferences()) as PayloadOf<"preferences">;
  if (prefs.logo_id) {
    const logo = data.entries.find(
      (e) => e.id === prefs.logo_id && e.payload.type === "document",
    );
    if (!logo) throw new Error("A céglogó hiányzik.");
    await image(
      await documentBytes(repo, logo),
      (logo.payload as PayloadOf<"document">).mime,
      65,
    );
  }
  text(
    payload.type === "quote" ? "ÁRAJÁNLAT" : "ÁTADÁSI JEGYZŐKÖNYV",
    20,
    true,
  );
  text(`${payload.number} · ${payload.revision}. verzió`, 11);
  if (!payload.sealed) text("TERVEZET", 12, true);
  text(
    `Vállalkozó: ${payload.company.name}\n${payload.company.address}\nAdószám: ${payload.company.tax_number}\n${payload.company.email} ${payload.company.phone}`,
  );
  text(
    `Ügyfél: ${payload.customer.name}\nSzámlázási cím: ${payload.customer.address}\nMunkavégzés helye: ${payload.site}`,
  );
  if (payload.type === "quote") {
    text(payload.title, 15, true);
    text(`Keltezés: ${payload.issued_on} | Érvényes: ${payload.valid_until}`);
    for (const [i, line] of payload.lines.entries()) {
      text(
        `${i + 1}. ${line.name}${line.location ? " · " + line.location : ""}`,
        11,
        true,
      );
      text(
        `${quantity(line.quantity_milli)} ${line.unit} × ${formatMoney(line.price_minor)} = ${formatMoney(lineTotal(line))}`,
      );
      if (line.notes) text(line.notes);
    }
    const total = quoteTotals(payload);
    y -= 8;
    text(
      `Munkadíj: ${formatMoney(total.labor)}\nAnyagköltség: ${formatMoney(payload.materials_minor)}\nKedvezmény: ${formatMoney(payload.discount_minor)}\nNettó összesen: ${formatMoney(total.net)}\n${payload.tax_mode === "aam" ? "Alanyi adómentes" : `Áfa ${payload.vat_basis_points / 100}%`}: ${formatMoney(total.tax)}\nFizetendő: ${formatMoney(total.gross)}`,
      12,
      true,
    );
    if (payload.terms) {
      text("Fizetési és vállalási feltételek", 12, true);
      text(payload.terms);
    }
    if (prefs.bank_account)
      text(`Bank: ${prefs.bank_name}\nSzámlaszám: ${prefs.bank_account}`);
    text(
      "Az ajánlat nem számla. A PDF elkészítése nem jelent ügyfél-elfogadást.",
      9,
    );
  } else {
    text(`Elvégzés dátuma: ${payload.performed_on}`);
    for (const [title, value] of [
      ["Elvégzett munka", payload.work],
      ["Eltérések", payload.deviations],
      ["Pótmunkák", payload.extras],
      ["Fennmaradó feladatok", payload.remaining],
      ["Kiegészítő átadási feltételek", payload.terms ?? ""],
    ]) {
      text(title, 12, true);
      text(value || "Nincs rögzítve.");
    }
    text("Lezárási ellenőrzések", 12, true);
    text(
      `${payload.checks.tidy ? "✓" : "□"} Rendezett munkaterület\n${payload.checks.informed ? "✓" : "□"} Ügyfél tájékoztatása\n${payload.checks.documents ? "✓" : "□"} Dokumentumok átadása`,
    );
    for (const id of payload.photo_ids) {
      const e = data.entries.find(
        (e) => e.id === id && e.payload.type === "document",
      );
      if (!e) throw new Error("Egy kiválasztott fénykép hiányzik.");
      ensure(285);
      text((e.payload as PayloadOf<"document">).name, 9);
      await image(
        await documentBytes(repo, e),
        (e.payload as PayloadOf<"document">).mime,
        240,
      );
    }
    ensure(
      payload.customer_signature && payload.contractor_signature ? 290 : 175,
    );
    text("Aláírások", 12, true);
    text(
      `Állapot: ${payload.customer_signature && payload.contractor_signature ? "mindkét fél aláírta" : payload.customer_signature || payload.contractor_signature ? "részben aláírt" : "aláíratlan"}`,
    );
    if (payload.customer_signature) {
      text("Ügyfél");
      await image(
        base64ToBytes(payload.customer_signature.split(",")[1]),
        "image/png",
        85,
      );
    }
    if (payload.contractor_signature) {
      text("Vállalkozó");
      await image(
        base64ToBytes(payload.contractor_signature.split(",")[1]),
        "image/png",
        85,
      );
    }
    text(
      `Rögzítési idő: ${payload.signed_at || "Nincs aláírás"} | ${payload.timezone}\nAz eszköz által rögzített idő nem külső szolgáltató által hitelesített időbélyeg.`,
      8,
    );
  }
  pdf.setTitle(`${payload.number} · ${payload.revision}. verzió`);
  pdf.setAuthor(payload.company.name);
  return pdf.save();
}
