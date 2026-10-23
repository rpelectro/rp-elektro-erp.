import { test, expect } from "@playwright/test";

test("helyiségenkénti fotók mentés és újranyitás után is külön maradnak", async ({
  page,
}) => {
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
  await dialog.getByRole("button", { name: "Mentés", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Megnyitás", exact: true }).click();
  const living = dialog.getByRole("region", {
    name: "Helyiség: Nappali",
    exact: true,
  });
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
});
