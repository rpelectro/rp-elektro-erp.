import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

test("helyiségfotók, hosszú szöveg szerkesztése és projekt PDF-ek", async ({
  page,
}, info) => {
  test.setTimeout(90000);
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
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Felmérés neve", { exact: true })
    .fill("Helyiséges felmérés");
  const longText = Array.from(
    { length: 80 },
    (_, index) =>
      `${index + 1}. Hosszú magyar leírás: árvíztűrő tükörfúrógép, megvizsgált vezetékek és csatlakozók.`,
  ).join("\n");
  await dialog.getByLabel("Meglévő állapot", { exact: true }).fill(longText);
  await expect(
    dialog.getByLabel("Meglévő állapot", { exact: true }),
  ).toHaveJSProperty(
    "scrollHeight",
    await dialog
      .getByLabel("Meglévő állapot", { exact: true })
      .evaluate((node) => node.clientHeight),
  );
  await dialog
    .locator(".long-text-field")
    .filter({ has: page.getByLabel("Meglévő állapot", { exact: true }) })
    .getByRole("button", { name: "Nagyobb szerkesztőnézet", exact: true })
    .click();
  const largeEditor = page.getByRole("dialog", {
    name: "Szöveg szerkesztése: Meglévő állapot",
    exact: true,
  });
  await expect(largeEditor).toBeVisible();
  await largeEditor
    .getByRole("textbox", { name: "Meglévő állapot", exact: true })
    .fill(longText + "\nVÉGSŐ ÁLLAPOTLEÍRÁS");
  await page.keyboard.press("Escape");
  await expect(largeEditor).not.toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByLabel("Meglévő állapot", { exact: true }),
  ).toHaveValue(longText + "\nVÉGSŐ ÁLLAPOTLEÍRÁS");
  await dialog
    .getByLabel("Belső megjegyzés – nem kerül az ügyfél PDF-jére")
    .fill("TITKOS-BELSO-NE-EXPORTALD");
  for (const name of ["Nappali", "Konyha"]) {
    await dialog
      .getByRole("combobox", { name: "Választható helyiség" })
      .selectOption(name);
    await dialog
      .getByRole("button", {
        name: "Kiválasztott helyiség hozzáadása",
        exact: true,
      })
      .click();
  }
  await dialog
    .getByRole("button", { name: "Tétel hozzáadása", exact: true })
    .first()
    .click();
  await dialog
    .getByLabel("Munka megnevezése", { exact: true })
    .fill("Árazandó felmérési munka");
  await dialog
    .getByRole("combobox", { name: "Ár megadásának módja", exact: true })
    .selectOption("text");
  await dialog
    .getByLabel("Munkadíj szövegesen", { exact: true })
    .fill("Egyeztetés szerint");
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  );
  for (const [name, files] of [
    ["Nappali", ["nappali-1.png", "nappali-2.png"]],
    ["Konyha", ["konyha.png"]],
  ] as const) {
    const room = dialog.getByRole("region", {
      name: `Helyiség: ${name}`,
      exact: true,
    });
    if (name === "Nappali") {
      const dataTransfer = await page.evaluateHandle(
        ({ names, bytes }) => {
          const transfer = new DataTransfer();
          transfer.items.add(
            new File(["Hibás fájl"], "nem-kep.txt", { type: "text/plain" }),
          );
          for (const fileName of names)
            transfer.items.add(
              new File(
                [
                  new Uint8Array([
                    ...bytes,
                    ...new TextEncoder().encode(fileName),
                  ]),
                ],
                fileName,
                { type: "image/png" },
              ),
            );
          return transfer;
        },
        { names: [...files], bytes: Array.from(png) },
      );
      await room
        .locator(".file-drop")
        .dispatchEvent("dragenter", { dataTransfer });
      await expect(room.locator(".file-drop")).toHaveClass(/is-dragging/);
      await room.locator(".file-drop").dispatchEvent("drop", { dataTransfer });
      await dataTransfer.dispose();
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
    for (const file of files)
      await expect(
        room.getByRole("img", { name: file, exact: true }),
      ).toBeVisible();
  }
  const pdfDownload = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "PDF letöltése", exact: true })
    .click();
  const pdfPath = info.outputPath("felmeres.pdf");
  await (await pdfDownload).saveAs(pdfPath);
  expect(
    (await PDFDocument.load(await readFile(pdfPath))).getPageCount(),
  ).toBeGreaterThan(2);
  await dialog.getByRole("button", { name: "Mentés", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Megnyitás", exact: true }).click();
  const living = dialog.getByRole("region", {
    name: "Helyiség: Nappali",
    exact: true,
  });
  await expect(
    dialog.getByLabel("Munkadíj szövegesen", { exact: true }),
  ).toHaveValue("Egyeztetés szerint");
  const kitchen = dialog.getByRole("region", {
    name: "Helyiség: Konyha",
    exact: true,
  });
  await expect(
    living.getByLabel("Helyiség neve", { exact: true }),
  ).not.toBeVisible();
  await expect(living.locator("summary")).toContainText("2 kép");
  await living.locator("summary").click();
  await kitchen.locator("summary").click();
  await living
    .getByLabel("Helyiség meglévő állapota")
    .fill("Megőrzött szobajegyzet");
  await living.locator("summary").click();
  await expect(
    living.getByLabel("Helyiség meglévő állapota"),
  ).not.toBeVisible();
  await living.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(living.getByLabel("Helyiség meglévő állapota")).toHaveValue(
    "Megőrzött szobajegyzet",
  );
  await expect(living.getByRole("img")).toHaveCount(2);
  await expect(kitchen.getByRole("img")).toHaveCount(1);
  await expect(
    kitchen.getByRole("img", { name: "konyha.png", exact: true }),
  ).toBeVisible();
  await living
    .getByRole("button", {
      name: "Fotó leválasztása: nappali-1.png",
      exact: true,
    })
    .click();
  await dialog.getByRole("button", { name: "Mentés", exact: true }).click();
  await page.getByRole("button", { name: "Megnyitás", exact: true }).click();
  await expect(living.locator("summary")).toContainText("1 kép");
  await living.locator("summary").click();
  await kitchen.locator("summary").click();
  await expect(living.getByLabel("Helyiség meglévő állapota")).toHaveValue(
    "Megőrzött szobajegyzet",
  );
  await expect(living.getByRole("img")).toHaveCount(1);
  await expect(kitchen.getByRole("img")).toHaveCount(1);
  await dialog.getByRole("button", { name: "Mentés", exact: true }).click();
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
    const download = page.waitForEvent("download");
    await page
      .locator(".report-toolbar")
      .first()
      .getByRole("button", { name: "PDF letöltése", exact: true })
      .click();
    const path = info.outputPath(`${tab}.pdf`);
    await (await download).saveAs(path);
    expect(
      (await PDFDocument.load(await readFile(path))).getPageCount(),
    ).toBeGreaterThan(0);
  }
  await page
    .locator(".project-tabs")
    .getByRole("button", { name: "Árajánlat", exact: true })
    .click();
  await page.getByRole("button", { name: "Új ajánlat", exact: true }).click();
  await dialog
    .getByRole("combobox", { name: "Felmérés kiválasztása", exact: true })
    .selectOption({ label: "Helyiséges felmérés" });
  await expect(
    dialog.getByText("Felmérésben megadott ár:", { exact: false }),
  ).toBeVisible();
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
