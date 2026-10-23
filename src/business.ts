import { z } from "zod";
const txt = z.string().max(10000),
  id = z.uuid();
const amount = z.number().int().min(0).max(999999999999);
const signedAmount = z.number().int().min(-999999999999).max(999999999999);
const date = z.iso.date();
const recipe = z.object({
  material_id: id,
  name: txt.min(1),
  unit: txt.min(1),
  quantity_milli: z.number().int().positive().max(1000000000),
});
export const lineSchema = z.object({
  id,
  work_id: id.nullable(),
  name: txt.min(1),
  unit: txt.min(1),
  quantity_milli: z.number().int().positive().max(1000000000),
  price_minor: amount,
  location: txt,
  notes: txt,
  recipe: z.array(recipe).max(1000),
});
export type WorkLine = z.infer<typeof lineSchema>;
export const partySchema = z.object({
  name: txt,
  address: txt,
  tax_number: txt,
  email: txt,
  phone: txt,
});
const quote = z.object({
  type: z.literal("quote"),
  series_id: id,
  revision: z.number().int().positive(),
  sealed: z.boolean(),
  number: txt.min(1),
  title: txt.min(1),
  issued_on: date,
  valid_until: date,
  company: partySchema,
  customer: partySchema,
  site: txt,
  tax_mode: z.enum(["unknown", "aam", "vat"]),
  vat_basis_points: z.number().int().min(0).max(10000),
  lines: z.array(lineSchema).min(1).max(1000),
  materials_minor: amount,
  discount_minor: amount,
  terms: txt,
  pdf_id: id.nullable(),
});
const survey = z.object({
  type: z.literal("survey"),
  name: txt.min(1),
  surveyed_on: date,
  existing: txt,
  planned: txt,
  unknown: txt,
  internal_notes: txt,
  rooms: z.array(
    z.object({
      id,
      name: txt.min(1),
      existing: txt,
      planned: txt,
      lines: z.array(lineSchema),
    }),
  ),
  whole_property: z.array(lineSchema),
  photo_ids: z.array(id),
});
const handover = z.object({
  type: z.literal("handover"),
  series_id: id,
  revision: z.number().int().positive(),
  sealed: z.boolean(),
  number: txt.min(1),
  performed_on: date,
  company: partySchema,
  customer: partySchema,
  site: txt,
  work: txt.min(1),
  deviations: txt,
  extras: txt,
  remaining: txt,
  terms: txt.optional(),
  checks: z.object({
    tidy: z.boolean(),
    informed: z.boolean(),
    documents: z.boolean(),
  }),
  photo_ids: z.array(id),
  customer_signature: z.string().max(1000000),
  contractor_signature: z.string().max(1000000),
  signed_at: txt,
  timezone: txt,
  pdf_id: id.nullable(),
});
const invoice = z.object({
  type: z.literal("invoice"),
  direction: z.enum(["outgoing", "incoming"]),
  source: z.literal("manual"),
  provider: z.literal("szamlazz.hu"),
  external_id: z.string().nullable(),
  document_type: z.enum([
    "invoice",
    "proforma",
    "advance",
    "final",
    "credit",
    "correction",
  ]),
  draft: z.boolean(),
  is_test: z.boolean(),
  number: txt,
  issuer: partySchema,
  customer: partySchema,
  issued_on: date.nullable(),
  performed_on: date.nullable(),
  due_on: date.nullable(),
  received_on: date.nullable(),
  net_minor: signedAmount.nullable(),
  tax_minor: signedAmount.nullable(),
  gross_minor: signedAmount.nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  method: txt,
  relation_ids: z.array(id),
  advance_deduction_minor: amount,
  notes: txt,
});
const payment = z.object({
  type: z.literal("payment"),
  invoice_id: id,
  paid_on: date,
  amount_minor: amount.refine((n) => n > 0, "A befizetés pozitív legyen."),
  currency: z.string().regex(/^[A-Z]{3}$/),
  direction: z.enum(["in", "out"]),
  method: txt.min(1),
  notes: txt,
  voids_id: id.nullable(),
});
const materialPlan = z.object({
  type: z.literal("materials"),
  quote_id: id,
  lines: z.array(
    z.object({
      material_id: id,
      name: txt.min(1),
      unit: txt.min(1),
      calculated_milli: z.number().int().nonnegative(),
      override_milli: z.number().int().nonnegative().nullable(),
      manual: z.boolean(),
      notes: txt,
    }),
  ),
});
const event = z
  .object({
    type: z.literal("event"),
    title: txt.min(1),
    category: z.enum(["survey", "work", "return"]),
    starts_at: z.iso.datetime(),
    ends_at: z.iso.datetime(),
    location: txt,
    notes: txt,
    cancelled: z.boolean(),
    google_enabled: z.boolean(),
  })
  .refine((e) => e.starts_at < e.ends_at, "A befejezés a kezdés után legyen.");
