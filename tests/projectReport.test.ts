import { describe, expect, it } from "vitest";
import { projectReportBlocks, type ReportBlock } from "../src/projectReport";
import { type Snapshot, type Project } from "../src/domain";
import { type PayloadOf } from "../src/business";
import { entry, ids, invoice } from "./fixtures";

const meta = {
  id: ids.project,
  company_id: ids.company,
  version: 1,
  created_at: "2026-10-25T08:00:00Z",
  updated_at: "2026-10-25T08:00:00Z",
};
const project: Project = {
  ...meta,
  title: "Felmérési projekt",
  customer_id: null,
  site_address: "Pécs",
  status: "survey",
  notes: "TITKOS PROJEKTJEGYZET",
  archived: false,
};
const base: Snapshot = {
  company: {
    ...meta,
    id: ids.company,
    name: "RP Elektro",
    email: "",
    phone: "",
    address: "",
    tax_number: "",
    tax_mode: "aam",
    billing_mode: "manual",
  },
  projects: [project],
  partners: [],
  work_items: [],
  entries: [],
};
const survey: PayloadOf<"survey"> = {
  type: "survey",
  name: "Helyszíni felmérés",
  surveyed_on: "2026-10-25",
  existing: "Őrzött magyar szöveg\nMásodik sor",
  planned: "Új kiállások",
  unknown: "Nem vizsgált hálózat",
  internal_notes: "TITKOS BELSŐ JEGYZET",
  rooms: [
    {
      id: crypto.randomUUID(),
      name: "Konyha",
      existing: "Régi vezeték",
      planned: "Csere",
      lines: [],
      photo_ids: [ids.document],
    },
  ],
  whole_property: [],
  photo_ids: [],
};
const text = (blocks: ReportBlock[]) =>
  blocks.flatMap((b) => ("text" in b ? [b.text] : [])).join("\n");

describe("Projekt PDF tartalom", () => {
  it("megőrzi a hosszú szöveget és a helyiségfotók sorrendjét, kizárja a belső jegyzeteket és más projekt adatait", () => {
    const other = {
      ...entry({ ...survey, name: "MÁS PROJEKT TITKOS" }),
      project_id: crypto.randomUUID(),
    };
    const blocks = projectReportBlocks(
      { ...base, entries: [entry(survey), other] },
      project,
      1,
    );
    expect(text(blocks)).toContain(survey.existing);
    expect(text(blocks)).toContain("Helyiség: Konyha");
    expect(text(blocks)).not.toMatch(/TITKOS/);
    expect(
      blocks.findIndex((b) => "photoId" in b && b.photoId === ids.document),
    ).toBeGreaterThan(
      blocks.findIndex((b) => "text" in b && b.text === "Helyiség: Konyha"),
    );
  });
  it("a még nem mentett felmérés aktuális tartalmát is exportálja", () => {
    const blocks = projectReportBlocks(base, project, 1, {
      ...survey,
      name: "Aktuális űrlap",
    });
    expect(text(blocks)).toContain("Aktuális űrlap");
    expect(text(blocks)).not.toContain("TITKOS");
  });
  it("minden projektfül exportálható üres adattárral is", () => {
    for (let tab = 0; tab < 7; tab++)
      expect(projectReportBlocks(base, project, tab).length).toBeGreaterThan(0);
  });
  it("az anyaglistán a felülbírált mennyiség jelenik meg", () => {
    const row = entry({
      type: "materials",
      quote_id: ids.quote,
      lines: [
        {
          material_id: ids.document,
          name: "Rézvezeték",
          unit: "m",
          calculated_milli: 3000,
          override_milli: 5000,
          manual: false,
          notes: "Tartalékkal",
        },
      ],
    });
    const report = text(
      projectReportBlocks({ ...base, entries: [row] }, project, 3),
    );
    expect(report).toContain("Rézvezeték: 5 m");
    expect(report).toContain("Számított: 3 m");
  });
  it("a számlanyilvántartást egyértelműen jelöli, és a bizonylat devizáját használja", () => {
    const row = entry({
      ...invoice(),
      currency: "EUR",
      is_test: true,
      draft: true,
    });
    const report = text(
      projectReportBlocks({ ...base, entries: [row] }, project, 5),
    );
    expect(report).toContain("NEM SZÁMLA");
    expect(report).toContain("EUR");
    expect(report).toContain("TESZT");
    expect(report).toContain("TERVEZET");
  });
});
