import { useEffect, useState, type FormEvent } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  LockKeyhole,
  ArrowRight,
  ShieldCheck,
  HardDrive,
  Cloud,
} from "lucide-react";
import { cloudRepository } from "./cloud";
import { localExists, openLocal } from "./local";
import { friendly, type Repository } from "./domain";
import { wrapOffline } from "./offline";

export function Auth({
  client,
  configError,
  onReady,
}: {
  client: SupabaseClient | null;
  configError: string;
  onReady: (repo: Repository) => void;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [local, setLocal] = useState(
    localStorage
      .getItem("erp-active-vault")
      ?.startsWith("rp-elektro-offline-") ?? false,
  );
  const [vault, setVault] = useState(
    localStorage.getItem("erp-active-vault") ?? "rp-elektro-local-v1",
  );
  const [remember, setRemember] = useState(
    localStorage.getItem("erp-remember-session") === "true",
  );
  const [factors, setFactors] = useState<{ id: string; label: string }[]>([]);
  const [exists, setExists] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(configError);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [factor, setFactor] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    localExists()
      .then(setExists)
      .catch(() => setError("A böngésző helyi tárolója nem érhető el."));
  }, []);
  useEffect(() => {
    if (!client) return;
    client.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      setSession(data.session);
    });
    const { data } = client.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, [client]);
  useEffect(() => {
    if (!client || !session || local || recovery) return;
    let cancelled = false;
    setChecking(true);
    (async () => {
      const aal = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal.error) throw aal.error;
      if (cancelled) return;
      if (aal.data.currentLevel === "aal2") {
        const repo = await cloudRepository(client);
        if (!cancelled) onReady(repo);
        return;
      }
      const factors = await client.auth.mfa.listFactors();
      if (factors.error) throw factors.error;
      const verified = factors.data.totp.find((f) => f.status === "verified");
      setFactors(
        factors.data.totp
          .filter((f) => f.status === "verified")
          .map((f) => ({
            id: f.id,
            label: f.friendly_name ?? "Hitelesítő alkalmazás",
          })),
      );
      if (verified) {
        if (!cancelled) setFactor(verified.id);
        return;
      }
      // Remove abandoned, unverified enrollments before creating a fresh QR.
      for (const f of factors.data.all.filter(
        (f) => f.factor_type === "totp" && f.status === "unverified",
      )) {
        const removed = await client.auth.mfa.unenroll({ factorId: f.id });
        if (removed.error) throw removed.error;
      }
      if (cancelled) return;
      const enrolled = await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "E-RP hitelesítő",
        issuer: "RP Elektro ERP",
      });
      if (enrolled.error) throw enrolled.error;
      if (!cancelled) {
        setFactor(enrolled.data.id);
        setQr(enrolled.data.totp.qr_code);
        setSecret(enrolled.data.totp.secret);
      }
    })()
      .catch((e) => {
        if (!cancelled) setError(friendly(e));
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, session?.user.id, local, recovery]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (local) {
        if (!exists && password !== confirm)
          throw new Error("A két jelszó nem egyezik.");
        const repo = await openLocal(password, !exists);
        setPassword("");
        setConfirm("");
        onReady(
          repo.mode === "cloud"
            ? wrapOffline(repo, async () => {
                if (!client)
                  throw new Error("Az online kapcsolat nincs bekötve.");
                return cloudRepository(client);
              })
            : repo,
        );
      } else if (client && recovery) {
        if (password.length < 12)
          throw new Error("Legalább 12 karakteres új jelszót adj meg.");
        const result = await client.auth.updateUser({ password });
        if (result.error) throw result.error;
        setPassword("");
        setRecovery(false);
        setMessage("A jelszó megváltozott. Folytasd a kétlépcsős belépést.");
      } else if (client && session && factor) {
        const result = await client.auth.mfa.challengeAndVerify({
          factorId: factor,
          code,
        });
        if (result.error) throw result.error;
        setCode("");
        setQr("");
        setSecret("");
        onReady(await cloudRepository(client));
      } else if (client) {
        localStorage.setItem("erp-remember-session", String(remember));
        const result = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (result.error) throw result.error;
        setPassword("");
      }
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy(false);
    }
  }
  async function forgot() {
    if (!client || !email) {
      setError("Előbb add meg az e-mail-címedet.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname,
      });
      if (result.error) throw result.error;
      setMessage(
        "Ha a fiók létezik és az e-mail-küldés be van állítva, megérkezik a helyreállító levél.",
      );
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy(false);
    }
  }
  const demoAllowed = import.meta.env.VITE_ENABLE_LOCAL_DEMO !== "false";
  return (
    <main className="auth-shell">
      <section className="auth-intro">
        <div className="brand">
          <span className="brand-mark">E</span> E-RP <small>RP ELEKTRO</small>
        </div>
        <div>
          <span className="eyebrow">KEVESEBB ADMINISZTRÁCIÓ</span>
          <h1>
            A munka nálad.
            <br />A részletek
            <br />
            <em>egy helyen.</em>
          </h1>
          <p>
            A felméréstől az átadásig.
            <br />
            Ajánlatok, dokumentumok és pénzügyek.
          </p>
        </div>
        <span className="version">0.2.0 · MUNKATÉR</span>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="round-icon">
            <LockKeyhole size={24} />
          </div>
          <h2>
            {local
              ? exists
                ? "Helyi adattár megnyitása"
                : "Helyi próbamód"
              : recovery
                ? "Új jelszó"
                : session
                  ? "Kétlépcsős azonosítás"
                  : "Belépés a munkaterületre"}
          </h2>
          <p className="muted">
            {local
              ? "Titkosított tárolás ezen a böngészőn. Próbához, mintaadatokkal."
              : session
                ? "A felhőben tárolt adatokhoz hitelesítő alkalmazás szükséges."
                : "A saját vállalkozásod elkülönített munkaterülete."}
          </p>
          {error && (
            <div role="alert" className="notice error">
              {error}
            </div>
          )}
          {message && (
            <div role="status" className="notice">
              {message}
            </div>
          )}
          {!client && !local ? (
            <div className="setup-note">
              <Cloud size={22} />
              <strong>A felhő még nincs bekötve</strong>
              <p>
                A forráscsomag tartalmazza a Supabase-adatbázist és a bekötési
                útmutatót. Addig a helyi próbamódban kipróbálhatod az
                alapfunkciókat.
              </p>
            </div>
          ) : (
            <form onSubmit={submit}>
              {local && (
                <label>
                  Helyi adattár
                  <select
                    aria-label="Helyi adattár"
                    value={vault}
                    onChange={(e) => {
                      const v = e.target.value;
                      setVault(v);
                      localStorage.setItem("erp-active-vault", v);
                      setPassword("");
                      setConfirm("");
                      localExists().then(setExists);
                    }}
                  >
                    {[
                      "rp-elektro-local-v1",
                      ...(JSON.parse(
                        localStorage.getItem("erp-vaults") ?? "[]",
                      ) as string[]),
                    ].map((name, i) => (
                      <option key={name} value={name}>
                        {i === 0
                          ? "Alap helyi próba"
                          : `${name.startsWith("rp-elektro-offline") ? "Saját offline eszköz" : "Próbavisszaállítás"} ${i}`}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!local && !session && (
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Saját eszköz – munkamenet megőrzése
                </label>
              )}
              {!local && session && !recovery && factors.length > 1 && (
                <label>
                  Hitelesítő kiválasztása
                  <select
                    value={factor}
                    onChange={(e) => setFactor(e.target.value)}
                  >
                    {factors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!local && !session && (
                <label>
                  E-mail-cím
                  <input
                    autoComplete="username"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
              )}
              {(local || !session || recovery) && (
                <label>
                  {local ? "Helyi jelszó" : recovery ? "Új jelszó" : "Jelszó"}
                  <input
                    type="password"
                    autoComplete={
                      (local && !exists) || recovery
                        ? "new-password"
                        : "current-password"
                    }
                    minLength={(local && !exists) || recovery ? 12 : undefined}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              )}
              {local && !exists && (
                <>
                  <label>
                    Jelszó újra
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={12}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                  </label>
                  <p className="small muted">
                    Legalább 12 karakter. Ezt a jelszót nem lehet
                    visszaállítani. A böngésző adatainak törlése az adattárat is
                    törli; ez még nem az éles üzleti adattár.
                  </p>
                </>
              )}
              {!local && session && !recovery && (
                <>
                  {qr && (
                    <div className="totp">
                      <p>
                        Olvasd be a kódot a hitelesítő alkalmazásodba, majd írd
                        be a hatjegyű kódot.
                      </p>
                      <img
                        src={
                          qr.startsWith("data:")
                            ? qr
                            : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`
                        }
                        width="190"
                        height="190"
                        alt="Hitelesítő alkalmazás QR-kódja"
                      />
                      <details>
                        <summary>Kézi beállítási kulcs</summary>
                        <code>{secret}</code>
                      </details>
                    </div>
                  )}
                  <label>
                    Hatjegyű hitelesítő kód
                    <input
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </label>
                </>
              )}
              <button
                className="primary wide"
                disabled={busy || checking || (local && exists === null)}
              >
                {busy || checking
                  ? "Ellenőrzés…"
                  : local
                    ? exists
                      ? "Megnyitás"
                      : "Titkosított próba létrehozása"
                    : session
                      ? "Folytatás"
                      : "Belépés"}
                <ArrowRight size={17} />
              </button>
              {!local && !session && (
                <button
                  className="text-button"
                  type="button"
                  disabled={busy}
                  onClick={forgot}
                >
                  Elfelejtett jelszó
                </button>
              )}
            </form>
          )}
          {demoAllowed && (
            <button
              className="secondary wide mode-button"
              disabled={busy}
              onClick={() => {
                setLocal(!local);
                setPassword("");
                setConfirm("");
                setError(configError);
                setMessage("");
              }}
            >
              <HardDrive size={16} />
              {local
                ? "Vissza a felhős belépéshez"
                : "Helyi próbamód megnyitása"}
            </button>
          )}
          {!local && session && (
            <button
              className="text-button"
              onClick={() => client?.auth.signOut()}
            >
              Kijelentkezés
            </button>
          )}
          <p className="auth-foot">
            <ShieldCheck size={15} /> A helyi próba és a felhős adattár külön
            működik.
          </p>
        </div>
      </section>
    </main>
  );
}
