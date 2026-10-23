import { describe, expect, it } from "vitest";
import { basicCatalog, catalogKey, parseCatalog } from "../src/catalogImport";

describe("Munkakatalógus tömeges bevitele", () => {
  it("az 50 alapmunkát árazás nélküli tételekként olvassa be", () => {
    const rows = parseCatalog(basicCatalog);
    expect(rows).toHaveLength(50);
    expect(rows.every((row) => row.price_minor === 0)).toBe(true);
  });
  it("Excel-fejlécet, tabulátort és magyar tizedes árat kezel", () => {
    const [row] = parseCatalog(
      "\uFEFFNév\tEgység\tÁr\tKategória\tLeírás\r\nLámpa\tdb\t1 234,50\tVilágítás\tBekötés\r\n",
    );
    expect(row).toMatchObject({
      name: "Lámpa",
      unit: "db",
      price_minor: 123450,
      category: "Világítás",
      description: "Bekötés",
    });
  });
  it.each([
    "Munka",
    "Munka;;100",
    "Munka;db;-10",
    "Munka;db;1e3",
    "Munka;db;0;;;;",
    "",
  ])("hibás listát nem fogad el: %s", (text) => {
    expect(() => parseCatalog(text)).toThrow();
  });
  it("teljes listaellenőrzéssel és sorszámmal jelzi a hibát", () => {
    expect(() => parseCatalog("Jó;db\nRossz;db;-1")).toThrow("2. sor");
    expect(() => parseCatalog(" Lámpa ;db\nlámpa;DB")).toThrow("Ismétlődő");
    expect(catalogKey({ name: " Lámpa ", unit: "DB" })).toBe(
      catalogKey({ name: "lámpa", unit: "db" }),
    );
  });
  it("korlátozza az egyszerre feldolgozható listát", () => {
    expect(() =>
      parseCatalog(
        Array.from({ length: 501 }, (_, i) => `Munka ${i};db`).join("\n"),
      ),
    ).toThrow("500");
  });
});
