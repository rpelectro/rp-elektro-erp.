import { useState, useEffect } from "react";
import { type Repository, friendly } from "./domain";
export function SyncBar({ repo }: { repo: Repository }) {
  const [state, setState] = useState<{
      pending: number;
      conflicts: unknown[];
      lastSync: string;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (!repo.sync) return;
    let mounted = true,
      active = false;
    const refresh = async () => {
      if (!mounted) return null;
      try {
        const status = await repo.sync!.status();
        if (mounted) setState(status);
        return status;
      } catch (e) {
        if (mounted) setError(friendly(e));
        return null;
      }
    };
    const run = async () => {
      if (active || !mounted) return;
      active = true;
      try {
        await repo.sync!.run();
        if (mounted) setError("");
      } catch (e) {
        if (mounted) setError(friendly(e));
      } finally {
        active = false;
        await refresh();
      }
    };
    void refresh().then(() => {
      if (navigator.onLine) void run();
    });
    const changed = () => {
      void refresh();
      if (navigator.onLine) void run();
    };
    window.addEventListener("online", changed);
    window.addEventListener("erp-local-saved", changed);
    const timer = setInterval(() => {
      void refresh().then((s) => {
        if (s?.pending && !s.conflicts.length && navigator.onLine) void run();
      });
    }, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
      window.removeEventListener("online", changed);
      window.removeEventListener("erp-local-saved", changed);
    };
  }, [repo]);
  if (!repo.sync) return null;
  return (
    <div
      className={`sync-bar ${state?.pending || error ? "pending" : ""}`}
      role="status"
    >
      {state?.conflicts.length
        ? "Egyeztetés szükséges – Beállítások / Offline és kapcsolatok"
        : state?.pending
          ? `Helyben mentve · ${state.pending} művelet feltöltésre vár`
          : "Az adott eszköz minden művelete feltöltve"}
      {error && <small>{error}</small>}
      <span>
        Utolsó szinkron:{" "}
        {state?.lastSync
          ? new Date(state.lastSync).toLocaleString("hu-HU")
          : "még nincs"}
      </span>
    </div>
  );
}
