import { describe, it, expect } from "vitest";
import {
  quoteTotals,
  lineTotal,
  aggregateMaterials,
  refreshMaterials,
  invoiceBalance,
  financialSummary,
  validateBusiness,
  parseQuantity,
  overlaps,
} from "../src/business";
import { budapestToIso } from "../src/Calendar";
import { quote, invoice, line, entry, ids } from "./fixtures";
describe("Munkafolyamat üzleti szabályai", () => {
  it("a szöveges felmérési ár nem számolható nullaként az ajánlatba", () => {
    const q = quote();
    q.lines[0] = {
      ...q.lines[0],
      price_minor: 0,
      price_text: "Egyeztetés szerint",
    };
    expect(() => quoteTotals(q)).toThrow("számszerű");
    expect(() => lineTotal(q.lines[0])).toThrow("számszerű");
    q.lines[0] = { ...q.lines[0], price_minor: 350000, price_text: undefined };
    expect(quoteTotals(q).labor).toBe(525000);
  });
  it("tételenként kerekít és az adót a pontos nettóból számolja", () => {
    expect(lineTotal(line)).toBe(185184);
    expect(quoteTotals(quote())).toEqual({
      labor: 185184,
      net: 195184,
      tax: 52700,
      gross: 247884,
    });
    expect(() => quoteTotals({ ...quote(), discount_minor: 900000 })).toThrow();
    expect(parseQuantity("1,125")).toBe(1125);
    expect(() => parseQuantity("1.1234")).toThrow();
  });
  it("azonos név mellett eltérő anyagazonosító és egység külön marad; kézi felülírás megőrződik", () => {
    const q = quote();
    q.lines[0] = {
      ...q.lines[0],
      recipe: [
        {
          material_id: ids.document,
          name: "Vezeték",
          unit: "m",
          quantity_milli: 2000,
        },
        {
          material_id: ids.quote,
          name: "Vezeték",
          unit: "m",
          quantity_milli: 1000,
        },
      ],
    };
    const lines = aggregateMaterials(q);
    expect(lines).toHaveLength(2);
    expect(lines[0].calculated_milli).toBe(3000);
    const old = {
      type: "materials" as const,
      quote_id: ids.quote,
      lines: lines.map((l, i) => ({
        ...l,
        override_milli: i === 0 ? 8000 : null,
      })),
    };
    q.lines[0].quantity_milli = 3000;
    const fresh = refreshMaterials(old, ids.document, q);
    expect(fresh.lines[0]).toMatchObject({
      calculated_milli: 6000,
      override_milli: 8000,
    });
  });
  it("lezárt ajánlat nem írható át és PDF nem jelent elfogadást", () => {
    const old = entry(
      { ...quote(), sealed: true, pdf_id: ids.document },
      ids.quote,
    );
    expect(() =>
      validateBusiness(
        { ...old, payload: { ...quote(), title: "Átírva" } },
        [old],
        old,
      ),
    ).toThrow("pillanatfelvétel");
    expect(() =>
      validateBusiness(
        {
          ...old,
          payload: {
            type: "decision",
            quote_id: ids.quote,
            state: "accepted",
            decided_on: "2026-10-23",
            notes: "",
          },
        },
        [entry(quote(), ids.quote)],
      ),
    ).toThrow("végleges");
  });
  it("számlapillanat és részfizetés külön marad, hibás befizetés visszavonható", () => {
    const i = entry(invoice(), ids.invoice),
      payment = entry({
        type: "payment",
        invoice_id: i.id,
        paid_on: "2026-10-23",
        amount_minor: 50000,
        currency: "HUF",
        direction: "in",
        method: "utalás",
        notes: "",
        voids_id: null,
      });
    expect(invoiceBalance(i, [i, payment])).toEqual({
      paid: 50000,
      open: 77000,
    });
    const reversal = entry({
      ...(payment.payload as any),
      voids_id: payment.id,
    });
    expect(invoiceBalance(i, [i, payment, reversal])).toEqual({
      paid: 0,
      open: 127000,
    });
    expect(() => validateBusiness(i, [i], i)).toThrow();
  });
  it("az előleg és végszámla értékét nem duplázza; devizákat és tesztbizonylatot elkülönít", () => {
    const advance = entry({
      ...invoice(),
      document_type: "advance",
      number: "ADV",
      net_minor: 10000,
      tax_minor: 0,
      gross_minor: 10000,
    });
    const final = entry({
      ...invoice(),
      document_type: "final",
      number: "FINAL",
      net_minor: 50000,
      tax_minor: 0,
      gross_minor: 50000,
      advance_deduction_minor: 10000,
      relation_ids: [advance.id],
    });
    const eur = entry({
      ...invoice(),
      number: "EUR",
      currency: "EUR",
      net_minor: 1000,
      tax_minor: 0,
      gross_minor: 1000,
    });
    const test = entry({ ...invoice(), number: "TEST", is_test: true });
    const summary = financialSummary([advance, final, eur, test]);
    expect(summary.HUF.invoiced).toBe(50000);
    expect(summary.EUR.invoiced).toBe(1000);
  });
  it("hiányos számla tervezetben maradhat, összeg és deviza nem található ki", () => {
    const draft = entry({
      ...invoice(),
      draft: true,
      number: "",
      gross_minor: null,
      net_minor: null,
      tax_minor: null,
    });
    expect(invoiceBalance(draft, [])).toBeNull();
    expect(financialSummary([draft]).HUF.drafts).toBe(1);
    expect(() =>
      validateBusiness(
        { ...draft, payload: { ...invoice(), gross_minor: 123 } },
        [],
      ),
    ).toThrow("nem egyezik");
    expect(() =>
      validateBusiness(
        { ...draft, payload: { ...invoice(), direction: "incoming" } },
        [],
      ),
    ).toThrow("később");
  });
  it("a budapesti idő nyári/téli eltérését és az óraátállítás kétértelmű idejét kezeli", () => {
    expect(budapestToIso("2026-07-01T12:00")).toBe("2026-07-01T10:00:00.000Z");
    expect(budapestToIso("2026-12-01T12:00")).toBe("2026-12-01T11:00:00.000Z");
    expect(() => budapestToIso("2026-10-25T02:30")).toThrow("óraátállítás");
    const e = {
      type: "event" as const,
      title: "Teszt",
      category: "work" as const,
      starts_at: "2026-10-23T10:00:00.000Z",
      ends_at: "2026-10-23T11:00:00.000Z",
      location: "",
      notes: "",
      cancelled: false,
      google_enabled: false,
    };
    expect(overlaps(e, [entry(e)])).toHaveLength(1);
  });
});
