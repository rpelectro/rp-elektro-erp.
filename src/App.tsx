import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  Users,
  ReceiptText,
  Settings,
  Plus,
  Search,
  ArrowUpRight,
  X,
  Menu,
  LogOut,
  Archive,
  RotateCcw,
  Pencil,
  ChevronRight,
  Check,
  Cloud,
  HardDrive,
  Hammer,
  Building2,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import {
  ConflictError,
  friendly,
  formatMoney,
  moneyInput,
  parseMoney,
  statuses,
  type Company,
  type Kind,
  type Partner,
  type Project,
  type Repository,
  type Snapshot,
  type Status,
  type Tables,
  type Work,
} from "./domain";
import { ProjectModules } from "./Workflow";
import { Invoices, Finance } from "./Invoices";
import { Calendar } from "./Calendar";
import { WorkspaceSettings } from "./WorkspaceSettings";
import { SyncBar } from "./SyncBar";
import { Upcoming } from "./Upcoming";

type Page =
  "dashboard" | "projects" | "customers" | "settings" | "calendar" | "invoices";
type Editor = {
  kind: Exclude<Kind, "entries">;
  record?: Tables[Exclude<Kind, "entries">];
};
const nav = [
  { id: "dashboard", label: "Irányítópult", icon: LayoutDashboard },
  { id: "projects", label: "Projektek", icon: FolderKanban },
  { id: "calendar", label: "Naptár", icon: CalendarDays },
  { id: "customers", label: "Ügyfelek", icon: Users },
  { id: "invoices", label: "Számlák", icon: ReceiptText },
  { id: "settings", label: "Beállítások", icon: Settings },
];
const headings = {
  calendar: ["Naptár", "Felmérések, munkák és visszatérések."],
  invoices: ["Számlák", "Kézi nyilvántartás és befizetések."],
  dashboard: ["Irányítópult", "Minden munka egy helyen."],
  projects: ["Projektek", "A felméréstől az átadásig."],
  customers: ["Ügyfelek", "Kapcsolatok és számlázási adatok."],
  settings: ["Beállítások", "Vállalkozás és munkakatalógus."],
};
export function App({
  repo,
  onExit,
  onRestore,
}: {
  repo: Repository;
  onExit: () => Promise<void>;
  onRestore?: (repo: Repository) => void;
}) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [page, setPage] = useState<Page>("dashboard");
  const [settingsTab, setSettingsTab] = useState<
    "company" | "catalog" | "roadmap"
  >("catalog");
  const [search, setSearch] = useState("");
  const [archived, setArchived] = useState(false);
  const [status, setStatus] = useState("all");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [project, setProject] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  async function reload() {
    setLoading(true);
    try {
      setData(await repo.load());
      setError("");
    } catch (e) {
      setError(friendly(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void reload();
    const online = () => setOffline(!navigator.onLine);
    const synced = () => void reload();
    window.addEventListener("erp-sync-complete", synced);
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    return () => {
      window.removeEventListener("erp-sync-complete", synced);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
    };
  }, [repo]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  function navigate(next: Page) {
    setPage(next);
    setProject(null);
    setSearch("");
    setArchived(false);
    setStatus("all");
    setMenu(false);
  }
  const matches = (text: string) =>
    text.toLocaleLowerCase("hu").includes(search.toLocaleLowerCase("hu"));
  async function toggle<K extends "partners" | "projects" | "work_items">(
    kind: K,
    record: Tables[K],
  ) {
    setError("");
    try {
      await repo.save(
        kind,
        { ...record, archived: !record.archived },
        record.id,
        record.version,
      );
      setNotice(
        record.archived
          ? "Visszaállítva."
          : "Archiválva. A kapcsolódó adatok megmaradtak.",
      );
      await reload();
    } catch (e) {
      setError(friendly(e));
    }
  }
  const customerName = (id: string | null) =>
    data?.partners.find((p) => p.id === id)?.name ?? "Nincs ügyfél megadva";
  const activeProjects = data?.projects.filter((p) => !p.archived) ?? [];
  const activeCustomers = data?.partners.filter((p) => !p.archived) ?? [];
  const selectedProject = data?.projects.find((p) => p.id === project);
  const newButton = (kind: Exclude<Kind, "entries">, label: string) => (
    <button className="primary" onClick={() => setEditor({ kind })}>
      <Plus size={17} />
      {label}
    </button>
  );
  function projectRows(rows: Project[]) {
    return (
      <div className="project-grid">
        {rows.map((p) => (
          <button
            key={p.id}
            className="project-card"
            onClick={() => {
              setPage("projects");
              setProject(p.id);
            }}
          >
            <div className="row between">
              <span className={`badge ${p.status}`}>{statuses[p.status]}</span>
              <ArrowUpRight size={18} />
            </div>
            <h3>{p.title}</h3>
            <p>{customerName(p.customer_id)}</p>
            <div className="project-address">
              {p.site_address || "Munkavégzési cím nincs megadva"}
            </div>
            <div className="card-footer">
              <span>{new Date(p.updated_at).toLocaleDateString("hu-HU")}</span>
              <span>
                {p.archived ? "Archivált" : "Projekt megnyitása"}{" "}
                <ChevronRight size={14} />
              </span>
            </div>
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="app-shell">
      {menu && (
        <button
          className="sidebar-backdrop"
          aria-label="Menü bezárása"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">E</span>
          <div>
            E-RP<small>RP ELEKTRO</small>
          </div>
        </div>
        <div className="workspace-label">MUNKATERÜLET</div>
        <nav aria-label="Főmenü">
          {nav.map((n) => {
            const disabled = false;
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                disabled={disabled}
                className={page === n.id ? "active" : ""}
                onClick={() => navigate(n.id as Page)}
              >
                <Icon size={19} />
                <span>{n.label}</span>
                {disabled && <small>Később</small>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-avatar">RP</div>
          <div>
            <strong>{data?.company.name ?? "RP Elektro"}</strong>
            <small>Saját munkaterület</small>
          </div>
          <button
            title={repo.mode === "local" ? "Adattár zárolása" : "Kijelentkezés"}
            aria-label={
              repo.mode === "local" ? "Adattár zárolása" : "Kijelentkezés"
            }
            onClick={() => void onExit()}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="row">
            <button
              className="icon-button mobile-menu"
              aria-label="Menü megnyitása"
              onClick={() => setMenu(true)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb">
              Munkaterület <ChevronRight size={14} />{" "}
              <strong>{headings[page][0]}</strong>
            </span>
          </div>
          <span className={`storage-state ${offline ? "offline" : ""}`}>
            {repo.mode === "local" ? (
              <HardDrive size={15} />
            ) : (
              <Cloud size={15} />
            )}
            {repo.mode === "local"
              ? "Titkosított helyi próba"
              : offline
                ? "Nincs hálózat · a mentés nem elérhető"
                : "Supabase munkaterület"}
          </span>
        </header>
        <SyncBar repo={repo} />
        {repo.mode === "local" && (
          <div className="demo-banner">
            <strong>PRÓBAMÓD</strong> Az adatok ezen a böngészőn maradnak.
            Mintaadatokkal próbáld ki. A Beállításokban titkosított üzleti
            mentést is készíthetsz.
          </div>
        )}
        <main className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">RP ELEKTRO / E-RP</span>
              <h1>
                {selectedProject ? selectedProject.title : headings[page][0]}
              </h1>
              <p>
                {selectedProject
                  ? customerName(selectedProject.customer_id)
                  : headings[page][1]}
              </p>
            </div>
            <div className="row">
              {page === "projects" &&
                !project &&
                newButton("projects", "Új projekt")}
              {page === "customers" && newButton("partners", "Új ügyfél")}
              {page === "settings" &&
                settingsTab === "catalog" &&
                newButton("work_items", "Új munkatétel")}
              {page === "dashboard" && newButton("projects", "Új projekt")}
            </div>
          </div>
          {error && (
            <div role="alert" className="notice error">
              {error}
              <button className="text-button" onClick={() => void reload()}>
                Újratöltés
              </button>
            </div>
          )}
          {notice && (
            <div role="status" className="notice success">
              <Check size={16} />
              {notice}
            </div>
          )}
          {!data ? (
            <section className="panel">
              <p>
                {loading ? "Adatok betöltése…" : "Az adatok nem tölthetők be."}
              </p>
            </section>
          ) : (
            <>
              {page === "dashboard" && (
                <>
                  <div className="metrics">
                    <Metric
                      label="Aktív projektek"
                      value={
                        activeProjects.filter((p) => p.status !== "completed")
                          .length
                      }
                      icon={<FolderKanban />}
                    />
                    <Metric
                      label="Felmérésre vár"
                      value={
                        activeProjects.filter(
                          (p) =>
                            p.status === "inquiry" || p.status === "survey",
                        ).length
                      }
                      icon={<Clock3 />}
                    />
                    <Metric
                      label="Ügyfelek"
                      value={activeCustomers.length}
                      icon={<Users />}
                    />
                    <Metric
                      label="Munkatételek"
                      value={data.work_items.filter((w) => !w.archived).length}
                      icon={<Hammer />}
                    />
                  </div>
                  <Finance ctx={{ repo, data, reload }} />
                  <Upcoming ctx={{ repo, data, reload }} />
                  <div className="section-heading">
                    <h2>Legutóbbi projektek</h2>
                    <button
                      className="text-button"
                      onClick={() => navigate("projects")}
                    >
                      Összes projekt <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {activeProjects.length ? (
                    projectRows(
                      [...activeProjects]
                        .sort((a, b) =>
                          b.updated_at.localeCompare(a.updated_at),
                        )
                        .slice(0, 6),
                    )
                  ) : (
                    <Empty
                      title="Indulhat az első projekt"
                      text="Rögzítsd az ügyfelet, a munkavégzés helyét és a projekt állapotát."
                      action={newButton("projects", "Projekt létrehozása")}
                    />
                  )}
                  <div className="foundation">
                    <ShieldCheck size={24} />
                    <div>
                      <h3>A teljes munkafolyamat egy helyen</h3>
                      <p>
                        Felmérés, ajánlat, anyagigény, átadás és kézi
                        számlanyilvántartás. Az adatokat és a kapcsolatokat a
                        beállításokban ellenőrizheted.
                      </p>
                    </div>
                    <button
                      className="secondary"
                      onClick={() => {
                        navigate("settings");
                        setSettingsTab("roadmap");
                      }}
                    >
                      Állapot megnyitása
                    </button>
                  </div>
                </>
              )}
              {page === "projects" && !selectedProject && (
                <>
                  <Toolbar
                    search={search}
                    setSearch={setSearch}
                    archived={archived}
                    setArchived={setArchived}
                    placeholder="Projekt, ügyfél vagy cím keresése"
                  >
                    <select
                      aria-label="Projektállapot szűrése"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="all">Minden állapot</option>
                      {Object.entries(statuses).map(([k, v]) => (
                        <option value={k} key={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </Toolbar>
                  {(() => {
                    const rows = data.projects.filter(
                      (p) =>
                        p.archived === archived &&
                        (status === "all" || p.status === status) &&
                        matches(
                          `${p.title} ${customerName(p.customer_id)} ${p.site_address}`,
                        ),
                    );
                    return rows.length ? (
                      projectRows(
                        rows.sort((a, b) =>
                          b.updated_at.localeCompare(a.updated_at),
                        ),
                      )
                    ) : (
                      <Empty
                        title="Nincs megjeleníthető projekt"
                        text="Hozz létre egy projektet, vagy módosítsd a szűrőket."
                      />
                    );
                  })()}
                </>
              )}
              {selectedProject && (
                <>
                  <div className="row project-actions">
                    <button
                      className="text-button"
                      onClick={() => {
                        setProject(null);
                        if (page !== "projects") setPage("projects");
                      }}
                    >
                      ← Vissza a projektekhez
                    </button>
                    <button
                      className="secondary"
                      onClick={() =>
                        setEditor({ kind: "projects", record: selectedProject })
                      }
                    >
                      <Pencil size={15} /> Szerkesztés
                    </button>
                    <ArchiveButton
                      archived={selectedProject.archived}
                      onClick={() => void toggle("projects", selectedProject)}
                    />
                  </div>
                  <ProjectModules
                    key={selectedProject.id}
                    ctx={{ repo, data, reload, projectId: selectedProject.id }}
                    project={selectedProject}
                  >
                    <div className="detail-grid">
                      <section className="panel">
                        <h2>Projektadatok</h2>
                        <dl>
                          <dt>Állapot</dt>
                          <dd>
                            <span className={`badge ${selectedProject.status}`}>
                              {statuses[selectedProject.status]}
                            </span>
                            {selectedProject.archived && " · Archivált"}
                          </dd>
                          <dt>Ügyfél</dt>
                          <dd>{customerName(selectedProject.customer_id)}</dd>
                          <dt>Munkavégzés helye</dt>
                          <dd>
                            {selectedProject.site_address || "Nincs megadva"}
                          </dd>
                          <dt>Belső megjegyzés</dt>
                          <dd className="prewrap">
                            {selectedProject.notes || "Nincs megjegyzés"}
                          </dd>
                        </dl>
                      </section>
                      <section className="panel">
                        <h2>Projekt története</h2>
                        <dl>
                          <dt>Létrehozva</dt>
                          <dd>{date(selectedProject.created_at)}</dd>
                          <dt>Utolsó módosítás</dt>
                          <dd>{date(selectedProject.updated_at)}</dd>
                          <dt>Adatverzió</dt>
                          <dd>{selectedProject.version}</dd>
                        </dl>
                        <p className="small muted">
                          A dokumentumok külön pillanatfelvételekként
                          megmaradnak. A számlázás és fizetés nem módosítja
                          automatikusan a projekt állapotát.
                        </p>
                      </section>
                    </div>
                  </ProjectModules>
                </>
              )}
              {page === "calendar" && <Calendar ctx={{ repo, data, reload }} />}
              {page === "invoices" && <Invoices ctx={{ repo, data, reload }} />}
              {page === "customers" && !selectedProject && (
                <>
                  <Toolbar
                    search={search}
                    setSearch={setSearch}
                    archived={archived}
                    setArchived={setArchived}
                    placeholder="Név, e-mail vagy telefonszám"
                  />
                  <section className="panel table-panel">
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Ügyfél</th>
                            <th>Kapcsolat</th>
                            <th>Számlázási cím</th>
                            <th>Projektek</th>
                            <th>
                              <span className="sr-only">Műveletek</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.partners
                            .filter(
                              (p) =>
                                p.archived === archived &&
                                matches(
                                  `${p.name} ${p.email} ${p.phone} ${p.billing_address}`,
                                ),
                            )
                            .map((p) => (
                              <tr key={p.id}>
                                <td>
                                  <button
                                    className="name-button"
                                    onClick={() =>
                                      setEditor({ kind: "partners", record: p })
                                    }
                                  >
                                    {p.name}
                                  </button>
                                </td>
                                <td>
                                  {p.email || "—"}
                                  <small>{p.phone}</small>
                                </td>
                                <td>{p.billing_address || "—"}</td>
                                <td>
                                  {
                                    data.projects.filter(
                                      (pr) => pr.customer_id === p.id,
                                    ).length
                                  }
                                </td>
                                <td>
                                  <div className="row">
                                    <button
                                      className="icon-button"
                                      aria-label={`${p.name} szerkesztése`}
                                      onClick={() =>
                                        setEditor({
                                          kind: "partners",
                                          record: p,
                                        })
                                      }
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <ArchiveButton
                                      archived={p.archived}
                                      onClick={() => void toggle("partners", p)}
                                      compact
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {!data.partners.some(
                      (p) =>
                        p.archived === archived &&
                        matches(
                          `${p.name} ${p.email} ${p.phone} ${p.billing_address}`,
                        ),
                    ) && (
                      <Empty
                        title="Még nincs itt ügyfél"
                        text="A rögzített ügyfeleket a projektekhez is hozzá tudod rendelni."
                      />
                    )}
                  </section>
                </>
              )}
              {page === "settings" && !selectedProject && (
                <>
                  <WorkspaceSettings
                    ctx={{ repo, data, reload, switchRepo: onRestore }}
                    onRestore={onRestore}
                  />
                  <div className="tabs">
                    <button
                      className={settingsTab === "catalog" ? "active" : ""}
                      onClick={() => setSettingsTab("catalog")}
                    >
                      Munkakatalógus
                    </button>
                    <button
                      className={settingsTab === "company" ? "active" : ""}
                      onClick={() => setSettingsTab("company")}
                    >
                      Vállalkozás
                    </button>
                    <button
                      className={settingsTab === "roadmap" ? "active" : ""}
                      onClick={() => setSettingsTab("roadmap")}
                    >
                      Fejlesztési állapot
                    </button>
                  </div>
                  {settingsTab === "catalog" && (
                    <>
                      <Toolbar
                        search={search}
                        setSearch={setSearch}
                        archived={archived}
                        setArchived={setArchived}
                        placeholder="Munkatétel vagy kategória"
                      />
                      <section className="panel table-panel">
                        <div className="table-scroll">
                          <table>
                            <thead>
                              <tr>
                                <th>Munkatétel</th>
                                <th>Kategória</th>
                                <th>Egység</th>
                                <th>Munkadíj / egység</th>
                                <th>
                                  <span className="sr-only">Műveletek</span>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.work_items
                                .filter(
                                  (w) =>
                                    w.archived === archived &&
                                    matches(`${w.name} ${w.category}`),
                                )
                                .map((w) => (
                                  <tr key={w.id}>
                                    <td>
                                      <button
                                        className="name-button"
                                        onClick={() =>
                                          setEditor({
                                            kind: "work_items",
                                            record: w,
                                          })
                                        }
                                      >
                                        {w.name}
                                      </button>
                                      <small>{w.description}</small>
                                    </td>
                                    <td>{w.category || "—"}</td>
                                    <td>{w.unit}</td>
                                    <td className="money">
                                      {formatMoney(w.price_minor)}
                                    </td>
                                    <td>
                                      <div className="row">
                                        <button
                                          className="icon-button"
                                          aria-label={`${w.name} szerkesztése`}
                                          onClick={() =>
                                            setEditor({
                                              kind: "work_items",
                                              record: w,
                                            })
                                          }
                                        >
                                          <Pencil size={16} />
                                        </button>
                                        <ArchiveButton
                                          archived={w.archived}
                                          onClick={() =>
                                            void toggle("work_items", w)
                                          }
                                          compact
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                        {!data.work_items.some(
                          (w) =>
                            w.archived === archived &&
                            matches(`${w.name} ${w.category}`),
                        ) && (
                          <Empty
                            title="Építsd fel a munkakatalógust"
                            text="A saját munkatételeidet a felmérésekben és ajánlatokban is használhatod."
                          />
                        )}
                      </section>
                      <p className="small muted">
                        A rögzített ár munkadíj, nem anyagár. Az adózási módot a
                        vállalkozási adatoknál kell megadni; a rendszer nem
                        feltételez automatikus áfát.
                      </p>
                    </>
                  )}
                  {settingsTab === "company" && (
                    <section className="panel company-panel">
                      <div className="row between">
                        <h2>
                          <Building2 size={20} /> Vállalkozás adatai
                        </h2>
                        <button
                          className="secondary"
                          onClick={() =>
                            setEditor({
                              kind: "companies",
                              record: data.company,
                            })
                          }
                        >
                          <Pencil size={15} /> Szerkesztés
                        </button>
                      </div>
                      <dl>
                        <dt>Név</dt>
                        <dd>{data.company.name}</dd>
                        <dt>E-mail</dt>
                        <dd>{data.company.email || "Nincs megadva"}</dd>
                        <dt>Telefon</dt>
                        <dd>{data.company.phone || "Nincs megadva"}</dd>
                        <dt>Cím</dt>
                        <dd>{data.company.address || "Nincs megadva"}</dd>
                        <dt>Adószám</dt>
                        <dd>{data.company.tax_number || "Nincs megadva"}</dd>
                        <dt>Adózási mód</dt>
                        <dd>
                          {
                            {
                              unknown: "Még nincs megadva",
                              aam: "Alanyi adómentes",
                              vat: "Áfás",
                            }[data.company.tax_mode]
                          }
                        </dd>
                        <dt>Számlázás</dt>
                        <dd>Kézi kiállítás a Számlázz.hu felületén</dd>
                      </dl>
                      <div className="notice">
                        Ez a kiadás nem állít ki számlát és nem hívja a Számla
                        Agent API-t.
                      </div>
                    </section>
                  )}
                  {settingsTab === "roadmap" && (
                    <section className="panel roadmap">
                      <h2>Mi használható most?</h2>
                      <p>
                        A munkafolyamat helyi próbamódban végig használható. Az
                        éles fiókok bekötése és elfogadási próbája külön lépés.
                      </p>
                      {[
                        [
                          "Ügyfelek, projektek, munkakatalógus",
                          "Elkészült",
                          "Létrehozás, szerkesztés, keresés, archiválás és visszaállítás.",
                        ],
                        [
                          "Supabase adatbázis és belépés",
                          repo.mode === "cloud"
                            ? "Bekötve"
                            : "Bekötésre előkészítve",
                          "SQL-séma, tulajdonosi jogosultságok, TOTP kétlépcsős azonosítás. Éles fiókkal külön ellenőrzést igényel.",
                        ],
                        [
                          "Felmérés és verziózott árajánlat",
                          "Használható",
                          "Helyiségek, munkatételek, fotók és magyar PDF.",
                        ],
                        [
                          "Anyagigény és átadási jegyzőkönyv",
                          "Használható",
                          "Mennyiségek beszerzés nélkül; ellenőrzőlista és aláírás.",
                        ],
                        [
                          "Kézi számlanyilvántartás és befizetések",
                          "Használható",
                          "Számlaszám, PDF és részfizetések. Számla Agent és bejövő számlák később.",
                        ],
                        [
                          "Naptár, offline projektcsomag, biztonsági mentés",
                          "Használható",
                          "Titkosított műveletsor, ellenőrzött üzleti mentés, elkülönített próbavisszaállítás. A saját fiókok bekötése külön beüzemelés.",
                        ],
                        [
                          "Google Naptár és régi adatok",
                          "Külön beüzemelés szükséges",
                          "A Google-kapcsolat szerverkódja elkészült, éles bekötése hátravan. A régi export formátumához importadapter szükséges; jelenleg csak írás nélküli előnézet van.",
                        ],
                      ].map(([title, state, description]) => (
                        <div className="roadmap-row" key={title}>
                          <div>
                            <h3>{title}</h3>
                            <p>{description}</p>
                          </div>
                          <span className="badge">{state}</span>
                        </div>
                      ))}
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </main>
        <footer className="app-footer">
          E-RP <span>0.2.0 · RP Elektro</span>
          <button
            className="text-button"
            disabled={loading}
            onClick={() => void reload()}
          >
            <RotateCcw size={13} />
            Adatok frissítése
          </button>
        </footer>
      </div>
      {editor && data && (
        <EditorDialog
          key={`${editor.kind}/${editor.record?.id ?? "new"}`}
          editor={editor}
          data={data}
          repo={repo}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            setEditor(null);
            setNotice(
              repo.mode === "local"
                ? "Elmentve a titkosított helyi adattárba."
                : repo.sync
                  ? "Helyben mentve. A feltöltés állapota felül követhető."
                  : "A szerver visszaigazolta a mentést.",
            );
            await reload();
          }}
        />
      )}
    </div>
  );
}
function date(value: string) {
  return new Date(value).toLocaleString("hu-HU");
}
function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <section className="metric">
      <div className="row between">
        <span>{label}</span>
        <div className="metric-icon">{icon}</div>
      </div>
      <strong>{value}</strong>
      <span className="metric-note">A rögzített adatok alapján</span>
    </section>
  );
}
function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <FolderKanban size={28} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function ArchiveButton({
  archived,
  onClick,
  compact,
}: {
  archived: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      className={compact ? "icon-button" : "secondary"}
      title={archived ? "Visszaállítás" : "Archiválás"}
      aria-label={archived ? "Visszaállítás" : "Archiválás"}
      onClick={onClick}
    >
      {archived ? <RotateCcw size={16} /> : <Archive size={16} />}
      {!compact && (archived ? "Visszaállítás" : "Archiválás")}
    </button>
  );
}
function Toolbar({
  search,
  setSearch,
  archived,
  setArchived,
  placeholder,
  children,
}: {
  search: string;
  setSearch: (s: string) => void;
  archived: boolean;
  setArchived: (a: boolean) => void;
  placeholder: string;
  children?: ReactNode;
}) {
  return (
    <div className="toolbar">
      <div className="search-box">
        <Search size={17} />
        <input
          aria-label={placeholder}
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="row filters">
        {children}
        <label className="checkbox">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
          />
          Archiváltak
        </label>
      </div>
    </div>
  );
}

function EditorDialog({
  editor,
  data,
  repo,
  onClose,
  onSaved,
}: {
  editor: Editor;
  data: Snapshot;
  repo: Repository;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [record, setRecord] = useState(editor.record);
  const [formVersion, setFormVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const { kind } = editor;
  const names = {
    partners: "ügyfél",
    projects: "projekt",
    work_items: "munkatétel",
    companies: "vállalkozás",
  };
  useEffect(() => {
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
    };
  }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function close() {
    if (busy) return;
    if (dirty) setConfirmClose(true);
    else onClose();
  }
  async function refreshRecord() {
    setBusy(true);
    try {
      const latest = await repo.load();
      const next =
        kind === "companies"
          ? latest.company
          : latest[kind].find((r) => r.id === record?.id);
      if (!next) throw new Error("A rekord nem található.");
      setRecord(next);
      setFormVersion((v) => v + 1);
      setConflict(false);
      setError("");
      setDirty(false);
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    const s = (key: string) => String(f.get(key) ?? "");
    try {
      const shared = {
        archived: record && "archived" in record ? record.archived : false,
      };
      if (kind === "partners")
        await repo.save(
          kind,
          {
            ...shared,
            name: s("name"),
            email: s("email"),
            phone: s("phone"),
            billing_address: s("billing_address"),
            notes: s("notes"),
          },
          record?.id,
          record?.version,
        );
      if (kind === "projects")
        await repo.save(
          kind,
          {
            ...shared,
            title: s("title"),
            customer_id: s("customer_id") || null,
            site_address: s("site_address"),
            status: s("status") as Status,
            notes: s("notes"),
          },
          record?.id,
          record?.version,
        );
      if (kind === "work_items")
        await repo.save(
          kind,
          {
            ...shared,
            name: s("name"),
            category: s("category"),
            unit: s("unit"),
            price_minor: parseMoney(s("price")),
            description: s("description"),
          },
          record?.id,
          record?.version,
        );
      if (kind === "companies")
        await repo.save(
          kind,
          {
            name: s("name"),
            email: s("email"),
            phone: s("phone"),
            address: s("address"),
            tax_number: s("tax_number"),
            tax_mode: s("tax_mode") as Company["tax_mode"],
            billing_mode: "manual",
          },
          record?.id,
          record?.version,
        );
      setDirty(false);
      await onSaved();
    } catch (e) {
      setError(friendly(e));
      if (e instanceof ConflictError) setConflict(true);
    } finally {
      setBusy(false);
    }
  }
  const p = record as Partner | undefined,
    pr = record as Project | undefined,
    w = record as Work | undefined,
    c = record as Company | undefined;
  return (
    <dialog
      ref={dialog}
      className="editor-dialog"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      aria-labelledby="editor-title"
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">
            {record ? "ADATOK MÓDOSÍTÁSA" : "ÚJ REKORD"}
          </span>
          <h2 id="editor-title">
            {record ? "Szerkesztés" : "Új"} · {names[kind]}
          </h2>
        </div>
        <button
          className="icon-button"
          aria-label="Bezárás"
          disabled={busy}
          onClick={close}
        >
          <X size={21} />
        </button>
      </div>
      <form
        ref={form}
        key={formVersion}
        onSubmit={submit}
        onChange={() => setDirty(true)}
      >
        <div className="dialog-body">
          {error && (
            <div role="alert" className="notice error">
              {error}
              {conflict && (
                <>
                  <p>
                    A beírt értékek megmaradtak. Másold ki, amit meg szeretnél
                    tartani. Az alábbi gomb az űrlapot a legfrissebb adatokra
                    cseréli.
                  </p>
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={() => void refreshRecord()}
                  >
                    Friss változat betöltése
                  </button>
                </>
              )}
            </div>
          )}
          {confirmClose && (
            <div className="notice error">
              A nem mentett változtatások elvesznek.
              <div className="row">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setConfirmClose(false)}
                >
                  Szerkesztés folytatása
                </button>
                <button type="button" className="secondary" onClick={onClose}>
                  Elvetés és bezárás
                </button>
              </div>
            </div>
          )}
          {(kind === "partners" || kind === "companies") && (
            <>
              <Field
                label={
                  kind === "companies" ? "Vállalkozás neve *" : "Ügyfél neve *"
                }
                name="name"
                required
                maxLength={200}
                value={p?.name}
              />
              <div className="form-grid">
                <Field
                  label="E-mail-cím"
                  name="email"
                  type="email"
                  value={p?.email}
                />
                <Field
                  label="Telefonszám"
                  name="phone"
                  type="tel"
                  maxLength={80}
                  value={p?.phone}
                />
              </div>
              {kind === "partners" ? (
                <>
                  <Field
                    label="Számlázási cím"
                    name="billing_address"
                    value={p?.billing_address}
                    maxLength={1000}
                  />
                  <Area
                    label="Belső megjegyzés"
                    name="notes"
                    value={p?.notes}
                  />
                </>
              ) : (
                <>
                  <Field
                    label="Vállalkozás címe"
                    name="address"
                    value={c?.address}
                    maxLength={1000}
                  />
                  <div className="form-grid">
                    <Field
                      label="Adószám"
                      name="tax_number"
                      value={c?.tax_number}
                      maxLength={40}
                    />
                    <label>
                      Adózási mód
                      <select
                        name="tax_mode"
                        defaultValue={c?.tax_mode ?? "unknown"}
                      >
                        <option value="unknown">Még nincs megadva</option>
                        <option value="aam">Alanyi adómentes</option>
                        <option value="vat">Áfás</option>
                      </select>
                    </label>
                  </div>
                </>
              )}
            </>
          )}
          {kind === "projects" && (
            <>
              <Field
                label="Projekt neve *"
                name="title"
                value={pr?.title}
                required
                maxLength={200}
              />
              <label>
                Ügyfél
                <select name="customer_id" defaultValue={pr?.customer_id ?? ""}>
                  <option value="">Később adom meg</option>
                  {data.partners
                    .filter((p) => !p.archived || p.id === pr?.customer_id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.archived ? " (archivált)" : ""}
                      </option>
                    ))}
                </select>
              </label>
              <Field
                label="Munkavégzés helye"
                name="site_address"
                value={pr?.site_address}
                maxLength={1000}
              />
              <label>
                Állapot
                <select name="status" defaultValue={pr?.status ?? "inquiry"}>
                  {Object.entries(statuses).map(([k, v]) => (
                    <option value={k} key={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <Area label="Belső megjegyzés" name="notes" value={pr?.notes} />
              <p className="small muted">
                A munkavégzés helye külön adat az ügyfél számlázási címétől.
              </p>
            </>
          )}
          {kind === "work_items" && (
            <>
              <Field
                label="Munkatétel neve *"
                name="name"
                required
                value={w?.name}
                maxLength={200}
              />
              <Field
                label="Kategória"
                name="category"
                value={w?.category}
                maxLength={100}
              />
              <div className="form-grid">
                <Field
                  label="Mértékegység *"
                  name="unit"
                  required
                  value={w?.unit ?? "db"}
                  maxLength={30}
                />
                <Field
                  label="Munkadíj / egység (Ft) *"
                  name="price"
                  required
                  inputMode="decimal"
                  value={w ? moneyInput(w.price_minor) : "0"}
                />
              </div>
              <Area label="Leírás" name="description" value={w?.description} />
              <p className="small muted">
                Az árat két tizedes pontossággal tároljuk. Anyagárat itt nem
                rögzítünk.
              </p>
            </>
          )}
        </div>
        <div className="dialog-footer">
          <span className="small muted">
            {dirty ? "Nem mentett változtatások" : "* Kötelező mező"}
          </span>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={close}
          >
            Mégse
          </button>
          <button className="primary" disabled={busy || conflict}>
            {busy ? "Mentés…" : "Mentés"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
function Field({
  label,
  name,
  value,
  ...props
}: {
  label: string;
  name: string;
  value?: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
  inputMode?: "decimal";
}) {
  return (
    <label>
      {label}
      <input name={name} defaultValue={value ?? ""} {...props} />
    </label>
  );
}
function Area({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value?: string;
}) {
  return (
    <label>
      {label}
      <textarea
        name={name}
        rows={4}
        maxLength={5000}
        defaultValue={value ?? ""}
      />
    </label>
  );
}
