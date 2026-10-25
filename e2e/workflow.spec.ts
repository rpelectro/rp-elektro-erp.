import { test, expect, type Page } from "@playwright/test";
test("teljes munka: felmérés, magyar PDF-ajánlat, anyagigény, aláírt átadás, számla, részfizetés és ellenőrzött mentés", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  page.setDefaultTimeout(15000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const dialog = () => page.locator("dialog[open], .record-workspace");
  const section = async (name: string) =>
    page
      .locator(".record-workspace")
      .getByRole("navigation", { name: "Dokumentum részei" })
      .getByRole("button", { name, exact: true })
      .click();
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.getByRole("button", { name: "Helyi próbamód megnyitása" }).click();
  await page
    .getByLabel("Helyi jelszó", { exact: true })
    .fill("Teljes-proba-jelszo-2026");
  await page.getByLabel("Jelszó újra").fill("Teljes-proba-jelszo-2026");
  await page
    .getByRole("button", { name: "Titkosított próba létrehozása" })
    .click();
  await page.getByRole("button", { name: "Beállítások", exact: true }).click();
  await page.getByRole("button", { name: "Vállalkozás", exact: true }).click();
  await page.getByRole("button", { name: "Szerkesztés", exact: true }).click();
  await dialog().getByLabel("Vállalkozás neve *").fill("RP Elektro teszt – őű");
  await dialog().getByLabel("Vállalkozás címe").fill("Pécs, Próba út 1.");
  await dialog()
    .getByRole("combobox", { name: "Adózási mód", exact: true })
    .selectOption("aam");
  await dialog().getByRole("button", { name: "Mentés", exact: true }).click();
  await page
    .getByRole("button", { name: "Munkakatalógus", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Új munkatétel", exact: true })
    .click();
  await dialog().getByLabel("Munkatétel neve *").fill("Dugalj szerelés");
  await dialog().getByLabel("Munkadíj / egység (Ft) *").fill("3500");
  await dialog().getByRole("button", { name: "Mentés", exact: true }).click();
  await page
    .getByRole("button", { name: "Anyagreceptek", exact: true })
    .click();
  await page
    .getByLabel("Anyag neve", { exact: true })
    .fill("Rézvezeték 2,5 mm²");
  await page.getByLabel("Anyag egysége").fill("m");
  await page
    .getByRole("button", { name: "Anyag felvétele", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Recept munkatétele" })
    .selectOption({ label: "Dugalj szerelés" });
  await page
    .getByRole("combobox", { name: "Recepthez adandó anyag" })
    .selectOption({ label: "Rézvezeték 2,5 mm² · m" });
  await page
    .getByRole("button", { name: "Anyag hozzáadása a recepthez" })
    .click();
  await page.getByLabel("Szükséges mennyiség 1 munkaegységhez").fill("2");
  await page.getByRole("button", { name: "Recept mentése" }).click();
  await page.getByRole("button", { name: "Ügyfelek", exact: true }).click();
  await page.getByRole("button", { name: "Új ügyfél", exact: true }).click();
  await dialog().getByLabel("Ügyfél neve *").fill("Árvíztűrő Tükörfúrógép");
  await dialog().getByLabel("Számlázási cím").fill("Pécs, Ügyfél tér 2.");
  await dialog().getByRole("button", { name: "Mentés", exact: true }).click();
  await page.getByRole("button", { name: "Projektek", exact: true }).click();
  await page.getByRole("button", { name: "Új projekt", exact: true }).click();
  await dialog()
    .getByLabel("Projekt neve *")
    .fill("Teljes munkafolyamat próba");
  await dialog()
    .getByRole("combobox", { name: "Ügyfél", exact: true })
    .selectOption({ label: "Árvíztűrő Tükörfúrógép" });
  await dialog()
    .getByLabel("Munkavégzés helye")
    .fill("Pécs, Munkavégzés út 3.");
  await dialog().getByRole("button", { name: "Mentés", exact: true }).click();
  await page
    .getByRole("button", { name: /Érdeklődés.*Teljes munkafolyamat próba/ })
    .click();
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Felmérés", exact: true }).click();
  await page.getByRole("button", { name: "Új felmérés" }).click();
  const survey = page.getByRole("region", {
    name: "Felmérés szerkesztése",
    exact: true,
  });
  const surveyNav = survey.getByRole("navigation", { name: "Felmérés részei" });
  await survey.getByLabel("Felmérés neve").fill("Helyszíni felmérés");
  await surveyNav
    .getByRole("button", { name: "Leírások", exact: true })
    .click();
  await survey
    .getByRole("textbox", { name: "Meglévő állapot", exact: true })
    .fill("Alumínium vezeték; helyiségenként felmérve.");
  await survey
    .getByRole("tab", { name: "Belső megjegyzés", exact: true })
    .click();
  await survey
    .getByLabel("Belső megjegyzés – nem kerül az ügyfél PDF-jére")
    .fill("EZ-TITKOS-BELSO-MEGJEGYZES");
  await surveyNav
    .getByRole("button", { name: "Teljes ingatlan munkái", exact: true })
    .click();
  await survey
    .locator('[data-survey-section="property"]')
    .getByRole("combobox", { name: "Munkakatalógusból" })
    .selectOption({ label: "Dugalj szerelés" });
  await survey
    .locator('[data-survey-section="property"]')
    .getByRole("button", { name: "Tétel hozzáadása" })
    .click();
  await survey.getByLabel("Mennyiség", { exact: true }).fill("2");
  await surveyNav
    .getByRole("button", { name: "+ Helyiség hozzáadása", exact: true })
    .click();
  await survey
    .getByRole("button", { name: "Egyedi helyiség hozzáadása", exact: true })
    .click();
  await survey.getByLabel("Helyiség neve").fill("Konyha");
  await survey.getByRole("button", { name: "Mentés", exact: true }).click();
  await expect(
    survey.getByText("Felmérés elmentve.", { exact: true }),
  ).toBeVisible();
  await survey
    .getByRole("button", { name: "← Vissza a projekthez", exact: true })
    .click();
  await expect(survey).not.toBeVisible();
  await page.getByRole("button", { name: "Árajánlat", exact: true }).click();
  await page.getByRole("button", { name: "Új ajánlat", exact: true }).click();
  await section("Munkatételek");
  await dialog()
    .getByRole("combobox", { name: "Felmérés kiválasztása" })
    .selectOption({ label: "Helyszíni felmérés" });
  await section("Alapadatok");
  await dialog().getByLabel("Érvényesség", { exact: true }).fill("2026-12-31");
  await section("Vállalási feltételek");
  const terms = Array.from(
    { length: 40 },
    (_, index) =>
      `${index + 1}. A vállalás részletes feltétele, áttekinthető görgethető szöveggel.`,
  ).join("\n");
  await dialog()
    .getByRole("textbox", {
      name: "Fizetési és vállalási feltételek",
      exact: true,
    })
    .fill(terms);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await section("Munkatételek");
  await section("Vállalási feltételek");
  await expect(
    dialog().getByRole("textbox", {
      name: "Fizetési és vállalási feltételek",
      exact: true,
    }),
  ).toHaveValue(terms);
  await dialog().getByRole("button", { name: "Mentés", exact: true }).click();
  await expect(
    dialog().getByText("Ajánlattervezet elmentve.", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("quote-workspace.png"),
    fullPage: true,
  });
  await section("Árazás és adózás");
  await dialog().getByLabel("Kézi anyagköltség (Ft)").fill("3000");
  await section("Összesítés és PDF");
  await dialog()
    .getByRole("button", { name: "Végleges PDF-pillanatfelvétel készítése" })
    .click();
  await expect(
    dialog().getByText(
      "A végleges ajánlat és eredeti PDF elmentve. Kiküldés nem történt.",
    ),
  ).toBeVisible();
  await section("PDF és dokumentumok");
  const quoteDownload = page.waitForEvent("download", { timeout: 15000 });
  await dialog().getByRole("button", { name: "Letöltés", exact: true }).click();
  await (await quoteDownload).saveAs(info.outputPath("ajanlat.pdf"));
  await section("Küldés / ügyféldöntés");
  await dialog()
    .getByRole("combobox", { name: "Állapot", exact: true })
    .selectOption("accepted");
  await dialog().getByRole("button", { name: "Esemény rögzítése" }).click();
  await expect(
    dialog().getByText("Az esemény rögzítve. Nem történt e-mail-küldés.", {
      exact: true,
    }),
  ).toBeVisible();
  await dialog()
    .getByRole("button", { name: "← Vissza a listához", exact: true })
    .click();
  await page.getByRole("button", { name: "Anyagok", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Anyaglista ajánlatverziója" })
    .selectOption({ index: 1 });
  await page.getByRole("button", { name: "Eltérések előnézete" }).click();
  await page.getByRole("button", { name: "Frissítés jóváhagyása" }).click();
  await expect(page.getByText("Számított: 4 m", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Anyaglista szerkesztése", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await dialog()
    .getByLabel("Ténylegesen szükséges mennyiség", { exact: true })
    .fill("5");
  await section("Anyagok megjegyzései");
  await dialog()
    .getByRole("textbox", { name: "Anyag megjegyzése", exact: true })
    .fill("Külön ellenőrzött anyagigény.");
  await dialog().getByRole("button", { name: "Mentés", exact: true }).click();
  await expect(
    dialog().getByText("Anyaglista mentve.", { exact: true }),
  ).toBeVisible();
  await dialog().getByRole("button", { name: "Mentés", exact: true }).click();
  await expect(
    dialog().getByText("Anyaglista mentve.", { exact: true }),
  ).toBeVisible();
  await dialog()
    .getByRole("button", { name: "← Vissza a listához", exact: true })
    .click();
  await expect(page.getByText("Szükséges: 5 m", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Jegyzőkönyv", exact: true }).click();
  await page.getByRole("button", { name: "Új jegyzőkönyv" }).click();
  await section("Elvégzett munka / leírások");
  await dialog()
    .getByRole("textbox", { name: "Ténylegesen elvégzett munka", exact: true })
    .fill("Két dugalj cseréje és ellenőrzése.");
  await section("Lezárási ellenőrzések");
  await expect(
    dialog().getByRole("button", { name: "Tartalom áttekintése és aláírás" }),
  ).toBeDisabled();
  await dialog().getByLabel("Rendezett munkaterület", { exact: true }).check();
  await dialog().getByLabel("Ügyfél tájékoztatása", { exact: true }).check();
  await dialog().getByLabel("Dokumentumok átadása", { exact: true }).check();
  await dialog()
    .getByRole("button", { name: "Tartalom áttekintése és aláírás" })
    .click();
  await section("Aláírások és PDF");
  for (const label of ["Ügyfél aláírása", "Vállalkozó aláírása"]) {
    const canvas = dialog().locator(`canvas[aria-label="${label}"]`);
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Nincs aláírásmező");
    await page.mouse.move(box.x + 20, box.y + 25);
    await page.mouse.down();
    await page.mouse.move(box.x + 80, box.y + 45, { steps: 10 });
    await page.mouse.move(box.x + 140, box.y + 20, { steps: 10 });
    await page.mouse.up();
  }
  await dialog()
    .getByRole("button", { name: "Végleges jegyzőkönyv és PDF" })
    .click();
  await expect(
    dialog().getByText("A jegyzőkönyv és eredeti PDF véglegesen elmentve."),
  ).toBeVisible();
  await section("PDF és dokumentumok");
  const handoverDownload = page.waitForEvent("download", { timeout: 15000 });
  await dialog().getByRole("button", { name: "Letöltés", exact: true }).click();
  await (await handoverDownload).saveAs(info.outputPath("jegyzokonyv.pdf"));
  await dialog()
    .getByRole("button", { name: "← Vissza a listához", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Számlák", exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Kiállított számla rögzítése" })
    .click();
  await dialog()
    .getByLabel("Hiányos tervezet – kimarad a pénzügyi összesítésből")
    .uncheck();
  await dialog().getByLabel("Tényleges számlaszám").fill("TESZT-2026-001");
  await section("Dátumok és összegek");
  for (const label of [
    "Kiállítás dátuma",
    "Teljesítés dátuma",
    "Fizetési határidő",
  ])
    await dialog().getByLabel(label, { exact: true }).fill("2026-10-23");
  await dialog().getByLabel("Nettó", { exact: true }).fill("10000");
  await dialog().getByLabel("Adó", { exact: true }).fill("0");
  await dialog().getByLabel("Bruttó – előleglevonás előtt").fill("10000");
  await dialog().getByLabel("Fizetési mód", { exact: true }).fill("Átutalás");
  await dialog()
    .getByRole("button", { name: "Kiállított számla végleges rögzítése" })
    .click();
  await expect(
    dialog().getByText(
      "A külső számla adatai rögzítve. Számlakiállítás nem történt.",
    ),
  ).toBeVisible();
  await section("Befizetések");
  await dialog().getByLabel("Összeg (HUF)", { exact: true }).fill("4000");
  await dialog().getByLabel("Befizetés módja").fill("Átutalás");
  await dialog().getByRole("button", { name: "Befizetés rögzítése" }).click();
  await expect(dialog().getByText(/nyitott:/)).toContainText("6");
  await dialog()
    .getByRole("button", { name: "← Vissza a listához", exact: true })
    .click();
  await page.getByRole("button", { name: "Naptár", exact: true }).click();
  await page.getByRole("button", { name: "Új időpont" }).click();
  await dialog().getByLabel("Időpont neve").fill("Visszatérés");
  await dialog().getByLabel("Kezdés (budapesti idő)").fill("2026-11-01T12:00");
  await dialog()
    .getByLabel("Befejezés (budapesti idő)")
    .fill("2026-11-01T13:00");
  await dialog().getByRole("button", { name: "Mentés", exact: true }).click();
  await expect(page.getByText("Visszatérés", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Beállítások", exact: true }).click();
  await page
    .getByRole("button", { name: "Adatok és mentések", exact: true })
    .click();
  await page
    .getByLabel("Külön mentési jelszó (legalább 12 karakter)")
    .fill("Kulon-mentesi-jelszo-2026");
  const backupDownload = page.waitForEvent("download", { timeout: 15000 });
  await page
    .getByRole("button", { name: "Teljes üzleti mentés készítése" })
    .click();
  const file = await backupDownload,
    path = await file.path();
  if (!path) throw new Error("Nincs letöltött mentési fájl");
  await page
    .getByLabel("Mentési fájl ellenőrzése", { exact: true })
    .setInputFiles(path);
  await expect(
    page.getByText("A számítógépről visszaolvasott fájl ellenőrzése sikeres.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Visszaállítás előnézete" }),
  ).toBeVisible();
  await page
    .getByLabel("Új próbaadattár feloldó jelszava")
    .fill("Visszaallitott-jelszo-2026");
  await page
    .getByRole("button", { name: "Elkülönített próba-visszaállítás" })
    .click();
  await expect(
    page.getByText("Külön próbaadattár létrejött.", { exact: false }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Helyi próbamód megnyitása" }).click();
  await page
    .getByLabel("Helyi jelszó", { exact: true })
    .fill("Visszaallitott-jelszo-2026");
  await page.getByRole("button", { name: "Megnyitás", exact: true }).click();
  await page.getByRole("button", { name: "Projektek", exact: true }).click();
  await page
    .getByRole("button", { name: /Érdeklődés.*Teljes munkafolyamat próba/ })
    .click();
  await page
    .getByRole("button", { name: "Számlák", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("cell", {
      name: "TESZT-2026-001 Normál számla",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Megnyitás", exact: true }).click();
  await section("Befizetések");
  await expect(dialog().getByText(/nyitott:/)).toContainText("6");
  await dialog()
    .getByRole("button", { name: "← Vissza a listához", exact: true })
    .click();
  await page.getByRole("button", { name: "Dokumentumok", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Letöltés", exact: true }),
  ).toHaveCount(2);
  const restoredDownload = page.waitForEvent("download", { timeout: 15000 });
  await page
    .getByRole("button", { name: "Letöltés", exact: true })
    .first()
    .click();
  await (
    await restoredDownload
  ).saveAs(info.outputPath("visszaallitott-eredeti.pdf"));
  expect(errors).toEqual([]);
  await page.screenshot({
    path: info.outputPath("workflow.png"),
    fullPage: true,
  });
});
