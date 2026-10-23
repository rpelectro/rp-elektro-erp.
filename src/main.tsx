import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Auth } from "./Auth";
import { clientFromEnv } from "./cloud";
import type { Repository } from "./domain";
import "./style.css";
import "./modules.css";
import { registerSW } from "virtual:pwa-register";
const updateApp = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new Event("erp-update-ready"));
  },
});
const App = lazy(() =>
  import("./App").then((module) => ({ default: module.App })),
);

let configError = "";
let client: ReturnType<typeof clientFromEnv> = null;
try {
  client = clientFromEnv();
} catch (error) {
  configError =
    error instanceof Error ? error.message : "Hibás Supabase-beállítás.";
}
function Root() {
  const [update, setUpdate] = useState(false);
  useEffect(() => {
    const handler = () => setUpdate(true);
    window.addEventListener("erp-update-ready", handler);
    return () => window.removeEventListener("erp-update-ready", handler);
  }, []);
  const [repo, setRepo] = useState<Repository | null>(null);
  const ready = useCallback((next: Repository) => setRepo(next), []);
  useEffect(() => {
    const listener = client?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT")
        setRepo((current) => {
          current?.close();
          return null;
        });
    });
    return () => listener?.data.subscription.unsubscribe();
  }, []);
  async function exit() {
    if (repo?.sync) {
      const status = await repo.sync.status();
      if (
        status.pending &&
        !window.confirm(
          `${status.pending} művelet még nincs feltöltve. A titkosított helyi munka megmarad. Bezárod a munkaterületet?`,
        )
      )
        return;
    }
    repo?.close();
    setRepo(null);
    if (client && repo?.mode === "cloud")
      await client.auth.signOut({ scope: "local" });
  }
  return (
    <>
      {update && (
        <div className="update-banner">
          Új alkalmazásverzió érhető el. A tartósan mentett függő munka
          megmarad.
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Mentsd el a nyitott űrlapokat. Frissíted most az alkalmazást?",
                )
              )
                void updateApp(true);
            }}
          >
            Mentés után frissítés
          </button>
        </div>
      )}
      {repo ? (
        <Suspense
          fallback={<main className="content">Munkaterület betöltése…</main>}
        >
          <App repo={repo} onExit={exit} onRestore={ready} />
        </Suspense>
      ) : (
        <Auth client={client} configError={configError} onReady={ready} />
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Root />);
