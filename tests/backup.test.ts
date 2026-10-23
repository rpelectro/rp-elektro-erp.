import { beforeEach, it, expect } from "vitest";
import { openLocal } from "../src/local";
import { createPackage, encryptPackage, verifyPackage } from "../src/backup";
import { attach, documentBytes } from "../src/documents";
import { invoice } from "./fixtures";
import { invoiceBalance } from "../src/business";
const pass = "Teszt-jelszo-2026";
it("a titkosított üzleti mentés minden fájlt tartalmaz, hibás jelszó és sérült fájl nem állítható vissza", async () => {
  const first = await openLocal(pass, true, {
    name: `test-backup-${crypto.randomUUID()}`,
  });
  const customer = await first.save("partners", {
    name: "Biztonsági másolat ügyfele",
    email: "",
    phone: "",
    billing_address: "Pécs",
    notes: "",
    archived: false,
  });
  const project = await first.save("projects", {
    title: "Biztonsági mentés projekt",
    customer_id: customer.id,
    site_address: "Pécs",
    status: "inquiry",
    notes: "",
    archived: false,
  });
  const file = new File(["%PDF-1.4\nTeszt"], "eredeti.pdf", {
    type: "application/pdf",
  });
  const document = await attach(first, project.id, file);
  const inv = await first.save("entries", {
    project_id: project.id,
    payload: invoice(),
    source_system: "",
    source_id: "",
  });
  const payment = await first.save("entries", {
    project_id: project.id,
    payload: {
      type: "payment",
      invoice_id: inv.id,
      paid_on: "2026-10-23",
      amount_minor: 3000,
      currency: "HUF",
      direction: "in",
      method: "utalás",
      notes: "",
      voids_id: null,
    },
    source_system: "",
    source_id: "",
  });
  const pack = await createPackage(first),
    bytes = await encryptPackage(pack, pass);
  expect(new TextDecoder().decode(bytes)).not.toContain(customer.name);
  await expect(verifyPackage(bytes, "hibas-jelszo")).rejects.toThrow("Hibás");
  const verified = await verifyPackage(bytes, pass);
  expect(verified.manifest.files).toBe(1);
  if (payment.payload.type !== "payment") throw new Error("Nincs befizetés");
  await first.save("entries", {
    project_id: project.id,
    payload: { ...payment.payload, voids_id: payment.id },
    source_system: "",
    source_id: "",
  });
  const reversed = await verifyPackage(
    await encryptPackage(await createPackage(first), pass),
    pass,
  );
  expect(
    invoiceBalance(
      reversed.snapshot.entries.find((e) => e.id === inv.id)!,
      reversed.snapshot.entries,
    )?.paid,
  ).toBe(0);
  const restored = await openLocal(pass, true, {
    name: `restored-${crypto.randomUUID()}`,
    seed: verified.snapshot,
    files: verified.files,
  });
  expect((await restored.load()).projects[0].customer_id).toBe(customer.id);
  expect(
    new TextDecoder().decode(await documentBytes(restored, document)),
  ).toContain("%PDF-1.4");
  const key = Object.keys(pack.files)[0];
  pack.files[key] = btoa("sérült");
  await expect(
    verifyPackage(await encryptPackage(pack, pass), pass),
  ).rejects.toThrow("ellenőrző");
  first.close();
  restored.close();
});
