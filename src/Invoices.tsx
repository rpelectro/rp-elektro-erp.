import { RecordWorkspace, WorkspaceSection } from "./RecordWorkspace";
import { useState } from "react";
import {
  type Context,
  Text,
  Amount,
  Select,
  Check,
  Form,
  useAction,
  saveEntry,
  Upload,
  DocumentList,
} from "./ui";
import {
  type Entry,
  type PayloadOf,
  today,
  emptyParty,
  invoiceBalance,
  financialSummary,
  quoteTotals,
  acceptedQuotes,
} from "./business";
import { formatMoney, parseMoney, moneyInput, friendly } from "./domain";
import { PartyEditor } from "./Workflow";
const types = {
  invoice: "Normál számla",
  proforma: "Díjbekérő",
  advance: "Előlegszámla",
  final: "Végszámla",
  credit: "Sztornó",
  correction: "Helyesbítő",
};
const currencyMoney = (n: number, currency: string) =>
  new Intl.NumberFormat("hu-HU", { style: "currency", currency }).format(
    n / 100,
  );
function newInvoice(ctx: Context): PayloadOf<"invoice"> {
  const project = ctx.data.projects.find((p) => p.id === ctx.projectId),
    customer = ctx.data.partners.find((p) => p.id === project?.customer_id),
    c = ctx.data.company;
  return {
    type: "invoice",
    direction: "outgoing",
    source: "manual",
    provider: "szamlazz.hu",
    external_id: null,
    document_type: "invoice",
    draft: true,
    is_test: false,
    number: "",
    issuer: {
      name: c.name,
      address: c.address,
      tax_number: c.tax_number,
      email: c.email,
      phone: c.phone,
    },
    customer: customer
      ? {
          name: customer.name,
          address: customer.billing_address,
          tax_number: "",
          email: customer.email,
          phone: customer.phone,
        }
      : emptyParty(),
    issued_on: null,
    performed_on: null,
    due_on: null,
    received_on: null,
    net_minor: null,
    tax_minor: null,
    gross_minor: null,
    currency: "HUF",
    method: "",
    relation_ids: [],
    advance_deduction_minor: 0,
    notes: "",
  };
}
export function Finance({ ctx }: { ctx: Context }) {
  const filtered = ctx.data.entries.filter(
    (e) => ctx.projectId === undefined || e.project_id === ctx.projectId,
  );
  const totals = financialSummary(filtered);
  const accepted = acceptedQuotes(filtered).reduce(
    (sum, e) => sum + quoteTotals(e.payload as PayloadOf<"quote">).gross,
    0,
  );
  return (
    <div className="finance-grid">
      {accepted > 0 && (
        <section className="panel">
          <h3>Elfogadott ajánlatok · HUF</h3>
          <dl>
            <dt>Elfogadott projektérték</dt>
            <dd>{formatMoney(accepted)}</dd>
            <dt>Még nem számlázott</dt>
            <dd>{formatMoney(accepted - (totals.HUF?.invoiced ?? 0))}</dd>
          </dl>
        </section>
      )}
      {Object.entries(totals).map(([currency, s]) => (
        <section className="panel" key={currency}>
          <h3>{currency} · Kimenő számlák</h3>
          <dl>
            <dt>Kiállított érték</dt>
            <dd>{currencyMoney(s.invoiced, currency)}</dd>
            <dt>Rögzített befizetés</dt>
            <dd>{currencyMoney(s.paid, currency)}</dd>
            <dt>Nyitott összeg</dt>
            <dd>{currencyMoney(s.open, currency)}</dd>
            <dt>Kimaradó hiányos tervezet</dt>
            <dd>{s.drafts}</dd>
          </dl>
        </section>
      ))}
    </div>
  );
}
export function Invoices({ ctx }: { ctx: Context }) {
  const [edit, setEdit] = useState<Entry | null | undefined>(),
    [filter, setFilter] = useState(""),
    [openOnly, setOpenOnly] = useState(false);
  const rows = ctx.data.entries.filter(
    (e) =>
      e.payload.type === "invoice" &&
      (ctx.projectId === undefined || e.project_id === ctx.projectId) &&
      `${e.payload.number} ${e.payload.customer.name}`
        .toLocaleLowerCase("hu")
        .includes(filter.toLocaleLowerCase("hu")) &&
      (!openOnly || (invoiceBalance(e, ctx.data.entries)?.open ?? 0) > 0),
  );
  return (
    <>
      <Finance ctx={ctx} />
      <section className="panel">
        <div className="section-heading">
          <h2>Kimenő számlanyilvántartás</h2>
          <button className="primary" onClick={() => setEdit(null)}>
            Kiállított számla rögzítése
          </button>
        </div>
        <div className="notice">
          Kézzel rögzítve – Számlázz.hu. Nincs automatikus számlakiállítás,
          banki vagy NAV-egyeztetés.
        </div>
        <div className="toolbar">
          <Text
            label="Számla vagy ügyfél keresése"
            value={filter}
            onChange={setFilter}
          />
          <Check
            label="Csak nyitott tartozás"
            value={openOnly}
            onChange={setOpenOnly}
          />
          <a
            className="secondary"
            href="https://www.szamlazz.hu/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Számlázz.hu megnyitása ↗
          </a>
        </div>
        {ctx.projectId && <BillingSheet ctx={ctx} />}
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Számla</th>
                <th>Ügyfél</th>
                <th>Határidő</th>
                <th>Összeg / nyitott</th>
                <th>Állapot</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const p = e.payload as PayloadOf<"invoice">,
                  balance = invoiceBalance(e, ctx.data.entries),
                  pdf = ctx.data.entries.some(
                    (d) =>
                      d.payload.type === "document" &&
                      d.payload.entity_id === e.id &&
                      d.payload.mime === "application/pdf",
                  );
                return (
                  <tr key={e.id}>
                    <td>
                      {p.number || "Hiányos tervezet"}
                      <small>
                        {types[p.document_type]}
                        {p.is_test ? " · TESZT" : ""}
                      </small>
                    </td>
                    <td>{p.customer.name || "Nincs megadva"}</td>
                    <td>
                      {p.due_on ?? "Nincs megadva"}
                      {balance &&
                        balance.open > 0 &&
                        p.due_on &&
                        p.due_on < today() && (
                          <small className="danger-text">Lejárt</small>
                        )}
                    </td>
                    <td>
                      {p.gross_minor === null
                        ? "Ismeretlen"
                        : currencyMoney(p.gross_minor, p.currency)}
                      <small>
                        Nyitott:{" "}
                        {balance
                          ? currencyMoney(balance.open, p.currency)
                          : "Nem számítható"}
                      </small>
                    </td>
                    <td>
                      {p.draft ? "Tervezet" : "Rögzített"}
                      <small>{pdf ? "PDF csatolva" : "PDF hiányzik"}</small>
                    </td>
                    <td>
                      <button className="secondary" onClick={() => setEdit(e)}>
                        Megnyitás
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <p className="muted">Még nincs a szűrésnek megfelelő számla.</p>
        )}
        {edit !== undefined && (
          <InvoiceEditor
            key={edit?.id ?? "new"}
            ctx={ctx}
            entry={edit ?? undefined}
            onClose={() => setEdit(undefined)}
          />
        )}
      </section>
    </>
  );
}
function BillingSheet({ ctx }: { ctx: Context }) {
  const p = ctx.data.projects.find((p) => p.id === ctx.projectId),
    c = ctx.data.partners.find((c) => c.id === p?.customer_id),
    quotes = acceptedQuotes(
      ctx.data.entries.filter((e) => e.project_id === ctx.projectId),
    );
  const action = useAction();
  const text = `Ügyfél: ${c?.name ?? ""}\nSzámlázási cím: ${c?.billing_address ?? ""}\nE-mail: ${c?.email ?? ""}\nMunkavégzés helye: ${p?.site_address ?? ""}\n${quotes
    .map((q) => {
      const p = q.payload as PayloadOf<"quote">;
      return `Elfogadott ajánlat: ${p.number} v${p.revision} · ${formatMoney(quoteTotals(p).gross)}`;
    })
    .join("\n")}`;
  return (
    <details className="billing-sheet">
      <summary>Számlázási adatok</summary>
      <p className="small muted">
        Előkészítő adatlap, nem számla. Nem kap számlaszámot.
      </p>
      <pre>{text}</pre>
      <button
        className="secondary"
        onClick={() =>
          void action.act(async () => {
            await navigator.clipboard.writeText(text);
            action.setMessage("Adatok a vágólapra másolva.");
          })
        }
      >
        Adatok másolása
      </button>
      {action.feedback}
    </details>
  );
}
function OptionalMoney({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  return (
    <label>
      {label}
      <input
        inputMode="decimal"
        placeholder="Ismeretlen / nincs megadva"
        defaultValue={
          value === null
            ? ""
            : `${value < 0 ? "-" : ""}${moneyInput(Math.abs(value))}`
        }
        onChange={(e) => {
          try {
            const s = e.target.value.trim();
            if (!s) onChange(null);
            else
              onChange(
                (s.startsWith("-") ? -1 : 1) *
                  parseMoney(s.replace(/^-/, "").trim()),
              );
            e.target.setCustomValidity("");
          } catch (error) {
            e.target.setCustomValidity(friendly(error));
          }
        }}
      />
    </label>
  );
}
function InvoiceEditor({
  ctx,
  entry,
  onClose,
}: {
  ctx: Context;
  entry?: Entry;
  onClose: () => void;
}) {
  const [p, set] = useState<PayloadOf<"invoice">>(
    (entry?.payload as PayloadOf<"invoice">) ?? newInvoice(ctx),
  );
  const [projectId, setProject] = useState<string | null>(
    entry?.project_id ?? ctx.projectId ?? null,
  );
  const [dirty, mark] = useState(false),
    [record, setRecord] = useState(entry);
  const action = useAction();
  const patch = (values: Partial<typeof p>) => {
    mark(true);
    set({ ...p, ...values });
  };
  const readonly = !!record && !p.draft;
  return (
    <RecordWorkspace
      title="Kiállított számla nyilvántartása"
      onClose={onClose}
      dirty={dirty}
      busy={action.busy}
      saveLabel={
        readonly
          ? undefined
          : p.draft
            ? "Tervezet mentése"
            : "Kiállított számla végleges rögzítése"
      }
      sections={
        readonly
          ? [
              { id: "overview", label: "Rögzített számla" },
              { id: "payments", label: "Befizetések" },
              { id: "documents", label: "Eredeti fájlok" },
            ]
          : [
              { id: "basic", label: "Alapadatok és típus" },
              { id: "parties", label: "Kibocsátó és vevő" },
              { id: "money", label: "Dátumok és összegek" },
              { id: "relations", label: "Kapcsolt bizonylatok" },
              { id: "notes", label: "Megjegyzés" },
              ...(record ? [{ id: "documents", label: "Eredeti fájlok" }] : []),
            ]
      }
    >
      {action.feedback}
      {readonly ? (
        <>
          <WorkspaceSection id="overview">
            <div className="notice">
              A kiállított számla adatai változatlan pillanatfelvételként
              megmaradnak. Sztornóhoz vagy helyesbítéshez külön, kapcsolt
              dokumentumot rögzíts.
            </div>
            <h3>
              {p.number} · {types[p.document_type]}
            </h3>
            <p>
              {p.issuer.name} → {p.customer.name}
              <br />
              {p.issued_on} · határidő: {p.due_on}
              <br />
              <strong>{currencyMoney(p.gross_minor ?? 0, p.currency)}</strong>
            </p>
            {p.advance_deduction_minor > 0 && (
              <p>
                Beszámított előleg:{" "}
                {currencyMoney(p.advance_deduction_minor, p.currency)}
              </p>
            )}
          </WorkspaceSection>
          <WorkspaceSection id="payments" title="Befizetések">
            <Payments ctx={{ ...ctx, projectId }} invoice={record} />
          </WorkspaceSection>
          <WorkspaceSection id="documents" title="Eredeti fájlok">
            <Upload
              ctx={{ ...ctx, projectId }}
              category="invoice"
              entityId={record.id}
            />
            <DocumentList ctx={{ ...ctx, projectId }} entityId={record.id} />
          </WorkspaceSection>
          <WorkspaceSection id="overview">
            <button
              className="secondary"
              onClick={() => {
                set({
                  ...newInvoice(ctx),
                  issuer: p.issuer,
                  customer: p.customer,
                  currency: p.currency,
                  document_type: "credit",
                  relation_ids: [record.id],
                });
                setRecord(undefined);
                mark(true);
              }}
            >
              Kapcsolt sztornó / helyesbítés rögzítése
            </button>
          </WorkspaceSection>
        </>
      ) : (
        <Form
          busy={action.busy}
          label={
            p.draft
              ? "Tervezet mentése"
              : "Kiállított számla végleges rögzítése"
          }
          onSave={() =>
            void action.act(async () => {
              const saved = await saveEntry(
                { ...ctx, projectId },
                p,
                record,
                projectId,
              );
              setRecord(saved);
              mark(false);
              await ctx.reload();
              action.setMessage(
                p.draft
                  ? "A hiányos tervezet megőrizve."
                  : "A külső számla adatai rögzítve. Számlakiállítás nem történt.",
              );
            })
          }
        >
          <WorkspaceSection id="basic" title="Alapadatok és típus">
            <Check
              label="Hiányos tervezet – kimarad a pénzügyi összesítésből"
              value={p.draft}
              onChange={(draft) => patch({ draft })}
            />
            <Check
              label="Tesztbizonylat – kimarad az éles összesítésből"
              value={p.is_test}
              onChange={(is_test) => patch({ is_test })}
            />
            <Select
              label="Projekt"
              value={projectId ?? ""}
              onChange={(v) => {
                setProject(v || null);
                mark(true);
              }}
              options={[
                ["", "Nincs projekt"],
                ...ctx.data.projects.map(
                  (p) => [p.id, p.title] as [string, string],
                ),
              ]}
            />
            <Select
              label="Vevő átvétele az ügyféltörzsből"
              value=""
              onChange={(v) => {
                const partner = ctx.data.partners.find((p) => p.id === v);
                if (partner)
                  patch({
                    customer: {
                      name: partner.name,
                      address: partner.billing_address,
                      tax_number: "",
                      email: partner.email,
                      phone: partner.phone,
                    },
                  });
              }}
              options={[
                ["", "Ügyfél kiválasztása…"],
                ...ctx.data.partners.map(
                  (p) => [p.id, p.name] as [string, string],
                ),
              ]}
            />
            <Select
              label="Dokumentumtípus"
              value={p.document_type}
              onChange={(document_type) =>
                patch({
                  document_type: document_type as typeof p.document_type,
                })
              }
              options={Object.entries(types)}
            />
            <Text
              label="Tényleges számlaszám"
              value={p.number}
              required={!p.draft}
              onChange={(number) => patch({ number })}
            />
          </WorkspaceSection>
          <WorkspaceSection id="parties" title="Kibocsátó és vevő">
            <PartyEditor
              p={p.issuer}
              label="Kibocsátó"
              onChange={(issuer) => patch({ issuer })}
            />
            <PartyEditor
              p={p.customer}
              label="Vevő"
              onChange={(customer) => patch({ customer })}
            />
          </WorkspaceSection>
          <WorkspaceSection id="money" title="Dátumok és összegek">
            <div className="three-columns">
              <Text
                label="Kiállítás dátuma"
                type="date"
                value={p.issued_on ?? ""}
                required={!p.draft}
                onChange={(issued_on) =>
                  patch({ issued_on: issued_on || null })
                }
              />
              <Text
                label="Teljesítés dátuma"
                type="date"
                value={p.performed_on ?? ""}
                required={!p.draft}
                onChange={(performed_on) =>
                  patch({ performed_on: performed_on || null })
                }
              />
              <Text
                label="Fizetési határidő"
                type="date"
                value={p.due_on ?? ""}
                required={!p.draft}
                onChange={(due_on) => patch({ due_on: due_on || null })}
              />
            </div>
            <div className="three-columns">
              <OptionalMoney
                label="Nettó"
                value={p.net_minor}
                onChange={(net_minor) => patch({ net_minor })}
              />
              <OptionalMoney
                label="Adó"
                value={p.tax_minor}
                onChange={(tax_minor) => patch({ tax_minor })}
              />
              <OptionalMoney
                label="Bruttó – előleglevonás előtt"
                value={p.gross_minor}
                onChange={(gross_minor) => patch({ gross_minor })}
              />
            </div>
            <div className="form-grid">
              <Text
                label="Deviza (pl. HUF, EUR)"
                value={p.currency}
                required
                onChange={(currency) =>
                  patch({ currency: currency.toUpperCase() })
                }
              />
              <Text
                label="Fizetési mód"
                value={p.method}
                required={!p.draft}
                onChange={(method) => patch({ method })}
              />
            </div>
          </WorkspaceSection>
          <WorkspaceSection id="relations">
            <h3>Kapcsolt előzmények</h3>
            {ctx.data.entries
              .filter(
                (e) =>
                  e.payload.type === "invoice" &&
                  !e.payload.draft &&
                  e.id !== record?.id &&
                  e.project_id === projectId &&
                  e.payload.currency === p.currency,
              )
              .map((e) => (
                <Check
                  key={e.id}
                  label={`${(e.payload as PayloadOf<"invoice">).number} · ${types[(e.payload as PayloadOf<"invoice">).document_type]}`}
                  value={p.relation_ids.includes(e.id)}
                  onChange={(checked) =>
                    patch({
                      relation_ids: checked
                        ? [...p.relation_ids, e.id]
                        : p.relation_ids.filter((id) => id !== e.id),
                    })
                  }
                />
              ))}
            {p.document_type === "final" && (
              <>
                <Amount
                  label="Beszámított előleg (a bruttóból levonva)"
                  value={p.advance_deduction_minor}
                  onChange={(advance_deduction_minor) =>
                    patch({ advance_deduction_minor })
                  }
                />
                <p className="small muted">
                  A bruttó mezőbe a teljes munka értékét írd; az
                  előlegbeszámítás külön csökkenti a végszámla nyitott összegét.
                </p>
              </>
            )}
          </WorkspaceSection>
          <WorkspaceSection id="notes" title="Megjegyzés">
            <Text
              label="Megjegyzés"
              rows={3}
              value={p.notes}
              onChange={(notes) => patch({ notes })}
            />
          </WorkspaceSection>
        </Form>
      )}
      {record && p.draft && (
        <WorkspaceSection id="documents" title="Eredeti fájlok">
          <Upload
            ctx={{ ...ctx, projectId }}
            category="invoice"
            entityId={record.id}
          />
          <DocumentList ctx={{ ...ctx, projectId }} entityId={record.id} />
        </WorkspaceSection>
      )}
    </RecordWorkspace>
  );
}
function Payments({ ctx, invoice }: { ctx: Context; invoice: Entry }) {
  const inv = invoice.payload as PayloadOf<"invoice">;
  const [amount, setAmount] = useState(0),
    [paidOn, setPaidOn] = useState(today()),
    [method, setMethod] = useState(""),
    [direction, setDirection] = useState("in");
  const action = useAction();
  const rows = ctx.data.entries.filter(
      (e) =>
        e.payload.type === "payment" && e.payload.invoice_id === invoice.id,
    ),
    balance = invoiceBalance(invoice, ctx.data.entries)!;
  return (
    <section className="payment-box">
      {action.feedback}
      <h3>Befizetések</h3>
      <p>
        Rögzítve: <strong>{currencyMoney(balance.paid, inv.currency)}</strong> ·
        nyitott: <strong>{currencyMoney(balance.open, inv.currency)}</strong>
      </p>
      {rows.map((e) => {
        const p = e.payload as PayloadOf<"payment">,
          voided = rows.some(
            (r) => (r.payload as PayloadOf<"payment">).voids_id === e.id,
          );
        return (
          <div className="document-row" key={e.id}>
            <div>
              {p.paid_on} · {p.direction === "in" ? "+" : "−"}
              {currencyMoney(p.amount_minor, p.currency)} · {p.method}
              <small>
                {p.voids_id
                  ? "Visszavonási bejegyzés"
                  : voided
                    ? "Visszavonva"
                    : ""}
              </small>
            </div>
            {!p.voids_id && !voided && (
              <button
                className="secondary"
                disabled={action.busy}
                onClick={() =>
                  void action.act(async () => {
                    await saveEntry(ctx, {
                      ...p,
                      voids_id: e.id,
                      paid_on: today(),
                      notes: "Hibás befizetés visszavonása",
                    });
                    await ctx.reload();
                  })
                }
              >
                Befizetés visszavonása
              </button>
            )}
          </div>
        );
      })}
      <Form
        busy={action.busy}
        label="Befizetés rögzítése"
        onSave={() =>
          void action.act(async () => {
            await saveEntry(ctx, {
              type: "payment",
              invoice_id: invoice.id,
              paid_on: paidOn,
              amount_minor: amount,
              currency: inv.currency,
              direction: direction as "in" | "out",
              method,
              notes: "",
              voids_id: null,
            });
            await ctx.reload();
            action.setMessage(
              "A pénzmozgás rögzítve az E-RP-ben. A Számlázz.hu állapota nem változott.",
            );
          })
        }
      >
        <div className="form-grid">
          <Amount
            label={`Összeg (${inv.currency})`}
            value={amount}
            onChange={setAmount}
          />
          <Text
            label="Befizetés dátuma"
            type="date"
            required
            value={paidOn}
            onChange={setPaidOn}
          />
        </div>
        <div className="form-grid">
          <Text
            label="Befizetés módja"
            required
            value={method}
            onChange={setMethod}
          />
          <Select
            label="Pénzmozgás iránya"
            value={direction}
            onChange={setDirection}
            options={Object.entries({
              in: "Beérkező pénz",
              out: "Visszafizetés az ügyfélnek",
            })}
          />
        </div>
      </Form>
    </section>
  );
}
