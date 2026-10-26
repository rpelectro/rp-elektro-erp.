import { describe, expect, it } from "vitest";
import {
  basicCatalog,
  catalogKey,
  parseCatalog,
  decodeCatalogFile,
} from "../src/catalogImport";

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

it("CSV-fájlban idézőjelek, elválasztók és többsoros leírás is megmarad", () => {
  const csv =
    '\uFEFFMegnevezés;Egység;Egységár;Kategória;Leírás\r\n"Dugalj, kapcsoló";db;"3 500,50";Szerelvényezés;"Első sor; részlet\r\nMásodik sor: ""süllyesztett"" kivitel"';
  expect(parseCatalog(csv)).toEqual([
    expect.objectContaining({
      name: "Dugalj, kapcsoló",
      price_minor: 350050,
      category: "Szerelvényezés",
      description: 'Első sor; részlet\nMásodik sor: "süllyesztett" kivitel',
    }),
  ]);
});
it("vesszős CSV és Excel sep= jelölés is használható", () => {
  expect(
    parseCatalog(
      'Megnevezés,Egység,Egységár,Kategória,Leírás\nMunka,db,"1250,50",Teszt,"Leírás, vesszővel"',
    )[0],
  ).toMatchObject({ price_minor: 125050, description: "Leírás, vesszővel" });
  expect(
    parseCatalog("sep=;\r\nMunka;db;100;Teszt;Leírás")[0].price_minor,
  ).toBe(10000);
});
it.each([
  'Munka;db;100;Teszt;"Lezáratlan',
  'Munka;db;100;Teszt;"Leírás"szöveg',
])("hibás CSV-nél nem importál részlegesen: %s", (csv) => {
  expect(() => parseCatalog(csv)).toThrow("sor");
});
it("UTF-8, régebbi magyar Windows és UTF-16 kódolást olvas, túl nagy fájlt elutasít", () => {
  expect(decodeCatalogFile(new TextEncoder().encode("Árvíztűrő"))).toBe(
    "Árvíztűrő",
  );
  expect(decodeCatalogFile(new Uint8Array([0xf5, 0xfb]))).toBe("őű");
  expect(decodeCatalogFile(new Uint8Array([0xff, 0xfe, 0x51, 0x01]))).toBe("ő");
  expect(() => decodeCatalogFile(new Uint8Array(2 * 1024 * 1024 + 1))).toThrow(
    "2 MB",
  );
});
