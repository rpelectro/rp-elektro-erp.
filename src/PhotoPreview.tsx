import { useEffect, useState } from "react";
import { type Context } from "./ui";
import { documentBytes } from "./documents";
import { friendly } from "./domain";
export function PhotoPreview({ ctx, ids }: { ctx: Context; ids: string[] }) {
  const [images, setImages] = useState<
      { id: string; url: string; name: string }[]
    >([]),
    [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    void (async () => {
      const values = [];
      for (const id of ids) {
        const e = ctx.data.entries.find((e) => e.id === id);
        if (!e || e.payload.type !== "document")
          throw new Error("Hiányzó kiválasztott fotó.");
        const bytes = await documentBytes(ctx.repo, e),
          url = URL.createObjectURL(
            new Blob([new Uint8Array(bytes)], { type: e.payload.mime }),
          );
        urls.push(url);
        values.push({ id, url, name: e.payload.name });
      }
      if (!cancelled) setImages(values);
    })().catch((e) => {
      if (!cancelled) setError(friendly(e));
    });
    return () => {
      cancelled = true;
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [ctx.repo, ids.join("|")]);
  return (
    <>
      {error && (
        <div role="alert" className="notice error">
          {error}
        </div>
      )}
      <div className="photo-preview">
        {images.map((i) => (
          <figure key={i.id}>
            <img src={i.url} alt={i.name} />
            <figcaption>{i.name}</figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}
