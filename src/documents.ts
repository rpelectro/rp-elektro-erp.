import type { Repository, Snapshot } from "./domain";
import { today, type Entry, type PayloadOf } from "./business";
import { sha256, download } from "./transfer";
export async function attach(
  repo: Repository,
  projectId: string | null,
  file: File,
  category: PayloadOf<"document">["category"] = "other",
  entityId: string | null = null,
): Promise<Entry> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length > 10485760 || !bytes.length)
    throw new Error("A fájl mérete 1 bájt és 10 MB között lehet.");
  const mime = file.type;
  if (
    !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(mime)
  )
    throw new Error("Csak PDF, JPEG, PNG és WebP tölthető fel.");
  const signature = Array.from(bytes.subarray(0, 12));
  if (
    mime === "application/pdf" &&
    String.fromCharCode(...signature.slice(0, 5)) !== "%PDF-"
  )
    throw new Error("A fájl nem PDF.");
  if (
    mime === "image/png" &&
    signature.slice(0, 4).join(",") !== "137,80,78,71"
  )
    throw new Error("A fájl nem PNG.");
  if (mime === "image/jpeg" && (signature[0] !== 255 || signature[1] !== 216))
    throw new Error("A fájl nem JPEG.");
  if (
    mime === "image/webp" &&
    (String.fromCharCode(...signature.slice(0, 4)) !== "RIFF" ||
      String.fromCharCode(...signature.slice(8, 12)) !== "WEBP")
  )
    throw new Error("A fájl nem WebP.");
  const fileKey = await repo.putFile(bytes, mime);
  const existing = (await repo.load()).entries.find(
    (e) =>
      e.project_id === projectId &&
      e.payload.type === "document" &&
      e.payload.file_key === fileKey &&
      e.payload.entity_id === entityId &&
      e.payload.category === category,
  );
  if (existing) return existing;
  return repo.save("entries", {
    project_id: projectId,
    payload: {
      type: "document",
      file_key: fileKey,
      name: file.name,
      mime: mime as PayloadOf<"document">["mime"],
      size: bytes.length,
      sha256: await sha256(bytes),
      category,
      entity_id: entityId,
      created_on: today(),
      sent_on: null,
      original: true,
    },
    source_system: "",
    source_id: "",
  });
}
export async function documentBytes(repo: Repository, entry: Entry) {
  if (entry.payload.type !== "document") throw new Error("Nem fájl.");
  const bytes = await repo.getFile(entry.payload.file_key);
  if (
    bytes.length !== entry.payload.size ||
    (await sha256(bytes)) !== entry.payload.sha256
  )
    throw new Error("A fájl mérete vagy ellenőrzőösszege hibás.");
  return bytes;
}
export async function openDocument(repo: Repository, entry: Entry) {
  if (entry.payload.type !== "document") return;
  download(
    await documentBytes(repo, entry),
    entry.payload.name,
    entry.payload.mime,
  );
}
export async function picture(
  bytes: Uint8Array,
  mime: string,
): Promise<Uint8Array> {
  if (mime !== "image/webp") return bytes;
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], { type: mime }),
  );
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d")!.drawImage(img, 0, 0);
    const b = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("A kép nem alakítható át."))),
        "image/png",
      ),
    );
    return new Uint8Array(await b.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}
