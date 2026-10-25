import { type Snapshot, type Project, formatMoney, statuses } from "./domain";
import {
  type PayloadOf,
  type WorkLine,
  quantity,
  lineTotal,
  quoteTotals,
  invoiceBalance,
} from "./business";

export const reportTabs = [
  "Áttekintés",
  "Felmérés",
  "Árajánlat",
  "Anyagok",
  "Jegyzőkönyv",
  "Számlák",
  "Dokumentumok",
] as const;
export type ReportBlock =
  | {
      text: string;
      heading?: boolean;
      role?: "title" | "subtitle" | "meta" | "section";
    }
  | { photoId: string };

export function projectReportBlocks(
  data: Snapshot,
  project: Project,
  tab: number,
  survey?: PayloadOf<"survey">,
): ReportBlock[] {
  if (!reportTabs[tab]) throw new Error("Ismeretlen projektfül.");
  const rows = data.entries
    .filter((e) => e.project_id === project.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const blocks: ReportBlock[] = [];
  const text = (text: string, heading = false) =>
    blocks.push({ text, heading });
  const field = (label: string, value: string | null | undefined) => {
    blocks.push({ text: label, heading: true, role: "section" });
    text(value?.trim() || "Nincs rögzítve.");
  };
  const photos = (ids: string[]) => {
    for (const photoId of [...new Set(ids)]) blocks.push({ photoId });
  };
  const lines = (items: WorkLine[]) => {
    if (!items.length) text("Nincs rögzített munkatétel.");
    for (const [index, line] of items.entries()) {
      text(
        `${index + 1}. ${line.name}${line.location ? ` · ${line.location}` : ""}`,
        true,
      );
      text(
        line.price_text !== undefined
          ? `${quantity(line.quantity_milli)} ${line.unit} · Munkadíj: ${line.price_text}`
          : `${quantity(line.quantity_milli)} ${line.unit} × ${formatMoney(line.price_minor)} = ${formatMoney(lineTotal(line))}`,
      );
      if (line.notes) text(line.notes);
    }
  };
  blocks.push(
    { text: reportTabs[tab], role: "title" },
    { text: project.title, role: "subtitle" },
  );
  blocks.push({ text: `Vállalkozás: ${data.company.name}`, role: "meta" });
  blocks.push({
    text: `Ügyfél: ${data.partners.find((p) => p.id === project.customer_id)?.name ?? "Nincs megadva"}`,
    role: "meta",
  });
  blocks.push({
    text: `Munkavégzés helye: ${project.site_address || "Nincs megadva"}`,
    role: "meta",
  });
  if (tab !== 1)
    text(
      "Projektadatok kivonata. Nem helyettesíti az eredeti számlát vagy a végleges, aláírt dokumentumot.",
    );
  if (tab === 0) {
    field("Projektállapot", statuses[project.status]);
    // Project notes are internal and deliberately excluded from shared reports.
    for (const [index, type] of [
      "survey",
      "quote",
      "materials",
      "handover",
      "invoice",
      "document",
    ].entries())
      text(
        `${reportTabs[index + 1]}: ${rows.filter((row) => row.payload.type === type).length} bejegyzés`,
      );
  }
  if (tab === 1) {
    const surveys = survey
      ? [survey]
      : rows.flatMap((e) => (e.payload.type === "survey" ? [e.payload] : []));
    if (!surveys.length) text("Nincs mentett felmérés.");
    for (const s of surveys) {
      text(s.name || "Névtelen felmérés", true);
      text(`Felmérés dátuma: ${s.surveyed_on}`);
      field("Meglévő állapot", s.existing);
      field("Tervezett munka", s.planned);
      field("Ismeretlen / nem vizsgált adatok", s.unknown);
      text("Teljes ingatlanra vonatkozó munkák", true);
      lines(s.whole_property);
      for (const room of s.rooms) {
        text(`Helyiség: ${room.name || "Névtelen"}`, true);
        field("Helyiség meglévő állapota", room.existing);
        field("Helyiség tervezett munkája", room.planned);
        lines(room.lines);
        if (room.photo_ids?.length) {
          text(`${room.name} – fényképek`, true);
          photos(room.photo_ids);
        }
      }
      if (s.photo_ids.length) {
        text("Teljes ingatlan – fényképek", true);
        photos(s.photo_ids);
      }
      // Never export s.internal_notes.
    }
  }
  if (tab === 2) {
    const quotes = rows.filter((e) => e.payload.type === "quote");
    if (!quotes.length) text("Nincs mentett ajánlat.");
    for (const e of quotes)
      if (e.payload.type === "quote") {
        const p = e.payload,
          total = quoteTotals(p);
        text(
          `${p.number} · ${p.title} · ${p.revision}. verzió · ${p.sealed ? "Végleges" : "Tervezet"}`,
          true,
        );
        text(`Keltezés: ${p.issued_on} · Érvényes: ${p.valid_until}`);
        lines(p.lines);
        text(
          `Munkadíj: ${formatMoney(total.labor)} · Anyagköltség: ${formatMoney(p.materials_minor)} · Kedvezmény: ${formatMoney(p.discount_minor)}`,
        );
        text(
          `Nettó: ${formatMoney(total.net)} · Áfa: ${formatMoney(total.tax)} · Fizetendő: ${formatMoney(total.gross)}`,
        );
        if (p.terms) field("Feltételek", p.terms);
      }
  }
  if (tab === 3) {
    const plans = rows.filter((e) => e.payload.type === "materials");
    if (!plans.length)
      text(
        "Nincs mentett anyaglista. Az Anyagok fülön először válassz ajánlatverziót és mentsd a listát.",
      );
    for (const e of plans)
      if (e.payload.type === "materials") {
        const quoteId = e.payload.quote_id;
        const quote = rows.find((q) => q.id === quoteId)?.payload;
        text(
          quote?.type === "quote"
            ? `${quote.number} · ${quote.revision}. ajánlatverzió anyaglistája`
            : "Anyaglista",
          true,
        );
        for (const line of e.payload.lines) {
          text(
            `${line.name}: ${quantity(line.override_milli ?? line.calculated_milli)} ${line.unit}${line.manual ? " · kézi tétel" : ""}`,
            true,
          );
          if (line.override_milli !== null)
            text(
              `Számított: ${quantity(line.calculated_milli)} ${line.unit} · kézzel felülbírált mennyiség`,
            );
          if (line.notes) text(line.notes);
        }
      }
  }
  if (tab === 4) {
    const handovers = rows.filter((e) => e.payload.type === "handover");
    if (!handovers.length) text("Nincs mentett átadási jegyzőkönyv.");
    for (const e of handovers)
      if (e.payload.type === "handover") {
        const p = e.payload;
        text(
          `${p.number} · ${p.revision}. verzió · ${p.sealed ? "Végleges" : "Tervezet"}`,
          true,
        );
        text(`Elvégzés dátuma: ${p.performed_on}`);
        field("Elvégzett munka", p.work);
        field("Eltérések", p.deviations);
        field("Pótmunkák", p.extras);
        field("Fennmaradó feladatok", p.remaining);
        if (p.terms) field("Átadási feltételek", p.terms);
        text(
          `Rendezett munkaterület: ${p.checks.tidy ? "igen" : "nem"} · Ügyfél tájékoztatása: ${p.checks.informed ? "igen" : "nem"} · Dokumentumok átadása: ${p.checks.documents ? "igen" : "nem"}`,
        );
        text(
          `Aláírások állapota: ügyfél ${p.customer_signature ? "aláírta" : "nem írta alá"}, vállalkozó ${p.contractor_signature ? "aláírta" : "nem írta alá"}. Az aláírásokat az eredeti végleges PDF tartalmazza.`,
        );
        photos(p.photo_ids);
      }
  }
  if (tab === 5) {
    text("SZÁMLANYILVÁNTARTÁS – NEM SZÁMLA", true);
    const invoices = rows.filter((e) => e.payload.type === "invoice");
    if (!invoices.length) text("Nincs mentett számlabejegyzés.");
    const types = {
      invoice: "Számla",
      proforma: "Díjbekérő",
      advance: "Előlegszámla",
      final: "Végszámla",
      credit: "Sztornó",
      correction: "Helyesbítés",
    };
    for (const e of invoices)
      if (e.payload.type === "invoice") {
        const p = e.payload;
        const money = (amount: number | null) =>
          amount === null
            ? "Nincs megadva"
            : new Intl.NumberFormat("hu-HU", {
                style: "currency",
                currency: p.currency,
              }).format(amount / 100);
        text(
          `${p.number || "Nincs bizonylatszám"} · ${types[p.document_type]}${p.draft ? " · TERVEZET" : ""}${p.is_test ? " · TESZT" : ""}`,
          true,
        );
        text(`Kiállító: ${p.issuer.name} · Ügyfél: ${p.customer.name}`);
        text(
          `Keltezés: ${p.issued_on ?? "—"} · Teljesítés: ${p.performed_on ?? "—"} · Határidő: ${p.due_on ?? "—"}`,
        );
        text(
          `Nettó: ${money(p.net_minor)} · Áfa: ${money(p.tax_minor)} · Bruttó: ${money(p.gross_minor)}`,
        );
        const balance = invoiceBalance(e, rows);
        if (balance)
          text(
            `Rögzített befizetés: ${money(balance.paid)} · Előlegbeszámítás: ${money(p.advance_deduction_minor)} · Nyitott összeg: ${money(balance.open)}`,
          );
        if (p.notes) field("Megjegyzés", p.notes);
      }
  }
  if (tab === 6) {
    text("Dokumentumjegyzék – a csatolmányok tartalmát nem helyettesíti.");
    const documents = rows.filter((e) => e.payload.type === "document");
    if (!documents.length) text("Nincs feltöltött dokumentum.");
    for (const e of documents)
      if (e.payload.type === "document") {
        text(e.payload.name, true);
        text(
          `${e.payload.created_on} · ${e.payload.mime} · ${Math.ceil(e.payload.size / 1024)} kB`,
        );
      }
  }
  return blocks;
}
