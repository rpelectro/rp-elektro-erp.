import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  payloadSchema,
  today,
  type Entry,
  type PayloadOf,
  type WorkLine,
} from "./business";
import { type Context, Text, Select, useAction, saveEntry } from "./ui";
import { SurveyTextEditor } from "./SurveyTextEditor";
import { RoomPhotos } from "./RoomPhotos";
import { ReportButton } from "./ReportButton";
import { Upload, Check } from "./ui";

const roomNames = [
  "Nappali",
  "Konyha",
  "Étkező",
  "Hálószoba",
  "Gyerekszoba",
  "Fürdőszoba",
  "WC",
  "Előszoba",
  "Folyosó",
  "Dolgozószoba",
  "Kamra",
  "Háztartási helyiség",
  "Garázs",
  "Pince",
  "Padlás",
  "Terasz",
  "Kert",
];
const descriptions = [
  { key: "existing", tab: "Meglévő állapot", label: "Meglévő állapot" },
  { key: "planned", tab: "Tervezett munka", label: "Tervezett munka" },
  {
    key: "unknown",
    tab: "Ismeretlen adatok",
    label: "Ismeretlen / nem vizsgált adatok",
  },
  {
    key: "internal_notes",
    tab: "Belső megjegyzés",
    label: "Belső megjegyzés – nem kerül az ügyfél PDF-jére",
  },
] as const;
type Survey = PayloadOf<"survey">;

