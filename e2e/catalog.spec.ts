import { test, expect } from "@playwright/test";

test("az 50 alapmunka egyszerre menthető és ismétléskor nem duplikálódik", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/");
  await page.getByRole("button", { name: "Helyi próbamód megnyitása" }).click();
  await page
    .getByLabel("Helyi jelszó", { exact: true })
    .fill("Katalogus-proba-2026");
  await page.getByLabel("Jelszó újra").fill("Katalogus-proba-2026");
  await page
    .getByRole("button", { name: "Titkosított próba létrehozása" })
    .click();
  await page.getByRole("button", { name: "Beállítások", exact: true }).click();
  await page
    .getByRole("button", { name: "Tömeges munkatétel-felvitel" })
    .click();
  await page
    .getByRole("button", {
      name: "50 alapvető villanyszerelési munka betöltése",
    })
    .click();
  await page.getByRole("button", { name: "Előnézet és ellenőrzés" }).click();
  await expect(
    page.getByText("50 új tétel, 0 meglévő tétel kihagyva.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "50 munkatétel mentése", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "50 új munkatétel mentve" }),
  ).toBeVisible({ timeout: 60000 });
  await page
    .getByRole("button", {
      name: "50 alapvető villanyszerelési munka betöltése",
    })
    .click();
  await page.getByRole("button", { name: "Előnézet és ellenőrzés" }).click();
  await expect(
    page.getByText("0 új tétel, 50 meglévő tétel kihagyva.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "0 munkatétel mentése", exact: true }),
  ).toBeDisabled();
  // Single deletion can be cancelled; full reset includes archived records.
  const single = page.getByRole("button", {
    name: "Villamos hibakeresés törlése",
    exact: true,
  });
  await single.click();
  await page.getByRole("button", { name: "Mégse", exact: true }).click();
  await expect(single).toBeVisible();
  await single.click();
  await page
    .getByRole("button", { name: "Végleges törlés", exact: true })
    .click();
  await expect(single).toHaveCount(0);
  await page
    .locator(".table-panel tbody tr")
    .first()
    .getByRole("button", { name: "Archiválás", exact: true })
    .click();
  await expect(page.locator(".table-panel tbody tr")).toHaveCount(48);
  await page
    .getByRole("button", { name: "Teljes munkakatalógus ürítése", exact: true })
    .click();
  const confirm = page.getByRole("group", {
    name: "Munkatételek törlésének megerősítése",
  });
  await expect(
    confirm.getByRole("button", { name: "Végleges törlés", exact: true }),
  ).toBeDisabled();
  await confirm.getByLabel("A megerősítéshez írd be: TÖRLÉS").fill("TÖRLÉS");
  await confirm
    .getByRole("button", { name: "Végleges törlés", exact: true })
    .click();
  await expect(page.locator(".table-panel tbody tr")).toHaveCount(0);
  await page.getByRole("button", { name: "Előnézet és ellenőrzés" }).click();
  await expect(
    page.getByText("50 új tétel, 0 meglévő tétel kihagyva.", { exact: true }),
  ).toBeVisible();
});
