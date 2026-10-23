import { beforeEach, describe, expect, it } from "vitest";
import { localExists, openLocal } from "../src/local";
import { ConflictError } from "../src/domain";
const password = "Test-vault-password-2026";
const customer = {
  name: "Titkos Teszt Ügyfél",
  phone: "",
  email: "teszt@example.com",
  billing_address: "Budapest",
  notes: "Belső titok",
  archived: false,
};
beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase("rp-elektro-local-v1");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
});
describe("Titkosított helyi adattár", () => {
  it("létrehoz, ment, bezárás után visszaolvas és hibás jelszót elutasít", async () => {
    expect(await localExists()).toBe(false);
    const repo = await openLocal(password, true);
    const partner = await repo.save("partners", customer);
    const project = await repo.save("projects", {
      title: "Lakás",
      customer_id: partner.id,
      site_address: "Érd",
      status: "inquiry",
      notes: "",
      archived: false,
    });
    expect(partner.version).toBe(1);
    repo.close();
    expect(await localExists()).toBe(true);
    await expect(openLocal("wrong-password")).rejects.toThrow("Hibás jelszó");
    const reopened = await openLocal(password);
    const snapshot = await reopened.load();
    expect(snapshot.partners[0]).toMatchObject(customer);
    expect(snapshot.projects[0].id).toBe(project.id);
    await reopened.save(
      "partners",
      { ...customer, archived: true },
      partner.id,
      partner.version,
    );
    expect((await reopened.load()).projects[0].customer_id).toBe(partner.id);
    reopened.close();
  });
  it("két megnyitott ablak elavult írását megállítja", async () => {
    const first = await openLocal(password, true);
    const original = await first.save("partners", customer);
    const second = await openLocal(password);
    const outcomes = await Promise.allSettled([
      first.save("partners", { ...customer, name: "Első" }, original.id, 1),
      second.save("partners", { ...customer, name: "Második" }, original.id, 1),
    ]);
    expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(1);
    const rejected = outcomes.find(
      (o) => o.status === "rejected",
    ) as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(ConflictError);
    expect((await first.load()).partners[0].version).toBe(2);
    first.close();
    second.close();
  });
  it("nem tárol olvasható üzleti adatot és sérült titkosítást nem olvas be", async () => {
    const repo = await openLocal(password, true);
    await repo.save("partners", customer);
    const db = await new Promise<IDBDatabase>((resolve) => {
      const req = indexedDB.open("rp-elektro-local-v1");
      req.onsuccess = () => resolve(req.result);
    });
    const rows: {
      key: string;
      version: number;
      iv: Uint8Array;
      bytes: ArrayBuffer;
    }[] = await new Promise((resolve) => {
      const req = db.transaction("records").objectStore("records").getAll();
      req.onsuccess = () => resolve(req.result);
    });
    expect(JSON.stringify(rows)).not.toContain(customer.name);
    expect(JSON.stringify(rows)).not.toContain(customer.notes);
    const row = rows.find((r) => r.key.startsWith("partners/"))!;
    new Uint8Array(row.bytes)[0] ^= 255;
    await new Promise<void>((resolve) => {
      const tx = db.transaction("records", "readwrite");
      tx.objectStore("records").put(row);
      tx.oncomplete = () => resolve();
    });
    await expect(repo.load()).rejects.toThrow("sérült");
    db.close();
    repo.close();
  });
  it("ismeretlen ügyfélhez nem enged projektet és nem írja felül az adattárat", async () => {
    const repo = await openLocal(password, true);
    await expect(
      repo.save("projects", {
        title: "Hibás projekt",
        customer_id: crypto.randomUUID(),
        site_address: "",
        status: "inquiry",
        notes: "",
        archived: false,
      }),
    ).rejects.toThrow("ügyfél");
    await expect(openLocal(password, true)).rejects.toThrow("Már létezik");
    expect((await repo.load()).projects).toHaveLength(0);
    repo.close();
  });
});
