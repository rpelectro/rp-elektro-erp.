// @vitest-environment node
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { invoice } from "./fixtures";
let db: PGlite;
const owner = "10000000-0000-0000-0000-000000000001";
const other = "10000000-0000-0000-0000-000000000002";
const tenant = "20000000-0000-0000-0000-000000000001";
const tenant2 = "20000000-0000-0000-0000-000000000002";
const partner = "30000000-0000-0000-0000-000000000001";
async function auth(user: string, aal: string) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify({ sub: user, aal }),
  ]);
  await db.exec("set role authenticated");
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select (current_setting('request.jwt.claims',true)::jsonb->>'sub')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select current_setting('request.jwt.claims',true)::jsonb $$;
    grant usage on schema public,auth,storage to authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
  `);
  await db.exec(
    readFileSync(
      new URL("../supabase/migrations/001_core.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      new URL("../supabase/migrations/002_workflow.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      new URL("../supabase/migrations/003_catalog_delete.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    `insert into auth.users values ('${owner}'),('${other}'); insert into public.app_owners(user_id) values ('${owner}'),('${other}'); insert into public.companies(id,owner_id,name) values ('${tenant}','${owner}','RP'),('${tenant2}','${other}','Másik'); insert into public.partners(id,company_id,name) values ('${partner}','${tenant}','Saját ügyfél');`,
  );
}, 30000);
afterAll(async () => {
  await db.close();
});
describe("A tényleges PostgreSQL-migráció jogosultságai", () => {
  it("a katalógus törlése atomi, verzióellenőrzött, saját vállalkozásra és kétlépcsős belépésre korlátozott", async () => {
    await auth(owner, "aal2");
    const first = crypto.randomUUID(),
      second = crypto.randomUUID();
    await db.query(
      "insert into public.work_items(id,company_id,name,unit,price_minor) values ($1,$3,'Első','db',0),($2,$3,'Második','db',0)",
      [first, second, tenant],
    );
    const deletion = "select public.erp_delete_work_items($1::jsonb)";
    await expect(
      db.query(deletion, [
        JSON.stringify([
          { id: first, version: 1 },
          { id: second, version: 2 },
        ]),
      ]),
    ).rejects.toThrow("Catalog changed");
    expect(
      (
        await db.query("select id from public.work_items where id in ($1,$2)", [
          first,
          second,
        ])
      ).rows,
    ).toHaveLength(2);
    await auth(other, "aal2");
    await expect(
      db.query(deletion, [JSON.stringify([{ id: first, version: 1 }])]),
    ).rejects.toThrow("Catalog changed");
    await auth(owner, "aal1");
    await expect(
      db.query(deletion, [JSON.stringify([{ id: first, version: 1 }])]),
    ).rejects.toThrow("Two-factor");
    await auth(owner, "aal2");
    await db.query(deletion, [
      JSON.stringify([
        { id: first, version: 1 },
        { id: second, version: 1 },
      ]),
    ]);
    expect(
      (
        await db.query("select id from public.work_items where id in ($1,$2)", [
          first,
          second,
        ])
      ).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("select id from public.partners where id=$1", [partner]))
        .rows,
    ).toHaveLength(1);
  });
  it("a tartós műveletazonosító elveszett válasz után sem dupláz; a mentési snapshot konzisztens", async () => {
    await auth(owner, "aal2");
    const op = crypto.randomUUID(),
      id = crypto.randomUUID(),
      payload = JSON.stringify({
        name: "RPC ügyfél",
        email: "",
        phone: "",
        billing_address: "",
        notes: "",
        archived: false,
      });
    const sql = "select public.erp_apply($1,$2,$3,$4,$5::jsonb) as result";
    const first = await db.query<{ result: { id: string; version: number } }>(
      sql,
      [op, "partners", id, 0, payload],
    );
    const repeated = await db.query<{
      result: { id: string; version: number };
    }>(sql, [op, "partners", id, 0, payload]);
    expect(first.rows[0].result.id).toBe(id);
    expect(repeated.rows).toEqual(first.rows);
    expect(
      (await db.query("select * from public.partners where id=$1", [id])).rows,
    ).toHaveLength(1);
    await expect(
      db.query(sql, [crypto.randomUUID(), "partners", id, 0, payload]),
    ).rejects.toThrow("conflict");
    await expect(
      db.query(sql, [
        crypto.randomUUID(),
        "partners",
        id,
        1,
        JSON.stringify({ company_id: tenant2, name: "Tiltott" }),
      ]),
    ).rejects.toThrow("Unexpected");
    const snapshot = await db.query<{
      result: {
        company: { id: string };
        partners: unknown[];
        entries: unknown[];
      };
    }>("select public.erp_snapshot() as result");
    expect(snapshot.rows[0].result.company.id).toBe(tenant);
    expect(snapshot.rows[0].result.entries).toEqual([]);
  });
  it("a kiállított számla változatlan marad, részfizetés ellenőrzött és átadás nélkül nincs lezárás", async () => {
    await auth(owner, "aal2");
    const projectId = crypto.randomUUID(),
      invoiceId = crypto.randomUUID();
    await db.query(
      "insert into public.projects(id,company_id,title) values ($1,$2,$3)",
      [projectId, tenant, "SQL munkafolyamat"],
    );
    await expect(
      db.query("update public.projects set status=$1 where id=$2", [
        "completed",
        projectId,
      ]),
    ).rejects.toThrow("handover");
    await db.query(
      "insert into public.entries(id,company_id,project_id,payload) values ($1,$2,$3,$4::jsonb)",
      [invoiceId, tenant, projectId, JSON.stringify(invoice())],
    );
    await expect(
      db.query(
        "update public.entries set payload=jsonb_set(payload,'{number}','\"Átírt\"') where id=$1",
        [invoiceId],
      ),
    ).rejects.toThrow("Immutable");
    const payment = {
      type: "payment",
      invoice_id: invoiceId,
      paid_on: "2026-10-23",
      amount_minor: 3000,
      currency: "EUR",
      direction: "in",
      method: "utalás",
      notes: "",
      voids_id: null,
    };
    await expect(
      db.query(
        "insert into public.entries(company_id,project_id,payload) values ($1,$2,$3::jsonb)",
        [tenant, projectId, JSON.stringify(payment)],
      ),
    ).rejects.toThrow("Invalid payment");
    await db.query(
      "insert into public.entries(company_id,project_id,payload) values ($1,$2,$3::jsonb)",
      [tenant, projectId, JSON.stringify({ ...payment, currency: "HUF" })],
    );
    await auth(owner, "aal1");
    expect((await db.query("select * from public.entries")).rows).toHaveLength(
      0,
    );
    await auth(other, "aal2");
    expect((await db.query("select * from public.entries")).rows).toHaveLength(
      0,
    );
  });
  it("AAL1 szinten olvasni és írni sem enged", async () => {
    await auth(owner, "aal1");
    expect((await db.query("select * from public.partners")).rows).toHaveLength(
      0,
    );
    await expect(
      db.query("insert into public.partners(company_id,name) values ($1,$2)", [
        tenant,
        "Tiltott",
      ]),
    ).rejects.toThrow();
    expect(
      (
        await db.query(
          "update public.partners set name=$1 where id=$2 returning *",
          ["Tiltott", partner],
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("select * from public.companies")).rows,
    ).toHaveLength(0);
  });
  it("AAL2 szinten csak a saját vállalkozás olvasható", async () => {
    await auth(owner, "aal2");
    expect(
      (await db.query("select * from public.companies")).rows,
    ).toHaveLength(1);
    expect(
      (await db.query("select * from public.partners where id=$1", [partner]))
        .rows,
    ).toHaveLength(1);
    await expect(
      db.query("insert into public.partners(company_id,name) values ($1,$2)", [
        tenant2,
        "Tiltott",
      ]),
    ).rejects.toThrow();
    await auth(other, "aal2");
    expect((await db.query("select * from public.partners")).rows).toHaveLength(
      0,
    );
  });
  it("szerveroldali verziózás és feltételes frissítés megállítja az elavult írást", async () => {
    await auth(owner, "aal2");
    const result = await db.query<{ version: number }>(
      "update public.partners set name=$1,version=999 where id=$2 and version=1 returning version",
      ["Új név", partner],
    );
    expect(result.rows[0].version).toBe(2);
    expect(
      (
        await db.query(
          "update public.partners set name=$1 where id=$2 and version=1 returning *",
          ["Elavult", partner],
        )
      ).rows,
    ).toHaveLength(0);
    await expect(
      db.query("update public.partners set company_id=$1 where id=$2", [
        tenant2,
        partner,
      ]),
    ).rejects.toThrow();
    await expect(
      db.query("update public.companies set owner_id=$1 where id=$2", [
        other,
        tenant,
      ]),
    ).rejects.toThrow();
    await expect(
      db.query("delete from public.partners where id=$1", [partner]),
    ).rejects.toThrow();
    await expect(
      db.query("insert into public.app_owners(user_id) values ($1)", [
        crypto.randomUUID(),
      ]),
    ).rejects.toThrow();
  });
  it("az összetett idegen kulcs más vállalkozás ügyfelét rendszergazdaként sem kapcsolja be", async () => {
    await db.exec("reset role");
    await expect(
      db.query(
        "insert into public.projects(company_id,customer_id,title) values ($1,$2,$3)",
        [tenant2, partner, "Keresztkapcsolat"],
      ),
    ).rejects.toThrow();
  });
  it("a privát fájlokat tulajdonoshoz és AAL2-höz köti; az eredetik nem írhatók felül", async () => {
    await auth(owner, "aal2");
    await db
      .query("insert into storage.objects(bucket_id,name) values ($1,$2)", [
        "erp-files",
        `${tenant}/test.pdf`,
      ])
      .catch((e) => {
        throw new Error(`Saját fájl beszúrása: ${e.message}`);
      });
    await expect(
      db.query("insert into storage.objects(bucket_id,name) values ($1,$2)", [
        "erp-files",
        `${tenant2}/bad.pdf`,
      ]),
    ).rejects.toThrow();
    expect(
      (
        await db
          .query("update storage.objects set name=$1 returning *", [
            "overwrite",
          ])
          .catch((e) => {
            throw new Error(`Fájl frissítése: ${e.message}`);
          })
      ).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("delete from storage.objects returning *")).rows,
    ).toHaveLength(0);
    await auth(owner, "aal1");
    expect((await db.query("select * from storage.objects")).rows).toHaveLength(
      0,
    );
    await auth(other, "aal2");
    expect((await db.query("select * from storage.objects")).rows).toHaveLength(
      0,
    );
  });
});
