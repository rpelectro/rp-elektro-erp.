import { z } from "zod";
import { entrySchema, type Entry } from "./business";

export const statuses = {
  inquiry: "Érdeklődés",
  survey: "Felmérés",
  quoted: "Ajánlat elküldve",
  scheduled: "Ütemezve",
  in_progress: "Folyamatban",
  handover: "Átadás",
  completed: "Lezárva",
} as const;
export type Status = keyof typeof statuses;
const text = z.string().trim().max(5000);
export const partnerSchema = z.object({
  name: text.min(1, "Add meg az ügyfél nevét.").max(200),
  email: text.refine(
    (v) => !v || z.email().safeParse(v).success,
    "Érvénytelen e-mail-cím.",
  ),
  phone: text.max(80),
  billing_address: text.max(1000),
  notes: text,
  archived: z.boolean(),
});
export const projectSchema = z.object({
  title: text.min(1, "Add meg a projekt nevét.").max(200),
  customer_id: z.uuid().nullable(),
  site_address: text.max(1000),
  status: z.enum(Object.keys(statuses) as [Status, ...Status[]]),
  notes: text,
  archived: z.boolean(),
});
export const workSchema = z.object({
  name: text.min(1, "Add meg a munkatétel nevét.").max(200),
  category: text.max(100),
  unit: text.min(1, "Add meg a mértékegységet.").max(30),
  price_minor: z.number().int().nonnegative().max(999999999999),
  description: text,
  archived: z.boolean(),
});
export const companySchema = z.object({
  name: text.min(1).max(200),
  email: text.refine(
    (v) => !v || z.email().safeParse(v).success,
    "Érvénytelen e-mail-cím.",
  ),
  phone: text.max(80),
  address: text.max(1000),
  tax_number: text.max(40),
  tax_mode: z.enum(["unknown", "aam", "vat"]),
  billing_mode: z.literal("manual"),
});
export type PartnerData = z.infer<typeof partnerSchema>;
export type ProjectData = z.infer<typeof projectSchema>;
export type WorkData = z.infer<typeof workSchema>;
export type CompanyData = z.infer<typeof companySchema>;
export interface Meta {
  id: string;
  company_id: string;
  version: number;
  created_at: string;
  updated_at: string;
}
export type Partner = PartnerData & Meta;
export type Project = ProjectData & Meta;
export type Work = WorkData & Meta;
export type Company = CompanyData & Meta;
export interface Tables {
  entries: Entry;
  partners: Partner;
  projects: Project;
  work_items: Work;
  companies: Company;
}
export type Kind = keyof Tables;
export type Data<K extends Kind> = Omit<Tables[K], keyof Meta>;
export interface Snapshot {
  entries: Entry[];
  company: Company;
  partners: Partner[];
  projects: Project[];
  work_items: Work[];
}
export interface Repository {
  mode: "local" | "cloud";
  load(): Promise<Snapshot>;
  save<K extends Kind>(
    kind: K,
    data: Data<K>,
    id?: string,
    expectedVersion?: number,
  ): Promise<Tables[K]>;
  deleteWorkItems?(items: { id: string; version: number }[]): Promise<void>;
  close(): void;
  putFile(bytes: Uint8Array, mime: string): Promise<string>;
  getFile(key: string): Promise<Uint8Array>;
  applyOperation?(operation: SyncOperation): Promise<Tables[Kind]>;
  sync?: {
    run(): Promise<void>;
    status(): Promise<{
      pending: number;
      conflicts: SyncConflict[];
      lastSync: string;
    }>;
    resolve(conflict: SyncConflict, choice: "local" | "server"): Promise<void>;
  };
}
export interface SyncOperation {
  operation_id: string;
  table_name: Kind;
  record_id: string;
  expected_version: number;
  data: Record<string, unknown>;
  sequence: number;
}
export interface SyncConflict {
  operation: SyncOperation;
  server: Tables[Kind] | null;
  local: Tables[Kind] | null;
  message: string;
}
export class ConflictError extends Error {
  constructor() {
    super(
      "Az adatot egy másik ablak módosította. Töltsd be az új változatot, és ellenőrizd a módosításaidat.",
    );
    this.name = "ConflictError";
  }
}
export const schemas = {
  entries: entrySchema,
  partners: partnerSchema,
  projects: projectSchema,
  work_items: workSchema,
  companies: companySchema,
};
export function validate<K extends Kind>(kind: K, data: Data<K>): Data<K> {
  const result = schemas[kind].safeParse(data);
  if (!result.success) throw new Error(result.error.issues[0].message);
  return result.data as unknown as Data<K>;
}
// Exact hundredths of a forint; no floating point multiplication.
export function parseMoney(input: string): number {
  const value = input.trim().replace(/[ \u00a0\u202f]/g, "");
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value))
    throw new Error(
      "Az ár pozitív szám legyen, legfeljebb két tizedessel (pl. 1250,50).",
    );
  const [whole, fraction = ""] = value.split(/[.,]/);
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor > 999999999999)
    throw new Error("Túl nagy összeg.");
  return minor;
}
export const moneyInput = (minor: number) =>
  `${Math.floor(minor / 100)},${String(minor % 100).padStart(2, "0")}`;
export const formatMoney = (minor: number) =>
  new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(minor / 100);
export function friendly(error: unknown): string {
  if (error instanceof Error) {
    if (/Failed to fetch|fetch failed|NetworkError/i.test(error.message))
      return "Nem érhető el a szerver. A változtatás nincs elmentve; az űrlap nyitva marad.";
    return error.message;
  }
  return "A művelet nem sikerült. Próbáld újra.";
}
