import { useEffect, useState } from "react";
import { clientFromEnv } from "./cloud";
import { type Context, useAction, Text, Select, Form } from "./ui";
export function Account({ ctx }: { ctx: Context }) {
  const [client] = useState(() =>
      ctx.repo.mode === "cloud" ? clientFromEnv() : null,
    ),
    [factors, setFactors] = useState<{ id: string; label: string }[]>([]),
    [chosen, setChosen] = useState(""),
    [code, setCode] = useState(""),
    [newCode, setNewCode] = useState(""),
    [enrollment, setEnrollment] = useState<{
      id: string;
      qr: string;
      secret: string;
    } | null>(null);
  const action = useAction();
  async function refresh() {
    if (!client) return;
    const r = await client.auth.mfa.listFactors();
    if (r.error) throw r.error;
    const values = r.data.totp
      .filter((f) => f.status === "verified")
      .map((f) => ({ id: f.id, label: f.friendly_name ?? "Hitelesítő" }));
    setFactors(values);
    setChosen((v) => v || values[0]?.id || "");
  }
  useEffect(() => {
    void action.act(refresh);
    return () => {
      void client?.auth.stopAutoRefresh();
    };
  }, [client]);
  if (!client)
    return (
      <div className="notice">
        A tulajdonosi fiók és a tartalék hitelesítő kezelése a valódi
        Supabase-kapcsolat és kétlépcsős belépés után érhető el.
      </div>
    );
  return (
    <>
      {action.feedback}
      <h3>Tartalék hitelesítő</h3>
      <p>
        A második hitelesítőt külön eszközön vagy biztonságos helyen őrizd. Csak
        sikeres kódellenőrzés után kerül a működő hitelesítők közé.
      </p>
      <ul>
        {factors.map((f) => (
          <li key={f.id}>{f.label} · ellenőrzött</li>
        ))}
      </ul>
      {enrollment ? (
        <Form
          busy={action.busy}
          label="Tartalék hitelesítő ellenőrzése"
          onSave={() =>
            void action.act(async () => {
              const r = await client.auth.mfa.challengeAndVerify({
                factorId: enrollment.id,
                code: newCode,
              });
              if (r.error) throw r.error;
              setEnrollment(null);
              setNewCode("");
              await refresh();
              action.setMessage(
                "A tartalék TOTP kódellenőrzése sikeres. Őrizd az elsődleges telefontól elkülönítve.",
              );
            })
          }
        >
          <img
            width="190"
            height="190"
            alt="Tartalék hitelesítő QR-kódja"
            src={
              enrollment.qr.startsWith("data:")
                ? enrollment.qr
                : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(enrollment.qr)}`
            }
          />
          <details>
            <summary>Kézi beállítási kulcs</summary>
            <code>{enrollment.secret}</code>
          </details>
          <Text
            label="Új hitelesítő hatjegyű kódja"
            required
            value={newCode}
            onChange={(v) => setNewCode(v.replace(/\D/g, "").slice(0, 6))}
          />
        </Form>
      ) : (
        <Form
          busy={action.busy}
          label="Friss azonosítás és tartalék TOTP felvétele"
          onSave={() =>
            void action.act(async () => {
              const verified = await client.auth.mfa.challengeAndVerify({
                factorId: chosen,
                code,
              });
              if (verified.error) throw verified.error;
              const r = await client.auth.mfa.enroll({
                factorType: "totp",
                friendlyName: `Tartalék ${new Date().toISOString()} ${crypto.randomUUID().slice(0, 8)}`,
                issuer: "RP Elektro ERP",
              });
              if (r.error) throw r.error;
              setCode("");
              setEnrollment({
                id: r.data.id,
                qr: r.data.totp.qr_code,
                secret: r.data.totp.secret,
              });
            })
          }
        >
          <Select
            label="Működő hitelesítő"
            value={chosen}
            onChange={setChosen}
            options={factors.map((f) => [f.id, f.label])}
          />
          <Text
            label="Működő hitelesítő friss kódja"
            required
            value={code}
            onChange={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
          />
        </Form>
      )}
      <p className="small muted">
        Az összes hitelesítő elvesztésére külön üzemeltetési helyreállítási
        leírás van a csomagban. Az alkalmazás nem kapcsolja ki a kétlépcsős
        adatvédelmet.
      </p>
    </>
  );
}
