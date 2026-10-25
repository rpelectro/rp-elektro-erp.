import { expect, it } from "vitest";
import {
  reportInline,
  reportParagraphs,
  wrapReportRuns,
} from "../src/reportTypography";

it("a félkövér és dőlt formázást együtt is megőrzi", () => {
  expect(reportInline("***Fontos*** és *dőlt* szöveg")).toEqual([
    { text: "Fontos", bold: true, italic: true },
    { text: " és ", bold: false },
    { text: "dőlt", bold: false, italic: true },
    { text: " szöveg", bold: false },
  ]);
  expect(
    reportInline("azonosito_resz és \\*csillag\\*")
      .map((run) => run.text)
      .join(""),
  ).toBe("azonosito_resz és *csillag*");
});

it("szóhatáron tördel, a kiemelés közepén kezdődő szó sem szakad ketté", () => {
  const lines = wrapReportRuns(
    reportInline("A **villamos** hálózat állapota"),
    17,
    (text) => text.length,
  );
  expect(lines.map((line) => line.map((run) => run.text).join(""))).toEqual([
    "A villamos",
    "hálózat állapota",
  ]);
  expect(lines[0].some((run) => run.bold && run.text === "villamos")).toBe(
    true,
  );
  const styled = wrapReportRuns(
    reportInline("egy vezeté**kezés** kész"),
    11,
    (text) => text.length,
  );
  expect(styled.map((line) => line.map((run) => run.text).join(""))).toEqual([
    "egy",
    "vezetékezés",
    "kész",
  ]);
});

it("a hosszú, szóköz nélküli azonosító is kifér és hiánytalan marad", () => {
  const value = "ABCDEFGHIJKLMNO";
  const lines = wrapReportRuns(reportInline(value), 6, (text) => text.length);
  expect(
    lines.map((line) => line.map((run) => run.text).join("")).join(""),
  ).toBe(value);
  expect(
    lines.every(
      (line) => line.reduce((sum, run) => sum + run.text.length, 0) <= 6,
    ),
  ).toBe(true);
});

it("elkülöníti a Markdown címsorokat, listákat és bekezdéseket", () => {
  expect(
    reportParagraphs(
      "### Felső lakrész\n\nElső sor\nmásodik sor.\n\n- Vezeték\n- Kapcsoló\n\n---",
    ),
  ).toEqual([
    { text: "Felső lakrész", kind: "heading", level: 3 },
    { text: "Első sor második sor.", kind: "body" },
    { text: "Vezeték", kind: "list", marker: "•" },
    { text: "Kapcsoló", kind: "list", marker: "•" },
    { text: "", kind: "rule" },
  ]);
  expect(
    reportInline("**Kiemelés** és hibás lezárás.**")
      .map((run) => run.text)
      .join(""),
  ).toBe("Kiemelés és hibás lezárás.");
});
