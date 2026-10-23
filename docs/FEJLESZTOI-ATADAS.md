# Fejlesztői átadás — E-RP 0.2.0

Dátum: 2026. október 23. Önálló React/TypeScript/Vite forrás, jelenleg külső Git-repó és éles telepítés nélkül. A ZIP tartalmazza a lockfájlt, a forrást, a próbabuildet, a migrációkat és a teszteket. Valódi ügyféladat, szolgáltatói titok és éles környezeti fájl nincs benne.

## Rögzített döntések

- Külön ERP, Supabase Database/Auth/Storage, Cloudflare Pages. Nem Sites és nem a HomeHub adatbázisának bővítése.
- Egy tulajdonos, e-mail/jelszó/TOTP, tartalék hitelesítő, AAL2-vel védett üzleti adatok.
- Számlázás elsőként külső kézi Számlázz.hu #profi; Agent-használat és kulcs nincs.
- Bejövő számla későbbi bővítés. Anyagokhoz nincs készlet/beszerzés/árkezelés.
- Teljes havi célkeret legfeljebb 5 000 Ft, a meglévő #profi díját is beleszámítva. Tényleges szolgáltatói számlák és limitek ellenőrizendők.
- Nincs csendes adatfelülírás, végleges dokumentum újraszámítása, ismeretlen fizetettség kitalálása vagy régi adatok automatikus összevonása.

## Forrás térképe

| Fájl                                           | Feladat                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `domain.ts`, `business.ts`                     | Alap- és üzleti sémák, számítások, kapcsolati és véglegesítési ellenőrzések           |
| `local.ts`                                     | IndexedDB, jelszavas titkosítás, verzióellenőrzés, műveletsor, elkülönített adattárak |
| `cloud.ts`                                     | Publikus konfiguráció, Supabase Auth/RPC/Storage adapter                              |
| `offline.tsx`, `SyncBar.tsx`                   | Helyi felkészítés, soros feltöltés, újrapróbálás, ütközések és állapotjelzés          |
| `Auth.tsx`, `Account.tsx`                      | Jelszó/TOTP, munkamenetválasztás, offline feloldás, tartalék TOTP                     |
| `App.tsx`, `Workflow.tsx`                      | Alapadatok és projektmunkafolyamatok                                                  |
| `Invoices.tsx`, `Calendar.tsx`, `Upcoming.tsx` | Kézi pénzügyi nyilvántartás és időpontok                                              |
| `documents.ts`, `pdf.ts`, `PhotoPreview.tsx`   | Eredeti fájlok, hash, PDF magyar helyi fonttal, fotónézet                             |
| `backup.ts`, `WorkspaceSettings.tsx`           | Teljes mentés, fájlellenőrzés, izolált visszaállítás, importelőnézet, sablonok        |
| `worker/`                                      | Google OAuth, titkosított refresh token, D1-kapcsolatok és egyirányú szinkron         |

Alaptáblák: `companies`, `partners`, `projects`, `work_items`. Az `entries` típusos JSONB üzleti payloadokat tárol: survey, quote, materials, handover, invoice, payment, document, event, decision, preferences, material, recipe. Kliensoldali Zod és szerveroldali trigger/RPC szabályok ellenőrzik. A szerver nem fogad szabad tábla- vagy mezőnevet. A migrációk normál Supabase projektre készültek, az Auth/Storage sémák jelenlétére támaszkodnak.

A pénz egész század devizaegység, a mennyiség egész ezred egység. A tételszorzás BigInttel és rögzített kerekítéssel történik. Az ajánlat saját ár- és receptpillanatot visz; a katalógus utólagos módosítása nem módosítja. A lezárt ajánlat/jegyzőkönyv és végleges számla/pénzmozgás/dokumentum nem szerkeszthető. Befizetés javítása visszavonási bejegyzéssel történik. A tesztszámla és díjbekérő kimarad az árbevételi összesítésből. Külön devizák nincsenek átváltva vagy összemosva.

## Offline és szinkron invariánsok

Az üzleti mentés és a hozzá tartozó műveletazonosító egy IndexedDB tranzakcióban rögzül. Ugyanaz az UUID kerül az `erp_apply` RPC-nek; a szerver műveleti naplója elveszett hálózati válasz után is ugyanazt az eredményt adja, duplikálás nélkül. A szerver a vállalkozáson belüli módosításokat zárolja és ellenőrzi az elvárt verziót. Ütközésnél azonos rekord további műveletei várakoznak. A felhasználó két változatot lát és kifejezetten választ; a helyi előzmény titkosítva megmarad. Nincs automatikus mezőszintű összeolvasztás.

A fájlazonosító a vállalkozás és SHA-256 alapján képződik. A feltöltés és a dokumentumrekord külön lépés, sikertelenség után újrapróbálható. A műveletsor sorrendjét és a tervezet → fájl → végleges dokumentum kapcsolatot meg kell őrizni. Végleges dokumentum nem jelölhető sikeresnek a kapcsolt eredeti PDF nélkül.