const document = z.object({
  type: z.literal("document"),
  file_key: txt.min(1),
  name: txt.min(1),
  mime: z.enum(["application/pdf", "image/png", "image/jpeg", "image/webp"]),
  size: z.number().int().positive().max(10485760),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  category: z.enum(["photo", "quote", "handover", "invoice", "other", "logo"]),
  entity_id: id.nullable(),
  created_on: date,
  sent_on: date.nullable(),
  original: z.literal(true),
});
const decision = z.object({
  type: z.literal("decision"),
  quote_id: id,
  state: z.enum(["sent", "changes", "accepted", "rejected"]),
  decided_on: date,
  notes: txt,
});
const preferences = z.object({
  type: z.literal("preferences"),
  bank_name: txt,
  bank_account: txt,
  quote_terms: txt,
  handover_terms: txt,
  vat_basis_points: z.number().int().min(0).max(10000),
  logo_id: id.nullable(),
  last_verified_backup: txt,
});
const material = z.object({
  type: z.literal("material"),
  name: txt.min(1),
  unit: txt.min(1),
  archived: z.boolean(),
});
const workRecipe = z.object({
  type: z.literal("recipe"),
  work_id: id,
  lines: z.array(recipe),
});
export const payloadSchema = z.discriminatedUnion("type", [
  survey,
  quote,
  handover,
  invoice,
  payment,
  materialPlan,
  event,
  document,
  decision,
  preferences,
  material,
  workRecipe,
]);
export type Payload = z.infer<typeof payloadSchema>;
export type PayloadOf<T extends Payload["type"]> = Extract<
  Payload,
  { type: T }
>;
export const entrySchema = z.object({
  project_id: id.nullable(),
  payload: payloadSchema,
  source_system: txt.default(""),
  source_id: txt.default(""),
});
export type EntryData = z.infer<typeof entrySchema>;
export type Entry = EntryData & {
  id: string;
  company_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};
export const today = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Budapest" }).format(
    new Date(),
  );
export const emptyParty = () => ({
  name: "",
  address: "",
  tax_number: "",
  email: "",
  phone: "",
});
export const defaultPreferences = (): PayloadOf<"preferences"> => ({
  type: "preferences",
  bank_name: "",
  bank_account: "",
  quote_terms: "",
  handover_terms: "",
  vat_basis_points: 2700,
  logo_id: null,
  last_verified_backup: "",
});
export function parseQuantity(value: string): number {
  if (!/^\d+([.,]\d{1,3})?$/.test(value.trim()))
    throw new Error(
      "A mennyiség legfeljebb három tizedesjegyű pozitív szám legyen.",
    );
  const [a, b = ""] = value.trim().split(/[.,]/);
  const n = Number(a) * 1000 + Number(b.padEnd(3, "0"));
  if (!Number.isSafeInteger(n) || n > 1000000000)
    throw new Error("Túl nagy mennyiség.");
  return n;
}
export const quantity = (n: number) =>
  (n / 1000).toLocaleString("hu-HU", { maximumFractionDigits: 3 });
