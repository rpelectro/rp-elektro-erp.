# Ellenőrzési jegyzék — E-RP 0.2.0

Dátum: 2026. október 23. Környezet: Linux, Node.js 24.19.0, Chromium 153.0.8010.0. Minden próba létrehozott mintaadatokon futott; a régi ERP és valódi ügyféladatok nem voltak elérve vagy módosítva.

| Ellenőrzés                               | Eredmény                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| TypeScript + Vite termelési build és PWA | Sikeres: `npm run build`                                                                                     |
| Vitest                                   | 35 sikeres teszt, 7 fájl: `npm test`                                                                         |
| Playwright                               | 4 sikeres böngészős teszt, asztali és 390 × 844 mobilnézettel                                                |
| Futásidejű csomagok npm auditja          | 0 ismert sérülékenység: `npm audit --omit=dev --audit-level=moderate`                                        |
| PDF                                      | Magyar szöveg és számítás kiolvasással ellenőrizve; ajánlat és kétoldalas jegyzőkönyv vizuálisan ellenőrizve |

## Unit- és integrációs ellenőrzések

- Pontos pénzbeolvasás és magyar tizedesvessző, hibás/túl nagy mennyiség és összeg elutasítása; ajánlati számítás és kerekítés, anyagreceptek összesítése, kézi felülbírálás megőrzése.
- Végleges dokumentumok változtathatatlansága, számla/befizetés kapcsolatok, részfizetés és visszavonás, teszt/díjbekérő kizárása, előlegbeszámítás és devizák elkülönítése; budapesti DST időkezelés.
- Helyi titkosított adattár létrehozása, mentése, újranyitása; helytelen jelszó és sérült ciphertext elutasítása; olvasható üzleti adat hiánya a tárolt rekordban; párhuzamos íráskor verzióütközés.
- Teljes mentés titkosítása, visszaolvasása, fájlhash és kapcsolatok ellenőrzése, izolált visszaállítás; sérült fájl és hibás jelszó elutasítása. Visszavont befizetést tartalmazó mentés is ellenőrizhető.
- Offline műveletsor megmarad újranyitás után; elveszett szerverválasz után ugyanaz a műveletazonosító próbálódik újra; ütközésnél nincs csendes felülírás, kifejezett feloldás kell.
- Mindkét valódi SQL-migráció futtatása PGlite PostgreSQL-motoron modellezett Supabase `auth` és `storage` sémákkal. AAL1 tilalom, AAL2 tulajdonosok elkülönítése, idegen vállalkozásba írás tiltása, tulajdonos/azonosító változtathatatlansága, szerververzió és CAS.
- Szerveroldali `erp_apply` idempotencia: azonos művelet ismétlése ugyanazt az eredményt adja, nincs dupla rekord. Ismeretlen mező, hamis tenant és elavult verzió elutasítva. Végleges számla módosítása és jegyzőkönyv nélküli projektlezárás tiltva.
- Privát Storage-policyk: saját fájl feltölthető, idegené nem érhető el; eredeti fájl felülírása/törlése tiltott.
- Worker tényleges forrásának tesztje SQLite alapú D1-adapterrel és szimulált hálózattal: refresh token titkosítása, hibás kulcs/idegen origin/AAL1 elutasítása; elveszett Google-válasz után stabil azonosítóval egyetlen esemény marad, meghívott és automatikus értesítés nélkül.

## Böngészőben végigpróbált működés

1. Két ablakban ütköző szerkesztés: a helyi űrlap megmarad, elavult mentés megáll, explicit frissítéssel a másik ablak valódi módosítása betöltődik.
2. Ügyfél, projekt és munkatétel létrehozása, ügyfélkapcsolat és eltérő munkavégzési cím; jelszavas újranyitás, szerkesztés, archiválás és visszaállítás.
3. Mobilmenü, űrlap és nem mentett módosítás elvetési figyelmeztetése; nincs oldalszintű vízszintes túllógás 390 × 844 méreten.
4. A teljes munkafolyamat termelési builden, PWA felkészítése után **megszakított internetkapcsolattal**:
   - Cégadat, AAM, ügyfél, munkakatalógus, anyag és recept, projekt.
   - Felmérés, helyiség, két munkatétel-egység és belső jegyzet.
   - Végleges magyar ajánlat-PDF: 7 000 Ft munkadíj + 3 000 Ft kézi anyag = 10 000 Ft. A titkos belső megjegyzés nem szerepel a kiolvasott PDF-ben.
   - Ajánlat elfogadásának kézi bejegyzése; receptből 4 m vezeték.
   - Három kötelező lezárási ellenőrzés, mindkét rajzolt aláírás és végleges jegyzőkönyv-PDF. Az aláírásblokk egy oldalon marad.
   - Kézi számlanyilvántartás: 10 000 Ft, 4 000 Ft részfizetés, 6 000 Ft nyitott összeg.
   - Budapesti időpont rögzítése.
   - Titkosított mentés letöltése és a ténylegesen mentett fájl visszaolvasásos ellenőrzése.
   - Új, külön helyi adattárba visszaállítás, internet nélküli oldal-újratöltés, jelszavas feloldás; számla és részfizetés megnyitása, két eredeti PDF letöltése a visszaállított állományból.
   - Nem volt böngészőoldali `pageerror` a teljes próba alatt.

## A bizonyítás határai

- Nincs élő Supabase-, Cloudflare-, SMTP- vagy Google-kapcsolat. Nem történt publikálás, fizetős megrendelés vagy régi adatimport.
- A PostgreSQL/RLS teszt tényleges SQL-t futtat, de modellezett Auth/Storage környezetben. A PostgREST, valódi JWT, élő TOTP, Storage API és több eszköz közötti éles szinkron külön elfogadási próba.
- A Worker-teszt szimulált Google-válaszokat használ. OAuth jóváhagyás, valós tokenlejárat, D1/Workers éles környezet és Google-kvóták nincsenek igazolva.
- A böngészőteszt helyi próbamódban fut; a helyi tárolót és PDF/offline visszaállítást bizonyítja. A valódi felhős teljes folyamatot nem helyettesíti. Fotó és számlaeredeti feltöltéshez további éles fájlpróba szükséges.
- A Playwright szokásos Chromium-letöltése ebben a környezetben üres/hibás ZIP-et adott. A sikeres futtatás külön Chromium 153 binárist használt az `ERP_CHROMIUM_PATH` változóval. A végfelhasználói csomag ezt nem igényli. Firefox/Safari, valódi telefon és Windows CMD futtatás nem volt elérhető; a Windows-indító tartalma átnézett, az általa hívott npm/build/preview lépések Linuxon működnek.
- A build méretfigyelmeztetése nem hiba: fő JS kb. 580 kB (gzip 167 kB), külön PDF-modul kb. 1,14 MB (gzip 507 kB). A PWA kb. 2,54 MiB saját alkalmazásfájlt precache-el. A dinamikusan és statikusan is importált dokumentumsegédre Vite figyelmeztet, a működés sikeresen ellenőrzött.
- Az audit az adott pillanatban ismert, futásidejű függőségi adatbázist ellenőrzi; nem teljes biztonsági audit.
- Valódi helyreállító e-mail, teljes elveszett-TOTP eljárás és tényleges havi költség saját fiókkal ellenőrizendő. Régi exportformátumhoz író importadapter még nincs.

A csomagban lévő `dist` publikus Supabase-beállítások nélküli próbabuild. Éles használathoz saját publikus konfigurációval új build és a fenti elfogadási kör szükséges.
