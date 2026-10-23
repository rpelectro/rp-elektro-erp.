import { test, expect } from "@playwright/test";
test("két ablak ütközésekor a beírt adat megmarad és nem lesz csendes felülírás", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Helyi próbamód megnyitása" }).click();
  await page
    .getByLabel("Helyi jelszó", { exact: true })
    .fill("Proba-jelszo-2026");
  await page.getByLabel("Jelszó újra").fill("Proba-jelszo-2026");
  await page
    .getByRole("button", { name: "Titkosított próba létrehozása" })
    .click();
  await page.getByRole("button", { name: "Ügyfelek", exact: true }).click();
  await page.getByRole("button", { name: "Új ügyfél", exact: true }).click();
  await page.getByLabel("Ügyfél neve *").fill("Eredeti név");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mentés", exact: true })
    .click();
  await page.getByRole("button", { name: "Eredeti név", exact: true }).click();
  await page.getByLabel("Ügyfél neve *").fill("Első ablak mentése");
  const second = await page.context().newPage();
  await second.goto("/");
  await second
    .getByRole("button", { name: "Helyi próbamód megnyitása" })
    .click();
  await second
    .getByLabel("Helyi jelszó", { exact: true })
    .fill("Proba-jelszo-2026");
  await second.getByRole("button", { name: "Megnyitás", exact: true }).click();
  await second.getByRole("button", { name: "Ügyfelek", exact: true }).click();
  await second
    .getByRole("button", { name: "Eredeti név", exact: true })
    .click();
  await second.getByLabel("Ügyfél neve *").fill("Második ablak piszkozata");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mentés", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await second
    .getByRole("dialog")
    .getByRole("button", { name: "Mentés", exact: true })
    .click();
  await expect(second.getByRole("alert")).toContainText("másik ablak");
  await expect(second.getByLabel("Ügyfél neve *")).toHaveValue(
    "Második ablak piszkozata",
  );
  await expect(
    second
      .getByRole("dialog")
      .getByRole("button", { name: "Mentés", exact: true }),
  ).toBeDisabled();
  await second
    .getByRole("button", { name: "Friss változat betöltése" })
    .click();
  await expect(second.getByLabel("Ügyfél neve *")).toHaveValue(
    "Első ablak mentése",
  );
});
test("ügyfél, projekt és munkatétel: mentés, újranyitás, archiválás", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Helyi próbamód megnyitása" }).click();
  await page
    .getByLabel("Helyi jelszó", { exact: true })
    .fill("Proba-jelszo-2026");
  await page.getByLabel("Jelszó újra").fill("Proba-jelszo-2026");
  await page
    .getByRole("button", { name: "Titkosított próba létrehozása" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Irányítópult", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ügyfelek", exact: true }).click();
  await page.getByRole("button", { name: "Új ügyfél", exact: true }).click();
  await page.getByLabel("Ügyfél neve *", { exact: true }).fill("Teszt Elek");
  await page.getByLabel("E-mail-cím", { exact: true }).fill("elek@example.com");
  await page.getByLabel("Számlázási cím").fill("Budapest, Teszt utca 1.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mentés", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Teszt Elek", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Projektek", exact: true }).click();
  await page.getByRole("button", { name: "Új projekt", exact: true }).click();
  await page.getByLabel("Projekt neve *").fill("Lakásfelújítás");
  await page
    .getByRole("combobox", { name: "Ügyfél", exact: true })
    .selectOption({ label: "Teszt Elek" });
  await page.getByLabel("Munkavégzés helye").fill("Érd, Próba utca 2.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mentés", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Érdeklődés.*Lakásfelújítás/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Projektadatok" }),
  ).toBeVisible();
  await expect(
    page.getByText("Érd, Próba utca 2.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Beállítások", exact: true }).click();
  await page
    .getByRole("button", { name: "Új munkatétel", exact: true })
    .click();
  await page.getByLabel("Munkatétel neve *").fill("Dugalj szerelés");
  await page.getByLabel("Munkadíj / egység (Ft) *").fill("1 234,56");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mentés", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Dugalj szerelés", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Helyi próbamód megnyitása" }).click();
  await page
    .getByLabel("Helyi jelszó", { exact: true })
    .fill("Proba-jelszo-2026");
  await page.getByRole("button", { name: "Megnyitás", exact: true }).click();
  await page.getByRole("button", { name: "Ügyfelek", exact: true }).click();
  await page.getByRole("button", { name: "Teszt Elek", exact: true }).click();
  await page
    .getByLabel("Ügyfél neve *", { exact: true })
    .fill("Teszt Elek módosítva");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mentés", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Teszt Elek módosítva", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Archiválás", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Teszt Elek módosítva", exact: true }),
  ).not.toBeVisible();
  await page.getByLabel("Archiváltak", { exact: true }).check();
  await expect(
    page.getByRole("button", { name: "Teszt Elek módosítva", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Visszaállítás", exact: true })
    .click();
  await page.getByLabel("Archiváltak", { exact: true }).uncheck();
  await expect(
    page.getByRole("button", { name: "Teszt Elek módosítva", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
});

test("mobilon használható belépés és menü, az el nem mentett űrlap nem vész el csendben", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Helyi próbamód megnyitása" }).click();
  await page
    .getByLabel("Helyi jelszó", { exact: true })
    .fill("Proba-jelszo-2026");
  await page.getByLabel("Jelszó újra").fill("Proba-jelszo-2026");
  await page
    .getByRole("button", { name: "Titkosított próba létrehozása" })
    .click();
  await page.getByRole("button", { name: "Menü megnyitása" }).click();
  await page.getByRole("button", { name: "Ügyfelek", exact: true }).click();
  await page.getByRole("button", { name: "Új ügyfél", exact: true }).click();
  await page.getByLabel("Ügyfél neve *").fill("Ne vesszen el");
  await page.getByRole("button", { name: "Mégse", exact: true }).click();
  await expect(
    page.getByText("A nem mentett változtatások elvesznek."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Szerkesztés folytatása" }).click();
  await expect(page.getByLabel("Ügyfél neve *")).toHaveValue("Ne vesszen el");
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  const dimensions = await page.evaluate(() => ({
    width: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
    outside: Array.from(document.querySelectorAll("*"))
      .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1)
      .map((e) => `${e.tagName}.${e.className}`),
  }));
  expect(dimensions.scroll, JSON.stringify(dimensions)).toBeLessThanOrEqual(
    dimensions.width,
  );
});
