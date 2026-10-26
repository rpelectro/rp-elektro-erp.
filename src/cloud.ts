import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  ConflictError,
  validate,
  type Data,
  type Kind,
  type Repository,
  type Snapshot,
  type Tables,
} from "./domain";
import { sha256 } from "./transfer";

export function checkConfig(url: string, key: string) {
  if (!url || !key) return false;
  if (new URL(url).protocol !== "https:")
    throw new Error("A Supabase URL HTTPS-cím legyen.");
  if (key.startsWith("sb_secret_"))
    throw new Error(
      "Titkos szerverkulcs nem kerülhet a böngészőbe. Publishable kulcsot adj meg.",
    );
  if (!key.startsWith("sb_publishable_")) {
    try {
      const role = JSON.parse(
        atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      ).role;
      if (role !== "anon") throw new Error();
    } catch {
      throw new Error(
        "Érvénytelen publikus kulcs. Csak publishable vagy anon kulcs használható.",
      );
    }
  }
  return true;
}
export function clientFromEnv(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  if (!checkConfig(url, key)) return null;
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key) =>
          localStorage.getItem("erp-remember-session") === "true"
            ? localStorage.getItem(key)
            : sessionStorage.getItem(key),
        setItem: (key, value) => {
          (localStorage.getItem("erp-remember-session") === "true"
            ? localStorage
            : sessionStorage
          ).setItem(key, value);
        },
        removeItem: (key) => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        },
      },
    },
  });
}
export async function cloudRepository(
  client: SupabaseClient,
): Promise<Repository> {
  const result = await client.from("companies").select("*").single();
  if (result.error)
    throw new Error(
      "A vállalkozás nem tölthető be. Ellenőrizd az adatbázis telepítését, a tulajdonos beállítását és a kétlépcsős belépést.",
    );
  const companyId = result.data.id as string;
  return {
    mode: "cloud",
    async load() {
      const snapshot = await client.rpc("erp_snapshot");
      if (snapshot.error) throw new Error(snapshot.error.message);
      return snapshot.data as Snapshot;
    },
    async save<K extends Kind>(
      kind: K,
      input: Data<K>,
      id?: string,
      expectedVersion?: number,
    ): Promise<Tables[K]> {
      const data = validate(kind, input);
      const payload: Record<string, unknown> = { ...data };
      if (kind === "companies" && id !== companyId)
        throw new Error("Érvénytelen vállalkozás.");
      const result = await client.rpc("erp_apply", {
        operation_id: crypto.randomUUID(),
        table_name: kind,
        record_id: id ?? crypto.randomUUID(),
        expected_version: id ? (expectedVersion ?? -1) : 0,
        data: payload,
      });
      if (result.error) {
        if (result.error.code === "40001") throw new ConflictError();
        throw new Error(result.error.message);
      }
      return result.data as Tables[K];
    },
    async deleteWorkItems(items) {
      if (!items.length) return;
      const result = await client.rpc("erp_delete_work_items", { items });
      if (result.error) {
        if (result.error.code === "40001") throw new ConflictError();
        if (["PGRST202", "42883"].includes(result.error.code))
          throw new Error(
            "A törléshez futtasd le a 003_catalog_delete.sql adatbázis-frissítést a Supabase SQL Editorban.",
          );
        throw new Error(result.error.message);
      }
    },
    async applyOperation(operation) {
      const { sequence, ...body } = operation;
      const result = await client.rpc("erp_apply", body);
      if (result.error) {
        if (result.error.code === "40001") throw new ConflictError();
        throw new Error(result.error.message);
      }
      return result.data;
    },
    close() {
      /* AuthGate owns the session. */
    },
    async putFile(bytes, mime) {
      if (!bytes.byteLength || bytes.byteLength > 10485760)
        throw new Error("A fájl legfeljebb 10 MB lehet.");
      const hash = await sha256(bytes);
      const name = `${companyId}/${hash}`;
      const result = await client.storage
        .from("erp-files")
        .upload(name, new Uint8Array(bytes), {
          contentType: mime,
          upsert: false,
        });
      if (result.error) {
        const existing = await client.storage.from("erp-files").download(name);
        if (
          existing.error ||
          (await sha256(new Uint8Array(await existing.data.arrayBuffer()))) !==
            hash
        )
          throw new Error(result.error.message);
      }
      return name;
    },
    async getFile(name) {
      const result = await client.storage.from("erp-files").download(name);
      if (result.error) throw new Error(result.error.message);
      return new Uint8Array(await result.data.arrayBuffer());
    },
  };
}
