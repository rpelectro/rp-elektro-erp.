import { clientFromEnv } from "./cloud";
export async function calendarRequest(
  url: string,
  action: "status" | "connect" | "sync" | "disconnect",
): Promise<{
  connected?: boolean;
  url: string;
  synced?: number;
  message?: string;
}> {
  const target = new URL(url);
  if (target.protocol !== "https:")
    throw new Error("A naptárkapcsolat HTTPS-címet igényel.");
  const configured = import.meta.env.VITE_CALENDAR_WORKER_URL?.replace(
    /\/$/,
    "",
  );
  if (!configured || url.replace(/\/$/, "") !== configured)
    throw new Error(
      "Csak a telepítéskor megadott saját naptárszolgáltatás használható.",
    );
  const client = clientFromEnv();
  if (!client) throw new Error("A Supabase nincs bekötve.");
  const { data, error } = await client.auth.getSession();
  if (error || !data.session)
    throw new Error("Új online bejelentkezés szükséges.");
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/${action}`, {
      method: action === "status" ? "GET" : "POST",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error ?? "A naptárművelet nem sikerült.");
    return result;
  } finally {
    await client.auth.stopAutoRefresh();
  }
}
