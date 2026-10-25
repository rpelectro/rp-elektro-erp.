import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

test("teljes oldalas felmérés: fülek, keresés, mentés, fotók, mobil és PDF", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  page.setDefaultTimeout(15000);
  await page.goto("/");
  await page.getByRole("button", { name: "Helyi próbamód megnyitása" }).click();
  await page
    .getByLabel("Helyi jelszó", { exact: true })
    .fill("Szobafoto-proba-2026");
  await page.getByLabel("Jelszó újra").fill("Szobafoto-proba-2026");
  await page
    .getByRole("button", { name: "Titkosított próba létrehozása" })
    .click();
  await page.getByRole("button", { name: "Ügyfelek", exact: true }).click();
  await page.getByRole("button", { name: "Új ügyfél", exact: true }).click();
  await page.getByLabel("Ügyfél neve *").fill("Szobafotó ügyfél");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mentés", exact: true })
    .click();
  await page.getByRole("button", { name: "Projektek", exact: true }).click();
  await page.getByRole("button", { name: "Új projekt", exact: true }).click();
  await page.getByLabel("Projekt neve *").fill("Szobafotó projekt");
  await page
    .getByRole("combobox", { name: "Ügyfél", exact: true })
    .selectOption({ label: "Szobafotó ügyfél" });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mentés", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Érdeklődés.*Szobafotó projekt/ })
    .click();
  await page.getByRole("button", { name: "Felmérés", exact: true }).click();
  await page.getByRole("button", { name: "Új felmérés" }).click();
  const workspace = page.getByRole("region", {
    name: "Felmérés szerkesztése",
    exact: true,
  });
  const nav = workspace.getByRole("navigation", {
    name: "Felmérés részei",
    exact: true,
  });
  const go = async (name: string | RegExp) =>
    nav.getByRole("button", { name, exact: typeof name === "string" }).click();
  const save = async () => {
    await workspace
      .getByRole("button", { name: "Mentés", exact: true })
      .click();
    await expect(
      workspace.getByText("Felmérés elmentve.", { exact: true }),
    ).toBeVisible();
    await expect(
      workspace.getByText("Minden módosítás mentve", { exact: true }),
    ).toBeVisible();
  };
  const back = async () =>
    workspace
      .getByRole("button", { name: "← Vissza a projekthez", exact: true })
      .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await workspace
    .getByLabel("Felmérés neve", { exact: true })
    .fill("Helyiséges felmérés");
  await go("Leírások");
  const longText =
    Array.from(
      { length: 80 },
      (_, index) =>
        `${index + 1}. Hosszú magyar leírás: árvíztűrő tükörfúrógép, megvizsgált vezetékek és csatlakozók.`,
    ).join("\n") + "\nVÉGSŐ ÁLLAPOTLEÍRÁS";
  const text = workspace.getByRole("textbox", {
    name: "Meglévő állapot",
    exact: true,
  });
  await text.fill(longText);
  await text.evaluate((node: HTMLTextAreaElement) => {
    node.scrollTop = 400;
  });
  await workspace
    .getByRole("tab", { name: "Tervezett munka", exact: true })
    .click();
  await workspace
    .getByRole("textbox", { name: "Tervezett munka", exact: true })
    .fill("Kapcsolók cseréje");
  await workspace
    .getByRole("tab", { name: "Meglévő állapot", exact: true })
    .click();
  await expect(text).toHaveValue(longText);
  await expect(text).toHaveJSProperty("scrollTop", 400);
  await expect(workspace.locator("textarea:visible")).toHaveCount(1);
  await workspace
    .getByLabel("Keresés a szövegben", { exact: true })
    .fill("VÉGSŐ ÁLLAPOTLEÍRÁS");
  await workspace
    .getByRole("button", { name: "Következő találat", exact: true })
    .click();
  expect(
    await text.evaluate((node: HTMLTextAreaElement) =>
      node.value.slice(node.selectionStart, node.selectionEnd),
    ),
  ).toBe("VÉGSŐ ÁLLAPOTLEÍRÁS");
  expect(
    await text.evaluate((node: HTMLTextAreaElement) => node.scrollTop),
  ).toBeGreaterThan(400);
  await workspace
    .getByRole("tab", { name: "Belső megjegyzés", exact: true })
    .click();
  await workspace
    .getByLabel("Belső megjegyzés – nem kerül az ügyfél PDF-jére")
    .fill("TITKOS-BELSO-NE-EXPORTALD");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("navigation", { name: "Főmenü" })
    .getByRole("button", { name: "Projektek", exact: true })
    .click();
  await expect(workspace).toBeVisible();
  await go("Teljes ingatlan munkái");
  const property = workspace.locator('[data-survey-section="property"]');
  await property
    .getByRole("button", { name: "Tétel hozzáadása", exact: true })
    .click();
  await property
    .getByLabel("Munka megnevezése", { exact: true })
    .fill("Árazandó felmérési munka");
  await property
    .getByLabel("Egység munkadíja (Ft)", { exact: true })
    .fill("hibás ár");
  await go("Leírások");
  await workspace.getByRole("button", { name: "Mentés", exact: true }).click();
  await expect(property).toBeVisible();
  await expect(workspace.getByRole("alert")).toContainText("kijelölt mezőt");
  await property
    .getByLabel("Egység munkadíja (Ft)", { exact: true })
    .fill("1000");
  await property
    .getByRole("combobox", { name: "Ár megadásának módja", exact: true })
    .selectOption("text");
  await property
    .getByLabel("Munkadíj szövegesen", { exact: true })
    .fill("Egyeztetés szerint");
  for (const name of ["Nappali", "Konyha"]) {
    await go("+ Helyiség hozzáadása");
    await workspace
      .getByRole("combobox", { name: "Választható helyiség" })
      .selectOption(name);
    await workspace
      .getByRole("button", {
        name: "Kiválasztott helyiség hozzáadása",
        exact: true,
      })
      .click();
    await expect(
      workspace.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  }
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  );
  for (const [name, files] of [
    ["Nappali", ["nappali-1.png", "nappali-2.png"]],
    ["Konyha", ["konyha.png"]],
  ] as const) {
    await go(new RegExp(`^${name}`));
    const room = workspace.getByRole("region", {
      name: `Helyiség: ${name}`,
      exact: true,
    });
    if (name === "Nappali") {
      const transfer = await page.evaluateHandle(
        ({ names, bytes }) => {
          const data = new DataTransfer();
          data.items.add(
            new File(["Hibás fájl"], "nem-kep.txt", { type: "text/plain" }),
          );
          for (const name of names)
            data.items.add(
              new File(
                [new Uint8Array([...bytes, ...new TextEncoder().encode(name)])],
                name,
                { type: "image/png" },
              ),
            );
          return data;
        },
        { names: [...files], bytes: Array.from(png) },
      );
      await room
        .locator(".file-drop")
        .dispatchEvent("dragenter", { dataTransfer: transfer });
      await expect(room.locator(".file-drop")).toHaveClass(/is-dragging/);
      await room
        .locator(".file-drop")
        .dispatchEvent("drop", { dataTransfer: transfer });
      await transfer.dispose();
      await expect(room.getByRole("alert")).toContainText("2/3 kép feltöltve");
    } else
      await room.getByLabel(`${name} – képek feltöltése`).setInputFiles(
        files.map((name) => ({
          name,
          mimeType: "image/png",
          buffer: Buffer.concat([png, Buffer.from(name)]),
        })),
      );
    await expect(room.getByRole("img")).toHaveCount(files.length);
  }
  const download = page.waitForEvent("download");
  await workspace
    .getByRole("button", { name: "PDF letöltése", exact: true })
    .click();
  const pdfPath = info.outputPath("felmeres.pdf");
  await (await download).saveAs(pdfPath);
  expect(
    (await PDFDocument.load(await readFile(pdfPath))).getPageCount(),
  ).toBeGreaterThan(2);
  await save();
  await back();
  await page.getByRole("button", { name: "Megnyitás", exact: true }).click();
  await go("Leírások");
  await expect(text).toHaveValue(longText);
  expect(
    await text.evaluate(
      (node: HTMLTextAreaElement) => node.scrollHeight > node.clientHeight,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("survey-desktop.png"),
    fullPage: true,
  });
  await go(/^Nappali/);
  const living = workspace.getByRole("region", {
    name: "Helyiség: Nappali",
    exact: true,
  });
  await living
    .getByLabel("Helyiség meglévő állapota", { exact: true })
    .fill("Megőrzött szobajegyzet");
  await living
    .getByRole("button", {
      name: "Fotó leválasztása: nappali-1.png",
      exact: true,
    })
    .click();
  await save();
  await save();
  await go(/^Konyha/);
  await go(/^Nappali/);
  await expect(
    living.getByLabel("Helyiség meglévő állapota", { exact: true }),
  ).toHaveValue("Megőrzött szobajegyzet");
  await expect(living.getByRole("img")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await workspace
    .getByRole("combobox", { name: "Felmérés részei", exact: true })
    .selectOption("descriptions");
  await expect(text).toBeVisible();
  expect(
    await text.evaluate((node) => node.getBoundingClientRect().width),
  ).toBeLessThan(390);
  await page.screenshot({
    path: info.outputPath("survey-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await back();
  for (const tab of [
    "Áttekintés",
    "Felmérés",
    "Árajánlat",
    "Anyagok",
    "Jegyzőkönyv",
    "Számlák",
    "Dokumentumok",
  ]) {
    await page
      .locator(".project-tabs")
      .getByRole("button", { name: tab, exact: true })
      .click();
    const event = page.waitForEvent("download");
    await page
      .locator(".report-toolbar")
      .first()
      .getByRole("button", { name: "PDF letöltése", exact: true })
      .click();
    const path = info.outputPath(`${tab}.pdf`);
    await (await event).saveAs(path);
    expect(
      (await PDFDocument.load(await readFile(path))).getPageCount(),
    ).toBeGreaterThan(0);
  }
  await page
    .locator(".project-tabs")
    .getByRole("button", { name: "Árajánlat", exact: true })
    .click();
  await page.getByRole("button", { name: "Új ajánlat", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("combobox", { name: "Felmérés kiválasztása", exact: true })
    .selectOption({ label: "Helyiséges felmérés" });
  await dialog.getByRole("button", { name: "Mentés", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("számszerű");
  await dialog
    .getByLabel("Egység munkadíja (Ft)", { exact: true })
    .fill("3500");
  await dialog.getByRole("button", { name: "Mentés", exact: true }).click();
  await expect(
    dialog.getByText("Ajánlattervezet elmentve.", { exact: true }),
  ).toBeVisible();
});
