// @vitest-environment node
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import worker, { type Env, seal, unseal, googleId } from "../worker/index";
let sqlite: DatabaseSync;
let env: Env;
const company = "10000000-0000-4000-8000-000000000001",
  owner = "20000000-0000-4000-8000-000000000001",
  event = "30000000-0000-4000-8000-000000000001";
const secret = Buffer.alloc(32, 7).toString("base64");
beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(
    readFileSync(new URL("../worker/schema.sql", import.meta.url), "utf8"),
  );
  env = {
    DB: {
      prepare(sql) {
        let values: unknown[] = [];
        return {
          bind(...v) {
            values = v;
            return this;
          },
          async first() {
            return (
              (sqlite.prepare(sql).get(...(values as any[])) as any) ?? null
            );
          },
          async run() {
            return sqlite.prepare(sql).run(...(values as any[]));
          },
        };
      },
    },
    APP_URL: "https://erp.example",
    SUPABASE_URL: "https://sb.example",
    SUPABASE_PUBLISHABLE_KEY: "public",
    GOOGLE_CLIENT_ID: "test",
    GOOGLE_CLIENT_SECRET: "secret",
    TOKEN_SEAL_KEY: secret,
  };
});
afterEach(() => {
  vi.unstubAllGlobals();
  sqlite.close();
});
it("a szerver titkosítja a refresh tokent és idegen eredetről nem kérhető kapcsolat", async () => {
  const encrypted = await seal("VERY-SECRET-REFRESH-TOKEN", secret);
  expect(encrypted).not.toContain("VERY-SECRET");
  expect(await unseal(encrypted, secret)).toBe("VERY-SECRET-REFRESH-TOKEN");
  await expect(
    unseal(encrypted, Buffer.alloc(32, 8).toString("base64")),
  ).rejects.toThrow();
  const response = await worker.fetch(
    new Request("https://worker.example/connect", {
      method: "POST",
      headers: { Origin: "https://evil.example" },
    }),
    env,
  );
  expect(response.status).toBe(403);
});
it("elveszett Google-válasz után determinisztikus azonosítóval egy esemény marad, meghívó nélkül", async () => {
  sqlite
    .prepare("insert into connections values (?,?,?,?)")
    .run(
      company,
      owner,
      await seal("refresh-token", secret),
      new Date().toISOString(),
    );
  const stored = new Map<string, any>(),
    payload = {
      type: "event",
      title: "Felmérés",
      category: "survey",
      starts_at: "2026-11-01T10:00:00.000Z",
      ends_at: "2026-11-01T11:00:00.000Z",
      location: "Pécs",
      notes: "",
      cancelled: false,
      google_enabled: true,
    };
  let lost = true;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: any, init: any = {}) => {
      const url = String(input);
      if (url.endsWith("/auth/v1/user")) return Response.json({ id: owner });
      if (url.endsWith("/rpc/erp_snapshot"))
        return Response.json({
          company: { id: company, owner_id: owner },
          entries: [{ id: event, payload }],
        });
      if (url === "https://oauth2.googleapis.com/token")
        return Response.json({ access_token: "access-token" });
      if (url.startsWith("https://www.googleapis.com/calendar/")) {
        const id = googleId(event);
        if (!init.method)
          return stored.has(id)
            ? Response.json(stored.get(id))
            : new Response("", { status: 404 });
        expect(url).toContain("sendUpdates=none");
        if (init.method === "POST" || init.method === "PUT") {
          const body = JSON.parse(init.body);
          expect(body.attendees).toEqual([]);
          stored.set(id, body);
          if (lost) {
            lost = false;
            throw new Error("Lost response");
          }
          return Response.json(body);
        }
        return new Response(null, { status: 204 });
      }
      throw new Error("Unexpected request");
    }),
  );
  const request = () =>
    new Request("https://worker.example/sync", {
      method: "POST",
      headers: {
        Origin: "https://erp.example",
        Authorization: "Bearer owner-token",
      },
    });
  expect((await worker.fetch(request(), env)).status).toBe(502);
  expect((await worker.fetch(request(), env)).status).toBe(200);
  expect(stored.size).toBe(1);
  expect(sqlite.prepare("select * from event_links").all()).toHaveLength(1);
  const quota = sqlite.prepare("select calls from daily_quota").get() as {
    calls: number;
  };
  const before = quota.calls;
  await worker.fetch(request(), env);
  expect(
    (sqlite.prepare("select calls from daily_quota").get() as any).calls,
  ).toBe(before);
});
it("AAL1 vagy nem tulajdonos szerveroldali snapshot nélkül nem érhet el naptárt", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: any) =>
      String(input).endsWith("/auth/v1/user")
        ? Response.json({ id: owner })
        : Response.json({ company: null, entries: [] }),
    ),
  );
  const r = await worker.fetch(
    new Request("https://worker.example/status", {
      headers: { Origin: "https://erp.example", Authorization: "Bearer aal1" },
    }),
    env,
  );
  expect(r.status).toBe(401);
});
