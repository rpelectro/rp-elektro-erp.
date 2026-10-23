import { it, expect } from "vitest";
import { openLocal } from "../src/local";
import { wrapOffline } from "../src/offline";
import {
  ConflictError,
  type Repository,
  type Snapshot,
  type Kind,
  type Tables,
} from "../src/domain";
const pass = "Offline-jelszo-2026";
it("az offline rekord és művelet tartós; elveszett szerverválasz után ugyanaz az operation_id kerül újra küldésre", async () => {
  const name = `sync-${crypto.randomUUID()}`;
  let local = await openLocal(pass, true, { name, queue: true });
  const saved = await local.save("partners", {
    name: "Offline ügyfél",
    email: "",
    phone: "",
    billing_address: "",
    notes: "",
    archived: false,
  });
  const op = (await local.operations())[0];
  expect(op.record_id).toBe(saved.id);
  local.close();
  local = await openLocal(pass, false, { name });
  expect(await local.operations()).toHaveLength(1);
  let fail = true,
    calls: string[] = [];
  const snapshot = await local.load();
  const remote = {
    mode: "cloud",
    load: async () => snapshot,
    applyOperation: async (operation: any) => {
      calls.push(operation.operation_id);
      if (fail) {
        fail = false;
        throw new Error("Elveszett válasz");
      }
      return saved;
    },
    putFile: async () => "",
    getFile: async () => new Uint8Array(),
    save: async () => saved,
    close() {},
  } as Repository;
  const wrapped = wrapOffline(local, async () => remote);
  await expect(wrapped.sync!.run()).rejects.toThrow("Elveszett");
  expect((await wrapped.sync!.status()).pending).toBe(1);
  await wrapped.sync!.run();
  expect(calls).toEqual([op.operation_id, op.operation_id]);
  expect((await wrapped.sync!.status()).pending).toBe(0);
  wrapped.close();
});
it("ütközéskor mindkét változat megmarad, kifejezett választásig nincs felülírás", async () => {
  const name = `conflict-${crypto.randomUUID()}`;
  const base = await openLocal(pass, true, { name });
  const original = await base.save("partners", {
    name: "Alap",
    email: "",
    phone: "",
    billing_address: "",
    notes: "",
    archived: false,
  });
  const snapshot = await base.load();
  base.close();
  const local = await openLocal(pass, true, {
    name: `cache-${crypto.randomUUID()}`,
    queue: true,
    seed: snapshot,
  });
  await local.save("partners", { ...original, name: "Helyi" }, original.id, 1);
  const server = { ...original, name: "Szerver", version: 2 },
    remoteSnapshot = { ...snapshot, partners: [server] };
  const remote = {
    mode: "cloud",
    load: async () => remoteSnapshot,
    applyOperation: async () => {
      throw new ConflictError();
    },
  } as unknown as Repository;
  const wrapped = wrapOffline(local, async () => remote);
  await wrapped.sync!.run();
  const status = await wrapped.sync!.status();
  expect(status.conflicts[0].local).toMatchObject({ name: "Helyi" });
  expect(status.conflicts[0].server).toMatchObject({ name: "Szerver" });
  expect((await local.load()).partners[0].name).toBe("Helyi");
  await wrapped.sync!.resolve(status.conflicts[0], "server");
  expect((await local.load()).partners[0].name).toBe("Szerver");
  expect((await local.operations()).length).toBe(0);
  wrapped.close();
});
