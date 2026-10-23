interface Statement {
  bind(...v: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}
export interface Env {
  DB: { prepare(sql: string): Statement };
  APP_URL: string;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  TOKEN_SEAL_KEY: string;
}
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (value: string) =>
  Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
export async function seal(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    unb64(secret),
    "AES-GCM",
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return `${b64(iv)}.${b64(new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value))))}`;
}
export async function unseal(value: string, secret: string) {
  const [iv, bytes] = value.split(".");
  const key = await crypto.subtle.importKey(
    "raw",
    unb64(secret),
    "AES-GCM",
    false,
    ["decrypt"],
  );
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: unb64(iv) },
      key,
      unb64(bytes),
    ),
  );
}
export const googleId = (id: string) =>
  `erp${id.replaceAll("-", "").toLowerCase()}`;
function json(value: unknown, status = 200, origin?: string) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(origin
        ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" }
        : {}),
    },
  });
}
async function identity(request: Request, env: Env) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("AUTH");
  const headers = {
    Authorization: authorization,
    apikey: env.SUPABASE_PUBLISHABLE_KEY,
  };
  const user = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers });
  if (!user.ok) throw new Error("AUTH");
  const principal = (await user.json()) as { id: string };
  const snapshot = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/erp_snapshot`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!snapshot.ok) throw new Error("AUTH");
  const data = (await snapshot.json()) as {
    company: { id: string; owner_id: string } | null;
    entries: Record<string, any>[];
  };
  if (!data.company || data.company.owner_id !== principal.id)
    throw new Error("AUTH");
  return { userId: principal.id, companyId: data.company.id, data };
}
async function quota(env: Env) {
  const day = new Date().toISOString().slice(0, 10);
  const row = await env.DB.prepare(
    "insert into daily_quota(day,calls) values (?,1) on conflict(day) do update set calls=calls+1 where calls<1000 returning calls",
  )
    .bind(day)
    .first();
  if (!row) throw new Error("QUOTA");
}
async function calendarFetch(
  env: Env,
  url: string,
  token: string,
  init: RequestInit = {},
) {
  await quota(env);
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(12000),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}
function ours(value: any, company: string, id: string) {
  return (
    value?.extendedProperties?.private?.erp_company === company &&
    value?.extendedProperties?.private?.erp_entry === id
  );
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url),
      app = new URL(env.APP_URL),
      origin = request.headers.get("Origin");
    if (url.pathname === "/authorize" && request.method === "GET") {
      const state = url.searchParams.get("ticket");
      const saved = state
        ? await env.DB.prepare("select expires from oauth_states where state=?")
            .bind(state)
            .first<{ expires: number }>()
        : null;
      if (!saved || saved.expires < Date.now())
        return json(
          {
            error: "Lejárt összekapcsolási szándék. Indítsd újra az E-RP-ből.",
          },
          400,
        );
      const oauth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      oauth.search = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: `${url.origin}/callback`,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/calendar.events.owned",
        access_type: "offline",
        prompt: "consent",
        state: state!,
      }).toString();
      return new Response(null, {
        status: 303,
        headers: {
          Location: oauth.toString(),
          "Set-Cookie": `erp_oauth=${state}; Path=/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
          "Cache-Control": "no-store",
        },
      });
    }
    if (request.method === "OPTIONS") {
      if (origin !== app.origin) return json({ error: "Tiltott eredet." }, 403);
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": app.origin,
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Authorization,Content-Type",
          Vary: "Origin",
        },
      });
    }
    if (url.pathname === "/callback" && request.method === "GET") {
      try {
        const state = url.searchParams.get("state"),
          code = url.searchParams.get("code"),
          cookie = request.headers.get("Cookie") ?? "";
        if (
          !state ||
          !code ||
          !cookie.split(";").some((c) => c.trim() === `erp_oauth=${state}`)
        )
          throw new Error("STATE");
        const saved = await env.DB.prepare(
          "delete from oauth_states where state=? returning company_id,owner_id,expires",
        )
          .bind(state)
          .first<{ company_id: string; owner_id: string; expires: number }>();
        if (!saved || saved.expires < Date.now()) throw new Error("STATE");
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${url.origin}/callback`,
            grant_type: "authorization_code",
          }),
        });
        if (!response.ok) throw new Error("GOOGLE");
        const tokens = (await response.json()) as { refresh_token?: string };
        if (!tokens.refresh_token) throw new Error("REFRESH");
        await env.DB.prepare(
          "insert into connections(company_id,owner_id,token,updated_at) values (?,?,?,?) on conflict(company_id) do update set owner_id=excluded.owner_id,token=excluded.token,updated_at=excluded.updated_at",
        )
          .bind(
            saved.company_id,
            saved.owner_id,
            await seal(tokens.refresh_token, env.TOKEN_SEAL_KEY),
            new Date().toISOString(),
          )
          .run();
        return new Response(null, {
          status: 303,
          headers: {
            Location: env.APP_URL,
            "Set-Cookie":
              "erp_oauth=; Path=/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
            "Cache-Control": "no-store",
          },
        });
      } catch {
        return json(
          {
            error:
              "A Google-kapcsolat nem fejeződött be. Jelentkezz be újra az E-RP-ben és indíts új összekapcsolást.",
          },
          400,
        );
      }
    }
    if (origin !== app.origin) return json({ error: "Tiltott eredet." }, 403);
    if (!["/status", "/connect", "/sync", "/disconnect"].includes(url.pathname))
      return json({ error: "Ismeretlen művelet." }, 404, app.origin);
    if (request.method !== (url.pathname === "/status" ? "GET" : "POST"))
      return json({ error: "Tiltott metódus." }, 405, app.origin);
    try {
      const who = await identity(request, env);
      if (url.pathname === "/status") {
        const row = await env.DB.prepare(
          "select updated_at from connections where company_id=? and owner_id=?",
        )
          .bind(who.companyId, who.userId)
          .first();
        return json({ connected: !!row }, 200, app.origin);
      }
      if (url.pathname === "/disconnect") {
        await env.DB.prepare(
          "delete from connections where company_id=? and owner_id=?",
        )
          .bind(who.companyId, who.userId)
          .run();
        return json(
          {
            connected: false,
            message:
              "A szerveroldali kapcsolat eltávolítva. A korábban létrehozott Google-események megmaradtak.",
          },
          200,
          app.origin,
        );
      }
      if (url.pathname === "/connect") {
        const state = b64(crypto.getRandomValues(new Uint8Array(32)))
          .replaceAll("+", "-")
          .replaceAll("/", "_")
          .replaceAll("=", "");
        await env.DB.prepare(
          "insert into oauth_states(state,company_id,owner_id,expires) values (?,?,?,?)",
        )
          .bind(state, who.companyId, who.userId, Date.now() + 600000)
          .run();
        const oauth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        oauth.search = new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID,
          redirect_uri: `${url.origin}/callback`,
          response_type: "code",
          scope: "https://www.googleapis.com/auth/calendar.events.owned",
          access_type: "offline",
          prompt: "consent",
          state,
        }).toString();
        return json(
          { url: `${url.origin}/authorize?ticket=${state}` },
          200,
          app.origin,
        );
      }
      const lease = crypto.randomUUID(),
        started = Date.now();
      const lock = await env.DB.prepare(
        "insert into sync_locks(company_id,expires,lease) values (?,?,?) on conflict(company_id) do update set expires=excluded.expires,lease=excluded.lease where expires<? returning company_id",
      )
        .bind(who.companyId, started + 300000, lease, started)
        .first();
      if (!lock)
        return json(
          { error: "Már folyamatban van a naptár szinkronja." },
          409,
          app.origin,
        );
      try {
        const connection = await env.DB.prepare(
          "select token from connections where company_id=? and owner_id=?",
        )
          .bind(who.companyId, who.userId)
          .first<{ token: string }>();
        if (!connection)
          return json(
            { error: "Előbb kapcsold össze a Google-fiókot." },
            409,
            app.origin,
          );
        const refreshed = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            refresh_token: await unseal(connection.token, env.TOKEN_SEAL_KEY),
            grant_type: "refresh_token",
          }),
        });
        if (!refreshed.ok)
          return json(
            {
              error:
                "A Google-engedély lejárt vagy visszavonták. Kapcsold össze újra. Az E-RP-időpontok megmaradtak.",
            },
            409,
            app.origin,
          );
        const { access_token } = (await refreshed.json()) as {
          access_token: string;
        };
        let synced = 0;
        for (const entry of who.data.entries.filter(
          (e) => e.payload.type === "event" && e.payload.google_enabled,
        )) {
          if (Date.now() - started > 240000)
            return json(
              {
                synced,
                message:
                  "Részleges szinkron: az időkorlát miatt a többi esemény következő indításkor folytatható.",
              },
              200,
              app.origin,
            );
          const p = entry.payload,
            content = JSON.stringify(p),
            existing = await env.DB.prepare(
              "select google_id,content from event_links where company_id=? and entry_id=?",
            )
              .bind(who.companyId, entry.id)
              .first<{ google_id: string; content: string }>();
          if (existing?.content === content) continue;
          const id = existing?.google_id ?? googleId(entry.id),
            base =
              "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            endpoint = `${base}/${id}`;
          const check = await calendarFetch(env, endpoint, access_token);
          let current: any = null;
          if (check.ok) current = await check.json();
          else if (check.status !== 404 && check.status !== 410)
            throw new Error("GOOGLE");
          if (current && !ours(current, who.companyId, entry.id))
            throw new Error("FOREIGN");
          const body = {
            id,
            summary: p.title,
            description: p.notes,
            location: p.location,
            start: { dateTime: p.starts_at, timeZone: "Europe/Budapest" },
            end: { dateTime: p.ends_at, timeZone: "Europe/Budapest" },
            extendedProperties: {
              private: { erp_company: who.companyId, erp_entry: entry.id },
            },
            attendees: [],
          };
          if (p.cancelled) {
            if (current) {
              const removed = await calendarFetch(
                env,
                `${endpoint}?sendUpdates=none`,
                access_token,
                { method: "DELETE" },
              );
              if (
                !removed.ok &&
                removed.status !== 404 &&
                removed.status !== 410
              )
                throw new Error("GOOGLE");
            }
          } else {
            const response = await calendarFetch(
              env,
              `${current ? endpoint : base}?sendUpdates=none`,
              access_token,
              { method: current ? "PUT" : "POST", body: JSON.stringify(body) },
            );
            if (!response.ok) throw new Error("GOOGLE");
          }
          await env.DB.prepare(
            "insert into event_links(company_id,entry_id,google_id,content,last_sync) values (?,?,?,?,?) on conflict(company_id,entry_id) do update set google_id=excluded.google_id,content=excluded.content,last_sync=excluded.last_sync",
          )
            .bind(
              who.companyId,
              entry.id,
              id,
              content,
              new Date().toISOString(),
            )
            .run();
          synced++;
        }
        return json(
          {
            synced,
            message:
              "Csak az engedélyezett E-RP-események módosultak; meghívó nem ment ki.",
          },
          200,
          app.origin,
        );
      } finally {
        await env.DB.prepare(
          "delete from sync_locks where company_id=? and lease=?",
        )
          .bind(who.companyId, lease)
          .run();
      }
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      return json(
        {
          error:
            code === "AUTH"
              ? "Online tulajdonosi, kétlépcsős belépés szükséges."
              : code === "QUOTA"
                ? "Az alkalmazás napi 1000 naptárhívásos korlátja elérve. A helyi események megmaradtak."
                : "A naptárművelet nem fejeződött be. A már rögzített események megmaradtak; később újrapróbálható.",
        },
        code === "AUTH" ? 401 : code === "QUOTA" ? 429 : 502,
        app.origin,
      );
    }
  },
};
