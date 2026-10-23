import { describe, it, expect } from "vitest";
import { parseMoney, moneyInput, validate } from "../src/domain";
import { checkConfig } from "../src/cloud";
describe("Pontos pénzkezelés", () => {
  it("a magyar árakat egész századforintként tárolja és visszaalakítja", () => {
    expect(parseMoney("1 234,56")).toBe(123456);
    expect(parseMoney("0.01")).toBe(1);
    expect(parseMoney("12,5")).toBe(1250);
    expect(parseMoney(moneyInput(999999999999))).toBe(999999999999);
  });
  it.each([
    "-1",
    "1e3",
    "1,234.56",
    "12,345",
    "",
    "10000000000",
    "NaN",
    "Infinity",
  ])("elutasítja az érvénytelen árat: %s", (value) =>
    expect(() => parseMoney(value)).toThrow(),
  );
  it("nem enged üres vagy túl hosszú ügyfélnevet", () => {
    const base = {
      name: "",
      phone: "",
      email: "",
      billing_address: "",
      notes: "",
      archived: false,
    };
    expect(() => validate("partners", base)).toThrow();
    expect(() =>
      validate("partners", { ...base, name: "a".repeat(201) }),
    ).toThrow();
  });
});
describe("Böngészős kulcsok", () => {
  it("nem fogad el titkos vagy service_role kulcsot", () => {
    expect(() =>
      checkConfig("https://example.supabase.co", "sb_secret_bad"),
    ).toThrow();
    const token = `a.${btoa(JSON.stringify({ role: "service_role" }))}.c`;
    expect(() => checkConfig("https://example.supabase.co", token)).toThrow();
    expect(() =>
      checkConfig("http://example.supabase.co", "sb_publishable_test"),
    ).toThrow();
    expect(checkConfig("", "")).toBe(false);
    expect(
      checkConfig("https://example.supabase.co", "sb_publishable_test"),
    ).toBe(true);
  });
});