function round(n: bigint, d: bigint) {
  return (n + d / 2n) / d;
}
function safe(n: bigint): number {
  if (n < 0 || n > 999999999999n)
    throw new Error("Az összeg meghaladja a megengedett határt.");
  return Number(n);
}
export const lineTotal = (line: WorkLine) =>
  safe(round(BigInt(line.price_minor) * BigInt(line.quantity_milli), 1000n));
export function quoteTotals(q: PayloadOf<"quote">) {
  const labor = safe(q.lines.reduce((s, l) => s + BigInt(lineTotal(l)), 0n));
  const net =
    BigInt(labor) + BigInt(q.materials_minor) - BigInt(q.discount_minor);
  if (net < 0) throw new Error("A kedvezmény meghaladja az ajánlat értékét.");
  const tax =
    q.tax_mode === "vat" ? round(net * BigInt(q.vat_basis_points), 10000n) : 0n;
  return { labor, net: safe(net), tax: safe(tax), gross: safe(net + tax) };
}
export function aggregateMaterials(
  q: PayloadOf<"quote">,
): PayloadOf<"materials">["lines"] {
  const map = new Map<string, PayloadOf<"materials">["lines"][number]>();
  for (const line of q.lines)
    for (const r of line.recipe) {
      const key = `${r.material_id}/${r.unit}`;
      const n = safe(
        round(BigInt(line.quantity_milli) * BigInt(r.quantity_milli), 1000n),
      );
      const old = map.get(key);
      if (old) old.calculated_milli += n;
      else
        map.set(key, {
          material_id: r.material_id,
          name: r.name,
          unit: r.unit,
          calculated_milli: n,
          override_milli: null,
          manual: false,
          notes: "",
        });
    }
  return [...map.values()];
}
export function refreshMaterials(
  previous: PayloadOf<"materials">,
  quoteId: string,
  q: PayloadOf<"quote">,
): PayloadOf<"materials"> {
  const calculated = aggregateMaterials(q);
  const old = new Map(
    previous.lines
      .filter((l) => !l.manual)
      .map((l) => [`${l.material_id}/${l.unit}`, l]),
  );
  const lines = calculated.map((l) => {
    const p = old.get(`${l.material_id}/${l.unit}`);
    old.delete(`${l.material_id}/${l.unit}`);
    return {
      ...l,
      override_milli: p?.override_milli ?? null,
      notes: p?.notes ?? "",
    };
  });
  for (const l of old.values())
    if (l.override_milli !== null) lines.push({ ...l, calculated_milli: 0 });
  return {
    type: "materials",
    quote_id: quoteId,
    lines: [...lines, ...previous.lines.filter((l) => l.manual)],
  };
}
export function immutable(p: Payload) {
  return (
    ((p.type === "quote" || p.type === "handover") && p.sealed) ||
    (p.type === "invoice" && !p.draft) ||
    ["payment", "decision", "document"].includes(p.type)
  );
}
export function validateBusiness(
  next: EntryData,
  entries: Entry[],
  previous?: Entry,
  recordId = previous?.id,
) {
  entrySchema.parse(next);
  const p = next.payload;
  if (previous && immutable(previous.payload))
    throw new Error(
      "Ez végleges pillanatfelvétel. Új verziót vagy kapcsolt javítást hozz létre.",
    );
  if (
    previous &&
    (previous.payload.type !== p.type ||
      (previous.project_id !== next.project_id && p.type !== "event"))
  )
    throw new Error(
      "A dokumentum típusa és projektkapcsolata nem cserélhető le.",
    );
  const related = (id: string, type: Payload["type"]) => {
    const r = entries.find((e) => e.id === id && e.payload.type === type);
    if (!r || r.project_id !== next.project_id)
      throw new Error("Hiányzó vagy más projekthez tartozó kapcsolat.");
    return r;
  };
  if (p.type === "quote") {
    quoteTotals(p);
    if (
      p.sealed &&
      (p.tax_mode === "unknown" ||
        !p.customer.name ||
        !p.company.name ||
        !p.customer.address ||
        !p.company.address ||
        !p.pdf_id)
    )
      throw new Error(
        "Végleges ajánlathoz nevek, címek, adózási mód és PDF szükséges.",
      );
    if (p.valid_until < p.issued_on)
      throw new Error("Hibás ajánlati érvényesség.");
  }
  if (p.type === "handover" && p.sealed) {
    if (!Object.values(p.checks).every(Boolean) || !p.pdf_id)
      throw new Error("A lezáráshoz mindhárom ellenőrzés és a PDF szükséges.");
  }
  if ((p.type === "quote" || p.type === "handover") && p.sealed) {
    const document = related(p.pdf_id!, "document");
    if (
      document.payload.type !== "document" ||
      document.payload.mime !== "application/pdf" ||
      document.payload.entity_id !== recordId
    )
      throw new Error(
        "A végleges eredeti PDF nincs ehhez a dokumentumhoz kapcsolva.",
      );
  }
  if (p.type === "invoice") {
    if (p.direction === "incoming")
      throw new Error("A bejövő számla munkafolyamata később kapcsolható be.");
    if (!p.draft) {
      if (
        !p.number.trim() ||
        !p.issued_on ||
        !p.performed_on ||
        !p.due_on ||
        p.net_minor === null ||
        p.tax_minor === null ||
        p.gross_minor === null ||
        !p.issuer.address ||
        !p.customer.address ||
        !p.method
      )
        throw new Error("A végleges számlanyilvántartás adatai hiányosak.");
      if (p.net_minor + p.tax_minor !== p.gross_minor)
        throw new Error("A nettó és adó összege nem egyezik a bruttóval.");
    }
    for (const rel of p.relation_ids) {
      const r = related(rel, "invoice").payload as PayloadOf<"invoice">;
      if (r.currency !== p.currency)
        throw new Error("Eltérő devizájú számlák nem kapcsolhatók.");
    }
    if (
      p.advance_deduction_minor > 0 &&
      (p.document_type !== "final" || !p.relation_ids.length)
    )
      throw new Error("Előlegbeszámításhoz kapcsolt végszámla szükséges.");
    const advances = p.relation_ids
      .map((id) => entries.find((e) => e.id === id)?.payload)
      .filter(
        (r): r is PayloadOf<"invoice"> =>
          r?.type === "invoice" && r.document_type === "advance",
      )
      .reduce((s, r) => s + Math.max(r.gross_minor ?? 0, 0), 0);
    if (
      p.advance_deduction_minor > advances ||
      p.advance_deduction_minor > Math.max(p.gross_minor ?? 0, 0)
    )
      throw new Error(
        "Az előlegbeszámítás meghaladja a kapcsolt előlegek vagy a végszámla értékét.",
      );
    if (
      ["credit", "correction"].includes(p.document_type) &&
      !p.relation_ids.length
    )
      throw new Error(
        "Sztornóhoz és helyesbítéshez az eredeti számla kapcsolata szükséges.",
      );
    if (
      !p.draft &&
      entries.some(
        (e) =>
          e.id !== recordId &&
          e.payload.type === "invoice" &&
          !e.payload.draft &&
          e.payload.direction === p.direction &&
          e.payload.issuer.tax_number === p.issuer.tax_number &&
          e.payload.number === p.number &&
          e.payload.currency === p.currency,
      )
    )
      throw new Error("Ez a számlaszám már szerepel a kibocsátónál.");
  }
  if (p.type === "payment") {
    const inv = related(p.invoice_id, "invoice")
      .payload as PayloadOf<"invoice">;
    if (inv.draft || inv.currency !== p.currency)
      throw new Error(
        "Tervezethez vagy eltérő devizával nem rögzíthető befizetés.",
      );
    if (p.voids_id) {
      const original = related(p.voids_id, "payment")
        .payload as PayloadOf<"payment">;
      if (
        original.voids_id ||
        original.invoice_id !== p.invoice_id ||
        original.amount_minor !== p.amount_minor ||
        entries.some(
          (e) =>
            e.id !== recordId &&
            e.payload.type === "payment" &&
            e.payload.voids_id === p.voids_id,
        )
      )
        throw new Error("Hibás vagy már visszavont befizetés.");
    }
  }
  if (p.type === "decision") {
    const q = related(p.quote_id, "quote").payload as PayloadOf<"quote">;
    if (!q.sealed)
      throw new Error("Csak végleges ajánlathoz rögzíthető döntés.");
  }
  if (p.type === "materials") related(p.quote_id, "quote");
  if (
    p.type === "document" &&
    p.entity_id &&
    !entries.some(
      (e) => e.id === p.entity_id && e.project_id === next.project_id,
    )
  )
    throw new Error("A dokumentum kapcsolata nem található.");
}
export function invoiceBalance(invoice: Entry, entries: Entry[]) {
  const p = invoice.payload;
  if (p.type !== "invoice" || p.draft || p.gross_minor === null) return null;
  const payments = entries
    .filter(
      (e) =>
        e.payload.type === "payment" && e.payload.invoice_id === invoice.id,
    )
    .map((e) => e.payload as PayloadOf<"payment">);
  const voided = new Set(payments.map((p) => p.voids_id).filter(Boolean));
  const paid = payments
    .filter(
      (p) =>
        !p.voids_id &&
        !voided.has(entries.find((e) => e.payload === p)?.id ?? ""),
    )
    .reduce(
      (s, p) => s + (p.direction === "in" ? p.amount_minor : -p.amount_minor),
      0,
    );
  return { paid, open: p.gross_minor - paid - p.advance_deduction_minor };
}
export function financialSummary(entries: Entry[]) {
  const result: Record<
    string,
    { invoiced: number; paid: number; open: number; drafts: number }
  > = {};
  for (const e of entries) {
    const p = e.payload;
    if (p.type !== "invoice" || p.direction !== "outgoing" || p.is_test)
      continue;
    const r = (result[p.currency] ??= {
      invoiced: 0,
      paid: 0,
      open: 0,
      drafts: 0,
    });
    if (p.draft) {
      r.drafts++;
      continue;
    }
    if (p.document_type === "proforma") continue;
    const balance = invoiceBalance(e, entries)!;
    const value = (p.gross_minor ?? 0) - p.advance_deduction_minor;
    r.invoiced += value;
    r.paid += balance.paid;
    r.open += balance.open;
  }
  return result;
}
export function overlaps(event: PayloadOf<"event">, entries: Entry[]) {
  return entries.filter(
    (e) =>
      e.payload.type === "event" &&
      !e.payload.cancelled &&
      e.payload.starts_at < event.ends_at &&
      event.starts_at < e.payload.ends_at,
  );
}
export function acceptedQuotes(entries: Entry[]) {
  const selected = new Map<string, Entry>();
  for (const e of entries) {
    if (e.payload.type !== "quote" || !e.payload.sealed) continue;
    const decisions = entries
      .filter(
        (d) => d.payload.type === "decision" && d.payload.quote_id === e.id,
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    if (
      (decisions[0]?.payload as PayloadOf<"decision"> | undefined)?.state !==
      "accepted"
    )
      continue;
    const prev = selected.get(e.payload.series_id);
    if (
      !prev ||
      (prev.payload as PayloadOf<"quote">).revision < e.payload.revision
    )
      selected.set(e.payload.series_id, e);
  }
  return [...selected.values()];
}
