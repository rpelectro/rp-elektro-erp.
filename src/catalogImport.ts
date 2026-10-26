import { parseMoney, workSchema, type WorkData } from "./domain";

export const catalogKey = (item: { name: string; unit: string }) =>
  `${item.name.trim().normalize("NFC").toLocaleLowerCase("hu")}\u0000${item.unit.trim().normalize("NFC").toLocaleLowerCase("hu")}`;

// Excel TSV and RFC-style CSV: quoted separators, newlines and escaped quotes.
function catalogRecords(input: string): { cells: string[]; line: number }[] {
  let text = input.replace(/^\uFEFF/, "");
  if (text.length > 2 * 1024 * 1024)
    throw new Error("Legfeljebb 2 MB-os katalógus olvasható be.");
  let delimiter = "";
  const separator = text.match(/^sep=([;,\t])\r?\n/i);
  if (separator) {
    delimiter = separator[1];
    text = text.slice(separator[0].length);
  }
  if (!delimiter) {
    const counts: Record<string, number> = { ";": 0, "\t": 0, ",": 0 };
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (quoted && text[i + 1] === '"') i++;
        else quoted = !quoted;
      } else if (!quoted && (c === "\r" || c === "\n")) {
        if (Object.values(counts).some(Boolean)) break;
      } else if (!quoted && c in counts) counts[c]++;
    }
    delimiter = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  }
  const result: { cells: string[]; line: number }[] = [];
  let cells: string[] = [],
    value = "",
    quoted = false,
    ended = false,
    line = 1,
    start = 1;
  const field = () => {
    cells.push(value.trim());
    value = "";
    ended = false;
  };
  const record = () => {
    field();
    if (cells.some((c) => c !== "")) result.push({ cells, line: start });
    cells = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          value += '"';
          i++;
        } else {
          quoted = false;
          ended = true;
        }
      } else if (c === "\r" || c === "\n") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        value += "\n";
        line++;
      } else value += c;
    } else if (c === delimiter) field();
    else if (c === "\r" || c === "\n") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      record();
      line++;
      start = line;
    } else if (c === '"') {
      if (value.trim() || ended)
        throw new Error(`${line}. sor: szabálytalan idézőjel a CSV-ben.`);
      value = "";
      quoted = true;
    } else if (ended && !/\s/.test(c))
      throw new Error(`${line}. sor: váratlan szöveg a záró idézőjel után.`);
    else if (!ended) value += c;
  }
  if (quoted) throw new Error(`${start}. sor: lezáratlan idézőjel a CSV-ben.`);
  record();
  return result;
}

export function decodeCatalogFile(bytes: Uint8Array): string {
  if (bytes.byteLength > 2 * 1024 * 1024)
    throw new Error("Legfeljebb 2 MB-os CSV-fájl tölthető fel.");
  if (bytes[0] === 0xff && bytes[1] === 0xfe)
    return new TextDecoder("utf-16le").decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff)
    return new TextDecoder("utf-16be").decode(bytes);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1250").decode(bytes);
  }
}

// Fixed column order: name, unit, HUF price, category, description.
export function parseCatalog(text: string): WorkData[] {
  const records = catalogRecords(text);
  const rows: WorkData[] = [];
  const seen = new Set<string>();
  for (const [index, { cells, line }] of records.entries()) {
    if (
      index === 0 &&
      ["név", "megnevezés", "munka megnevezése"].includes(
        cells[0].toLocaleLowerCase("hu"),
      )
    )
      continue;
    try {
      if (cells.length < 2 || cells.length > 5)
        throw new Error(
          "2–5 oszlop szükséges: megnevezés, egység, egységár, kategória, leírás. Csak a munkakatalógus munkalapját exportáld.",
        );
      const [name, unit, price = "", category = "", description = ""] = cells;
      const item = workSchema.parse({
        name,
        unit,
        price_minor: price ? parseMoney(price) : 0,
        category,
        description,
        archived: false,
      });
      const key = catalogKey(item);
      if (seen.has(key)) throw new Error("Ismétlődő név és egység a listában.");
      seen.add(key);
      rows.push(item);
      if (rows.length > 500)
        throw new Error("Egyszerre legfeljebb 500 tétel importálható.");
    } catch (error) {
      throw new Error(
        `${line}. sor: ${error instanceof Error ? error.message : "Érvénytelen adat."}`,
      );
    }
  }
  if (!rows.length)
    throw new Error("Másolj be vagy tölts fel legalább egy munkatételt.");
  return rows;
}

export const basicCatalog = `Helyszíni villamos felmérés;alkalom
Villamos hibakeresés;óra
Meglévő áramkör nyomvonalának feltérképezése;áramkör
Villamos kiállás helyének kijelölése;db
Falhorony készítése téglafalban;fm
Falhorony készítése betonfalban;fm
Szerelvénydoboz helyének kialakítása téglafalban;db
Szerelvénydoboz helyének kialakítása betonfalban;db
Szerelvénydoboz beépítése gipszkarton falba;db
Süllyesztett szerelvénydoboz rögzítése;db
Kötődoboz felszerelése;db
Faláttörés készítése vezetékátvezetéshez;db
Merev védőcső szerelése falon kívül;fm
Védőcső elhelyezése falhoronyban;fm
Hajlékony védőcső elhelyezése álmennyezetben;fm
Kábelcsatorna felszerelése;fm
Kábeltálca felszerelése;fm
Vezeték behúzása meglévő védőcsőbe;fm
Kábel elhelyezése védőcsőben vagy kábelcsatornában;fm
Kábel rögzítése falon kívül;fm
Kötések kialakítása kötődobozban;doboz
Meglévő vezetékkötések javítása;doboz
Egypólusú kapcsoló felszerelése és bekötése;db
Csillárkapcsoló felszerelése és bekötése;db
Váltókapcsoló felszerelése és bekötése;db
Keresztkapcsoló felszerelése és bekötése;db
Nyomógomb felszerelése és bekötése;db
Fényerőszabályzó felszerelése és bekötése;db
Egyes dugalj felszerelése és bekötése;db
Kettős dugalj felszerelése és bekötése;db
Kültéri, időjárásálló dugalj felszerelése;db
Meglévő kapcsoló cseréje;db
Meglévő dugalj cseréje;db
Mennyezeti lámpatest felszerelése és bekötése;db
Oldalfali lámpatest felszerelése és bekötése;db
Süllyesztett spotlámpa beépítése;db
Kültéri lámpatest felszerelése és bekötése;db
LED-szalag szerelése profilba;fm
LED-tápegység felszerelése és bekötése;db
Mozgásérzékelő felszerelése és bekötése;db
Alkonykapcsoló felszerelése és bekötése;db
Fürdőszobai elszívó ventilátor villamos bekötése;db
Villanybojler villamos bekötése;db
Elektromos sütő villamos bekötése;db
Elektromos főzőlap villamos bekötése;db
Lakáselosztó szekrény felszerelése;db
Kismegszakító beépítése és bekötése;db
Áram-védőkapcsoló beépítése és bekötése;db
Túlfeszültség-védelmi készülék beépítése és bekötése;db
Elosztó áramköreinek feliratozása;elosztó`;
