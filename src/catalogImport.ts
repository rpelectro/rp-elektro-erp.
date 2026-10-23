import { parseMoney, workSchema, type WorkData } from "./domain";

export const catalogKey = (item: { name: string; unit: string }) =>
  `${item.name.trim().normalize("NFC").toLocaleLowerCase("hu")}\u0000${item.unit.trim().normalize("NFC").toLocaleLowerCase("hu")}`;

// Tab-separated spreadsheet rows or semicolon-separated text. Prices are HUF.
export function parseCatalog(text: string): WorkData[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const rows: WorkData[] = [];
  const seen = new Set<string>();
  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    const cells = line
      .split(line.includes("\t") ? "\t" : ";")
      .map((s) => s.trim());
    if (
      !rows.length &&
      ["név", "megnevezés", "munka megnevezése"].includes(
        cells[0].toLocaleLowerCase("hu"),
      )
    )
      continue;
    try {
      if (cells.length < 2 || cells.length > 5)
        throw new Error("2–5 oszlop szükséges.");
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
        `${index + 1}. sor: ${error instanceof Error ? error.message : "Érvénytelen adat."}`,
      );
    }
  }
  if (!rows.length) throw new Error("Másolj be legalább egy munkatételt.");
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