export function SurveyWorkspace({
  ctx,
  entry,
  onClose,
  renderLines,
}: {
  ctx: Context;
  entry?: Entry;
  onClose: () => void;
  renderLines: (
    value: WorkLine[],
    onChange: (value: WorkLine[]) => void,
  ) => ReactNode;
}) {
  const [p, set] = useState<Survey>(
    (entry?.payload as Survey) ?? {
      type: "survey",
      name: "",
      surveyed_on: today(),
      existing: "",
      planned: "",
      unknown: "",
      internal_notes: "",
      rooms: [],
      whole_property: [],
      photo_ids: [],
    },
  );
  const [record, setRecord] = useState(entry);
  const [dirty, mark] = useState(false);
  const [section, setSection] = useState(entry ? "descriptions" : "basic");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [roomPreset, setRoomPreset] = useState("Nappali");
  const action = useAction();
  const form = useRef<HTMLFormElement>(null);
  const workspace = useRef<HTMLElement>(null);
  const busy = uploadBusy || action.busy;
  const patch = (value: Partial<Survey>) => {
    action.setMessage("");
    mark(true);
    set((previous) => ({ ...previous, ...value }));
  };
  useEffect(() => {
    workspace.current?.scrollIntoView({ block: "start" });
  }, [section]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty || busy) event.preventDefault();
    };
    const navigate = (event: MouseEvent) => {
      const target = event.target;
      if (
        !(target instanceof Element) ||
        !target.closest(".sidebar button, .sidebar a")
      )
        return;
      if (
        busy ||
        (dirty &&
          !window.confirm(
            "A felmérés módosításai nincsenek elmentve. Elhagyod mentés nélkül?",
          ))
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty, busy]);
  function leave() {
    if (
      !busy &&
      (!dirty ||
        window.confirm(
          "A felmérés módosításai nincsenek elmentve. Visszalépsz mentés nélkül?",
        ))
    )
      onClose();
  }
  function addRoom(name: string) {
    const id = crypto.randomUUID();
    let unique = name,
      number = 2;
    while (name && p.rooms.some((r) => r.name === unique))
      unique = `${name} ${number++}`;
    patch({
      rooms: [
        ...p.rooms,
        {
          id,
          name: unique,
          existing: "",
          planned: "",
          lines: [],
          photo_ids: [],
        },
      ],
    });
    setSection(id);
  }
  function updateRoom(id: string, value: Partial<Survey["rooms"][number]>) {
    patch({
      rooms: p.rooms.map((room) =>
        room.id === id ? { ...room, ...value } : room,
      ),
    });
  }
  async function save() {
    if (busy) return;
    await action.act(async () => {
      const invalid = form.current?.querySelector<HTMLInputElement>(
        "input:invalid, textarea:invalid, select:invalid",
      );
      if (invalid) {
        const target = invalid.closest<HTMLElement>("[data-survey-section]")
          ?.dataset.surveySection;
        if (target) setSection(target);
        requestAnimationFrame(() => {
          invalid.focus();
          invalid.reportValidity();
        });
        throw new Error(
          "Ellenőrizd a kijelölt mezőt. A felmérés még nincs elmentve.",
        );
      }
      const validated = payloadSchema.safeParse(p);
      if (!validated.success) {
        const issue = validated.error.issues[0],
          path = issue.path;
        setSection(
          path[0] === "rooms"
            ? (p.rooms[Number(path[1])]?.id ?? "rooms")
            : path[0] === "whole_property"
              ? "property"
              : ["name", "surveyed_on"].includes(String(path[0]))
                ? "basic"
                : "descriptions",
        );
        throw new Error(issue.message);
      }
      const saved = await saveEntry(ctx, p, record);
      setRecord(saved);
      mark(false);
      await ctx.reload();
      action.setMessage("Felmérés elmentve.");
    });
  }
  const navigation = [
    { id: "basic", label: "Alapadatok" },
    { id: "descriptions", label: "Leírások" },
    { id: "property", label: "Teljes ingatlan munkái" },
    { id: "photos", label: "Általános fényképek" },
    { id: "rooms", label: "+ Helyiség hozzáadása" },
    ...p.rooms.map((room) => ({
      id: room.id,
      label: room.name || "Új helyiség",
      detail: `${room.lines.length} munkatétel · ${room.photo_ids?.length ?? 0} kép`,
    })),
  ];
  const project = ctx.data.projects.find(
    (project) => project.id === ctx.projectId,
  );
  return (
    <section
      ref={workspace}
      className="survey-workspace"
      aria-label="Felmérés szerkesztése"
    >
      <header className="survey-workspace-header">
        <div>
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={leave}
          >
            ← Vissza a projekthez
          </button>
          <h1>{project?.title ?? "Projekt"} – Felmérés</h1>
        </div>
        <div className="row">
          <span className={dirty ? "survey-unsaved" : "muted"}>
            {busy
              ? "Művelet folyamatban…"
              : dirty
                ? "Nem mentett módosítások"
                : record
                  ? "Minden módosítás mentve"
                  : "Új felmérés"}
          </span>
          <ReportButton ctx={ctx} tab={1} survey={p} disabled={busy} />
          <button
            type="button"
            className="primary"
            disabled={busy}
            onClick={() => void save()}
          >
            Mentés
          </button>
        </div>
      </header>
      {action.feedback}
      <div className="survey-mobile-nav">
        <fieldset disabled={busy} className="survey-workspace-fields">
          <Select
            label="Felmérés részei"
            value={section}
            onChange={setSection}
            options={navigation.map((item) => [item.id, item.label])}
          />
        </fieldset>
      </div>
      <div className="survey-workspace-grid">
        <nav className="survey-section-nav" aria-label="Felmérés részei">
          <strong>Felmérés részei</strong>
          {navigation.map((item, index) => (
            <div key={item.id}>
              {index === 5 && (
                <strong className="survey-nav-rooms">Helyiségek</strong>
              )}
              <button
                type="button"
                className={section === item.id ? "active" : ""}
                aria-current={section === item.id ? "page" : undefined}
                disabled={busy}
                onClick={() => setSection(item.id)}
              >
                {item.label}
                {"detail" in item && <small>{item.detail}</small>}
              </button>
            </div>
          ))}
        </nav>
        <form
          ref={form}
          className="survey-workspace-main"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <fieldset disabled={busy} className="survey-workspace-fields">
            <section data-survey-section="basic" hidden={section !== "basic"}>
              <h2>Alapadatok</h2>
              <Text
                label="Felmérés neve"
                required
                value={p.name}
                onChange={(name) => patch({ name })}
              />
              <Text
                label="Felmérés dátuma"
                type="date"
                required
                value={p.surveyed_on}
                onChange={(surveyed_on) => patch({ surveyed_on })}
              />
              <button
                type="button"
                className="secondary"
                onClick={() => setSection("descriptions")}
              >
                Tovább a leírásokhoz
              </button>
            </section>
            <section
              data-survey-section="descriptions"
              hidden={section !== "descriptions"}
            >
              <h2>Leírások</h2>
              <SurveyTextEditor
                fields={descriptions.map((field) => ({
                  ...field,
                  value: p[field.key],
                }))}
                onChange={(key, value) => patch({ [key]: value })}
              />
            </section>
            <section
              data-survey-section="property"
              hidden={section !== "property"}
            >
              <h2>Teljes ingatlanra vonatkozó munkák</h2>
              {renderLines(p.whole_property, (whole_property) =>
                patch({ whole_property }),
              )}
            </section>
            <section data-survey-section="rooms" hidden={section !== "rooms"}>
              <h2>Helyiség hozzáadása</h2>
              <Select
                label="Választható helyiség"
                value={roomPreset}
                onChange={setRoomPreset}
                options={roomNames.map((name) => [name, name])}
              />
              <div className="row">
                <button
                  type="button"
                  className="primary"
                  onClick={() => addRoom(roomPreset)}
                >
                  Kiválasztott helyiség hozzáadása
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => addRoom("")}
                >
                  Egyedi helyiség hozzáadása
                </button>
              </div>
            </section>
            {p.rooms.map((room) => (
              <section
                data-survey-section={room.id}
                key={room.id}
                hidden={section !== room.id}
                aria-label={`Helyiség: ${room.name || "Névtelen"}`}
              >
                <h2>{room.name || "Új helyiség"}</h2>
                <Text
                  label="Helyiség neve"
                  required
                  value={room.name}
                  onChange={(name) => updateRoom(room.id, { name })}
                />
                <SurveyTextEditor
                  fields={[
                    {
                      key: "existing",
                      tab: "Meglévő állapot",
                      label: "Helyiség meglévő állapota",
                      value: room.existing,
                    },
                    {
                      key: "planned",
                      tab: "Tervezett munka",
                      label: "Helyiség tervezett munkája",
                      value: room.planned,
                    },
                  ]}
                  onChange={(key, value) =>
                    updateRoom(room.id, { [key]: value })
                  }
                />
                <h3>Helyiség munkái</h3>
                {renderLines(room.lines, (lines) =>
                  updateRoom(room.id, { lines }),
                )}
                {section === room.id && (
                  <RoomPhotos
                    ctx={ctx}
                    name={room.name}
                    ids={room.photo_ids ?? []}
                    entityId={record?.id}
                    onBusy={setUploadBusy}
                    locked={busy}
                    onAdd={(id) => {
                      mark(true);
                      set((previous) => ({
                        ...previous,
                        rooms: previous.rooms.map((r) =>
                          r.id === room.id
                            ? {
                                ...r,
                                photo_ids: [
                                  ...new Set([...(r.photo_ids ?? []), id]),
                                ],
                              }
                            : r,
                        ),
                      }));
                    }}
                    onRemove={(id) =>
                      updateRoom(room.id, {
                        photo_ids: (room.photo_ids ?? []).filter(
                          (photo) => photo !== id,
                        ),
                      })
                    }
                  />
                )}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Eltávolítod a helyiséget a munkáival és fotó-hozzárendeléseivel? Az eredeti képek megmaradnak.",
                      )
                    ) {
                      patch({ rooms: p.rooms.filter((r) => r.id !== room.id) });
                      setSection("rooms");
                    }
                  }}
                >
                  Helyiség eltávolítása
                </button>
              </section>
            ))}
            <section data-survey-section="photos" hidden={section !== "photos"}>
              <h2>Általános / korábban feltöltött fényképek</h2>
              <p>
                A szobák fotóit a saját helyiségüknél töltsd fel. Itt az egész
                ingatlanhoz tartozó képeket választhatod ki.
              </p>
              {ctx.data.entries
                .filter(
                  (e) =>
                    e.project_id === ctx.projectId &&
                    e.payload.type === "document" &&
                    e.payload.mime.startsWith("image/") &&
                    (!p.rooms.some((r) => r.photo_ids?.includes(e.id)) ||
                      p.photo_ids.includes(e.id)),
                )
                .map(
                  (e) =>
                    e.payload.type === "document" && (
                      <Check
                        key={e.id}
                        label={e.payload.name}
                        value={p.photo_ids.includes(e.id)}
                        onChange={(checked) =>
                          patch({
                            photo_ids: checked
                              ? [...p.photo_ids, e.id]
                              : p.photo_ids.filter((id) => id !== e.id),
                          })
                        }
                      />
                    ),
                )}
              {section === "photos" && (
                <Upload ctx={ctx} category="photo" entityId={record?.id} />
              )}
            </section>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