A PWA az alkalmazás saját shelljét, fontját és kódját precache-eli. A privát üzleti adatok saját titkosított tárolóba kerülnek, nem általános API-response cache-be. A frissítés felhasználói jelzésre aktiválódik. A helyi kulcs kizárólag a feloldott folyamat memóriájában él. A böngésző eredetenként és profilonként külön tárhelyet használ.

## Google háttérszolgáltatás telepítése

Előkészített forrás, nem élesre kötött szolgáltatás. A `worker/wrangler.toml` helykitöltőit valódi értékekkel kell kitölteni. Worker és D1 szükséges; ezek kerete és költsége külön ellenőrizendő. Google callback: a Worker HTTPS-originje + `/callback`.

1. Saját Cloudflare-fiókban hozz létre D1-adatbázist, alkalmazd a `worker/schema.sql` sémát, és írd be az adatbázis azonosítóját a konfigurációba.
2. Add meg a pontos `APP_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `GOOGLE_CLIENT_ID` változókat. A Google OAuth webalkalmazásban állítsd be a callbacket, a szükséges API-t és a tulajdonosi hozzáférést. A tesztüzem token-élettartamát és az engedélyezési követelményeket a saját projektben ellenőrizni kell.
3. Védett Worker secretként add meg a `GOOGLE_CLIENT_SECRET` értéket és a 32 kriptográfiailag véletlen bájtból képzett base64 `TOKEN_SEAL_KEY` értéket. A kulcs elvesztése/forgatása új Google-összekapcsolást igényelhet. Egyik sem Vite-változó.
4. Saját, ellenőrzött Wrangler eszközzel telepítsd a Workert. A felület buildjében add meg a rögzített `VITE_CALENDAR_WORKER_URL` HTTPS-címet, és buildelj újra. A felület tetszőleges más címre nem küld hozzáférési tokent.
5. A tulajdonos AAL2 belépése után a Beállításokban kapcsolja össze a Google-fiókot. Először egy próbaeseménnyel ellenőrizd a létrehozást, szerkesztést, lemondást és megszakadt válasz utáni újrapróbálást.

A kapcsolat az elsődleges Google-naptárba ír, a `calendar.events.owned` jogosultsággal. ERP → Google egyirányú; nincs meghívott, automatikus e-mail vagy sendUpdates. Csak saját privát ERP-metaadattal rendelkező eseményt írhat felül/törölhet. Stabil eseményazonosító, szerveroldali tokenlezárás, OAuth-state/cookie, AAL2/owner-ellenőrzés, vállalkozásonkénti szinkronzár és napi 1 000 API-hívásos technikai korlát van. A kapcsolat bontása a szerveroldali refresh tokent eltávolítja, a már létrehozott eseményeket megtartja. A Google-oldali jogosultság külön is visszavonható.

## Hiányzó bemenetek és hátralévő éles átvétel

| Feltétel                | Mi hiányzik és mikor kész?                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Saját Supabase/Pages    | Nincs hozzáférés vagy telepített alkalmazás. Migráció, tulajdonos, publikus konfiguráció és HTTPS build után valódi API-próba szükséges. |
| Auth/SMTP/TOTP          | A kód megvan, élő levélkézbesítés, TOTP és teljes elveszett-eszköz helyreállítás nincs igazolva. Próbatulajdonossal végig kell járni.    |
| Éles offline egyeztetés | A helyi tároló és idempotens szerver külön tesztelt; valódi PostgREST/Storage hálózattal több eszközön is ellenőrizendő.                 |
| Google                  | Forrás és mockteszt kész, saját OAuth, Worker és D1 nincs telepítve/engedélyezve.                                                        |
| Régi ERP-import         | Export és eredeti fájlok hiányoznak. Csak belső formátumelőnézet van; nincs író importadapter.                                           |
| Nagy állományok         | Böngészős mentés 100 MiB eredeti fájlig. Nagyobb tárhoz külön üzemeltetői export szükséges.                                              |
| Agent                   | Szándékosan későbbi feladat, működő kézi út mellett.                                                                                     |

A régi import következő fejlesztése: változatlan forrásmásolat, formátum és fájlok feltérképezése, régi forrásazonosítókon alapuló megfeleltetés, izolált próbaimport, eredeti dokumentumok és aláírások megőrzése, darabszám/összeg/hash jegyzék, ismételt import duplikációvédelme, majd kifejezett éles átvezetés. Névegyezés alapján ne vonj össze ügyfeleket; bizonytalan összeget vagy fizetettséget ne találj ki.

Az élő elfogadási körben igazolni kell: más felhasználó/AAL1 nem olvas adatot vagy fájlt; lejárt munkamenet nem töröl offline munkát; megszakadt feltöltés nem duplikál; két eszköz ütközése megőrzi mindkét változatot; teljes mentésből eredeti PDF is nyitható; nincs TOTP-megkerülés; a valódi SMTP működik; a saját díjak beleférnek a keretbe. Ezek nélkül a helyi próba nem éles üzemi átvétel.
