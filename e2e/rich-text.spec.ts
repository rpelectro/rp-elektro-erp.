import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

test("Office-szerű formázás: mentés, újranyitás és PDF", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  page.setDefaultTimeout(15000);
  await page.goto("/");
  await page.getByRole("button", { name: "Helyi próbamód megnyitása" }).click();
  await page
    .getByLabel("Helyi jelszó", { exact: true })
    .fill("Szerkeszto-proba-2026");
  await page.getByLabel("Jelszó újra").fill("Szerkeszto-proba-2026");
  await page
    .getByRole("button", { name: "Titkosított próba létrehozása" })
    .click();
  await page.getByRole("button", { name: "Projektek", exact: true }).click();
  await page.getByRole("button", { name: "Új projekt", exact: true }).click();
  await page.getByLabel("Projekt neve *").fill("Formázási próba");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mentés", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Érdeklődés.*Formázási próba/ })
    .click();
  await page
    .locator(".project-tabs")
    .getByRole("button", { name: "Felmérés", exact: true })
    .click();
  await page.getByRole("button", { name: "Új felmérés", exact: true }).click();
  const workspace = page.getByRole("region", {
    name: "Felmérés szerkesztése",
    exact: true,
  });
  await workspace
    .getByLabel("Felmérés neve", { exact: true })
    .fill("Formázott felmérés");
  await workspace
    .getByRole("navigation", { name: "Felmérés részei", exact: true })
    .getByRole("button", { name: "Leírások", exact: true })
    .click();
  const editor = workspace.getByRole("textbox", {
    name: "Meglévő állapot",
    exact: true,
  });
  await editor.fill("Fontos megállapítás");
  await editor.press("ControlOrMeta+a");
  await workspace
    .getByRole("button", { name: "Félkövér", exact: true })
    .click();
  await expect(editor.locator("strong")).toHaveText("Fontos megállapítás");
  await workspace
    .getByRole("button", { name: "Visszavonás", exact: true })
    .click();
  await expect(editor.locator("strong")).toHaveCount(0);
  await workspace
    .getByRole("button", { name: "Ismétlés", exact: true })
    .click();
  await expect(editor.locator("strong")).toHaveText("Fontos megállapítás");
  await editor.press("ControlOrMeta+a");
  await workspace.getByRole("button", { name: "Dőlt", exact: true }).click();
  await workspace
    .getByRole("button", { name: "Címsor 2", exact: true })
    .click();
  await expect(editor.locator("h2")).toHaveText("Fontos megállapítás");
  await expect(editor.locator("em")).toHaveText("Fontos megállapítás");
  await workspace
    .getByRole("tab", { name: "Tervezett munka", exact: true })
    .click();
  const planned = workspace.getByRole("textbox", {
    name: "Tervezett munka",
    exact: true,
  });
  await planned.click();
  await workspace
    .getByRole("button", { name: "Felsorolás", exact: true })
    .click();
  await planned.pressSequentially("Első munka");
  await planned.press("Enter");
  await planned.pressSequentially("Második munka");
  await expect(planned.locator("ul li")).toHaveCount(2);
  await planned.press("ControlOrMeta+a");
  await workspace.getByRole("button", { name: "Dőlt", exact: true }).click();
  await workspace
    .getByRole("button", { name: "Számozott lista", exact: true })
    .click();
  await expect(planned.locator("ol li")).toHaveCount(2);
  await workspace.getByRole("button", { name: "Mentés", exact: true }).click();
  await expect(
    workspace.getByText("Felmérés elmentve.", { exact: true }),
  ).toBeVisible();
  await workspace
    .getByRole("button", { name: "← Vissza a projekthez", exact: true })
    .click();
  await page.getByRole("button", { name: "Megnyitás", exact: true }).click();
  await expect(
    workspace.getByRole("button", { name: "Félkövér", exact: true }),
  ).toBeEnabled();
  await expect(editor.locator("h2 strong em, h2 em strong")).toHaveText(
    "Fontos megállapítás",
  );
  await expect(editor).not.toContainText("##");
  await workspace
    .getByRole("tab", { name: "Tervezett munka", exact: true })
    .click();
  await expect(planned.locator("ol li")).toHaveCount(2);
  await expect(planned.locator("em")).toHaveCount(2);
  await page.screenshot({
    path: info.outputPath("office-editor.png"),
    fullPage: true,
  });
  const download = page.waitForEvent("download");
  await workspace
    .getByRole("button", { name: "PDF letöltése", exact: true })
    .click();
  const path = info.outputPath("formazott-felmeres.pdf");
  await (await download).saveAs(path);
  expect(
    (await PDFDocument.load(await readFile(path))).getPageCount(),
  ).toBeGreaterThan(0);
});
