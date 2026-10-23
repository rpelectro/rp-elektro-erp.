# CODEX HANDOVER — E-RP / RP Elektro

**Átadás dátuma:** 2026. október 23. (Europe/Budapest).  
**Alkalmazás:** `rp-elektro-erp`, a `package.json` szerint **0.2.0**.  
**Dokumentum nyelve:** magyar. **Átadási cél:** a meglévő projekt folytatása, nem újraírása.  
**Állapot:** működő helyi próba és jelentős elkészült forráskód; az éles szolgáltatói átvétel, a régi adatok tényleges importja és néhány részlet befejezése még hátravan.

## 0. Hogyan használd ezt az átadást?

Ez a dokumentum az átadott forrás pillanatfelvételét írja le. Az eredeti elfogadott működési specifikáció teljes szövegét is tartalmazza a mellékletben, hogy a ritkább követelmények se vesszenek el. A specifikáció tervezési állításai nem jelentenek automatikusan elkészült kódot. A jelenlegi állapotot az alábbi modulértékelés, a tesztbizonyítékok és a konkrét kód együtt határozza meg.

Jelölések:

- **[FELHASZNÁLÓ]**: a hozzáférhető üzenetben ténylegesen kért vagy pontosított igény.
- **[ELFOGADOTT TERV]**: az `ERP-mukodesi-terv.md` működési specifikációban rögzített terv; nem minden részlethez látható az eredeti, szó szerinti jóváhagyó párbeszéd.
- **[KÓD]**: a jelenlegi forrásból kiolvasható implementáció.
- **[TESZT]**: ténylegesen lefuttatott ellenőrzés által lefedett eset.
- **[JAVASLAT]**: az átadásban felvetett következő megoldás, amely nem eredeti felhasználói döntés.
- **NEM ISMERT**: nincs megbízható adat. **ELLENŐRIZENDŐ**: a pontos működés további ellenőrzést igényel.

Állapotok: **KÉSZ** = a megnevezett körben megvalósítva és ellenőrizve; **RÉSZBEN KÉSZ** = van kód, de a teljes követelmény nincs lezárva; **NINCS KÉSZ** = hiányzó implementáció; **HIBÁS** = azonosított probléma; **NEM ELLENŐRZÖTT** = nincs elegendő bizonyíték. A „KÉSZ, helyi próba” nem jelenti, hogy a szolgáltatások élesben be vannak kötve.

### 0.1. A források és az előzmények elérhetőségének határa

Az átadás készítésekor hozzáférhető volt:

1. A jelen beszélgetés látható felhasználói üzenetsora, a legutóbbi fejlesztési műveletek és azok eredményei.
2. A korábbi hosszú fejlesztési szakasz megőrzött, részletes munkafolyamat-összefoglalója. Ez **nem azonos a teljes szó szerinti párbeszéddel**.
3. Az `ERP-mukodesi-terv.md` teljes aktuális tartalma: 627 sor, 70 461 bájt, 4. tárolt verzió; saját fejlécében 1.0 specifikáció, 2026. október 23. Az átadáskor újra kiolvasva. Ennek másolata a `docs/ELFOGADOTT-SPECIFIKACIO.md`.
4. A teljes jelenlegi `erp/` forrás, konfigurációk, SQL-ek, tesztek, dokumentáció és helyi build.
5. A korábbi `ERP-v0.1.0.zip`, a `ERP-v0.2.0.zip`, valamint a fejlesztési tesztkimenetek.

Nem áll rendelkezésre a korábbi párbeszéd minden asszisztensválasza szó szerint; az eredeti kattintható felületterv önálló, teljes forrása; a HomeHub teljes forrása; a régi ERP teljes forrása/adatexportja; éles szolgáltatói hozzáférés; a felhasználó gépének tényleges telepítési útvonala. A videó- és képi korábbi anyagokból nem vezetünk le ellenőrizetlen új követelményt. Nem állítjuk, hogy az elveszett előzményeket visszaolvastuk. A dokumentum a hozzáférhető anyagokkal teljes, az elveszett szó szerinti történet teljességét nem garantálja.

**Irányadó sorrend:** legutolsó kifejezett felhasználói döntés → elfogadott működési terv → megvalósított kód tényei → ellenőrzések. Eltérésnél ne igazítsd át csendben a követelményt a kódhoz: rögzítsd az eltérést és javítsd megfelelően.

## 1. Projektcél, történet és érvényes döntések

### 1.1. Az eredeti szándék

**[FELHASZNÁLÓ]** A felhasználónak a HomeHub elkészítésének megoldása jobban tetszett, mint a korábbi ERP-é. Azt kérte, hogy az ERP-t is ilyen fejlesztési iránnyal készítsük újra, de előtte a teljes működést, feladatokat, felépítést és képességeket beszéljük át. Azt is kérdezte, hogy a korábbi ERP stabilitását újabb modell vagy egyszerűbb feladat okozta-e. Ehhez összehasonlítható mérési adat nem ismert; ne építs technológiai döntést feltételezett modellfölényre.

Cél: villanyszerelő vállalkozás napi munkáinak végigvezetése egy saját alkalmazásban, a megkereséstől/felméréstől az ajánlaton és anyagigényen át az átadásig, számlanyilvántartásig és fizetésig. A felhasználó helyszínen telefonról/tabletről, irodában számítógépről is használni szeretné. A rendszer maradjon átadható és saját fiókokkal működtethető.

### 1.2. A hozzáférhető történet sorrendben

| Szakasz | Döntés vagy történés | Érvényes következmény |
| --- | --- | --- |
| Újratervezés | HomeHubhoz hasonló fejlesztés, előtte teljes működési egyeztetés | React/TS/Vite, külön ERP, terv megőrzése |
| Anyagok pontosítása | „Csak az anyagok a beszerzés nem kell most” | Szükséglet és mennyiség; nincs beszerzés/készlet/árkatalógus |
| Számlázási igény | Számlázz.hu-kapcsolatra rákérdezett és támogatta | Bővíthető alap, de a legutolsó döntés szerint kézi első ütem |
| Adattárolás | Supabase-t kérte, majd elfogadta | Database/Auth/Storage, külön projekt |
| Keret | Legfeljebb 5 000 Ft teljes havi szolgáltatási keret | Nem új többletkeret; meglévő számlázási díj is része |
| Agent-költség vita | Korábban ingyenesnek ígért API-t számon kérte, hivatalos linket kért | A téves korábbi ígéretet nem visszük tovább; éles használat díja külön ellenőrzendő |
| Számla/bizonylat tisztázása | A számla és a bejövő számla jelentésére kérdezett rá | Bejövő = más állítja ki neki; nem ugyanaz, mint külső felületen kiállított saját kimenő |
| Bejövő előkészítése | Később bejövőkkel is foglalkozna, most készítsük elő | Adatmodell bővíthetősége; teljes bejövő workflow később |
| Előfizetés pontosítása | Neki #profi van, nem #free | Ne tervezz mellé új #start alapcsomagot |
| Végleges számlázási első ütem | Kézzel állítaná ki a számlát a Számlázz.hu-n, API később | Nincs Agent-kulcs, nincs automatikus kiállítás; nyilvántartás és PDF/fizetések |
| Fejlesztés engedélyezése | Többször „mehet”, „csináld meg mind”, később kifejezetten minden megbeszélt funkciót kért | Önálló haladás a meghatározott keretben; ne helyettesítsd a teljes tervet kis demóval |
| Első alapverzió | 0.1.0 forráscsomag: alapadatok és adattárolás | Nem volt a teljes ERP; ezt utólag egyértelművé kellett tenni |
| Windows telepítés | `npm ci` EUSAGE, prompt: `PS C:\Users\bojle>` | Hiányzó lockfájl/nem megfelelő munkamappa; teljes ZIP, pontos `erp` mappa és külön parancsblokkok szükségesek |
| Telepítési visszajelzés | A felhasználó végül hibamentes futást jelzett | A gépén történő pontos funkciópróba nem dokumentált |
| Teljesebb kiadás | 0.2.0 munkafolyamat, offline, mentés, tesztek és átadási csomag | Jelenlegi folytatási alap |
| Aktuális kérés | Részletes Codex-átadás és teljes forrás-ZIP | Most dokumentálás és csomagolás történt; új üzleti funkciót ez a kör nem implementált |

A „tetszik”, „like it”, „good”, „oké” visszajelzések elfogadó hangvételét megőrizzük, de a nem látható asszisztensjavaslatokhoz nem találunk ki részletes jóváhagyást vagy pontos UI-pixelkövetelményt. A korábbi „linket” üzenet önmagában nem azonosít éles ERP-címet.

### 1.3. Végleges keretek és kizárások

- **[FELHASZNÁLÓ/ELFOGADOTT TERV]** HomeHub technológiai iránya: saját React + TypeScript + Vite, Supabase Database/Auth/Storage, Cloudflare Pages. A régi Sites ERP-t nem fejlesztjük tovább; új Sites-projekt sem cél.
- A HomeHub és az ERP forrása/adatbázisa külön; nincs engedély nélküli közös üzleti tároló.
- Egy tulajdonosi fiók, zárt regisztráció, jelszó + TOTP. Többfelhasználós szerepkörmodell nincs most megrendelve.
- Teljes havi plafon 5 000 Ft. Meglévő #profi valódi díja és fizetési gyakorisága **NEM ISMERT**. Új kötelező előfizetés nem lett kiválasztva/megrendelve.
- Első számlázási mód `manual`, szolgáltató `szamlazz.hu`; Agent későbbi külön bővítés. A rendszer nem számláz automatikusan újracsatlakozáskor sem.
- Bejövő számlákból most csak alap-előkészítés; nincs OCR, NAV-import, banki egyeztetés vagy könyvelői export vállalva.
- Anyagok: recept, szükséglet, mennyiség, kézi korrekció. Nincs készlet, rendelés, beszállítói ár vagy beszerzési állapot.
- A régi ERP és üzleti adatai megőrzendők. Az átadás nem engedély a régi rendszer törlésére.
- Nincs automatikus ügyfélmeghívó vagy dokumentumküldés. A dokumentum létrehozása, elküldése, elfogadása és kifizetése külön állapot.
- Nincs garantált „30 napig megbízható eszköz”, korlátlan Free infrastruktúra vagy jelszó nélküli titkosítási helyreállítás.

### 1.4. Működési és megjelenési elvárások

Magyar felület, ékezethelyes többoldalas PDF, budapesti naptáridő, valós mentési állapotok. A projekt fülei: Áttekintés / Felmérés / Árajánlat / Anyagok / Jegyzőkönyv / Számlák / Dokumentumok. **Külön Munkalap fül nincs az elfogadott tervben.** Főmenü: Irányítópult / Projektek / Naptár / Ügyfelek / Számlák / Beállítások.

A jelenlegi implementáció sötét oldalsávot, világos munkaterületet, sárga kiemelést, táblázatokat/kártyákat és modális szerkesztőket használ. CSS-tények: háttér `#f5f6f8`, tinta `#19222b`, kiemelés `#f3c546`, szöveg `#202932`, rendszerfont-lánc; nincs külső fontszolgáltatás. Ezek a meglévő kód tényei, nem szó szerint megőrzött felhasználói színkód-előírások. A korábbi felületterv vizuális irány volt; teljes pixelpontos megfelelés **NEM ELLENŐRZÖTT**.

Használhatóság: ne vesszen el csendben a szerkesztett adat, legyen mobilmenü, visszajelzés és hibajelzés. A felhasználó pontos, ellenőrzött állításokat vár, nem kér felesleges visszakérdezést. Parancsokat Windows alatt külön kódblokkokban adj; ne feltételezd, hogy a terminál eleve a projektmappában áll.

## 2. Üzleti munkafolyamat és modulok

### 2.1. A projekt a munka központja

Egy munka egy projekt; egy ügyfélnek több projektje és projektenként eltérő munkavégzési címe lehet. Szokásos lánc: megkeresés → felmérés → ajánlat és döntés → időpont/anyagelőkészítés → munkavégzés → átadás → számlázás/fizetés → archiválás. Rövid munkánál a felmérés kihagyható: közvetlen katalógusos vagy egyedi ajánlat. Nem generálunk helyette fiktív felmérést.

Projektállapotok a kódban: `inquiry` Érdeklődés, `survey` Felmérés, `quoted` Ajánlat elküldve, `scheduled` Ütemezve, `in_progress` Folyamatban, `handover` Átadás, `completed` Lezárva. Ezek szerkeszthető projektstátuszok; nem jelentenek automatikus ajánlatdöntést, számlát vagy fizetést. Lezáráshoz végleges, három ellenőrzésen átment jegyzőkönyv szükséges a helyi mentésben és a szerveroldali státuszváltási triggerben.

### 2.2. Ügyfelek és helyszínek

**Cél:** kapcsolattartási és számlázási alapadat. **Felület:** új ügyfél, szerkesztés, keresés, archiválás/visszaállítás; projektnél kiválasztás. **Adat:** név, e-mail, telefon, `billing_address`, belső megjegyzés, archiválás. A név kötelező, e-mail csak megadáskor ellenőrzött. Projekt külön `site_address` mezőt tárol.

**Jogosultság:** tenant + tulajdonos + AAL2 az éles adatnál; helyi próba jelszavas vault. A projekt ügyfele csak azonos vállalkozásból jöhet, SQL összetett idegen kulccsal is védve. Az archivált rekord a történeti dokumentumokat nem törli.

**Eltérés:** nincs külön `sites` tábla/helyszíntörzs, partneradószám vagy ügyfél/szállító szerepmező. A helyszín jelenleg projektcím. A tervben szereplő projektből közvetlen ügyfélfelvételt és minden keresési szempontot külön ellenőrizni kell; a meglévő projektűrlap ügyfélválasztást ad. A későbbi szállítói szerepek **NINCSENEK KÉSZ**.

### 2.3. Munkakatalógus, anyagtörzs és receptek

Munkakatalógus a Beállításokban: név, kategória, egység, `price_minor`, leírás, archiválás. Az ár munkadíj, nem anyagár. A katalógus nem tekinthető a felhasználó tényleges árlistájának, amíg nem ő/import tölti fel. Korábbi beszélgetésben megadott példaárakat ne seedeld elfogadott éles tarifaként.

Anyag: saját UUID, név, egység, archiválás (`material` entry). Recept: munkatétel UUID és anyagsorok (`recipe` entry), 1 munkaegységhez szükséges ezred mennyiséggel. Az ajánlatsor lemásolja a munkatétel és recept aktuális értékeit; további katalogusváltozás nem írja át.

Jogosultság közös a többi üzleti adattal. Kapcsolati ellenőrzés a recepteknél nincs azonos mélységben minden kliens/szerver útvonalon; ellenőrizendő. Az egy vállalkozásra jutó preferences, illetve egy munkához tartozó recipe egyediségét nem kényszeríti külön SQL-index. Párhuzamos létrehozásból több rekord keletkezhet; a UI gyakran `.find()` alapján választ.

### 2.4. Felmérés

Saját név és felmérési dátum, teljes ingatlan állapota (`existing`), terve (`planned`), ismeretlen/nem vizsgált rész (`unknown`), belső megjegyzés (`internal_notes`), helyiségek és teljes ingatlanhoz rendelt munkasorok, kiválasztott fotók.

Helyiség: UUID, név, meglévő/tervezett állapot, sorok. Munkasor: UUID, opcionális katalógusazonosító, saját név/egység/mennyiség/munkadíj/elhelyezés/megjegyzés/receptpillanat. A helyiségek ismeretlen állapota nincs külön mezőként, a teljes felmérésben igen. Fotók projekt-dokumentumrekordokra mutatnak.

UI: felmérés létrehozása, szerkesztése, helyiség és tétel hozzáadása, katalógusválasztás/egyedi sor, fénykép feltöltés és kiválasztás. Az ajánlat felmérésből másolatot készít, nem élő összekötést. Belső jegyzet nem kerül az ügyfél PDF-jére. **[TESZT]** felmérés/room/sor és a belső szöveg PDF-ből kihagyása igazolt a próbakörben. A teljes fotó- és többeszközös felmérésfolyamat nem teljes körűen tesztelt.

### 2.5. Árajánlat és ügyféldöntés

Létrehozható projektből, felmérésből, katalógusból és egyedi sorokkal. Az `AJ-...` azonosító dátum + UUID alapú, offline is egyedi; **nem számlaszám**. `series_id` egy dokumentumcsalád, `revision` annak változata, `sealed` a véglegesség.

Az ajánlat saját vállalkozó/ügyfél pillanatképet, helyszínt, keltezést/érvényességet, adózási módot és áfakulcsot, sorokat, kézi anyagösszeget, kifejezett kedvezményt, feltételeket és eredeti PDF-azonosítót tárol. Szerkeszthető munkadíj és recept; a felmérés/cégadat/katalógus eredetije nem változik.

Pénz: tételenként kerekített munkadíj + kézi anyag − kedvezmény = nettó; áfás esetben a nettóhoz adódik az áfa. AAM esetben adó nulla, megfelelő felirat. Ismeretlen adózásnál nem lehet teljesnek látszó végleges ajánlat. PDF: vállalkozó, ügyfél, külön munkacím, azonosító/verzió, dátumok, sorok, összegek, feltételek; helyi DejaVu fonttal, több oldallal. Logó és bankadat a beállításokból kerül be a generáláskor.

Mentési sorrend: tervezet → PDF-előállítás → eredeti fájl/dokumentum kapcsolása → végleges entry a PDF-re mutatva. A végleges dokumentum nem szerkeszthető; új verzió hozható létre. A PDF megőrzése akadályozza meg a későbbi cégadat/katalógus hatására történő történeti átírást.

Külön `decision` entry: `sent` / `changes` / `accepted` / `rejected`, döntési dátum és megjegyzés. Kézzel rögzített esemény, nem tényleges e-mail-küldés vagy online ügyfélportál. A döntések naplója változtathatatlan. Elfogadott ajánlatokból sorozatonként a legmagasabb elfogadott revízió kerül az összesítésbe; a döntések sorrendje `created_at` szerint áll elő. Szélső esetek — azonos időbélyeg, visszadátumozott döntés, több sorozat — további tesztet igényelnek.

### 2.6. Szükséges anyagok

Egy kiválasztott ajánlatverzióból készül az összesítés. Csoportosítási kulcs az anyag UUID + egység; azonos név kevés. A sor munkamennyiségének és a receptmennyiségnek szorzata ezred egységre kerekül. Anyagköltséget ebből nem számítunk.

Payload: `quote_id`, soronként anyagazonosító/név/egység, számított mennyiség, opcionális kézi felülbírálás, kézi jelölés és megjegyzés. Újabb ajánlatverzióra figyelmeztet; frissítéshez előnézet és jóváhagyás kell. A kézi értékek/kiegészítések megőrződnek; több ajánlatverzió mennyisége nem adódik össze. A jelenlegi UI a projekt legutóbb létrehozott anyagtervét kezeli, nem teljes többterves választót.

Készültség: számítás és alapfrissítés tesztelt. A változás-előnézet a következő lista értékeit mutatja; teljes régi–új számszerű eltéréslista nincs. Az ajánlat ugyanazon tervezetének módosítását nem hash/version alapján jelzi, csak magasabb revíziót keres. Ezek befejezendő részletek.

### 2.7. Naptár

Agenda/listanézet, dátumszűrő és korábbi események kapcsoló. Projekthez több felmérés/munkavégzés/visszatérés tartozhat, de projekt nélküli esemény is lehetséges. Kezdet, vég, helyszín, megjegyzés, lemondás és eseményenkénti Google-engedély tárolódik.

Megjelenítés és szerkesztés Europe/Budapest faliórával, UTC ISO tárolással. A `budapestToIso` nyári/téli eltolást próbál; a nem létező vagy kétszer előforduló óraátállítási időt elutasítja, más időpontot kér. Ez jelenlegi implementációs döntés, nem felhasználó által előírt időzóna-választó.

Átfedésnél figyelmeztetés és explicit tudomásulvétel szükséges. Lemondott esemény nem foglal időt. Az esemény vége nem zárja le a projektet. Nincs automatikus ügyfélmeghívó. Havi/heti rácsnézet nem készült; ilyen konkrét követelmény a hozzáférhető tervben nem szerepel.

### 2.8. Átadási jegyzőkönyv és aláírás

Projektenként több jegyzőkönyv, `AT-...` tartós azonosító, sorozat/revízió, dátum, felek pillanatképe és munkacím. Tényleges munka, eltérések, pótmunkák, fennmaradó feladatok, kiválasztott fotók és átadási kiegészítő feltételek. A beállított sablonszöveg új jegyzőkönyvbe másolódik.

Pontosan három kötelező ellenőrzés: rendezett munkaterület, ügyfél tájékoztatása, dokumentumok átadása. Hiányosan tervezet marad. Aláírás előtt tartalom- és fotóelőnézet; ügyfél és vállalkozó külön rajzfelületet kap. Állapot: aláíratlan/részben/mindkét fél által aláírt. **Mindkét aláírás nem kötelező a véglegesítéshez**; az állapotot valósan mutatjuk. Ne vezesd be ezt utólag kötelezőként felhasználói döntés nélkül.

A tartalom módosítása törli az új változat aláírásait; végleges dokumentumhoz új revízió kell, üres aláírásokkal. A rajzok PNG data URL-ként a payloadban tárolódnak, és a PDF-be beágyazódnak — nem külön Storage-aláírásfájlokként. Mentéskor így a strukturált adatok részei is. `signed_at` eszközidő és `timezone` rögzül; nem hiteles időbélyeg és nem minősített elektronikus aláírás. A jelenlegi közös `signed_at` nem két külön személy aláírási ideje.

Eredeti PDF kapcsolása után véglegesít. **[TESZT]** a két aláírásos PDF és offline mentés/visszaállítás bizonyított. Végleges többoldalas PDF vizuálisan is ellenőrizve; az aláírások egy blokkban/oldalon maradtak. Hosszú szöveg/fotó/logó összes kombinációja nincs igazolva.

### 2.9. Kimenő számlanyilvántartás és számlázási adatlap

Számlázási adatlap: projekt ügyfele, számlázási és munkacím, e-mail, elfogadott ajánlatok és összegek, másolás vágólapra. Nem számla és nem kap számlaszámot. A Számlázz.hu külön linkkel nyílik, kézi kiállítás/kiküldés ott történik.

UI: kiállított számla rögzítése, hiányos tervezet, dokumentumtípus, valós számlaszám/dátumok/összegek/deviza/fizetési mód, felek pillanatképe, kapcsolt előzmények, tesztjelölés, PDF-csatolás, keresés, csak nyitottak. Globális lista és projektfül. A valódi számla-PDF feltölthető később; a hiánya addig látható.

Dokumentumtípusok: normál `invoice`, díjbekérő `proforma`, előleg `advance`, végszámla `final`, sztornó `credit`, helyesbítő `correction`. A végleges nyilvántartás nem írható át; kapcsolt új dokumentum adja a korrekciót. Az adatok forrása „Kézzel rögzítve – Számlázz.hu”. A PDF nem bizonyít fizetést, és az ERP-be írás nem módosítja a szolgáltatót.

Hiányzó összegek/dátumok nullként őrizhetők tervezetben. Véglegesítéskor szám/dátumok/címek/összegek/fizetési mód és nettó + adó = bruttó ellenőrzés. A felek neve és kibocsátói azonosító ellenőrzése a jelenlegi üzleti validátorban nem teljes; javítandó, nem állítható kész számlaadat-minőségnek.

Egyediség: saját vállalkozás + irány + kibocsátói adószám + számlaszám + deviza. Nincs pusztán névalapú összevonás. `external_id` külön nullable mező, manuális úton nem kell kitölteni. A séma jelenleg `source: manual`, `provider: szamlazz.hu` értékre szűkített; az API és más szolgáltató **bővítést igényel**, nem csak egy konfigurációs kapcsolót.

### 2.10. Befizetések és pénzügyi összesítések

Számlánként több tényleges pénzmozgás: dátum, pozitív egész minor összeg, deviza, irány `in`/`out`, mód, megjegyzés. Tervezethez vagy más devizában nem rögzíthető. A hibás befizetés nem törlődik: új `voids_id` bejegyzés visszavonja. Többszöri visszavonás tiltott. Ez különbözik az ügyfélnek ténylegesen visszafizetett pénztől (`out`).

Képlet a kódban: nettó rögzített befizetés = aktív beérkező − aktív visszafizetések; nyitott = bruttó − befizetés − végszámlán beszámított előleg. Pénzügyi összesítés devizánként: kiállított érték, befizetés, nyitott, kimaradó tervezetek száma. Tesztszámla és díjbekérő kizárva. Előlegszámla + végszámla beszámítása az alaptesztben nem dupláz.

Elfogadott projektérték és még nem számlázott érték külön HUF mutató. Nincs automatikus árfolyam. Sztornó/helyesbítés előjelszabálya, több végszámlán újra beszámított előleg, többféle részfizetés és korrekció együttes esete nincs teljesen levédve/tesztelve; kritikus pénzügyi átvételi feladat. Az összesítő nem könyvelési/adózási rendszer, és a kintlévőséget a ténylegesen rögzített adatokból mutatja.

### 2.11. Dokumentumtár

Projektfájlok és céglogó, típusok: PDF/JPEG/PNG/WebP. Fájlonként legfeljebb 10 485 760 bájt (10 MiB; UI helyenként „10 MB”). MIME és alap mágikus bájtok ellenőrzöttek; ez nem teljes vírusellenőrzés vagy minden képformátum teljes validálása.

Dokumentumrekord: file key, eredeti név, MIME, méret, SHA-256, kategória, opcionális entry-kapcsolat, létrehozási dátum, `sent_on`, `original:true`. Kategória photo/quote/handover/invoice/other/logo. A nyers bájtok és a metaadat külön tárolódnak; hash-alapú tárkulcs ugyanazon vállalkozáson belül deduplikál. Azonos fájlhoz több értelmes dokumentumkapcsolat lehetséges. Más tenant fájlterületére mutatás tiltott.

Letöltés előtt méret/hash ellenőrzés. Privát Storage, nincs nyilvános URL vagy kliensoldali eredeti-felülírás/törlés. Az UI alapvetően letöltést kínál, a fényképekhez külön előnézet. A dokumentum `sent_on` mezője létezik, de önálló általános kiküldésjelölő/küldő workflow nincs; az ajánlati `decision.sent` ettől külön. Aláírások inline payloadban vannak, fotók/eredeti PDF-ek tényleges fájlként.

### 2.12. Cégadatok és sablonok

Cég: név, e-mail, telefon, cím, adószám, tax_mode unknown/aam/vat, billing_mode manual. Adózást nem találunk ki. Preferences entry: bank, bankszámla, ajánlati/átadási feltételek, alap áfa bázispontban, logódokumentum UUID, utolsó ellenőrzött mentés időpontja. Alap áfakulcs 2700 bázispont, de `tax_mode` ettől még unknown, amíg meg nem adják.

A sablon új dokumentumba másolódik; régi végleges PDF nem változik. Összetett vizuális sablonszerkesztő, WYSIWYG és több sablonprofil nincs. A külön banksablon és logó jelenlegi használatát a PDF-kód határozza meg. Preferences-írásnál a felület friss rekordverziót tölt be a mentés előtt, ami régi űrlapértéket friss verzióra írhat; többlapos ütközésvizsgálat szükséges.

### 2.13. Belépés, saját eszköz és helyreállítás

Supabase e-mail/jelszó, első belépéskor TOTP QR/manual secret és sikeres hatjegyű kód. AAL2-ig nincs üzleti hozzáférés. Ellenőrzött több TOTP esetén választó. Az elhagyott első unverified enrollmenteket kitakarítja. Tartalék TOTP felvétele a Fiókban meglévő faktor friss kódja + új faktor kódellenőrzése után; külön eszközön őrizendő.

„Megőrzött munkamenet” külön választás: a Supabase auth tárolója localStorage, különben sessionStorage. Ezek aktív auth-tokenek, **nem a helyi üzleti vault AES-titkosítása**. Saját offline vaultot online, AAL2 belépés után külön engedélyez a felhasználó, saját feloldó jelszóval. Az általános helyi próba ettől külön, éles Auth nélküli mintaadatos mód.

Jelszó-visszaállítás Supabase reset e-mail kérés, a jelen alkalmazás origin/path címére; engedélyezett redirect és SMTP külön beállítás. A felület generikus sikerszöveget használ, de a szolgáltatói hibák felhasználói megjelenítését és fiókfeltárás elleni viselkedést élesben vizsgálni kell. A jelszócsere nem oldja fel az AAL2-követelményt.

Elveszett telefon: kipróbált második TOTP. Minden faktor elvesztése: a saját, külön védett Supabase operátori fiókból adminisztratív helyreállítás; nincs publikus megkerülő gomb. Az RLS nem kapcsolható ki. A pontos teljes, végrehajtott adminisztrációs eljárás nincs igazolva; a `docs/FIOK-HELYREALLITAS.md` jelenleg elvi üzemeltetési leírás, nem élőben próbált runbook. Kísérleti recovery-code API nincs beépítve. Faktor törlése/revoke-all session UI nincs kész.

### 2.14. Offline szerkesztés és egyeztetés

PWA első sikeres online betöltéssel; appkód, PDF-kód és magyar font saját csomagból. A privát API-válaszok nem kapnak általános service worker runtime cache-t. A titkosított vaultban rekordok/fájlok/műveletek; nyers jelszó/kulcs nem kerül tartós tárolóba. A metaadatok — például UUID, sortípus, verzió — részben láthatók, a tartalom titkosított.

Offline felkészítéskor teljes üzleti snapshot és a kiválasztott projektek/cégfájlok töltődnek le. Nem csak a kiválasztott projektek rekordjai. Projekt Áttekintésben külön **Előkészítés offline használatra** letölti/ellenőrzi a projekt fájljait. Tárhelybecslés és `navigator.storage.persist()` kérés van; a böngésző engedélyének megtagadása látható üzenetet ad. Ez nem garancia az OS/böngésző adatmegőrzésére.

Minden helyi üzleti mentés és outbox-művelet egy IndexedDB tranzakció. Saját művelet-UUID, rekord-UUID, típus, elvárt verzió és sequence. Újrafeloldás után megmarad a sor. Feltöltés: fájl előbb, dokumentum/meta utána, azonos kulcs ellenőrzéssel; SQL RPC idempotenciával. Appnyitáskor/online eseményre/helyi mentésre és 10 másodperces függősor-ellenőrzéssel próbál szinkronizálni. Bezárt böngésző mellett nincs garantált háttérfolyamat.

Ütközés: szerver/local JSON egymás mellett, explicit szerver megtartása vagy helyi újrafeltöltése; titkosított történet. A lezárt dokumentum felülírását választás után is tiltja a szerver. Automatikus mezőszintű merge nincs. Feloldás után külön szinkronfutás kellhet. A függő fájloknak nincs teljes önálló, felhasználóbarát feltöltési állapotgépe; a sor dokumentumműveletei képviselik őket.

Jelzések: helyben mentve, műveletszám feltöltésre vár, egyeztetés szükséges, utolsó szinkron. A „minden feltöltve” csak adott eszközre vonatkozik. Az initial null státusznál és az üres outbox–sikertelen szerverfrissítés esetén a szöveg pontosságát tovább kell javítani. Nem igazolja más offline eszköz munkáját vagy a külön backupot.

### 2.15. Üzleti mentés és visszaállítás

Kézzel indított, a saját számítógépre letölthető titkosított `.erpbackup`. Tartalom: validált üzleti snapshot + minden hivatkozott eredeti fájl base64 formában + manifest (rekordszám, egyedi fájlszám, bájtok, hash). Ez üzleti mentés, nem teljes Supabase/Auth/Worker-projektmásolat. Jelszó/token/TOTP/API-titok nincs benne. Aláírás a handover payloadban és PDF-ben megmarad.

`erp-business` version 2 plaintext struktúra; `erp-encrypted` version 2 külső boríték, külön jelszó, PBKDF2-SHA256 310 000, AES-256-GCM és `erp-business-v2` AAD. Legalább 12 karakter; 16 bájt salt, 12 bájt IV. A file-hashok és kapcsolatok visszaellenőrzöttek. Mentéskészítés 100 MiB összes eredeti fájlig, beolvasási külső fájlhatár 180 MiB. Nem streaming, memóriaigény base64/JSON miatt nagyobb a nyers állománynál.

Állapotok: csomag elkészült → letöltés elindult → ténylegesen elmentett fájl visszaolvasva/ellenőrizve. Csak utóbbi írja az ellenőrzési időt. 24 óra után az alkalmazáson belül emlékeztető; nincs bezárt böngészőben automatikus napi mentés. Meglévő régi jó fájlt nem ír felül automatikusan.

Az ellenőrzött fájl új `rp-elektro-restore-<UUID>` helyi vaultba állítható, új helyi jelszóval. Visszaellenőrzi a darabszámot/fájlokat, az eredeti vaultot megtartja. Aktív vault választó a belépésben. **Éles Supabase-visszatöltő nincs.** Új tenant/auth-owner megfeleltetés és szerverre visszaállítás külön fejlesztési/operátori feladat.

Ismert eltérés: régi, de most ellenőrzött backup friss ellenőrzési időt írhat, így az esedékesség nem a legutóbbi üzleti pillanat frissességét méri. Az aktív outbox és konfliktustörténet nincs része a backupnak, csak az aktuális üzleti rekordok/fájlok. Ezt a visszaállítás nem küldi automatikusan felhőbe. Függő sor melletti backup pontos szemantikája és a mentés előtti összefoglaló még fejlesztendő.

### 2.16. Régi ERP adatainak átvétele

**[FELHASZNÁLÓ/ELFOGADOTT TERV]** Valódi ügyfél/projekt/felmérés/katalógus/ajánlatverzió/anyaglista/jegyzőkönyv/számla/fizetés/naptár/fotó/PDF megőrzése. A hiányzó régi export miatt még nincs bizonyított mezőmegfeleltetés vagy importált darabszám.

Jelenlegi `previewImport`: kizárólag `format: erp-exchange`, `version: 2`, `snapshot` szerkezetet fogad, validálja, forrásazonosítókat és eltéréseket listáz. A UI egy JSON-fájlt olvas és előnézetet mutat. **Nem importál semmit.** A `.erpbackup` és `erp-exchange` két eltérő formátum; ne nevezd mindkettőt általános importernek. `source_system`/`source_id` az entrykben és SQL-egyediséggel előkészítve; base partnerek/projektek/work_items táblákon ilyen mező még nincs. `import_run_id` nincs kész.

Elvárt import: változatlan forrásmásolat → valódi formátumhoz adapter → írás nélküli hibajegyzék → izolált próbaimport → darabszám/összeg/hash egyeztetés → friss mentés és egyeztetett éles átállás → utóellenőrzés. Újrapróbálás nem duplikálhat, közben módosított rekordot nem írhat felül. Részleges hiány nem fedhető el fiktív ügyféllel/nulla összeggel. Eredeti történeti PDF megőrizhető, de strukturált szerkeszthető ajánlatot nem kell kitalálni belőle. Import nem indít Agentet, levelet vagy Google-szinkront. Visszavonás csak saját importfutás érintett, azóta nem módosult adataira célzottan, nem általános törlés.

### 2.17. Későbbi bejövő számlák és Agent

Bejövőnél más a kibocsátó, saját cég a vevő; project opcionális; pénzmozgás jellemzően kifelé. Irány, bizonylattípus, fizetettség, feldolgozás és külső műveletállapot külön. A közös partnertörzs később ügyfél+szállító szerepet kaphat. A bejövő adatmodellből ma direction és received_on mező van, de a validátor és SQL ténylegesen tiltja a bejövő mentést.

Később külön döntendő: rögzítési mód, ellenőrzés/javítás/törlés, szállítólista, határidő, eredeti fájl, esetleges projektköltség, import/OCR elérhetőség és ára. Ezek **nem most vállalt kész funkciók**. Számlatételek normalizált modellje, többprojektes számlamegosztás és automatikus könyvelés nincs.

Agent később: külön server adapter, védett secret, explicit kiállítási szándék, tartós idempotencia, bizonytalan válasz utáni állapotegyeztetés. Korábban kézzel rögzített számlát/tervezetet nem állíthat ki újra. Minden új költséget a teljes kerettel együtt kell egyeztetni. Az eredeti tervben őrzött díjak történeti ellenőrzési állítások; e dokumentum készítésekor nem végeztünk új díjkutatást. Élesítéskor hivatalos oldalon újra ellenőrizendők.

## 3. Technikai felépítés

### 3.1. A tényleges architektúra

Frontend: React 19 + TypeScript strict, Vite 8; funkcionális komponensek, helyi state, propokkal átadott `Context`. Nincs React Router, Redux, külön Node/Express backend, Prisma vagy ORM. A fő navigáció és modális állapot az `App.tsx`-ben él; főképernyők nem külön, deep-linkelhető routerútvonalak.

`Repository` absztrakció alatt három tényleges út:

1. **Helyi próba:** `openLocal` → titkosított IndexedDB, nincs szerver.
2. **Közvetlen felhő:** `cloudRepository` → Supabase Auth kliens + `erp_snapshot`/`erp_apply` PostgREST RPC + privát Storage.
3. **Saját offline eszköz:** `wrapOffline(local, provider)` → helyi rekord/outbox mentés → ellenőrzött szerverfeltöltés; a UI először a helyi snapshotot látja.

A Google külön Cloudflare Worker + D1 forrás. Csak erre van külön HTTP-backend a projektben. A frontend Cloudflare Pages statikus kiadásra készül; helyben Vite preview/dev szolgálja ki. **A technológiák kódja létezik, de éles Supabase/Pages/Worker/D1/Google/SMTP erőforrás ebben a munkában nem lett beüzemelve.**

### 3.2. Fő fájlok

| Relatív fájl | Szerep és fontos belépési pont |
| --- | --- |
| `src/main.tsx` | Root, globális Supabase kliens, lazy App, PWA update, repo-váltás/kilépés |
| `src/Auth.tsx` | Helyi vault választás/feloldás, online login/TOTP/recovery |
| `src/Account.tsx` | Tartalék TOTP listázás/felvétel/kódellenőrzés |
| `src/App.tsx` | Főmenü, alapadatok, CRUD/archívum/keresés, irányítópult, szerkesztési konfliktus |
| `src/Workflow.tsx` | Projektfülek, sorok, felmérés, ajánlat, anyaglista, jegyzőkönyv, signature canvas |
| `src/Invoices.tsx` | Számlázási adatlap, kézi számlák, pénzügyi mutatók, befizetések |
| `src/Calendar.tsx` | Agenda és eseményszerkesztő, Budapest falióra konverzió |
| `src/Upcoming.tsx` | Következő öt időpont a megfelelő kontextusban |
| `src/WorkspaceSettings.tsx` | Sablonok/bank/logó, anyag/receptek, backup/restore/importelőnézet, kapcsolatok/fiók |
| `src/domain.ts` | Alapsémák, Meta/Snapshot/Repository/outbox típusok, exact money parser, státuszok |
| `src/business.ts` | Diszkriminált payloadsémák, üzleti validálás, összesítések, immutability |
| `src/local.ts` | Web Crypto, IndexedDB, CAS, outbox, refresh, conflict resolve |
| `src/cloud.ts` | Publikus config ellenőrzés, auth storage, RPC és Storage adapter |
| `src/offline.tsx` | Offline wrap, előkészítés, konfliktusnézet, Google-kapcsolat UI |
| `src/SyncBar.tsx` | Pending/lastsync jelzés, automatikus retry/poll eseményekkel |
| `src/backup.ts` | `cleanSnapshot`, `createPackage`, `encryptPackage`, `verifyPackage`, `previewImport` |
| `src/documents.ts` | `attach`, hash/kapcsolat, letöltés és WebP-konverzió |
| `src/pdf.ts` | `makePdf`, helyi font, A4 lapok, logó/fotók/aláírások |
| `src/PhotoPreview.tsx` | Privát fájlból object URL és képelőnézet |
| `src/transfer.ts` | Base64, SHA-256 és Blob letöltés |
| `src/ui.tsx` | Context, saveEntry, form/modal/input, useAction, DocumentList/Upload |
| `src/style.css`, `src/modules.css` | Alap és üzleti modul stílusok, reszponzív nézet |
| `src/vite-env.d.ts` | Vite/PWA típusok |
| `vite.config.ts` | React/PWA és Vitest konfiguráció; `base: './'` |
| `playwright.config.ts` | 4173 preview, E2E, opcionális Chromium executablePath |
| `tsconfig.json` | ES2022, DOM, ESNext/Bundler, strict/noEmit |
| `public/_headers`, `_redirects` | Pages biztonsági fejlécek és SPA fallback |
| `public/fonts/*`, `icon.svg` | Helyi DejaVu font/licenc és PWA ikon |
| `supabase/migrations/*.sql` | Az új ERP sémája és szerveroldali szabályai |
| `supabase/bootstrap-owner.sql.example` | Kézi tulajdonos/cég bejegyzés valós Auth UUID-val |
| `worker/index.ts`, `schema.sql`, `wrangler.toml` | Google szerverkód, D1 és deploymentminta |
| `START-ERP.cmd` | Windows indító: saját mappa, szükség szerinti npm ci, build, preview5173 |
| `README.md`, `TEST-REPORT.md`, `docs/*` | Indítás, korábbi ellenőrzések, elfogadott terv, fejlesztői átadás/helyreállítás |

A teljes fájllista és a pontos csomagverziók a generált mellékletben vannak. A projektben jelenleg nincs Git-repó/remote/commitazonosító, CI-workflow, production URL, központi hibakövető vagy automatizált release-rendszer. Ezeket ne találj ki.

### 3.3. Adatbázistáblák és kapcsolatok

Közös meta az üzleti rekordokon: `id uuid`, `company_id uuid`, `version`, `created_at timestamptz`, `updated_at timestamptz`. Vállalkozásnál `company_id` generált = `id`. A típusrendszerben a cég owner_id nélkül él; az élő SQL-snapshot extra owner_id-t is adhat, a backup tisztítója ezt levágja.

| Tábla | Saját mezők / kulcsok |
| --- | --- |
| `app_owners` | `user_id` PK/FK → `auth.users`, `created_at`; kliens csak sajátot olvas |
| `companies` | `owner_id` unique FK → app_owners; név/e-mail/telefon/cím/adószám/tax_mode/billing_mode + meta |
| `partners` | név/e-mail/telefon/billing_address/notes/archived; unique(company_id,id) |
| `projects` | customer_id nullable, title/site_address/status/notes/archived; composite FK(company_id,customer_id) → partners |
| `work_items` | name/category/unit/price_minor bigint/description/archived |
| `entries` | project_id nullable, payload JSONB, source_system/source_id + meta; tenant/project composite FK |
| `erp_operations` | id művelet-UUID PK, company_id, result JSONB, created_at; idempotencia ledger |
| `storage.buckets` | `erp-files`: private, 10 MiB, PDF/JPEG/PNG/WebP |
| `storage.objects` | Supabase tulajdonú tábla, tenantfájl policyk |

`entries` indexek: company/project; company/type; eredeti file kapcsolat-egyediség NULLS NOT DISTINCT; quote/handover type+series+revision unique; nem üres source_system/source_id unique; végleges invoice tenant+direction+issuer.tax_number+number+currency unique. Payload max SQL szöveghossz 8 000 000, engedélyezett típusok CHECK-kel.

Nincs külön normalizált számla/számlasor/fizetés/helyszín/fájl/recipe tábla: ezek nagy része typed JSONB entry. **Ne nevezd a specifikáció tervezett entitásait már létező SQL-tábláknak.** A JSON-beli hivatkozásokhoz trigger/kliensvalidáció van, de nem mind relációs FK. Teljes sémaparitás még nincs.

### 3.4. Payloadmezők — rövid, teljes áttekintés

| `payload.type` | Tárolt tartalom |
| --- | --- |
| survey | name, surveyed_on, existing, planned, unknown, internal_notes, rooms[id/name/existing/planned/lines], whole_property, photo_ids |
| quote | series_id, revision, sealed, number, title, issued_on, valid_until, company/customer party, site, tax_mode, vat_basis_points, lines, materials_minor, discount_minor, terms, pdf_id |
| handover | series_id, revision, sealed, number, performed_on, company/customer, site, work/deviations/extras/remaining, optional terms, checks{tidy,informed,documents}, photo_ids, customer_signature, contractor_signature, signed_at, timezone, pdf_id |
| invoice | direction, source, provider, external_id, document_type, draft, is_test, number, issuer/customer, issued_on/performed_on/due_on/received_on nullable, net_minor/tax_minor/gross_minor nullable signed, currency, method, relation_ids, advance_deduction_minor, notes |
| payment | invoice_id, paid_on, amount_minor, currency, direction, method, notes, voids_id |
| materials | quote_id, lines[material_id/name/unit/calculated_milli/override_milli/manual/notes] |
| event | title, category, starts_at, ends_at, location, notes, cancelled, google_enabled |
| document | file_key, name, mime, size, sha256, category, entity_id, created_on, sent_on, original |
| decision | quote_id, state, decided_on, notes |
| preferences | bank_name, bank_account, quote_terms, handover_terms, vat_basis_points, logo_id, last_verified_backup |
| material | name, unit, archived |
| recipe | work_id, lines[material_id/name/unit/quantity_milli] |

Party = name/address/tax_number/email/phone. WorkLine = id/work_id/name/unit/quantity_milli/price_minor/location/notes/recipe. EntryData = project_id + payload + source_system + source_id. Entry meta hozzáadódik. Pontos típuskorlátokhoz `src/business.ts` és `domain.ts` az elsődleges, nem ez a rövidített táblázat.

### 3.5. Számítási egységek és dátumok

Minor pénzegység század egység; HUF-nál századforint. Mennyiség ezred. Nem lebegőpontos ár×mennyiség: `BigInt`, tételenként nearest rounding, majd biztonságos Number-tartomány. Áfa bázispont: 2700 = 27%. Pénzkorlát jellemzően ±999 999 999 999 minor, pozitív áraknál alsó határ0. Mennyiségsor max1 000 000 000 milli. A nulla és negatív mennyiségek típusonként eltérően megengedettek; workline pozitív, material override lehet0.

Számladátumok naptári ISO date; technikai időpontok ISO timestamptz. `today()` Budapest. A meta backupvalidálója elfogad timezone offsetet is, nem csak `Z`-t. Nincs devizaárfolyam vagy tetszőleges deviza-tizedesexponens kezelés; az alkalmazás minden devizánál két tizedes alapegységgel számol. JPY/KWD és más eltérő skálájú devizák támogatása nem igazolt.

### 3.6. Jogosultság, RPC és Storage

RLS minden saját táblán; nincs anon üzleti jogosultság. `auth.uid()` saját engedélyezett app_owner + saját cég; restrictive AAL2 policy. Companies kliens SELECT/UPDATE, nincs tenant-provisioning. Partners/projects/work_items/entries kliens SELECT/INSERT/UPDATE, nincs végleges DELETE. App_owners kliens csak SELECT. Server trigger védi az ID/tenant/owner/meta és végleges entryk állapotát.

`erp_snapshot()` SQL security-invoker/stable: egy adatbázis-utasítás egy MVCC adatpillanattal, RLS-szűrt company/partners/projects/work_items/entries JSON. Nem több független kliensoldali SELECT-ből összerakott backup.

`erp_apply(operation_id uuid, table_name text, record_id uuid, expected_version int, data jsonb)` security-invoker: AAL2+tenant → tenant advisory tranzakciós zár → korábbi operation eredmény → tábla/mező allowlist → rekordverzió FOR UPDATE → INSERT expected0 vagy UPDATE expectedverzió → szerver stamp/guard → ledger insert → eredmény. `40001` = verzióütközés. A JSON payload belső sémája azonban nincs teljesen SQL-ben leképezve; a kliens Zod szigorúságát nem helyettesíti a jelenlegi részleges trigger.

Fájlkulcs `${companyId}/${sha256}`. Feltöltés upsert:false; ha hibát jelez, az adapter meglévő bájtok hashét ellenőrzi, és csak valóban azonos eredetinél tekinti teljesültnek. Storage policy tenantfolder+AAL2; nincs update/delete. Céglogó is privát fájl, PDF-készítéshez hitelesítetten/helyből kell elérni. Szolgáltatói HTTP-cache és éles biztonsági fejlécek külön ellenőrizendők.

### 3.7. Helyi titkosítás és tárolási szerkezet

IndexedDB verzió1, `meta` és `records` object store `key` indexszel. Alapnév `rp-elektro-local-v1`; offline `rp-elektro-offline-UUID`; visszaállított `rp-elektro-restore-UUID`.

Meta header: salt, verifier, PBKDF2 iterations, companyId, queue; globális revision. Rekordkulcsok: `companies/UUID`, `partners/UUID`, `projects/UUID`, `work_items/UUID`, `entries/UUID`, `file/company/hash`, `op/operationUUID`, `conflict/UUID`. Minden tartalom AES-GCM külön IV-vel és rekordkulcs-AAD-val titkosított; CryptoKey nem exportálható, memóriában él. A vault companyId és rekordkulcs/version technikai meta nincs teljesen elrejtve. Az eszköz feloldó jelszava nem Supabase-jelszó.

Az üzleti mentés compare-and-swap rekordverziót és globális revisiont is ellenőriz. Ez biztonságosabb az elvesző felülírásnál, de külön rekordok valóban párhuzamos mentése is konfliktust kaphat. Refresh csak üres outbox és változatlan revision mellett cseréli a helyi üzleti rekordokat. Fájlokat/conflict historyt nem ürít.

localStorage technikai kulcsok: `erp-active-vault`, `erp-vaults`, `erp-remember-session`, `erp-last-sync`; Supabase SDK sessionkey a konfiguráció szerint local/sessionStorage. `erp-last-sync` jelenleg nem vault/tenant szerinti névtérben van. Az aktív vault eltüntetése vagy tárhelytörlés nem javítási módszer.

### 3.8. Google API és D1

Szerver végpontok: `GET /status`, `POST /connect`, `GET /authorize?ticket=...`, `GET /callback?state=...&code=...`, `POST /sync`, `POST /disconnect`, `OPTIONS` CORS. A védett műveletek pontos APP_URL origint és Bearer Supabase sessiont kérnek. A Worker `/auth/v1/user` és AAL2 RLS-snapshot alapján ellenőrzi a tulajdonost, nem bízik a kliens companyId-jában.

OAuth-state 32 véletlen bájt, D1 TTL10perc; top-level authorize HttpOnly/Secure/SameSite=Lax callback-cookie-t tesz, Google consentre irányít. Callback state/cookie/single-use D1 után kódot cserél, refresh tokent AES-GCM alatt tárol. Scope `calendar.events.owned`; primary calendar. A tokenlezárásnak nincs kid/verzió/többkulcsos rotációja, ez technikai adósság.

D1-táblák: `connections(company_id PK,owner_id,token,updated_at)`; `oauth_states(state PK,company_id,owner_id,expires)`; `event_links(company_id,entry_id PK együtt,google_id,content,last_sync)`; `daily_quota(day PK,calls)`; `sync_locks(company_id PK,expires,lease)`.

Google event ID = `erp` + kötőjel nélküli kisbetűs ERP UUID. Módosítás előtt GET, privát `erp_company` és `erp_entry` tulajdonosság; aztán POST/PUT/DELETE. `attendees: []`, `sendUpdates=none`. Lemondott esemény törölhető, csak az adott ERP-eseményhez kötöttet. `content` egyezésnél nincs API-hívás; emiatt Google-ben kézzel módosított/törölt eseményt azonos ERP-payload esetén nem feltétlenül egyeztet újra.

Szinkronzár: 5perc és lease UUID; futás240s után folytatható részleges státusszal; Calendar-hívás timeout12s. Napi 1000 hívás saját, D1-ben számlált korlát: **jelenleg az egész Worker-projektre/UTC napra közös**, nem tenantonkénti Google-szolgáltatói kvóta. Nincs automatikus ütemező, webhook, watch vagy kétirányú szinkron. UI manuálisan indítja. A `/disconnect` backend megvan, a frontend `calendarRequest` típusa ismeri, de **nincs hozzá felhasználói bontógomb**. Google-engedély lekapcsolása (`google_enabled=false`) nem törli magától a már kitolt eseményt; a kívánt szemantikát tisztázni/tesztelni kell, nem szabad idegen naptárelemet törölni.

### 3.9. PWA és frissítések

`vite-plugin-pwa` Workbox generateSW, prompt update, skipWaiting:false, clientsClaim:false, cleanupOutdatedCaches:false. Precache JS/CSS/HTML/TTF/SVG/manifest, maximum4MB/file; jelenleg 13 bejegyzés kb.2,54MiB. Nincs privát API runtime cache deklarálva. A React `registerSW` update-bannerből kifejezett felhasználói művelettel aktiválódik.

Nincs kidolgozott verziózott IndexedDB/adatformátum-migrációs sor vagy visszagörgetési eljárás. Az update előtt a felhasználó felszólítást kap a nyitott űrlapok mentésére, de ez önmagában nem tesztelt automatikus draftmegőrzés minden modulban. Jövőbeli forrásfrissítés nem ürítheti csendben a helyi sort.

## 4. Telepítés, környezet és pontos parancsok

### 4.1. Helyi fejlesztés

Node deklarált minimum: `>=22.12`; ellenőrzött: **24.19.0**, npm **11.9.0**. A tesztek Worker-része `node:sqlite`-ot használ; a Node24 az igazolt választás. A minimumverzión minden teszt nem volt külön futtatva. Függőségeket a lockfájl rögzíti; ne frissíts minden csomagot automatikusan az átvétel elején.

Csomagold ki a forrás-ZIP-et, lépj az `erp` mappába. Linux/macOS parancsok:

```bash
npm ci
```

```bash
npm run dev -- --host 127.0.0.1
```

Vite dev alapport5173, de PWA offline próbára a production build/preview út kell. Az alábbi parancsok külön indíthatók; preview szerver alatt ne változtasd/buildeld át a `dist`-et épp futó E2E közben.

```bash
npm run build
```

```bash
npm run preview -- --host 127.0.0.1 --port 5173 --strictPort
```

Windows PowerShell ugyanebből a mappából, külön parancsblokkokkal:

```powershell
npm.cmd ci
```

```powershell
npm.cmd run build
```

```powershell
npm.cmd run preview -- --host 127.0.0.1 --port 5173 --strictPort
```

`START-ERP.cmd`: saját mappába lép, ellenőrzi npm és lock jelenlétét, hiányzó node_modules esetén npm ci, majd build és preview5173. Böngésző: http://127.0.0.1:5173. Windows alatt nem volt ténylegesen futtatva; a hívott npm lépések Linuxon igen. Régi és új csomag külön mappába, a régi megőrzésével. A port5173 azért fontos, hogy a korábbi azonos originű helyi próba ne tűnjön el egy új origin mögött. `localhost` és `127.0.0.1` külön tárhely.

### 4.2. Környezeti változók — értékek nélkül

| Név | Hol | Titkos? | Szerep |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | frontend `.env` / Pages build | nem | Saját HTTPS projekt-URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | frontend build | nem, publikusra szánt | publishable vagy régi anon; service_role/sb_secret tiltott |
| `VITE_ENABLE_LOCAL_DEMO` | frontend build | nem | csak a `false` érték rejti a helyi próbamódot; alap true |
| `VITE_CALENDAR_WORKER_URL` | frontend build | nem | fix saját HTTPS Worker-cím; ne legyen felhasználótól tetszőlegesen átírható |
| `APP_URL` | Worker vars | nem | tényleges frontend origin, CORS/visszatérés |
| `SUPABASE_URL` | Worker vars | nem | backend projekt-URL |
| `SUPABASE_PUBLISHABLE_KEY` | Worker vars | nem | Supabase publikus apikey, nem admin |
| `GOOGLE_CLIENT_ID` | Worker vars | nem | OAuth webalkalmazás ID |
| `GOOGLE_CLIENT_SECRET` | Worker secret | **igen** | OAuth kód/token csere |
| `TOKEN_SEAL_KEY` | Worker secret | **igen** | base64 32 véletlen bájt AES-GCM refresh token lezáráshoz |
| `DB` | Worker D1 binding | erőforráskötés | D1 adatbázis |
| `ERP_CHROMIUM_PATH` | csak fejlesztési tesztkörnyezet | nem | opcionális működő Chromium bináris |
| `CI` | tesztkörnyezet | nem | Playwright meglévő szerver újrahasználata |

SMTP-azonosítók Supabase szolgáltatói konfigurációban, nem a frontendben. Jelenleg nincs Agent env-változó. `.env.example` szándékosan üres publikus értékeket tartalmaz. A prefixelt Vite-változó a kliensbe épül; „.env-ben van” nem jelent szerveroldali titkot.

### 4.3. Supabase/Pages beüzemelés

Új külön ERP-projekten `001_core.sql` → `002_workflow.sql`, sorrendben egyszer. Létező0.1 sémán csak002, előzetes mentéssel. A fájlok nem általánosan újrafuttatható/idempotens upgrade-ek és nem a régi Sites adatbázisához készültek. Nincs `supabase/config.toml` vagy kész Docker/CLI stack. A helyi PostgreSQL-teszt modellezi az Auth/Storage sémát; nem futó teljes helyi Supabase.

Tulajdonosi Auth-user tényleges, ellenőrzött e-maillel, zárt signup; utána saját UUID-val kézi bootstrap. A példa nem tartalmaz érvényes felhasználói UUID-t. Site URL, Redirect URL, SMTP és TOTP beállítandó. Ne tegyél titkos admin kulcsot a bootstrap helyett a böngészőbe.

Cloudflare Pages: saját fiók, külön projekt, build `npm run build`, output `dist`, Node24 és publikus buildváltozók. A kliens `.env` változtatása után új build kell. Saját Git-repó és CI még létrehozandó; jelenleg nincs csatlakoztatott remote. Alapértelmezett szolgáltatói domain az első terv, új domain nincs megrendelve. HTTPS deep refresh, `_redirects` és `_headers` éles ellenőrzés kell.

CSP: default/script/style/font self; image self/data/blob; connect self + `https://*.supabase.co` + WSS + `https://*.workers.dev`; object none, base self, frame none, form self. Saját domain pontos originnel bővítendő; wildcardok a valódi végpontokra szűkítendők. A helyi preview nem alkalmazza a Cloudflare `_headers` szabályait, ezért a sikeres helyi E2E nem igazolja az éles CSP-t.

### 4.4. Worker beüzemelés

A `worker/wrangler.toml` helykitöltő konfiguráció. D1 létrehozás és schema.sql alkalmazás, valódi APP/Supabase/Google publikus vars, protected secrets, pontos Google `/callback` redirect, Worker deploy, majd fix VITE_CALENDAR_WORKER_URL és frontend rebuild. Wrangler nincs projektdevdependencyként pinelve, nincs kész deploy script vagy eredmény. A célplatform és az akkor használatos Wrangler hivatalos utasításait ellenőrizd a saját környezetben; ne találd ki a Cloudflare account/database ID-t.

Google publikálási/teszt státusz, tokenlejárat, scope engedélyezés és kvóták ellenőrzése valódi fiókkal. Támogatott elsődleges naptár; naptárválasztó nincs. Többfelhasználós Google-engedélyezés nem mostani scope.

### 4.5. Tesztparancsok

```bash
npm test
```

```bash
npm run build
```

```bash
npx playwright install chromium
```

```bash
npm run test:e2e
```

E2E a production `dist`-ből preview4173-at indít. Build szükséges előtte. A helyi felhasználói preview5173 ettől külön. Ha nincs telepíthető Chromium, használj saját megbízható binárist `ERP_CHROMIUM_PATH`-tal; a fejlesztés során a standard letöltés hibás/üres ZIP-et adott. A sikeres alternatív Chromium153 tesztbináris nem kerül a forráscsomagba és nem szükséges a felhasználó appindításához.

```bash
npm audit --omit=dev --audit-level=moderate
```

```bash
npx prettier --check src tests e2e worker/index.ts vite.config.ts playwright.config.ts
```

Az utolsó parancs ajánlott formázási ellenőrzés; külön lint/ESLint script nincs. Windows alatt `npm.cmd` és `npx.cmd` használható. Az `npm ci` csak a projekt lockfájljával és megfelelő munkamappából értelmes. Az átadási forrás-ZIP tartalmazza a lockot.

## 5. Készültségi mátrix és bizonyíték

| Funkció/kör | Állapot | Bizonyíték / korlát |
| --- | --- | --- |
| Forrás telepítés, TypeScript/Vite build | KÉSZ | npm ci és build sikeres Linux/Node24 alatt |
| Windows duplakattintásos indító | NEM ELLENŐRZÖTT | Script megírva/átnézve, Windows futás nem volt |
| Helyi jelszavas vault | KÉSZ | Unit + böngészős újranyitás, hibás jelszó/tamper |
| Ügyfél/projekt/katalógus alap CRUD | KÉSZ | Unit/SQL + E2E létrehozás/szerkesztés/archívum |
| Minden keresési és inline felviteli részlet | RÉSZBEN KÉSZ | Nem minden elfogadott keresési mező/átkötés igazolt |
| Külön helyszíntörzs, partnerszerepek | NINCS KÉSZ | Projektcím és ügyfélalapadat van |
| Felmérés/room/munkasor | KÉSZ, helyi alapfolyamat | E2E offline felvitel és ajánlatba másolás |
| Fotók teljes életciklusa | NEM ELLENŐRZÖTT teljes körben | Kód megvan, teljes image-upload/restore/éles API nincs lefedve |
| Árajánlat számítás/verzió/PDF | KÉSZ, lefedett kör | Business tesztek, offline PDF, vizuális próba |
| Ajánlatdöntés kézi bejegyzése | KÉSZ, alapút | Elfogadás E2E; összes döntéspermutáció nincs |
| Anyagrecept és alapösszesítés | KÉSZ, lefedett kör | Unit + 4m anyag E2E |
| Teljes anyaglista-diff és változásjelzés | RÉSZBEN KÉSZ | Csak újabb revízió figyelés; nincs minden tervezetmódosítás detektálás |
| Jegyzőkönyv/ellenőrzések/aláírt PDF | KÉSZ, lefedett kör | E2E, két aláírás, offline restore és PDF vizuális próba |
| Minden hosszú/fotós PDF kombináció | NEM ELLENŐRZÖTT | Nincs teljes szélsőeset-mátrix |
| Kézi számlaalap és részfizetés | KÉSZ, lefedett kör | 10k/4k/6k E2E, immutable és pénzügyi unit |
| Teljes pénzügyi/korrekciós szabályrendszer | RÉSZBEN KÉSZ | Többszöri előlegbeszámítás, előjelek, mezőparitás ellenőrizendő |
| Számlaeredeti/fotó éles Storage-próba | NEM ELLENŐRZÖTT | Nincs élő Supabase vagy valódi számlafájl |
| ERP-naptár és Budapest konverzió | KÉSZ, alapút | Unit DST + offline E2E esemény |
| PWA shell offline újranyitás | KÉSZ, Chromium-próba | Production preview, hálózat elvágása, reload+unlock |
| Saját felhős eszköz end-to-end offline | NEM ELLENŐRZÖTT | Alkotóelemek teszteltek, valódi hálózatos Supabase nincs |
| Outbox tartósság és azonos op retry | KÉSZ, lefedett kör | Offline unit és tényleges SQL RPC teszt |
| Több függő művelet konfliktusfeloldása | HIBÁS / javítandó kódszintű eltérés | Nem sequence szerint kiválasztott „utolsó” related op; lásd D01 |
| Közvetlen online mentés bizonytalan válasza | RÉSZBEN KÉSZ | Tartós UUID nincs a save-hívások között; D02 reprodukálandó |
| Függő fájlok külön részletes státusza | RÉSZBEN KÉSZ | Dokumentum-outboxon keresztüli feltöltés; nincs teljes külön UI state machine |
| Üzleti backup + readback + helyi restore | KÉSZ, lefedett kör | Unit és offline teljes böngészős visszaállítás |
| Backup frissesség/manifest összes tervmező | RÉSZBEN KÉSZ | Régi fájl új ellenőrzési ideje, appverzió/outbox scope és előzetes méret hiányos |
| Felhőbe történő teljes DR restore | NINCS KÉSZ | Csak izolált helyi visszaállító van |
| Régi import formátumelőnézet | RÉSZBEN KÉSZ | Belső exchange v2 előnézet, nincs valódi exportadapter |
| Tényleges régi adatimport és rollback | NINCS KÉSZ | Export hiányzik; író import nincs |
| Supabase SQL/RLS | KÉSZ a tesztelt modellben | PGlite valódi SQL + Auth/Storage stub; éles rendszer nem |
| SQL teljes JSON-sémaparitás | RÉSZBEN KÉSZ | Zod szigorúbb a triggernél, közvetlen table-grantek léteznek |
| Éles Auth/TOTP/SMTP | NEM ELLENŐRZÖTT | UI/SDK kód megvan, nincs valós projektpróba |
| Tartalék TOTP felvételi felület | NEM ELLENŐRZÖTT élőben | Kód megvan, friss régi + új kódot kér |
| Teljes elveszett-faktor runbook | RÉSZBEN KÉSZ | Elvi leírás van, kipróbált adminlépések és session revoke hiányzik |
| Google Worker alapkód | RÉSZBEN KÉSZ | 3 mock/SQLite teszt; OAuth és éles runtime nincs |
| Google bontás UI és event státuszkövetés | NINCS KÉSZ / részleges | Backend disconnect megvan, nincs gomb; nincs per-event állapot |
| Google kétirányú szinkron | NINCS KÉSZ, nem vállalt | Csak ERP→Google irány implementált |
| Agent API | NINCS KÉSZ, későbbi ütem | Szándékosan nincs hívás/kulcs |
| Bejövő workflow/OCR/NAV/bank | NINCS KÉSZ, későbbi/nem vállalt | Csak néhány alapmező, bejövő írás tiltott |
| Éles Pages/Supabase/Worker deploy | NINCS KÉSZ | Nincs hozzáférés/eredmény/URL |
| Valós havi költség és kvótafigyelés | NEM ELLENŐRZÖTT / részleges | Keret adott; saját díj ismeretlen; browser storage estimate nem Supabase számla |
| Windows/Safari/Firefox/valódi tablet/telefon | NEM ELLENŐRZÖTT | Csak Linux Chromium és emulált mobilméret |

### 5.1. Ténylegesen lefuttatott tesztek

Az átadási dokumentum készítésekor ismét lefutott: `npm test` **35/35**, 7 fájl; `npm run build` sikeres; `npm run test:e2e` **4/4**, Chromium153-mal. Az eredmény nem pusztán a korábbi asszisztens állításának átvétele. A kód ebben a dokumentálási körben nem módosult, az ismert hiányokat feladatként adtuk át.

| Tesztfájl | Darab | Lefedés |
| --- | --- | --- |
| domain.test.ts | 11 | money parser, adatséma, titkos Supabase-kulcs visszautasítás; paraméterezett esetekkel |
| local.test.ts | 4 | vault, újranyitás, wrong pass/tamper, párhuzamos írás, kapcsolatok |
| business.test.ts | 7 | számítás/recipe/immutable/payment/advance/deviza/DST |
| backup.test.ts | 1 | teljes roundtrip, hibás jelszó, sérült fájl, visszavont befizetés |
| offline.test.ts | 2 | outbox újranyitás/lost reply retry, explicit konfliktus |
| sql.test.ts | 7 | migrációk/RLS/RPC/CAS/private Storage/business guard |
| worker.test.ts | 3 | token titkosítás/origin/AAL1; determinisztikus event retry SQLite/mock hálózattal |
| e2e/core.spec.ts | 3 | két ablak, CRUD/reopen/archive, mobilmenu/dirty form/overflow |
| e2e/workflow.spec.ts | 1 | teljes offline munkafolyamat és titkosított readback/isolated restore |

Korábbi kiadás-előkészítési körben: tiszta `npm ci` a becsomagolt package+lock párral sikeres, 445 csomag; runtime `npm audit --omit=dev` 0 ismert sérülékenység. Ez történeti eredmény, nem a mostani napon később megjelenő hibák kizárása és nem teljes biztonsági audit. A csomagfüggőségben deprecated glob figyelmeztetés előfordult. Az összes devDependency auditja nem dokumentált sikeres ellenőrzés.

E2E részletes lánc: saját cég+AAM → munkakatalógus+anyag+recept → ügyfél/projekt → PWA ready → hálózat megszakítva → felmérés/helyiség/2db munkasor és belső titkos marker → 7 000+3 000=10 000Ft magyar PDF-ajánlat és kézi elfogadás → 4m anyag → három check+mindkét rajzolt signature → PDF → 10 000Ft külső számla kézi rögzítése → 4 000Ft részfizetés/6 000Ft nyitott → budapesti esemény → encrypted backup download → valódi fájl readback → új vault restore → offline reload/unlock → számla és részfizetés → két eredeti PDF letöltés. `pageerror` lista üres. Nem történt tényleges számlakiállítás vagy ügyfélértesítés.

PDF: ajánlat szövegkiolvasása igazolta az ékezeteket/számítást és a belső marker hiányát; ajánlat és kétoldalas jegyzőkönyv oldalainak képi ellenőrzése megtörtént a kiadáskor. A további hibajegyek nem válnak teszteltté attól, hogy ez a happy-path sikeres.

### 5.2. Ismert hibák, eltérések és technikai adósság

**Az alábbi kódszintű megfigyelések nem mind futtatott hibareprodukciók.** A megfigyelés és a lehetséges következmény külön van jelölve. Átvételkor célzott teszttel kell bizonyítani/javítani őket. A dokumentálás során nem nyúltunk hozzá az alkalmazáslogikához.

| ID | Megfigyelés és forrás | Besorolás, hatás, következő ellenőrzés |
| --- | --- | --- |
| D01 | `local.ts resolveOperations`: `getAll()` UUID-kulcssorrendjéből `related[related.length-1]`, nincs sequence-rendezés | **HIBÁS kódszintű sorrendválasztás**; több függő opból nem garantáltan legújabb payload lesz az új feltöltés. Készíts determinisztikus fordított UUID/sequence reprodukciót; új op az aktuális local rekordból vagy rendezett műveletből, kapcsolati szabályokkal. |
| D02 | `cloud.ts save`: minden hívás új operation_id, új rekordnál új UUID, nincs tartós direct-online outbox | **ELLENŐRIZENDŐ súlyos retry-kockázat**: szerver commit + elveszett válasz + UI újramentés új művelet lehet. Az offline sor tesztje ezt nem fedi. Egységesíts tartós szándékot az online úton is. |
| D03 | `WorkspaceSettings Templates`: mentéskor frissen töltött version mellé a korábban megnyitott `p` kerül | **ELLENŐRIZENDŐ csendes felülírás** két ablakban. A ténylegesen látott versiont őrizd és mutass konfliktust. Recipe/preferences párhuzamos singleton-létrehozás is vizsgálandó. |
| D04 | `erp_entry_guard` részleges JSON-ellenőrzés, authenticated direkt INSERT/UPDATE grant is létezik | **RÉSZBEN KÉSZ szervervalidáció**. Hiányzó booleán/enum/mező/numerikus skála/dátum/kapcsolat direkt API-val átcsúszhat; rossz payload snapshotot vagy pénzügyet törhet. SQL negatív tesztmátrix szükséges, ne csak kliens-Zodban javíts. |
| D05 | Invoice és handover végleges név/cím/tartalom ellenőrzése nem minden útvonalon azonos; invoice source/provider literal | **RÉSZBEN KÉSZ**. Valódi dokumentumokhoz egységes kötelező mezők és server parity; API-bővítés explicit sémaváltozás. |
| D06 | Előlegbeszámítás csak az adott végszámlán a kapcsolt előlegek összegéig ellenőrzött | **ELLENŐRIZENDŐ pénzügyi duplikálás** több végszámlán ugyanazon előleggel. Sztornó/helyesbítés előjelek és korrekciós láncok is külön tesztelendők. |
| D07 | `Backups` bármely azonos companyjú régi backup sikeres readbackjére „most” last_verified_backup | **Igazolt szemantikai eltérés**: friss ellenőrzés ≠ friss adatmentés. Külön backup-kelte/ellenőrzés ideje és figyelmeztetés kell. Manifestből appverzió hiányzik. |
| D08 | Backup csak snapshot+file; outbox/conflict history nincs; restore local queue:false | **RÉSZBEN KÉSZ** üzleti visszaállítás, nem teljes offline művelet-helyreállítás. UI pontos scope és feltöltetlen munka előnézet, későbbi DR import szükséges. |
| D09 | `erp-last-sync` origin-globális; SyncBar state:null esetén is „minden feltöltve”; hiba melletti címke félreérthető | **RÉSZBEN KÉSZ státuszpontosság**. Namespace vault/tenant, unknown/error explicit, last successful pull/push elkülönítés. |
| D10 | `wrapOffline` ugyanazon rekordot blokkol konfliktus után, kapcsolódó rekordokat nem topológiai függőség szerint; immutable átmenetekből végső payloadot összevonhat a resolve | **ELLENŐRIZENDŐ** hiba/megakadás dokumentum-fájl-finalize láncnál. Függőség és helyreállítás vizsgálata több művelettel. |
| D11 | Google UI nem ad disconnectet, eseményszintű feltöltés/hiba nincs; `google_enabled=false` kimarad a Workerből | **NINCS KÉSZ/RÉSZBEN KÉSZ** kapcsolatéletciklus. Megőrzés vs visszavonás szabálya látható legyen; ne törölj önkényesen külső adatot. |
| D12 | Worker azonos `content` esetén nem GET-el Google-re; nincs Retry-After/backoff állapot vagy OAuth token request timeout | **ELLENŐRIZENDŐ** külső kézi változás, lejárt/lemondott esemény újranyitása, quota/network recovery; élő/mocked negatív esetek. |
| D13 | `main.tsx ready` repo-cserénél csak setRepo, régi local repo nem záródik; egyes async effectek unmount utáni erőforrásai | **Technikai adósság/kódaudit**. Régi kulcs/repo/URL lifecycle és React cleanup rendbetétele, pending munka törlése nélkül. |
| D14 | preferences/recipe nincs egyedi index; kliens `.find()`; base táblákon nincs forrás-ID/import run | **RÉSZBEN KÉSZ adatmodell**. Ütközésbiztos singleton és importazonosság csak célzott migrációval. |
| D15 | `projects_close` SQL csak UPDATE; direkt INSERT completed más útvonal lehet | **ELLENŐRIZENDŐ server invariant gap**; negatív SQL teszt INSERT és UPDATE esetekre. |
| D16 | Anyagpreview új listát mutat, újabb revíziót figyel; azonos draft változását nem jelzi | **RÉSZBEN KÉSZ** az elfogadott frissítésjelzés/diff. Quote-version/hash és old/new mennyiségkülönbség kell. |
| D17 | Nincs verziózott vault-migráció, nagy adatoknál teljes snapshot/getAll/base64, poll/full refresh | **Technikai adósság** méret/memória/kvóta/frissítési biztonság. A 100MiB korlát nem garantál minden telefonon memóriát. |
| D18 | `friendly()` hálózati szövege általánosan „nincs elmentve”, miközben offline wrapperben helyben már lehet sikeres írás | **ELLENŐRIZENDŐ státusz-szemantika**. Helyi commit és szerverhiba elkülönített szöveg/eredmény legyen. |
| D19 | Vite >500kB chunk és ineffective dynamic import; nincs pinelt Wrangler/CI/lint | **Technikai adósság**, nem buildhiba. Fókusz a kritikus adatbiztonság után. |
| D20 | `verifyPackage` envelope limit/sémarészlet, prefs/logo/room photo/recipe kapcsolatok részleges validálása | **ELLENŐRIZENDŐ** ellenséges/sérült vagy régi verziós csomag. Teljes referenciagráf, limit és formátummigráció szükséges. |

Az átadás nem állítja, hogy további hiba nincs. A fő modulok nagy TSX-fájlok, több helyen `as` és `any` típusállítás van, a SQL tömör és nehezen karbantartható. A `vite-plugin-pwa` a runtime dependencies között szerepel, noha buildeszköz; besorolása rendezhető. A Node24 runtime mellé @types/node26 van pinelve; tisztázandó támogatási mátrix, nem automatikus major upgrade.

### 5.3. Blokkoló hiányzó bemenetek

| Bemenet | Állapot |
| --- | --- |
| Valós tulajdonosi e-mail/Auth UUID | NEM ISMERT |
| Supabase projekt/org/Free-keret, publikus URL+kulcs | NEM ISMERT, nincs bekötve |
| Cloudflare Pages/Worker/D1 fiók/projekt/URL | NEM ISMERT, nincs telepítve |
| SMTP, feladó, kézbesíthető cím | NEM ISMERT |
| Google Cloud OAuth-kliens/engedély/naptár | NEM ISMERT; kód primaryt használ |
| #profi saját havi/éves tényleges díj | NEM ISMERT; ne helyettesítsd listaárként valós szerződésnek |
| Régi ERP export és minden eredeti fájl | Nincs ellenőrzött forráscsomag |
| Felhasználó valós Windows/telefon/tablet próba | További szükséges átvételi kör |

A forráskódos javítások ezek nélkül is folytathatók. Csak az adott integrációs/éles/import lépés függ a bemenettől; ne állítsd le indokolatlanul az egész fejlesztést, és ne kérd a felhasználótól nyilvános chatben a titkokat.

## 6. Teljes hátralévő feladatlista, függőségekkel és készfeltételekkel

Prioritások: P0 = adatvesztés/pénzügyi sérülés elleni indulási blokkoló; P1 = első ütem teljessége; P2 = használhatóság/optimalizálás; P3 = külön későbbi ütem. Az alábbi sorrend az elfogadott keret befejezését szolgálja. A konkrét megoldásjavaslat nem új felhasználói követelmény.

### 6.1. Kritikus hibák és integritás

| ID | Elvárt munka | Függőség | Ellenőrizhető készfeltétel |
| --- | --- | --- | --- |
| T01 P0 | D01 többopos konfliktust reprodukálni, helyes sorrend/payload és history | local/offline tesztharness | Fordított UUID-sorrend, 3+ módosítás, legutóbbi helyi érték kerül fel; szerverválasztás megőrzi előzményt; semmi csendes eldobás |
| T02 P0 | D02 online műveleti szándék tartósítása/azonos retry | cloud adapter, UI save, RPC | Commit utáni elveszett válasz és újrakattintás után 1 ügyfél/quote/payment marad; apprestart után egyeztethető |
| T03 P0 | Kliens–SQL sémaparitás és JSON-negatív tesztek | migráció, Zod összevetés | Direkt authenticated RPC/table út hibás type/enum/booleán/skála/dátum/kapcsolat esetén elutasít, meglévő adatok nem sérülnek |
| T04 P0 | Sztornó/helyesbítés/előlegszabályok teljes pénzügyi tesztmátrixa | business + SQL; szolgáltatói működés tisztázása | Azonos előleg nem számítható be indokolatlanul többször; korrekciók és refund/deviza/test/proforma helyes összeg; eredeti snapshot megmarad |
| T05 P0 | Settings stale form és singleton-konfliktus | Preferences/recipe adatmodell | 2 ablak nem írhatja felül csendben egymást; egyszerre új settings/recipe után is egyértelmű aktív rekord |
| T06 P0 | Offline függőségek és dokumentumfinalize hibafolyamata | T01–T03, fájl adapter | Tervezet/file/metadata/final lépések bármely megszakadásakor újrapróbálható; nincs elvesző sor, dupla eredeti, végleges PDF nélküli rekord |
| T07 P0 | Close guard INSERT/UPDATE és végleges mezők | SQL/Zod | Completed közvetlen INSERT is szabályozott; teljes név/cím/validált pénz és azonos tenant minden úton |

### 6.2. Hiányzó alapfunkciók

| ID | Elvárt munka | Függőség | Készfeltétel |
| --- | --- | --- | --- |
| T08 P1 | Régi import infrastruktúra: base rekord source mapping, import run, előnézet/hibalista | Valódi export a konkrét adapterhez; infrastruktúra nélküle is készülhet | Minden típust forrásazonosítóval kezel, ismeretlen adatot nem talál ki, dry-run nem ír |
| T09 P1 | Konkrét exportadapter és író próbaimport | T08 + változatlan régi export/fájlcsomag | Kétszeri import nem duplikál; hiánylista/összegegyeztetés/hash; nincs külső side effect |
| T10 P1 | Éles import és célzott rollback előkészítése | T09 + backup + felhasználóval egyeztetett átállási pillanat | Csak saját futás módosítatlan adatai vonhatók vissza; régi ERP megmarad; delta egyeztetett |
| T11 P1 | Teljes üzleti felhő-visszaállító/operátori eljárás | backup és friss Supabase séma/Auth | Tenant/Auth-owner kontrollált map, original file restore, RLS újrapróba, számla/PDF/fotó/signature/payment megnyitható |
| T12 P1 | Tartalék TOTP és minden-faktor elvesztésének végrehajtható runbookja | Valós teszt Auth/SMTP/operátori account | Második faktorral belépés; elveszett faktor és régi session kezelése; AAL1 továbbra is tiltott; pontos kipróbált adminlépések dokumentálva |
| T13 P1 | Ügyfélfelvétel projektből és elfogadott keresési szempontok | Alapadat UI | Felhasználó a megfelelő ponton ügyfelet vesz fel, visszakapja kiválasztva; kereshető név/telefon/cím/projekt a terv szerint |

### 6.3. Meglévő funkciók befejezése

| ID | Elvárt munka | Függőség | Készfeltétel |
| --- | --- | --- | --- |
| T14 P1 | Backup adatfrissesség és előnézet | D07–D08 | Látni backup kelte/ellenőrzés ideje/app- és adatverzió/rekord-fájlszám/méret/feltöltetlen munka; régi fájl nem rejti el esedékes új mentést |
| T15 P1 | Teljes referenciagráf és csomaglimitek | backup/business | Hiányzó photo/logo/recipe/előzmény és malformed manifest jól jelzett, nem ír éles adatot; minden hivatkozott eredeti kötelező |
| T16 P1 | Anyaglista old/new diff és draftmódosítás jelzése | quote version/hash | Régi/új számított és kézi mennyiség látszik, kézi érték megőrződik, verziók nem adódnak össze |
| T17 P1 | Felhős saját eszköz tényleges offline átvétele | T01–T07 + élő Supabase | Két eszköz, új ügyfél/projekt/survey/photo/PDF/payment, restart, tokenlejárat, részleges hálózat, konfliktus megőrzött munkával |
| T18 P1 | Google életciklus és hiányzó UI | Worker és engedélyezett account | Disconnect gomb friss auth/állapotjelzéssel; per-event eredmény/hiba; false/cancelled/újranyitás szabályai teszteltek; külső adat nem sérül |
| T19 P1 | Google retry/backoff/lejárt token/kézi külső változás | T18, mock + élő API | Timeout/429/5xx/lost reply esetén determinisztikus folytatás, kvótakorlát valós, semmi meghívó |
| T20 P1 | Fájlfeltöltés állapotai és eredeti életciklus | document outbox, Storage | Rekord vs bájt státusz megkülönböztetve; mobil fotó és számlaPDF offline/lost reply/restore kerek próba |
| T21 P1 | Státuszok és vaultnévtér | D09/D18 | Unknown/error/mentve helyben/feltöltve külön; vaultváltás nem örököl másik lastsyncet; backup scope egyértelmű |
| T22 P1 | Dokumentum elküldés/elfogadás/aláírás állapotainak összhangja | decision/document/UI | PDF létrehozás nem küldés; kézi sent és dokumentum nézet következetes; nincs hamis automatikus siker |

### 6.4. Új, későbbi funkciók — ne keverd az első ütembe

| ID | Elvárt munka | Függőség | Készfeltétel |
| --- | --- | --- | --- |
| T23 P3 | Számla Agent backend adapter és explicit engedélyezés | Külön felhasználói döntés + aktuális díjak + provider tesztfiók | Secret szerveren; szándék/idempotencia/állapotegyeztetés; régi kézi rekordot és offline draftot nem számláz újra |
| T24 P3 | Bejövő számla részletes workflow | Külön mező/mód/jogosultság/javítás/költség egyeztetés | Outgoing/incoming pénzek és szerepek külön; opcionális project; nincs beszerzés vagy kitalált OCR/NAV ígéret |
| T25 P3 | Nagy/incrementális/automatikus mentés | Méretadatok, költség/üzemeltetés | Nem terheli észrevétlenül a kvótát; változott fájlok/integritás/visszaállítás bizonyított; kézi alapút megmarad |
| T26 P3 | Naptárválasztó, kétirányúság, más szolgáltatók, több user | Csak külön igényként | Ne tekintsd most megrendelt funkciónak |

### 6.5. Felhasználói felület

| ID | Elvárt munka | Függőség | Készfeltétel |
| --- | --- | --- | --- |
| T27 P2 | Mobil/tablet teljes munkafolyamat és accessibility | Valódi eszközök, összes modal/tablázat/signature | Olvasható címkék, billentyűzet/fókusz, hosszú szöveg és nincs akadályozó túllógás; user által jóváhagyott meglévő irány megmarad |
| T28 P2 | Minden üzleti szerkesztő dirty/conflict kezelése | UI state/audit | Navigáció/frissítés/dialog close nem veszít munkát csendben; ne csak alapadatűrlapon működjön |
| T29 P2 | Nyers JSON konfliktusnézet emberibb meződiffje | T01–T06 | A két változat/döntés/előzmény továbbra is elérhető; nem egyszerűsítéssel eltüntetett adat |
| T30 P2 | Hosszú PDF/logó/fotó tördelési mátrix | pdf.ts és fixturek | Többoldalas magyar hosszú sorok, áfa/kedvezmény/fotók/signaturek szemrevételezve; nincs levágás/feliratárva |

### 6.6. Biztonság, optimalizálás és karbantartás

| ID | Elvárt munka | Függőség | Készfeltétel |
| --- | --- | --- | --- |
| T31 P1 | Éles CSP/cache/RLS/auth/session audit | Saját staging HTTPS | Más user/AAL1 tiltott; privát response nincs plain SW cache-ben; valódi URL-ekre szűkített policy; logout/pending megőrzés |
| T32 P1 | Vault schema upgrade/rollback | Lokális jelenlegi1 verzió, jövőbeli migráció | Régi függő sorral update megszakításból is feloldható; nincs auto clear; backward incompatibility őszinte jelzés |
| T33 P2 | Snapshot/getAll/base64 memória és kvóta | Méretmérések, mobil eszköz | Dokumentált biztonságos méretek; túlcsordulás nem sikerjelzés; nincs pending fájl automatikus takarítása |
| T34 P2 | Komponensek/validátorok bontása, typing/lint, token lifecycle | Regressziós alaptesztek | Funkciók megmaradnak; kevesebb any/type cast, unmount repo/URL felszabadítva; tiszta check/build |
| T35 P2 | Bundle/chunk és buildeszközök rendbetétele | T34 | PDF továbbra is offline precached; nincs rejtett külső font; méretmérés és nincs funkcióvesztés |
| T36 P1 | Git és reprodukálható CI/forráskezelés | Saját repo célja | Secretmentes első commit, lock/SQL/docs/test együtt; build/unit/E2E fut; artifact és kiadás rollback követhető |
| T37 P1 | Üzemeltetési tárhely/forgalom/költségfigyelés | Valós szolgáltatói adatok | Becsült és szolgáltatói tény külön; limitközeli jelzés; nincs automatikus fizetős upgrade |

### 6.7. Végső tesztelés és élesítés

T38 P1: saját fiókok/költség beüzemelési adatlapja → külön staging deploy → tulajdonosi/TOTP/SMTP és tartalék-hozzáférés próba → teljes próbamunkafolyamat valós API-val, ügyfélértesítés/Agent nélkül → valódi számítógép/telefon/tablet offline + két eszköz → eredeti fotó/számlaPDF/aláírt jegyzőkönyv → teljes mentés/readback/új környezet restore → régi próbaimport egyeztetés → ellenőrzött éles átvétel és forrásátadás.

Függőségek: T01–T22 első ütem releváns pontjai, saját fiókok és export. Készfeltétel: dátumozott, tényleges eredményű elfogadási jegyzőkönyv, megismételhető parancsok, ismert hiánylista, saját fiókok tulajdonjoga és helyreállítása kipróbálva. Ne jelöld a teljes terméket élesnek pusztán a helyi 35+4 zöld teszttől.

## 7. Kötelező utasítások a folytató Codexnek

1. **Ne kezdd újra.** A 0.2.0 forrás a folytatási alap. Ne cseréld Sites-ra, más stackre vagy általános admin sablonra.
2. Először olvasd át a kódot és futtasd a baseline-t. Ellenőrizd e dokumentum minden lényeges állítását; külön discrepancy listát vezess.
3. Őrizd meg a meglévő működő modulokat, helyi adatot, dokumentumverziókat, fájlokat és outboxot. Ne törölj csak azért, hogy egyszerűbb legyen.
4. Az eredeti követelmény és a készültség két külön dolog. Hiányzó funkciót ne törölj a specifikációból, hanem készítsd el vagy jelöld függőnek.
5. Az elfogadott működési szabályokat ne változtasd meg önkényesen. Különösen: kézi számlázás, nincs beszerzés, későbbi bejövő/API, 5k teljes keret, TOTP/AAL2, változtathatatlan eredetik.
6. Az alkalmazás ne csináljon éles számlát/értesítést/importot a háttérben egy általános mentés vagy reconnect miatt.
7. A forrás nem kezelhet service_role/Google secret/Agent kulcsot frontend env-ként. A dokumentum és backup sem tartalmazhat titkot.
8. Minden jelentős adatkezelési változás után célzott teszt, megfelelő teljes regresszió és szükség esetén valódi API-s átvétel kell. Új negatív esetből írj valódi védőtesztet, ne pusztán implementációt tükröző tesztet.
9. Ne állítsd teszteltnek, ami csak meg van írva, és ne nevezd élő integrációnak a mockot. Az eredmény mellett add meg a környezetet és korlátot.
10. Helyi adatséma-változtatáshoz migráció és pending műveletes próba; SQL-változtatáshoz következő számozott migráció. Élesben korábban lefutott migrációt ne írd át történetileg.
11. Ne írj felül verzióütközést „force save”-vel. Felhasználói választás, követhető előzmény és eredeti pillanat megőrzése szükséges.
12. Tarts tiszta, karbantartható kódot, de refaktorálás címén ne tüntess el fotót, aláírást, backupot vagy részfizetést.
13. Folyamatosan frissítsd a `CODEX_HANDOVER.md`, `TEST-REPORT.md` és szükséges README állapotát. Feladat done csak ellenőrizhető készfeltétellel.
14. A felhasználót csak valóban hiányzó, szükséges döntésről kérdezd. Fiók/export nélkül végezhető hibajavítást folytasd önállóan.
15. Nincs garantált háttérmunka a beszélgetés lezárása után. Időbecslést becslésként adj, eredményt csak valódi fájllal/ellenőrzéssel jelents.
16. Átadáskor source ZIP, lock, migráció, konfigurációminta, teszt és dokumentáció együtt kell. Secretet, node_modules/dist/test artifactot ne csomagolj forrásként.

## 8. Az átadott fájlok és a jelen kör határa

- **`CODEX_HANDOVER.md`**: ez az önálló, teljes magyar átadási dokumentum, a forrás-ZIP gyökerének `erp/` mappájában is azonos tartalommal.
- **`ERP-v0.2.0-CODEX-source.zip`**: teljes aktuális forrás, lock, env-minta, SQL, Worker, font/licenc, tesztek és dokumentáció. **Nincs benne** node_modules, dist, .env, token, valós kulcs, tesztkimenet, screenshot/videó, Chromium bináris, tsbuildinfo, ideiglenes segédeszköz vagy régi ZIP. A hiányzó dist szándékos, `npm run build` hozza létre.
- A korábbi **`ERP-v0.2.0.zip`** felhasználói próba-csomag a kész próbabuildet is tartalmazta; nem ugyanaz a forrás-only átadás. A verzió maradt0.2.0, mert ebben a körben üzleti kódot nem változtattunk.

A jelen körben elvégzett utolsó fejlesztésjellegű művelet a meglévő kód auditálása, a baseline tesztek ismétlése és ez a dokumentáció/csomagolás. Nem történt a D01–D20 pontok javítása, éles fiókbekötés vagy adatimport. A forrás közötti eltéréseket a korábbi ZIP-hez képest csomagoláskor ellenőrizzük; a dokumentum hozzáadása nem jelenti új üzleti funkció megvalósítását.

## 9. Mellékletek — változatlan követelmények és gépileg kiolvasott tények

### A. A teljes elfogadott működési specifikáció

Az alábbi szöveg teljes másolat, a címsorszinteket két szinttel beljebb rendeztük. A benne szereplő „fejlesztendő” és „tervezett” állapot a terv keletkezési idejét tükrözi, nem írja felül a jelen dokumentum készültségi mátrixát. A díjak és szolgáltatói limitek a terv korábbi ellenőrzésének állításai; ebben az átadási körben nem történt friss díjkutatás.

### E-RP – működési specifikáció

Verzió: 1.0 · Dátum: 2026. október 23.

**Állapot:** kidolgozott működési specifikáció és tervezett adatmodell. Az offline működés, az adatátvétel és az indulási beállítások terve is szerepel benne. Ez fejlesztési alap, nem elkészült alkalmazás vagy végrehajtott adatátvétel. Az új alkalmazás forráskódja, az éles fiókok beállítása és a működés bizonyító tesztjei a megvalósítás következő feladatai.

**A mostani döntés:** első körben a számlát kézzel állítod ki a Számlázz.hu saját felületén. Az E-RP a számlázáshoz szükséges adatokat készíti elő, majd a már kiállított kimenő számlát, annak PDF-jét és fizetéseit tartja nyilván. A Számla Agent API-s kiállítás későbbi, külön bekapcsolható bővítés lesz. Az adatmodell továbbra is előkészíti a későbbi bejövő számlákat. A beszerzés nem része a jelenlegi feladatnak.

#### 1. Rögzített keretek

- Saját React + TypeScript + Vite alkalmazás, a HomeHubnál használt fejlesztési iránnyal.
- Supabase Database az adatokhoz, Supabase Storage a fényképekhez, PDF-ekhez és aláírásokhoz.
- Cloudflare Pages a webes felület tervezett tárhelye. A szerveroldali műveleteket külön, védett háttérszolgáltatás kezeli.
- Számítógépen, tableten és telefonon használható felület; helyszíni munkához offline szerkesztés és későbbi szinkronizálás.
- Elsőként egy tulajdonosi fiók, zárt regisztrációval és kétlépcsős azonosítással.
- Teljes szolgáltatási keret: legfeljebb havi 5 000 Ft. A keretbe a tárhely és a számlázási kapcsolat is beletartozik.
- Meglévő Számlázz.hu-előfizetés: **#profi**, a felhasználó 2026. október 23-i pontosítása alapján. Nem #free csomaggal és nem új #start-előfizetéssel tervezünk.
- Első ütem: kézi kiállítás a Számlázz.hu-n, kézi számlanyilvántartás az E-RP-ben. Az E-RP ebben az ütemben nem indít Számla Agent API-hívásokat, és működéséhez nem kér Agent-kulcsot.
- Az első anyagkezelés csak a szükséges anyagokat és mennyiségeket kezeli. Nincs készlet, rendelés, beszerzési állapot vagy beszállítói árkatalógus.

#### 2. A munka végigkövetése

Egy munka egy projekt. Egy ügyfélnek több projektje és több munkavégzési helyszíne lehet.

A szokásos folyamat: megkeresés → felmérés → árajánlat és döntés → időpont és előkészítés → munkavégzés → átadás → számlázás és fizetés → archiválás. Nem kell minden projektnek minden lépést végigjárnia. Rövid munkánál a felmérés kihagyható: új projekt → közvetlen ajánlat katalógusból vagy egyedi tétellel → munka → átadás → kézi számlanyilvántartás. A kihagyott felmérés helyére nem készül kitalált felmérési adat.

A munka állapota, az ajánlat elfogadása, a dokumentumok elkészülte és a fizetés külön nyilvántartás. Például az átadás nem állít ki automatikusan számlát, és a számlakiállítás nem jelenti a pénz beérkezését.

| Főmenü | Feladat |
| --- | --- |
| Irányítópult | Aktív munkák, határidők, következő események és pénzügyi összesítés |
| Projektek | A teljes munkafolyamat projektenként |
| Naptár | Felmérések, munkavégzések és visszatérések |
| Ügyfelek | Kapcsolattartási, számlázási és helyszínadatok |
| Számlák | Elsőként kimenő számlák; később elkülönített bejövő számlák |
| Beállítások | Cégadatok, katalógusok, sablonok, kapcsolatok és fiók |

A projekt fülei: **Áttekintés, Felmérés, Árajánlat, Anyagok, Jegyzőkönyv, Számlák, Dokumentumok.** Külön Munkalap fül nincs a tervben.

#### 3. Felmérés, ajánlat és anyagok

##### Felmérés

A felmérésnek saját neve van. Az ügyfél és a helyszín a projektből átvehető. Helyiségenként és a teljes ingatlanra vonatkozóan is rögzíthetők munkák, mennyiségek, egységek, elhelyezések, megjegyzések és fényképek. A meglévő állapot és a tervezett munka elkülönül. A nem vizsgált vagy ismeretlen adat rögzíthető így; nem kell helyette kitalált értéket megadni.

A belső megjegyzések nem kerülnek automatikusan az ügyfél dokumentumaiba. Az eredeti felmérés és a fényképek megmaradnak, az árajánlat későbbi szerkesztése nem írja át őket.

##### Árajánlat

Az ajánlat felmérésből állítható össze. Egy munkatételhez mennyiség, egység és munkadíj tartozik. A katalógus alapárát az adott ajánlatban felül lehet írni, és a későbbi katalógusmódosítás nem változtatja meg a már rögzített ajánlatot.

Az anyagköltség külön, kézzel megadott összeg. Az anyagmennyiségek listájából nem lesz automatikusan beszerzési vagy eladási ár. Kedvezmény csak kifejezett rögzítéssel jelenik meg.

Az ajánlat állapotai: tervezet, elküldött, módosításkérés, elfogadott, elutasított. Az elfogadás külön esemény; a PDF elkészítése nem jelent elfogadást. Az elküldött dokumentum pillanatfelvétel, módosításkor új verzió készül.

Az ügyfél PDF-jén a cég, az ügyfél és a helyszín adatai, az ajánlat azonosítója és verziója, a dátumok, az érvényesség, a munkák és mennyiségek, a munkadíj, az anyagköltség, az esetleges kedvezmény és a végösszeg szerepelnek. A fizetési és vállalási feltételek szerkeszthető sablonból jönnek. Az adózási beállítás a cégadatokhoz tartozik.

##### Anyagok

A munkatípusokhoz anyagrecept kapcsolható, mennyiséggel és egységgel. A kiválasztott ajánlatverzió alapján összesített anyaglista készül. Csak ténylegesen azonos anyag és egység vonható össze; azonos név önmagában nem elég.

Az anyaglista kézzel kiegészíthető és javítható. Ha változik az ajánlat, a rendszer jelzi a frissítés szükségességét, megmutatja az eltéréseket, és kezeli a kézi módosításokat. Több ajánlatverzió mennyiségeit nem adja össze.

A későbbi bejövő számlakezelés nem változtatja meg automatikusan az ajánlat anyagköltségét vagy ezt a szükségletlistát.

#### 4. Naptár és átadás

A projekthez több időpont tartozhat: felmérés, munkavégzés vagy visszatérés. Minden eseménynek van kezdete, vége, helyszíne és megjegyzése. A megjelenítés Europe/Budapest időzónában történik. Az átfedések figyelmeztetést adnak; egy elmúlt időpont nem zárja le a munkát.

A Google Naptár kapcsolat kizárólag az alkalmazáshoz kapcsolt eseményeket módosítja. Egy esemény mentése önmagában nem küld ügyfélmeghívót. Offline változtatáskor szinkronizálási sor és duplikációvédelem szükséges.

Az átadási jegyzőkönyv a ténylegesen elvégzett munkát, a dátumot, eltéréseket, pótmunkákat, fennmaradó feladatokat és kiválasztott fényképeket tartalmazza. Projektenként több jegyzőkönyv készülhet.

Három kötelező lezárási ellenőrzés:

1. Rendezett munkaterület.
2. Ügyfél tájékoztatása.
3. Dokumentumok átadása.

A hiányos dokumentum tervezet maradhat. Az ügyfél és a vállalkozó rajzolt aláírása az adott dokumentumverzióhoz kötődik. Módosítás után új verzió készül; az ügyfél régi aláírása nem kerül automatikusan az új tartalomra. Aláíratlan és részben aláírt dokumentum is egyértelműen megkülönböztethető.

#### 5. Kimenő számlák: először kézi kiállítás, később API

Kimenő számla: a saját vállalkozás állítja ki az ügyfélnek. Attól még kimenő marad, hogy a Számlázz.hu webes felületén készül, és az E-RP-be kézzel kerül be.

##### Első ütem – kézi munkafolyamat

| Lépés | Elvárt működés |
| --- | --- |
| Adatok előkészítése az E-RP-ben | Projekt, ügyfél, külön számlázási cím, elfogadott ajánlat és számlázandó összeg áttekintése; az adatok másolhatóak |
| Számlázz.hu megnyitása | Külön hivatkozás a számlázóhoz; nincs automatikus bejelentkezés, adatküldés vagy Agent-hívás |
| Kiállítás és kiküldés | Kézzel, a Számlázz.hu saját felületén történik |
| Kiállított számla rögzítése az E-RP-ben | A tényleges számlaszám, típus, dátumok, összegek, deviza és fizetési mód bevitele |
| PDF csatolása | A Számlázz.hu-ról letöltött eredeti PDF feltöltése és kapcsolása a projekthez |
| Fizetés követése | Befizetések kézi rögzítése dátummal, összeggel és móddal; részfizetés és nyitott összeg kezelése |

A tervezett fő műveletek neve: **Számlázási adatok**, **Számlázz.hu megnyitása**, **Kiállított számla rögzítése**, **PDF csatolása**, **Befizetés rögzítése**. API-s kiállítási gomb ebben az ütemben nincs bekapcsolva.

Az előkészített adatlap nem számla: nem kap saját számlaszámot, és az E-RP nem készít belőle hivatalos számla-PDF-et. A végleges számot és adatokat mindig a ténylegesen kiállított dokumentum alapján rögzítjük. A munkavégzési cím eltérhet a számlázási címtől.

A számla nyilvántartásához szükséges alapadatok: projekt vagy ügyfélkapcsolat, kimenő irány, dokumentumtípus, kibocsátó és vevő akkori adatai, számlaszám, kiállítási és teljesítési dátum, fizetési határidő, nettó/adó/bruttó összeg, deviza és fizetési mód. A rendszer a hiányos bejegyzést tervezetként megőrizheti, de hiányos adatból nem mutathat teljesnek látszó pénzügyi összesítést. A PDF később is csatolható; addig a dokumentum hiánya látható.

A rögzítés forrása **Kézzel rögzítve – Számlázz.hu**. A kézi bevitel nem jelent automatikus egyeztetést a Számlázz.hu-val, bankkal vagy NAV-val. A PDF feltöltése önmagában nem igazolja sem a fizetést, sem az adatok ellenőrzését. Az E-RP-ben rögzített befizetés nem módosítja automatikusan a Számlázz.hu fizetettségi állapotát.

A nyilvántartható dokumentumtípusok: normál számla, díjbekérő, előlegszámla, végszámla, sztornó és helyesbítő számla. A helyesbítés és sztornó külön dokumentumkapcsolat; nem a korábbi eredeti számla átírása. Az elfogadott projektérték, a kiállított számlák értéke, a rögzített fizetések, a kintlévőség és a még nem számlázott összeg elkülönül. Az előleg és végszámla elszámolása nem duplázhatja az összesítést. A díjbekérő nem számít automatikusan számlának vagy beérkezett pénznek.

Offline előkészíthetők a számlázási adatok, és helyben rögzíthetők egy már máshol kiállított számla adatai. A fájl feltöltési állapota külön követhető. Újracsatlakozáskor kizárólag a helyi nyilvántartás és fájlok szinkronizálódnak; ez sem most, sem később nem indíthat automatikus számlakiállítást.

##### Az API későbbi bekötésének előkészítése

- A vállalkozás számlázási módja kezdetben **kézi**. Az API-mód külön beállítás és későbbi, kifejezett bekapcsolás.
- Minden számla saját belső azonosítót kap. A számlairánytól külön mező jelöli a létrehozás forrását: kézzel rögzített vagy API-val kiállított.
- A számlázószolgáltató már kézi rögzítésnél is megadható. Az API külső azonosítója ekkor üresen maradhat; a felhasználónak nem kell kitalált értéket beírnia.
- Ugyanahhoz a számlához tartozik a projektkapcsolat, az eredeti PDF és a részfizetés attól függetlenül, hogy később melyik úton került be. Az API bekötése nem igényli e kapcsolatok újraépítését.
- A kézi rögzítés és az API-s kiállítás külön művelet. Egy már kiállított, kézzel rögzített számlát az API bekapcsolása nem állít ki újra, és a régi tervezeteket sem küldi be automatikusan.
- Későbbi lekérdezés vagy import során a már rögzített számlát egyeztetni kell az eredetivel. Nem jöhet létre automatikusan második nyilvántartási példány vagy dupla bevétel.
- A majdani API-művelet saját tartós műveletazonosítót és naplózott állapotot kap. Bizonytalan szolgáltatói válasz után először állapotegyeztetés szükséges; vak újraküldés nem megengedett.
- A majdani API-kulcs védett szerveroldali titok lesz. Az első kézi változat kulcs nélkül használható; a felület, az offline adatbázis és a naplók nem tárolhatják ezt a titkot.

A Számlázz.hu saját csomagjogosultságait és szabályait a későbbi API-s folyamatban is meg kell tartani. A több előleg egy végszámlához kapcsolásának szolgáltatói támogatását az API megvalósítása előtt külön ellenőrizni kell.

#### 6. Előkészítés a későbbi bejövő számlákhoz

Bejövő számla: más vállalkozás állítja ki az E-RP-ben kezelt vállalkozásnak. Ilyenkor az E-RP-ben a már létező dokumentumot kell majd rögzíteni és követni. A rögzítés nem indíthat kimenő számlakiállítást.

**Most az adatmodell és a kapcsolódási pontok készülnek elő.** A bejövő számlák képernyői, feltöltése, importja és teljes munkafolyamata későbbi fejlesztési ütem. A közös alap önmagában nem jelent bejövőszámla-importot vagy új fizetős szolgáltatást.

##### Közös adatok, külön folyamatok

| Adat vagy kapcsolat | Kimenő számla | Későbbi bejövő számla |
| --- | --- | --- |
| Irány | Kimenő | Bejövő |
| Kibocsátó | Saját vállalkozás | Szállító vagy szolgáltató |
| Vevő | Ügyfél | Saját vállalkozás |
| Partner | Ügyfél | Szállító vagy szolgáltató |
| Számlaszám | Először a kiállított számláról kézzel rögzítve; később az API adhatja vissza | A kapott számláról rögzítendő |
| Dátumok | Kiállítás, teljesítés, fizetési határidő | Ugyanezek, a beérkezés dátumával kiegészítve |
| Összegek | Nettó, adó, bruttó és deviza | Ugyanilyen alapmezők, az eredeti számla alapján |
| Fizetések | Beérkező pénz rögzítése | Kifizetés rögzítése |
| Projektkapcsolat | Projektből előkészíthető | Később opcionálisan projekthez rendelhető |
| Fájl | Először a számlázóról letöltött eredeti PDF kézi csatolása | A kapott számla eredeti fájlja |
| Létrehozás módja | Először külső kézi kiállítás és E-RP-rögzítés; később opcionális API | Meglévő számla rögzítése; az import módja később eldöntendő |

A partneradatok közös törzsbe rendezhetők, ügyfél- és szállítói szereppel. Ugyanaz a partner mindkét szerepben szerepelhet; nem szükséges két külön névjegyet fenntartani. A jelenlegi Ügyfelek menü ettől még megmaradhat, a szállítói nézet később kapcsolható be.

##### Tervezett adatmodell

Az alábbi nevek tervezési javaslatok; nem már létező adatbázistáblák.

| Egység | Tartalma és szerepe |
| --- | --- |
| Vállalkozás | Saját cégadatok és fiókhoz tartozás |
| Partnerek | Közös kapcsolattartási törzs, ügyfél/szállító szereppel |
| Számlák | Belső azonosító, irány, típus, létrehozási forrás, szolgáltató, opcionális API-azonosító, számlaszám, felek pillanatfelvétele, dátumok, deviza, összegek és állapotok |
| Számlatételek | Megnevezés, mennyiség, egység, egységár és adózási adatok; szükség esetén szolgáltatói nyers adatkapcsolat |
| Számlakapcsolatok | Előzmény, helyesbítés, sztornó és előleg/végszámla viszony; nem összekeverve a projektkapcsolattal |
| Számla–projekt kapcsolatok | Későbbi több projekthez rendelésre is bővíthető; kezdetben egy projekthez kapcsolás elegendő |
| Fizetések | Számlához tartozó ténylegesen rögzített pénzmozgás dátummal, összeggel, devizával és iránnyal |
| Dokumentumok és számlafájlok | Storage-hivatkozás, eredet, fájltípus, dokumentumverzió és megőrzési adatok |
| Külső kapcsolatok | Kezdetben kézi számlázási mód; később szolgáltató, API-kapcsolat, teszt/éles környezet és külső azonosító; a titkos kulcs elkülönítve |
| Műveleti napló | Kézi rögzítés és módosítás nyoma; később API-s kiállítási szándék, kérés, eredmény és bizonytalanság, titkos adatok nélkül |

##### Már az alapban betartandó szabályok

1. Minden számlának van egyértelmű iránya. A bejövő és kimenő összegek, fizetések és tartozások nem keverhetők össze.
2. A belső azonosító különbözik a számlaszámtól és a külső szolgáltató azonosítójától. Azonos számlaszám két külön szállítónál önmagában nem ütközés.
3. A számlához a kibocsátó és vevő akkori adatai is tartoznak. Egy későbbi partneradat-módosítás nem írja át a korábbi számlát.
4. A dokumentum állapota, a feldolgozás állapota, a fizetettség és az API-művelet állapota elkülönül. Egy feltöltött számla nem lesz ettől kifizetett vagy ellenőrzött.
5. A pénzösszegek pontos tizedesértékként, devizával és meghatározott kerekítési szabállyal tárolandók. Eltérő devizák összegét árfolyam és átváltási szabály nélkül nem adjuk össze.
6. A számla dátummezői naptári dátumok. A technikai események időpontjai időzónával értelmezhető időbélyegek. A kettő nem cserélhető fel.
7. A számlákhoz több részfizetés és dokumentum kapcsolódhat. Az eredeti PDF-fájlok megőrzendők; nem egy később módosuló partneradatból generált másolat helyettesíti őket.
8. Duplikációjelzéshez később felhasználható a kibocsátó, az eredeti számlaszám, a deviza, a külső azonosító és a fájl azonossága. Egyetlen egyszerű névegyezés nem lehet elegendő az automatikus összevonáshoz.
9. A bejövő számla projektkapcsolata kezdetben opcionális. Általános vállalkozási kiadás miatt nem kell mesterséges munkaprojektet létrehozni.
10. A bejövő számlák rögzítése nem vezet be készletkezelést, beszerzési folyamatot vagy automatikus könyvelési/adózási döntést.

##### Később eldöntendő lehetőségek

Ezek bővítési irányok, jelenleg nem vállalt funkciók:

- Kézi számlarögzítés és eredeti PDF vagy fénykép csatolása.
- Szállító, határidő és fizetettség szerinti lista.
- Kapcsolás munkaprojekthez; később egy összeg megosztása több projekt között.
- Automatikus adatkinyerés vagy import, a ténylegesen elérhető szolgáltatás és költség ellenőrzése után.
- Projektenkénti kiadásösszesítés, a kifizetés és a rögzített költség világos elkülönítésével.

A bejövő számlák fejlesztésének megkezdése előtt külön tisztázandó a rögzítési mód, a szükséges mezők, az ellenőrzés, a javítás és törlés szabálya, valamint a fizetés követése. Automatikus NAV-import, OCR, banki egyeztetés vagy könyvelői adatátadás nincs most megígérve.

#### 7. Ügyfelek, dokumentumok és beállítások

Az ügyfél a projekt létrehozásakor kiválasztható vagy felvehető. Az adatok név, telefonszám, cím és projekt alapján kereshetők. Hiányos ügyféladatokkal tervezet menthető, de a kiállításhoz szükséges mezőket az adott művelet előtt ellenőrizni kell.

A dokumentumtár közös hivatkozásokkal kezeli a fotókat, ajánlatverziókat, jegyzőkönyveket, számlákat és feltöltött fájlokat. Egy fájl több helyen megjelenhet anélkül, hogy minden nézethez új példány készülne. A dokumentum típusa, dátuma, verziója, kiküldési és aláírási állapota követhető.

A beállításokban szerepelnek a cég- és bankadatok, logó, adózási beállítás, munkakatalógus, anyagreceptek, dokumentumsablonok, kapcsolatok, fiók és adatmentés. Katalógustétel archiválható; ettől a korábbi ajánlatok és dokumentumok nem vesznek el.

#### 8. Offline működés és adatvédelem

Az alábbi működést dolgoztuk ki az első változat fejlesztési alapjaként. A fiókok létrehozása, a levelezés bekötése, a mentés és a helyreállítás tényleges megvalósítása és ellenőrzése még a fejlesztés része; jelenleg ezek nincsenek bekapcsolva.

##### 8.1. Belépés és hozzáférés

Kezdetben egyetlen tulajdonosi fiók lesz, nyilvános regisztráció nélkül. A Supabase-projekt és az E-RP tulajdonosi hozzáférése a felhasználóé; nem épülhet az asszisztens későbbi elérhetőségére.

Az első fiókot ellenőrzött e-mail-címmel hozzuk létre. Első belépéskor e-mail és jelszó, majd hitelesítő alkalmazásos, időalapú kód (TOTP) szükséges. A hitelesítő összekötése csak sikeres kódellenőrzéssel tekinthető befejezettnek. Az első üzleti adatok megnyitása előtt kötelező a második lépcső beállítása.

| Helyzet | Tervezett működés |
| --- | --- |
| Első belépés | E-mail és jelszó, TOTP beállítása és ellenőrzése, tartalék hozzáférési mód rögzítése |
| Új eszköz vagy kijelentkezés utáni belépés | E-mail és jelszó, majd TOTP |
| Saját eszköz | Külön választással megőrzött munkamenet és engedélyezett helyi offline adatok |
| Nem saját eszköz | Tartós belépés és offline adatgyűjtés nélkül; a munkamenet végén a helyi alkalmazásadatok törlése |
| Lejárt vagy visszavont munkamenet | Új azonosítás a szerverelérés előtt; a korábbi helyi munka megőrzése |
| Érzékeny fiókmódosítás vagy helyreállítás | Online, frissen igazolt hitelesítéssel; önmagában egy nyitott alkalmazásnézet nem elegendő |

A megőrzött munkamenet nem külön „30 napig megbízható eszköz” szolgáltatás. Az első változatban nem ígérünk pontos, szerver által kikényszerített 30 napos lejáratot. A Free csomaghoz igazodó megőrzött belépést és a kijelentkezést használjuk; az időkorlátos és egyetlen munkamenetes szabályokat nem tekintjük ingyenesen elérhető beépített funkciónak.

A hozzáférést nem csak a felület ellenőrzi. Az üzleti adattáblákhoz és a privát fájlokhoz a tulajdonosi jogosultság és a kétlépcsős azonosítás teljesítése egyaránt szükséges. Az adatbázis RLS-szabályai a második hitelesítési szintet (AAL2) is megkövetelik; az első beállítási képernyő nem ad üzleti adathozzáférést.

Fénykép, számla és aláírás privát Storage-területre kerül. Fájlmegnyitás hitelesített letöltéssel vagy rövid idejű hivatkozással történhet. A szerveroldali titkok és az adminisztrációs kulcsok nem kerülnek a böngésző alkalmazáskódjába, a helyi adatbázisba vagy a letöltött üzleti mentésbe. A bejelentkezési képernyő nem jelzi vissza illetéktelennek, hogy egy megadott e-mail-címhez létezik-e fiók.

##### 8.2. Elfelejtett jelszó és elveszett telefon

A helyreállítást három külön helyzetre bontjuk.

**Elfelejtett jelszó:** az alkalmazásból helyreállító e-mail kérhető. A visszatérési cím kizárólag az E-RP engedélyezett címére mutathat. A jelszó visszaállítása nem kapcsolja ki a TOTP-követelményt; az üzleti adatokhoz utána is teljesíteni kell a második lépcsőt.

Éles jelszó-helyreállításhoz saját SMTP-kapcsolatot kell beállítani és kipróbálni. Lehetőség szerint a meglévő levelezési szolgáltatás használható, ha támogatja ezt. A Supabase alapértelmezett tesztlevelezésére nem építünk éles helyreállítást. A konkrét szolgáltató és feladó beállítása a beüzemelés része; új fizetős előfizetés nincs most kiválasztva vagy megrendelve.

**Elveszett telefon:** a működő fiókhoz előre felvett és kipróbált tartalék TOTP-lehetőség ad elsődleges helyreállítási utat. Ez lehet második, elkülönítetten tárolt hitelesítő vagy biztonságos helyen őrzött beállítási titok. Nem elegendő, ha a tartalék kizárólag ugyanazon az elveszett telefonon van. Egy visszaállítási próba után az elveszett hitelesítő eltávolítható és az új telefon felvehető.

A Supabase dokumentációjában már szerepel kísérleti helyreállítókód-API is. Az első változat helyreállításának biztos alapja a kipróbált tartalék TOTP, a kísérleti kódlistát nem ígérjük kész szolgáltatásként.

**Minden alkalmazásos hitelesítő elveszett:** külön vészhelyzeti üzemeltetési leírás készül a saját Supabase-projekt tulajdonosi hozzáférésével végzett visszaállításhoz. Az adminisztrációs tényezőtörlés nem érhető el az E-RP nyilvános felületéről és nem járhat általános adathozzáférési feloldással. Utána az új TOTP beállítása és ellenőrzése ismét kötelező, az AAL2-követelmény megmarad.

A Supabase kezelőfelületéhez tartozó fiók külön hozzáférés, saját tartalék hitelesítéssel. Ha ehhez is minden hitelesítő elveszik, nem ígérünk garantált szolgáltatói visszaállítást. Ezért a projektátadás része az alkalmazás és az üzemeltetői fiók tartalék hozzáférésének külön ellenőrzése.

Más munkamenetek kijelentkeztetése is szükséges a helyreállítás után. A már kiadott hozzáférési token élettartamát és az offline helyi másolatot ettől külön kell kezelni: a kijelentkeztetés nem jelent minden offline eszközön azonnali távoli adattörlést.

##### 8.3. Saját eszköz és offline adatok

A helyi adatbázis kezeli a tervezeteket és a szinkronizálási sort. A felület külön jelzi a helyben mentett, feltöltésre váró, szinkronizált és hibás állapotot. A fájlok feltöltése külön állapotot kaphat az adatrekord mentésétől. A „helyben mentve” jelzés nem jelent szerverre feltöltött vagy külön biztonsági másolatba mentett adatot.

Offline üzleti adatok csak korábban online, teljesen azonosított és sajátként engedélyezett eszközre kerülhetnek. Ismeretlen eszközön az első belépés online történik. A telefonos TOTP-kód szerveroldali ellenőrzését nem utánozzuk offline, és nem másoljuk ehhez a TOTP titkát az alkalmazásba.

A helyi adatok védelméhez az eszköz képernyőzárát és felhasználói hozzáférését is használni kell. Az online kétlépcsős védelmet kiegészítő, titkosított helyi tároló és az offline dokumentumkészítés működése a 8.7–8.9. pontban szerepel.

Lejárt munkamenetnél a helyi módosításokat megőrizzük, a szerverre feltöltést új azonosításig megállítjuk. A böngésző bezárása utáni háttérszinkron nem garantált; a következő megnyitáskor folytatni kell. Kijelentkezés vagy helyi adatok törlése előtt a még nem szinkronizált munka mennyisége látható, és nem veszhet el figyelmeztetés és kifejezett döntés nélkül.

##### 8.4. Üzleti adatok és fájlok mentése

Az ingyenes induló változathoz **felhasználó által indított, titkosított, letölthető üzleti mentési csomagot** tervezünk. Az elsődleges cél egy, az éles Supabase-projekttől független példány a saját számítógépen. Külön adathordozóra vagy meglévő másik tárolóra második példány is készíthető. Nem feltételezzük, hogy ilyen adathordozó vagy második tárhely már rendelkezésre áll.

A cél napi munkavégzés után új mentés. A felület az utolsó ellenőrzött mentés idejét mutatja, és 24 óra után esedékességet jelez az alkalmazás következő használatakor. Ez alkalmazáson belüli jelzés és kézi mentésindítás; bezárt böngésző mellett nem jelent automatikusan lefutó napi mentést.

A Beállítások / Adatok és mentések tervezett műveletei:

- **Teljes üzleti mentés készítése.**
- **Mentési fájl ellenőrzése.**
- **Visszaállítás előnézete.**

| A csomag része | Tartalom |
| --- | --- |
| Üzleti adatok | Ügyfelek és partnerek, helyszínek, projektek, felmérések, ajánlatverziók, anyaglisták, jegyzőkönyvek, számlanyilvántartás és rögzített fizetések |
| Saját beállítások | Cégadatok, munkakatalógus, anyagreceptek és dokumentumsablonok |
| Eredeti fájlok | Fotók, PDF-ek, feltöltött dokumentumok és a jegyzőkönyvekhez tartozó aláírásfájlok |
| Ellenőrzési jegyzék | Mentés ideje, alkalmazás- és adatformátum-verzió, rekord- és fájlszámok, kapcsolatok, fájlméretek és ellenőrzőösszegek |

A csomag nem tartalmazza a fiók jelszavát, aktív munkameneteit, TOTP-titkait vagy a külső kapcsolatok titkos API-kulcsait. A belépési fiók és a szerver titkainak helyreállítása külön üzemeltetési feladat. A felületen ezért **üzleti mentésnek** nevezzük, nem egy minden Supabase-beállítást és hitelesítési adatot tartalmazó teljes projektmásolatnak.

A mentés titkosítása külön mentési jelszóval történik, bevált titkosítási megoldással. Ezt a jelszót a csomagtól elkülönítve kell őrizni; elveszett mentési jelszóra nem ígérünk visszafejtést. A mentés ellenőrzése helyes jelszóval és fájlellenőrző összegekkel történik.

Mentés előtt látszódik, mely eszköz aktuális adatai érhetők el, és van-e helyben feltöltetlen munka. A teljesnek minősített üzleti mentésnek minden benne hivatkozott fájlt tartalmaznia kell. Hiányzó fájl vagy megszakadt letöltés esetén a csomag nem kaphat „sikeres teljes mentés” jelzést.

A konzisztens adatpillanat készítését a mentési művelet kezeli: az üzleti adatokat és az eredeti, verziózott fájlokat ugyanahhoz a jegyzékhez kapcsolja. A pillanatfelvétel alatt az érintett szerveroldali módosítások rövid ideig zárolandók vagy következetes verzióhatárhoz kötendők, minden eszközre érvényesen. A pontos megoldás a fejlesztésben ellenőrizendő.

A felület elkülöníti a **csomag elkészült**, **letöltés elindult** és **helyi mentési fájl ellenőrizve** állapotokat. Egy letöltés gombnyomása önmagában nem bizonyítja, hogy a fájl megvan a számítógépen. Az utolsó ellenőrzött mentés ideje csak a mentett fájl visszaolvasása és ellenőrzése után frissülhet. Az előző jó mentést az új csomag nem írja felül.

Az adatbázis technikai SQL-mentése és a forráskód/migrációk megőrzése ettől elkülönülő üzemeltetési feladat. A Supabase adatbázis-mentése nem tartalmazza a Storage tényleges fájljait; ezeket ezért kell külön is a mentési csomaghoz gyűjteni.

##### 8.5. Visszaállítás

Először az éles környezettől elkülönített próbakörnyezetben történik a helyreállítás. A visszaállítás előnézete megmutatja a mentés idejét, a verziót, a rekordok és fájlok számát, a hiányokat, valamint a meglévő adatokkal várható ütközéseket. Sérült vagy nem támogatott csomag nem írhatja felül az éles adatokat.

Új Supabase-projekt esetén előbb a sémát és a hozzáférési szabályokat kell létrehozni, a tulajdonosi fiókot pedig ismét azonosítani és TOTP-vel ellátni. Az üzleti rekordok belső kapcsolatait megtartjuk; a régi és új hitelesítési tulajdonos azonosítója külön, ellenőrzött megfeleltetést kap. A fájlok a megfelelő privát területre kerülnek vissza.

A próba akkor sikeres, ha megnyitható egy helyreállított projekt, felmérés és ajánlatverzió, egy számla eredeti PDF-je, egy fotó és egy aláírt jegyzőkönyv; a részfizetések és a jogosultságok is helyesek. A teljes hozzáférési szabályzatot ilyenkor újra ellenőrizni kell, nem elég a rekordok megszámolása.

Az első sikeres visszaállítási próba az éles indulás feltétele. Újabb próba szükséges a mentési formátumot vagy az adatkapcsolatokat érintő jelentős változtatás után. Visszaállításkor legfeljebb az utolsó jó mentésig meglévő adatok állíthatók vissza; a két mentés közötti munka megőrzését nem lehet pusztán a mentési funkció létezéséből garantálni.

##### 8.6. Ingyenes Supabase-csomag: ellenőrzött keretek

A 2026. október 23-án ellenőrzött hivatalos dokumentáció alapján:

| Terület | Free csomag és a tervezett válasz |
| --- | --- |
| TOTP | Az alap MFA elérhető; erre épül a belépés |
| Munkamenet szigorú időkorlátja | Beépített session timeout nem jár a Free csomaghoz; pontos 30 napos bizalmi időt nem ígérünk |
| Helyreállító levelek | Saját SMTP bekötése támogatott; a tényleges levelezőfiók és kézbesítés beállítandó |
| Adatbázis | 500 MB; kihasználtság követése szükséges |
| Fájlok | 1 GB; a fotók és PDF-ek mérete figyelendő |
| Kimenő adatforgalom | 5 GB, valamint külön 5 GB gyorsítótárazott forgalom; a mentési letöltés is fogyaszt adatforgalmat |
| Automatikus adatbázis-mentés | Nem jár a Free csomaghoz; az első változat saját, kézzel indított üzleti mentést kap |
| Inaktivitás | Egy hét inaktivitás után a projekt szüneteltethető; folyamatos rendelkezésre állást nem tekintünk garantáltnak |

A fenti keretek miatt nem ígérünk korlátlan ingyenes tárhelyet vagy adatforgalmat. Egy teljes fájlmentést nem szabad észrevétlenül minden belépéskor újra letölteni. A mentés várható mérete és az utolsó futás állapota látható lesz; az automatizálás és a változott fájlokra szorítkozó mentés későbbi, külön ellenőrzött bővítés lehet.

A belépés és a mentés e működési tervéhez nem választottunk új fizetős előfizetést. A konkrét levelezési hozzáférés és a tényleges számlázási díj kitöltendő beüzemelési adat; a költségellenőrzés és az indulási sorrend a 12. fejezetben szerepel.

##### 8.7. Offline munkavégzés – pontos funkciók

Az alkalmazás telepíthető PWA-ként készül. Első alkalommal online kell megnyitni, teljesen bejelentkezni, sajátként engedélyezni az eszközt és letölteni az offline használathoz szükséges alkalmazásrészeket. Az alkalmazás működéséhez, a PDF-ekhez és a magyar karakterekhez szükséges kód, sablon és betűkészlet a saját csomag része; offline nem támaszkodhat külső betöltésre.

A helyszín előtt a projektnél **Előkészítés offline használatra** művelet jelzi, mely adatok és fájlok érhetők el az adott eszközön. Az aktív munkákhoz szükséges ügyféladatok, cégadatok, katalógusok, anyagreceptek, kiválasztott dokumentumok és eredeti fájlok együtt kerülnek a helyi csomagba. A teljes archív fotótárat nem töltjük le automatikusan minden eszközre.

| Művelet | Internet nélkül | Kapcsolat visszatérésekor |
| --- | --- | --- |
| Új ügyfél és projekt felvétele | Helyi azonosítóval, tervezetként menthető | Ellenőrzött feltöltés a függő rekordokkal együtt |
| Felmérés, helyiségek és munkatételek | Létrehozható és szerkeszthető | Verzióellenőrzött egyeztetés |
| Fénykép és megjegyzés | Helyben rögzíthető, ha sikeres a tárolás | Fájl és kapcsolatai külön követhetően feltöltődnek |
| Ajánlat és anyaglista | Letöltött katalógusból, illetve egyedi tétellel elkészíthető | A saját ár- és receptpillanatfelvétel megmarad |
| Ajánlat-PDF | Helyi adatokból előállítható | A létrehozott verzió és eredeti PDF feltölthető |
| Jegyzőkönyv és rajzolt aláírás | Elkészíthető, a kiválasztott helyi fotókkal | Az adott tartalomhoz kapcsolt változat kerül fel |
| Időpont felvétele vagy módosítása | Az E-RP helyi naptárába menthető | Előbb E-RP-egyeztetés, majd a bekötött Google-kapcsolat kezelése |
| Már kiállított számla és befizetés rögzítése | Helyi nyilvántartási bejegyzésként menthető | Számla- és fizetésadatok feltöltése; nincs Agent-hívás |
| Számlázz.hu-n kézi számlakiállítás | A külső számlázó online elérését igényli | A felhasználó külön elvégzi a számlázóban |
| Első belépés, TOTP-ellenőrzés és fiókhelyreállítás | Online kapcsolat szükséges | A hitelesítés után folytatható |
| E-mail küldése vagy Google-szinkron | Függő állapot, nem jelöljük elküldöttnek | Csak az engedélyezett művelet és működő kapcsolat alapján teljesülhet |

Új projekt internet nélkül is indítható, ha a saját eszköz korábbi beállítása és alapadatai rendelkezésre állnak. Offline más eszközön vagy a szerveren azóta keletkezett változás nem látható; ennek idejét az utolsó szinkron jelzi.

**A helyi adatok védelme:** az IndexedDB-ben az üzleti rekordok, a feltöltési sor és a helyi fájlok titkosított tartalomként tárolandók. A titkosítás szabványos Web Crypto megoldásra épül, egyedi eszközkulccsal és biztonságos véletlen értékekkel. A kulcsot külön, helyben beállított feloldó jelszó védi; ez nem a Supabase-jelszó, és nem szerveroldali TOTP-ellenőrzés.

Az eszköz sajátként engedélyezésekor ezt a feloldást kipróbáljuk. Új alkalmazásmegnyitáskor a titkosított helyi tárolóhoz külön feloldás szükséges; a megőrzött online munkamenet ettől elkülönül. A nyers adatkulcs és a feloldó jelszó nem maradhat olvashatóan a böngésző tartós tárában. A jelszóval védett kulcscsomag, a titkosítási verzió és az ellenőrzéshez szükséges technikai adatok tárolhatók.

A service worker gyorsítótára az alkalmazás nyilvános kódját, betűkészletét és sablonjait kezelheti. Hitelesített üzleti API-válasz vagy privát fénykép nem maradhat mellette titkosítatlan általános HTTP-gyorsítótárban; ezek a védett helyi adatkezeléshez tartoznak. A helyi feloldásig a titkosított műveletsor szinkronja is várakozik, majd a megnyitott, feloldott alkalmazásban folytatódhat.

Elfelejtett helyi feloldó jelszónál a szinkronizált adatok ismét letölthetők egy újból előkészített eszközre. A még sehová fel nem töltött helyi munka visszanyerése ilyen esetben nem garantálható. A helyi tároló újraállítása ezért külön, adatvesztést bemutató művelet; nem történhet automatikusan hibás jelszó után.

##### 8.8. Szinkronizálás és ütközések

Minden helyi változás saját műveletazonosítót kap. A helyi rekord és a hozzá tartozó függő művelet egy tranzakcióban mentendő, így az alkalmazás megszakítása után is megmarad, mit kell feltölteni. A felhasználó számára csak sikeres tartós helyi mentés után jelenhet meg mentést igazoló jelzés.

A szerver minden szerkeszthető rekordhoz verziót rendel. A kliens a kiinduló verziót is elküldi. A szerver egy tranzakcióban ellenőrzi a jogosultságot, a verziót és a művelet korábbi teljesülését. Egy elveszett válasz utáni újraküldés ugyanahhoz az eredményhez vezethet, nem új ügyfélhez, számlához vagy befizetéshez.

| Szinkronhelyzet | Szabály |
| --- | --- |
| A szerveren nem változott a rekord | A módosítás alkalmazható és új verziót kap |
| Két eszköz külön új tételt adott hozzá | Saját azonosítók alapján mindkét új tétel megmaradhat |
| Külön mezők változtak, bizonyíthatóan azonos alapból | Csak ellenőrizhető, üzleti szabályt nem sértő egyesítés történhet |
| Ugyanaz a mező két eszközön eltérően változott | Mindkét változat megőrzése és felhasználói egyeztetés; nincs csendes felülírás |
| Archivált/törlésre jelölt adaton van helyi módosítás | Egyeztetendő állapot; nincs automatikus visszaélesztés vagy adateldobás |
| Megszakadt feltöltés | Újrapróbálható, a műveletazonosító és az állapot megmarad |
| Lejárt hitelesítés | A feltöltés szünetel, a helyi változás megmarad |

A pénzösszegek, elfogadott ajánlatok, aláírt jegyzőkönyvek és kiállított számlák nem rendezhetők egyszerű „utoljára mentett nyer” szabállyal. Az eredeti, lezárt dokumentum pillanatfelvételként megmarad; tartalmi javítás új verzió vagy szabályos kapcsolt dokumentum.

A fényképek és PDF-ek feltöltése külön műveletsor. A fájl neve, belső azonosítója, mérete és kapcsolata követhető. A fájl feltöltése és a hivatkozás rögzítése közötti megszakadás sem indokol új példányt ugyanabból az eredeti fájlból. Az eredeti feltöltött képet és PDF-et nem írjuk felül előnézettel; a kisebb előnézet külön származtatott fájl lehet.

Az egyeztető képernyő a helyi és a szerveroldali értéket, valamint a kiindulási verziót mutatja. A felhasználó dönthet az értékről vagy külön másolat megőrzéséről. A döntésig mindkét változat visszakereshető; az adott rekord szerverfrissítése szünetelhet, a többi független művelet folytatódhat.

A tervezett állapotjelzések:

- **Helyben mentve** – az adott eszköz tartós tárában sikeres a mentés.
- **Feltöltésre vár** – van még szerver által nem igazolt művelet.
- **Fájlok feltöltése** – a rekord és a csatolmányok állapota külön látszik.
- **Egyeztetés szükséges** – ütközés vagy hiányzó adat vár döntésre.
- **Minden feltöltve** – az adott eszköz aktuális műveleteit és fájljait a szerver visszaigazolta.

A „Minden feltöltve” állapot nem állítja, hogy más, éppen offline eszközön sincs új munka. Teljes üzleti mentés a szerveren az adott pillanatig szinkronizált adatokról készül. Más eszközök csak utolsó ismert szinkronállapotot adhatnak; a mentés előtt a helyszíni eszközt is szinkronizálni kell.

##### 8.9. Offline dokumentumok, tárhely és frissítések

Az ajánlat és jegyzőkönyv PDF-je kliensoldalon készülhet, magyar ékezeteket és többoldalas tartalmat is kezelő, helyben elérhető betűkészlettel. A sablonhoz, logóhoz és felhasznált fotóhoz rendelkezésre kell állnia a helyi fájlnak. Hiányzó kötelező elemnél nem készülhet teljesnek látszó végleges dokumentum.

Az ajánlat számozása offline ütközésmentes belső azonosítóból indul. A végleges, ember által olvasható azonosító online kiosztása nem írhatja át a már elküldött PDF tartalmát; az offline kiadott ajánlat is tartós, saját azonosítót kap. A számlaszám ettől teljesen külön adat, azt a Számlázz.hu adja.

A jegyzőkönyv aláírása előtt ugyanaz a tartalom tekinthető át, amelyhez az aláírás kapcsolódik. A helyi dátum és az eszköz időzónája rögzíthető, de az offline időpontot nem nevezzük külső szolgáltató által hitelesített időbélyegnek. Szerkesztés után új verzió kell, a régi aláírás nem használható fel automatikusan.

Az offline fájl mentése és az ügyfélnek való elküldése külön állapot. A megosztás vagy e-mail-küldés elmaradásakor a dokumentum nem jelölhető automatikusan elküldöttnek. A helyi aláírt PDF és a hozzá tartozó adatok a szinkron befejezéséig a titkosított helyi tárban is megmaradnak.

A böngésző tartós tárolási engedélyét kérjük, és becsüljük a rendelkezésre álló helyet. Az engedély vagy elegendő tárhely hiánya látható állapot, nem eltitkolt hiba. A böngésző saját adattörlését, privát módját vagy az eszköz meghibásodását az alkalmazás nem tudja általánosan megakadályozni. Offline munkára a kipróbált normál böngésző/PWA-környezetet használjuk.

Tárhelyhiba esetén a sikertelen írás nem kap sikeres mentési jelzést. A még fel nem töltött fájlokat és műveleteket nem töröljük automatikusan helyfelszabadítás céljából. A már szinkronizált, ismét letölthető példányok és előnézetek takaríthatók ellenőrzött módon.

Friss alkalmazásverzió telepítése nem töltheti újra csendben a szerkesztett űrlapot. A függő műveletsor és a helyi séma migrációját ellenőrizni kell; az éppen futó alkalmazás és a régi tároló együttműködését sem szabad feltételezni teszt nélkül. Hibás frissítésnél a helyi munka megőrzése az elsődleges, nem az automatikus adattár-ürítés.

#### 9. Költségek és az éles integráció döntési pontja

**Aktuális döntés:** az első változatban nincs E-RP-ből indított Agent API-használat. A kézi nyilvántartás, a PDF csatolása és a fizetések rögzítése nem igényel Agent-kapcsolatot. Az E-RP költségtervébe ebben az ütemben nem kerül aktív Agent-díj; a meglévő #profi-előfizetés megmarad. Ez kizárólag az új E-RP által indított használatra vonatkozik, más esetleges integrációk használatáról nincs adatunk.

A következő Agent-díjadatok a **későbbi opcionális API-bekötés** tervezéséhez tartoznak.

A korábbi ingyenességi ígéret téves volt. Az API-kulcs létrehozása és a tesztfiókos használat díjmentes, az éles Számla Agent-használat díjköteles.

**Pontosított kiindulás:** a felhasználónak már van **#profi** előfizetése. Nem szükséges mellé új #start-csomagot tervezni. Az előfizetés tényleges díja, havi vagy éves díjfizetése és esetleges kedvezménye nem ismert; ezeket nem helyettesítjük feltételezett listaárral. A Számla Agent díja a #profi mellett is külön tétel.

A 2026. október 23-án ellenőrzött hivatalos díjoldal szerint havi 1–50 API-val kiállított bizonylat Agent-díja 2 690 Ft + áfa, 27% áfával 3 416,30 Ft. A számla is ilyen bizonylat. Az ár a meglévő #profi számlázócsomag díján felül értendő, nem számlánként fizetendő összeg.

A költségtervben külön soron mutatjuk a meglévő #profi-előfizetést és az E-RP miatti új többletköltséget. Ugyanazt az alapcsomagot nem számoljuk el még egyszer új előfizetésként.

A korábban megadott havi 5 000 Ft-os teljes plafont nem értelmezzük át automatikusan a meglévő előfizetés feletti pluszkeretté. Az első, kézi számlázási változat költségterve és a meglévő #profi díjának elszámolása a 12.3. pontban szerepel. A tényleges saját díj és SMTP-szolgáltatás ellenőrzése beüzemelési feladat. A későbbi Agent-bővítést az akkori teljes költséggel együtt kell értékelni. A bővíthető adatmodell önmagában nem tesz szükségessé előfizetést vagy éles API-hívást.

A #profi csomag hivatalos funkciólistájában szerepel a Számlaverzum, amelyben bejövő és kimenő számlák kezelhetők. Ez hasznos alap a későbbi bejövőszámla-folyamathoz, de nem jelenti automatikusan, hogy az E-RP-be is ingyenesen vagy külön fejlesztés nélkül importálhatók ezek az adatok. A külső adatkapcsolat pontos elérését és feltételeit a bejövő modul tervezésekor kell ellenőrizni.

Hivatalos hivatkozások:

- [Számla Agent – díjszabás és támogatott dokumentumtípusok](https://www.szamlazz.hu/szamla-agent-api)
- [Számla Agent költsége és tesztelése](https://tudastar.szamlazz.hu/gyik/szamla-agent-automatikus-szamlazas-koltsege)
- [Számla Agent API-kulcs: ingyenes létrehozás és díjköteles éles használat](https://tudastar.szamlazz.hu/gyik/kulcs)
- [Számlázz.hu alapcsomagok](https://www.szamlazz.hu/csomagok-es-arak)
- [Supabase díjcsomagok](https://supabase.com/pricing)
- [Supabase biztonsági mentések](https://supabase.com/docs/guides/platform/backups)
- [Supabase TOTP-belépés](https://supabase.com/docs/guides/auth/auth-mfa/totp)
- [Supabase MFA és adatbázis-hozzáférés](https://supabase.com/docs/guides/auth/auth-mfa)
- [Supabase munkamenetek és fizetős időkorlátok](https://supabase.com/docs/guides/auth/sessions)
- [Saját SMTP és az alapértelmezett levelezés korlátai](https://supabase.com/docs/guides/auth/auth-smtp)
- [Tartalék TOTP a Supabase kezelőfelületéhez](https://supabase.com/docs/guides/platform/multi-factor-authentication)
- [Adminisztrációs hitelesítőtörlés](https://supabase.com/docs/reference/javascript/auth-admin-deletefactor)
- [Kísérleti alkalmazásos helyreállítókód-generálás](https://supabase.com/docs/reference/javascript/auth-mfa-recovery-codes-generate)
- [Privát fájlok hozzáférési szabályai](https://supabase.com/docs/guides/storage/security/access-control)
- [Technikai adatbázis-mentés és visszaállítás](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Böngészős tárhely, tartós tárolás és adattörlés](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [Offline alkalmazás és service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Cloudflare Pages statikus tárhely díjazása](https://developers.cloudflare.com/pages/functions/pricing/)
- [Helyi Supabase fejlesztési környezet](https://supabase.com/docs/guides/local-development)
- [Google Calendar API aktuális kvótái és díjküszöbe](https://developers.google.com/workspace/calendar/api/guides/quota)
- [Google OAuth és a tesztüzemű tokenek lejárata](https://developers.google.com/identity/protocols/oauth2)
- [Google jogosultságok és alkalmazás-ellenőrzés](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification)

#### 10. Fejlesztési sorrend és elfogadási feltételek

##### Jelenlegi tervezési lépés

A tervezési feladat az 1.0 változatban az offline működés, az adatátvétel és az indulási/költségbeállítások kidolgozásával kiegészült. Az első ütemhez számlázási adatlap, külső kiállítás utáni számlarögzítés, PDF-csatolás és kézi fizetéskövetés tartozik. A bejövő számlák részletes működése továbbra is későbbi ütem.

A következő érdemi lépés az első működő alkalmazás megvalósítása a 13. fejezet szerint. A tényleges tulajdonosi e-mail, SMTP, Supabase- és Cloudflare-hozzáférés, a #profi tényleges számlázási díja, valamint a régi adatok ellenőrzött exportja beüzemelési bemenetek. Ezek ismeretlen értékeit nem találtuk ki és nem állítottuk be; az éles átadás feltételeit a 12. fejezet rögzíti. A korábbi kattintható felületterv vizuális irány, mintaadatokkal.

##### A belépés és mentés későbbi ellenőrzése

- Nyilvános regisztráció nem hozhat létre használható tulajdonosi fiókot.
- Csak jelszóval, AAL1-szinten a védett üzleti táblák és fájlok nem érhetők el.
- Az első TOTP beállítása nem adhat idő előtti üzleti hozzáférést.
- A tartalék hitelesítővel működik egy kipróbált helyreállítás; jelszó-visszaállítás után megmarad a TOTP-követelmény.
- Az éles helyreállító e-mail a tényleges feladóról megérkezik és csak az engedélyezett visszatérési címen működik.
- Lejárt munkamenetnél a helyi munka megmarad, a szerverre írás új hitelesítésig megáll.
- Mentéskor a rendszer nem hagyhatja ki csendben a PDF-eket, fényképeket vagy aláírásfájlokat.
- Sikertelen, megszakadt vagy hiányos mentés nem frissítheti az utolsó ellenőrzött mentés idejét.
- Hibás mentési jelszó vagy sérült csomag semmilyen éles adatot nem módosíthat.
- Az első éles használat előtt izolált környezetben bizonyított a kapcsolatok, eredeti fájlok és hozzáférések helyes visszaállítása.

##### A számlázás alapjainak későbbi ellenőrzése

- A kimenő számlázás a bejövő modul nélkül is működtethető.
- Az első ütem API-kulcs nélkül használható, és az E-RP nem indít Agent-hívást sem kiállításhoz, sem lekérdezéshez, sem fizetési állapot frissítéséhez.
- A számlázási adatlap nem kap számlaszámot és nem látszik kiállított számlának.
- A kézzel rögzített külső számla kimenő marad, a projekthez és eredeti PDF-hez kapcsolható, részfizetése követhető.
- API-bekapcsolás nem állít ki újra korábbi kézi számlát, nem küld be automatikusan tervezetet, és egyeztetéskor nem duplázza a már rögzített számlát.
- Az irány, a belső azonosító és a külső számlázó azonosítója elkülönül.
- Két szállító azonos számlaszáma nem okoz hibás összevonást.
- Partneradat módosítása nem ír át kiállított vagy rögzített számlapillanatfelvételt.
- Részfizetés után a nyitott összeg helyesen számítható; bevétel és kiadás elkülönül.
- A tesztbizonylatok nem kerülnek az éles pénzügyi összesítésbe.
- Bizonytalan szolgáltatói válasz és újrakattintás nem hoz létre automatikusan új számlát.
- Offline tervezet nem kerül automatikusan éles kiállításra újracsatlakozáskor.
- Az eredeti dokumentum hozzáférése védett és a számlához tartósan kapcsolódik.
- Egy későbbi bejövő modul hozzáadásához nem kell a kimenő számlákat új ügyfél- vagy dokumentumrendszerbe áthelyezni.

#### 11. A régi ERP adatainak átvétele

##### 11.1. Az átvétel köre és a forrás állapota

Alapértelmezésként a valódi üzleti adatokat és eredeti dokumentumokat megőrizzük. Az adatátvétel nem ad okot a korábbi rendszer vagy adatai törlésére. A minták, tesztbizonylatok és próbaügyfelek külön kezelendők; valódi adat nem minősíthető automatikusan tesztnek pusztán a neve alapján.

Jelenleg nincs ebben a munkában ellenőrzött, teljes régi ERP-adatexport és fájlcsomag. Ezért nem állítunk átvitt rekordszámot vagy sikeres migrációt. A következő táblázat az átvétel célját és ellenőrzési szabályát határozza meg; a tényleges forrásmezőket a valós export alapján kell megfeleltetni.

| Régi adat | Új rendszerben | Ellenőrzés |
| --- | --- | --- |
| Cégadatok és sablonok | Vállalkozási beállítások és dokumentumsablonok | Valódi adatok, adózás és megjelenítés áttekintése |
| Ügyfelek, elérhetőségek és címek | Partneradatok, számlázási címek, munkavégzési helyek | Névazonosság miatt nincs automatikus összevonás |
| Projektek | Új projektek a régi azonosító hivatkozásával | Ügyfél, cím és állapot megfeleltetése |
| Felmérések | Felmérések, helyiségek és tételek | Eredeti mennyiségek, ismeretlen adatok jelölésének megőrzése |
| Ajánlatok és verziók | Ajánlatpillanatfelvételek és eredeti PDF-ek | Tételárak, anyagösszeg és kedvezmény nem számolható újra a mai katalógusból |
| Munkakatalógus és anyagreceptek | Saját katalógus és receptek | Mértékegységek, aktív/archivált állapot és tényleges alapárak |
| Anyaglisták | Projekt szükséges anyagai és mennyiségei | Beszerzési/készletfolyamat bevezetése nélkül |
| Jegyzőkönyvek és aláírások | Eredeti dokumentumverzió és a hozzá tartozó fájlok | Régi aláírás nem kapcsolható új tartalomhoz |
| Számlák, díjbekérők, előlegek és kapcsolt dokumentumok | Kimenő nyilvántartás, dokumentumtípus és kapcsolatok | Számlaszám, teszt/éles állapot, eredeti PDF és összeg külön ellenőrzése |
| Befizetések | Rögzített részfizetések, ha van bizonyítható forrásadat | Ismeretlen fizetettségből nem készül automatikusan „fizetett” állapot |
| Időpontok | E-RP-események és ellenőrzött külső kapcsolat | Meglévő Google-esemény nem hozható létre még egyszer |
| Fotók és feltöltött fájlok | Privát Storage és eredeti kapcsolatok | Valódi fájltartalom, nem pusztán később lejáró hivatkozás |

Régi felhasználói jelszavakat, aktív munkameneteket és API-titkokat nem importálunk az új üzleti adatbázisba. A tulajdonosi fiók és a külső kapcsolatok az új rendszerben, külön beállítással jönnek létre.

##### 11.2. Az import folyamata

1. **Forrásmásolat:** a hozzáférhető export és eredeti fájlok változatlan példányát megőrizzük. Első lépésként az export tényleges mezőit és a hiányzó fájlokat mérjük fel.
2. **Megfeleltetés:** a forrásmezőket új mezőkhöz kötjük. JSON/CSV vagy más ténylegesen elérhető export támogatható; nem ígérünk még ismeretlen formátum automatikus olvasását.
3. **Ellenőrzés írás nélkül:** rekordok, dátumok, mennyiségek, összegek, devizák, azonosítók, szülő–gyermek kapcsolatok és fájlok vizsgálata.
4. **Próbaimport:** az éles munkáktól elkülönített környezetben készül. Import alatt nincs számlakiállítás, ügyfélértesítés vagy automatikus Google-eseménylétrehozás.
5. **Összehasonlítás:** az exportált és átvett rekordok, eredeti dokumentumok és pénzügyi részösszegek egyeztetése; az eltérések tételesen látszanak.
6. **Éles átvétel:** ellenőrzött csomaggal, előtte friss mentéssel és egyeztetett átállási pillanattal. A közben a régi rendszerben történt új változásokat külön fel kell mérni.
7. **Utóellenőrzés:** megnyitható projektek, ajánlatok, PDF-ek, fotók és fizetések, ismételt importtal sem duplázódó adatok.

Az átvételhez megőrizzük a forrásrendszert, az eredeti rekordazonosítót és az importfutás azonosítóját. Egy újrapróbált import nem hozhat létre ugyanabból a régi rekordból még egy példányt. Az új rendszerben már módosított rekordot egy újabb import nem írhat felül csendben.

A dátumok, tizedesjelek és pénzösszegek értelmezése nem alapulhat találgatáson. A hiányos, hibás vagy ellentmondásos rekord javításra váró listába kerül. A többi adat feldolgozható, de a kimaradt elemekkel együtt a hiánylista is az import eredménye. Egy nyilvántartási hiba nem javítható kitalált ügyféllel vagy nullára állított, valójában ismeretlen összeggel.

Az ajánlat vagy jegyzőkönyv eredeti PDF-ként akkor is megőrizhető történeti dokumentumként, ha nincs hozzá elegendő strukturált adat. Ebben az esetben ezt a korlátozást feltüntetjük; a PDF-ből nem lesz bizonyíték nélkül teljesen szerkeszthető, újraszámolt ajánlat.

Az import nyomán csak az import által létrehozott adatokra célzott visszavonás készülhet, ellenőrzött kapcsolatokkal. Azóta kézzel módosított vagy új dokumentummal összekapcsolt rekordoknál új egyeztetés szükséges. Az eredeti forráscsomag mindig megmarad.

##### 11.3. Adatátvétel és fejlesztés elkülönítése

Az alkalmazás fejlesztése elkezdhető valós ügyféladatok nélkül, elkülönített és egyértelműen megjelölt próbaadatokkal. Az éles rendszer induló katalógusa tényleges importból vagy kézi felvitelből készül; mintaárat nem tekintünk a vállalkozás elfogadott árlistájának.

Ha az ellenőrzött régi export csak később érhető el, az új rendszerbe később is beolvasható ugyanilyen előnézetes folyamatban. Ez nem jelenti a régi adatok eldobását. A régi ERP lezárása vagy törlése nem része ennek az előkészítési feladatnak.

#### 12. Indulási beállítások és havi költség

##### 12.1. Kiválasztott induló felépítés

| Terület | Induló megoldás | Tényleges beállítás állapota |
| --- | --- | --- |
| Új alkalmazás | Saját React + TypeScript + Vite projekt, a HomeHubtól külön forráskóddal | Fejlesztendő |
| Webes tárhely | Cloudflare Pages Free, elsőként a szolgáltatás alapértelmezett címével | Nem hoztunk létre és nem tettünk közzé új alkalmazást |
| Adatbázis és fájlok | Az E-RP-nek külön Supabase Free projekt, privát Storage és RLS | Hozzáférés és elérhető Free projektkeret ellenőrizendő |
| Belépés | Saját tulajdonosi e-mail, jelszó és TOTP, tartalék hitelesítővel | Tényleges fiók és hitelesítő nincs most beállítva |
| Helyreállító levelek | Meglévő, alkalmas SMTP-szolgáltatásból küldött levél | Szolgáltató, feladó és kézbesítés beállítandó |
| Számlázás | Meglévő Számlázz.hu #profi; külső kézi kiállítás | E-RP Agent-hívás nélkül; a saját előfizetés megmarad |
| Google Naptár | Saját Google-fiókhoz engedélyezett, védett szerveroldali kapcsolat | OAuth és kiválasztott naptár beállítandó |
| Üzleti mentés | Kézzel indított, titkosított csomag saját számítógépre | A mentési és ellenőrzési funkció fejlesztendő |
| Fejlesztési próbakörnyezet | Elkülönített helyi Supabase-környezet és próbaadatok | CLI és megfelelő helyi futtatókörnyezet előkészítendő |

Az új E-RP nem a régi Sites-alkalmazás továbbfejlesztése, és a HomeHub adatbázisát sem használjuk ellenőrzés nélkül közös üzleti tárként. A forráskód és a beállítások átadhatók; a fiókok és az éles erőforrások tulajdonosa a felhasználó marad.

A helyi Supabase futtatásához a hivatalos CLI és támogatott konténeres futtatókörnyezet szükséges. A helyi próbakörnyezet célja, hogy a fejlesztési és visszaállítási tesztek ne módosítsák az éles üzleti adatokat, és ne igényeljünk automatikusan harmadik aktív Free felhőprojektet.

##### 12.2. Beüzemelési adatlap

Ezek tényleges értékekkel kitöltendő mezők, nem újabb funkciótervezési kérdések. A titkos értékek az adott szolgáltatás titoktárolójába kerülnek; a dokumentumba csak a beállításuk állapotát és a nem titkos azonosítókat vezetjük.

| Szükséges adat | Cél | Kitöltéskor ellenőrizendő |
| --- | --- | --- |
| Tulajdonosi e-mail | Belépés és helyreállítás | Valódi hozzáférés és megérkező levél |
| Supabase projekt és szervezet | Üzleti adatok és Auth | Free csomag, projektkeret, tulajdonos és a HomeHubtól való elkülönítés |
| Supabase projektcím és nyilvános alkalmazáskulcs | A felület kapcsolata | Csak nyilvánosnak szánt kulcs kerülhet a kliensbe |
| Szerveroldali titkok | Védett háttérműveletek | Nem szerepelhetnek a klienscsomagban vagy nyilvános verziókezelésben |
| Cloudflare projekt és végleges alkalmazáscím | Telepítés és visszatérési címek | HTTPS, tulajdonosi hozzáférés és működő oldalfrissítés |
| SMTP-kiszolgáló és engedélyezett feladó | Helyreállító e-mail | Küldés, megérkezés, lejárt hivatkozás és helyes visszatérési cím próbája |
| #profi tényleges díja és díjfizetése | Az 5 000 Ft-os teljes keret | Saját számla vagy előfizetési adat alapján, nem feltételezett listaárral |
| Google OAuth-alkalmazás és naptár | E-RP-események szinkronja | Szűk jogosultságok, engedélyezett callback, stabil tokenkezelés |
| Mentési mappa és külön őrzött mentési jelszó | Független üzleti mentés | Letöltés, fájl-visszaolvasás és elkülönített visszaállítás |
| Régi ERP export és eredeti fájlok | Adatátvétel | Forrásmásolat, mezőmegfeleltetés és tételes hiánylista |

##### 12.3. Költségterv az első kézi számlázási ütemhez

Az induló cél az, hogy az új E-RP ne igényeljen új kötelező, fix havidíjas szolgáltatást. A nulla új szolgáltatási díj a Free keretek megtartására és alkalmas meglévő levelezésre épül; nem korlátlan szolgáltatási ígéret.

| Tétel | Új tervezett fix havidíj | Feltétel |
| --- | --- | --- |
| Cloudflare statikus felület | 0 Ft | Pages Free és statikus kiszolgálás |
| Supabase Database, Auth és Storage | 0 Ft | Free projekt és annak tárhely-/forgalmi keretei |
| Számla Agent | 0 Ft ebben az ütemben | Az E-RP nem használja az Agent API-t |
| Üzleti mentési csomag | 0 Ft külön felhő-előfizetés | Meglévő saját számítógépre mentés, meglévő tárhellyel |
| Új saját domain | 0 Ft tervezett beszerzés | Elsőként alapértelmezett szolgáltatási cím; új domain nincs megrendelve |
| SMTP | Tényleges meglévő szolgáltatás alapján | Csak igazoltan alkalmas és keretbe illeszkedő megoldás engedhető élesre |
| Google Calendar API | 0 Ft tervezett API-használati díj | Az aktuális díjmentes küszöb és kvóták alatt, korlátozott hívásszámmal |
| Meglévő Számlázz.hu #profi | A jelenlegi saját díj | A teljes havi költségben szerepel, új alapcsomagot nem veszünk mellé |

A 2026. október 23-án ellenőrzött nyilvános #profi listaár **havi fizetéssel kb. 4 813 Ft bruttó/hó**, éves fizetéssel **kb. 4 178 Ft bruttó havi átlag**, utóbbinál **kb. 50 140 Ft bruttó előre fizetendő éves összeggel**. Ezek ellenőrzött listaárpéldák, nem állítások a felhasználó tényleges szerződéséről vagy fizetési módjáról.

Havi listaáras példában az 5 000 Ft-os teljes keretből körülbelül 187 Ft maradna más szolgáltatásra. Ezért az első változathoz nem tervezünk automatikusan új fizetős SMTP-t, domaint, Supabase Pro-csomagot vagy Agentet. A teljes tervezett összeg a tényleges #profi-díj és az igazoltan szükséges egyéb díjak összege; a meglévő díjat nem soroljuk át észrevétlenül a kereten kívülre.

A Supabase tárhelye és adatforgalma követendő. Az alkalmazás saját nyilvántartásból adhat becslést; a pontos szolgáltatói felhasználást a kezelőfelületen ellenőrizzük. A korlát közeledése látható figyelmeztetés, és nem eredményezhet az E-RP által automatikusan jóváhagyott csomagváltást. Ha új költségre lenne szükség, annak pontos összegét és okát a változtatás előtt kell megmutatni.

##### 12.4. Google Naptár beüzemelési feltételei

A kapcsolat az E-RP saját eseményeire korlátozódik. A Google-hozzáférés naptárengedély, nem az E-RP jelszavas/TOTP-belépésének helyettesítése. A frissítőtoken szerveroldali titok, az alkalmazás csak a szükséges műveletet kéri a saját védett háttérszolgáltatásától.

Az engedélykérés a szükséges legszűkebb jogosultságokat és a tényleges alkalmazáscímet használja. A Google által előírt alkalmazás-ellenőrzési vagy személyes használati feltételeket a valódi Google-projekten kell ellenőrizni; nem állítjuk, hogy bármelyik ellenőrzés már megtörtént.

A Google hivatalos leírása szerint külső, **Testing** állapotú OAuth-alkalmazásnál a naptárhoz kért frissítőtoken hét nap után lejárhat. Az éles átadáskor ezért a publikálási állapotot, a szükséges engedélyeket és az újracsatlakozást is teszteljük. Lejárt vagy visszavont Google-kapcsolat nem veszítheti el az E-RP saját időpontjait; az események helyi kezelése folytatódhat, a külső szinkron állapota látható marad.

A Calendar API 2026. október 23-án olvasott leírása napi projektalapú díjmentes küszöböt és perces kvótákat közöl. Az első egyfelhasználós változat normál használatát jóval ezek alatt tervezzük. Az alkalmazás oldali napi védőkorlát legfeljebb 1 000 Calendar API-hívás, visszavett újrapróbálással és hurok elleni védelemmel; ez saját tervezett korlát, nem a Google szolgáltatói kvótája. A szolgáltatói feltételeket élesítéskor újra ellenőrizni kell.

##### 12.5. Éles indulás ellenőrzési sorrendje

1. A saját szolgáltatói fiókok, a tényleges csomagok és a teljes havi költség ellenőrzése.
2. Az alkalmazás telepítése, az adatbázisséma, RLS és privát fájltárolás beállítása; titkok ellenőrzése a kiadott klienscsomagban.
3. Tulajdonosi belépés, TOTP, tartalék hitelesítő és a tényleges e-mailes helyreállítás próbája.
4. Teljes munkafolyamat kipróbálása jelölt próbaadatokkal, Agent-hívás és valódi ügyfélértesítés nélkül.
5. Saját számítógép és helyszíni eszköz offline próbája, böngésző-újraindítással, megszakadó feltöltéssel és szinkronütközéssel.
6. Többoldalas magyar PDF, eredeti számlafájl, fotó és aláírt jegyzőkönyv ellenőrzése.
7. Titkosított mentés készítése és a mentett fájl visszaolvasása; elkülönített, tényleges visszaállítási próba.
8. A rendelkezésre álló régi adatok próbaimportja, egyeztetése, majd ellenőrzött éles átvétele.
9. A ténylegesen átadott forráskód, telepítési leírás, fiókhelyreállítási leírás és mentési folyamat összegyűjtése.

Ezek jelenleg előkészített ellenőrzési lépések, nem végrehajtott beüzemelési műveletek. A valódi hozzáférések vagy export hiányát nem helyettesítjük kitalált értékkel és nem jelöljük sikeres ellenőrzésnek.

#### 13. Megvalósítási sorrend és a következő lépés

A működési specifikáció a most kért három hátralévő területtel kidolgozott fejlesztési alap. A következő lépés az új alkalmazás kódjának elkészítése, majd a működés ellenőrzése.

| Fejlesztési szakasz | Eredmény |
| --- | --- |
| Saját projekt és adatkezelési alap | React/TypeScript/Vite alkalmazás, Supabase-séma, tulajdonosi jogosultság, Auth és privát fájltárolás |
| Első tesztelhető változat | Belépés, ügyfelek, helyszínek, projektek, saját munkakatalógus és tartós adatmentés |
| Munkafolyamat | Felmérés, fotók, ajánlatverziók, anyagreceptek és szükséges anyaglista |
| Dokumentumok és pénzügyi nyilvántartás | Naptár, jegyzőkönyv, aláírás, PDF-ek, kézi kimenő számla és részfizetések |
| Offline és szinkron | Saját eszköz, titkosított helyi tár, offline PDF és verzióellenőrzött műveletsor |
| Átadás előtti ellenőrzés | Adatimport, mentés és helyreállítás, eszközpróbák, költségellenőrzés és telepítési csomag |

Az első tesztelhető változat még nem jelent minden modult tartalmazó éles kiadást. A későbbi szakaszok nem hagyják el az elfogadott funkciókat; a sorrend az ellenőrizhető fejlesztést szolgálja. Az API-s számlakiállítás és a bejövő számlák kezelése külön későbbi bővítés marad.

A fejlesztésben külön ellenőrizendő fontos esetek:

- Két eszköz ugyanazon felmérését eltérően módosítja: nincs csendes adatvesztés.
- A fájl feltöltődött, de a válasz elveszett: újrapróbálás után is egy eredeti dokumentum marad.
- Az alkalmazás megszakad offline szerkesztés után: helyes feloldással megmarad a helyi munka és a műveletsor.
- Kevés hely vagy tiltott tartós tárolás: a mentési állapot valós, a sikertelen írás nem látszik sikeresnek.
- Helyreállított mentés után helyesek a rekordkapcsolatok, eredeti fájlok és hozzáférési szabályok.
- Ugyanaz az adatexport kétszer kerül importálásra: nincs duplikált ügyfél, számla vagy befizetés.
- A kézi számlanyilvántartás minden funkciója Agent-kulcs és Agent-hívás nélkül működik.
- Az éles csomag mintaadatai elkülönülnek a valódi üzleti adatoktól, és a függő funkciók nem mutatnak hamis sikerjelzést.

**A dokumentum elkészülte a tervezés eredménye. Alkalmazáskódot, éles adatátvitelt, szolgáltatói beállítást és sikeres futási tesztet csak tényleges végrehajtás után tekintünk elkészültnek.**


### B. A pontos package.json az átadáskor

```json
{
  "name": "rp-elektro-erp",
  "private": true,
  "version": "0.2.0",
  "type": "module",
  "engines": {
    "node": ">=22.12"
  },
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@pdf-lib/fontkit": "1.1.1",
    "@supabase/supabase-js": "2.118.0",
    "lucide-react": "1.61.0",
    "pdf-lib": "1.17.1",
    "react": "19.3.1",
    "react-dom": "19.3.1",
    "vite-plugin-pwa": "2.0.0",
    "zod": "4.6.7"
  },
  "devDependencies": {
    "@electric-sql/pglite": "0.5.11",
    "@playwright/test": "1.64.1",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "14.6.8",
    "@types/node": "26.6.5",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "6.1.2",
    "fake-indexeddb": "6.2.6",
    "jsdom": "30.1.3",
    "prettier": "3.9.10",
    "typescript": "7.0.2",
    "vite": "8.3.5",
    "vitest": "5.0.5"
  }
}
```

### C. Az átadott forrás fájljegyzéke és SHA-256 ellenőrzőösszegei

Relatív útvonalak az `erp/` gyökérhez. A CODEX_HANDOVER.md önmagát nem hash-eli. A generált build, függőségek és tesztkimenetek kizárva. E jegyzék a kód átvételkori azonosságát segíti; nem biztonsági audit.

| Fájl | Bájt | SHA-256 |
| --- | ---: | --- |
| `.env.example` | 104 | `7bfce4f3de0edaa9c21418631e5e60ec848a00a27cf69f1e74651d3d4a4e0c06` |
| `.gitignore` | 93 | `905a32190cecdb3aa51ec6aec5d83d8408b9edfa512c39b167ab42d2d2ba2aae` |
| `README.md` | 12378 | `f26c06ea25b1364ae1d6ca241275989ab931cf24853572ef1649359c159408e6` |
| `START-ERP.cmd` | 832 | `67991c21a5bac2fcbeb64544f5169177cebef9995eb889547ba9c7dedde91060` |
| `TEST-REPORT.md` | 7198 | `2269792a41c01f9159d124cf0082010f27221b6b94da310e571e0c2885e1164b` |
| `docs/ELFOGADOTT-SPECIFIKACIO.md` | 70461 | `8ebcda3f5c0f54ed314a07e4d9b7398336484650af2f3d9577f83efdd47de582` |
| `docs/FEJLESZTOI-ATADAS.md` | 9919 | `6ecf67a5bac340962e979eb83de1bf6ed9bff55d7866bcc5a61deaabde5b4e71` |
| `docs/FIOK-HELYREALLITAS.md` | 3834 | `f651abc9628cfb98c696312b0d2de49d82b5a41e55db3563434f2e6575f01eea` |
| `e2e/core.spec.ts` | 8236 | `1eb0b649a9d1a528f72568e9928a22279044332bf833ee452b9d486eccae094b` |
| `e2e/workflow.spec.ts` | 13236 | `49b257f09f081b159ce58e1299a1a0e62ad16f6a31603dc61b3fa19089bffe94` |
| `index.html` | 469 | `dfc942901ddab7d02301fa4e2597e6e8966cc8ee7408d3a694dfa33c5bbe4867` |
| `package-lock.json` | 271343 | `2e728e06df9ff76dc612147d01e8cfe3d109cb098bdd7ccff843b07c4ea11273` |
| `package.json` | 1120 | `e85bb36a8fd2ab67dc48cf1a8eaecdbfba85d0b9ca522308fc28247fd87996c2` |
| `playwright.config.ts` | 560 | `26f040a1737631211c43297fa3fcb944829b2f8534a75501dbbe2c55d7c52c27` |
| `public/_headers` | 467 | `a9654e3470504db1e2b728daf5515c7568c3617b04986de5de2c30ecf560d8f3` |
| `public/_redirects` | 19 | `6036983e5fc00f0169c9e939b1816ed771eee00e27f2fcc517b819041460b9ef` |
| `public/fonts/DejaVuSans.ttf` | 759720 | `ae7b7855e115a5966d8b1b3f80f254ccc117ec86f9965e202ee2940453837280` |
| `public/fonts/LICENSE-DejaVu.txt` | 3859 | `63d3ba759d12804c5b31a9d5940d855c1820d1f5999e6b0872eb1c7ff045fbc9` |
| `public/icon.svg` | 294 | `c4faf42dcc68e5efec654a7a5f619dc51ac3d544127a796fa1f79d528931fda3` |
| `src/Account.tsx` | 4747 | `f1dab078a62fc248bbd701dc631c0611908689dd061eb9bf2795e0033a768413` |
| `src/App.tsx` | 50628 | `e8d16e7cf6ba73a8fc366037329aca34770ca2769f4a04582756fb804c569ce8` |
| `src/Auth.tsx` | 16318 | `59d4557fbb338d185dba73afa26648f6f6d7e33995af17057d22dfb31e582e7a` |
| `src/Calendar.tsx` | 8474 | `a08224b3832ea40b44707aea5d2d9ca44271b3dce8923709673f2f9da83ffa2a` |
| `src/Invoices.tsx` | 23081 | `a449271102348c9e78a1ae010b9e3c19a401c8b26bc61c8d7b73a3fd785aa641` |
| `src/PhotoPreview.tsx` | 1611 | `55314ebcb9ce638924ca1af05fbe8b755b779b339e379019887749c60164fa69` |
| `src/SyncBar.tsx` | 2346 | `5c159e64103edd0dbcb962e3842624aa7ea84cd1a27550a18e2aed21200b424c` |
| `src/Upcoming.tsx` | 1407 | `9197018a69d3e8cd22c53d649b6ae8d2d34d3b442da0c2e23cc6347bdb5dccc8` |
| `src/Workflow.tsx` | 48550 | `fec8df14bd4c0ed404ee4a642bd4ce504d0eea534188ab5db20563635a23f552` |
| `src/WorkspaceSettings.tsx` | 16545 | `f08aa13a3505eba1e6f53bd03bce35ed70fadc5bb264444c6ce7e77b6b2d21e6` |
| `src/backup.ts` | 8338 | `a43135c1010ec8e28528277f983be45da25ef810d6f15bb823225c4e29185755` |
| `src/business.ts` | 17824 | `ee31c3e946b248e1dbfa0cba54a680473acca5c892ce12c9673c24b46ef0b555` |
| `src/cloud.ts` | 4705 | `be77f175d5e669b17c299dc0d1a1c483553dbaa1533ea10c8bdacceec10ff647` |
| `src/documents.ts` | 3583 | `e29ba3c0abda7f42cfecab05983b15a5ec36a9327b69073c4a1e4bd8261578a2` |
| `src/domain.ts` | 5361 | `b3138c0a68677e918d5aba07a3e1ee7d8b6d14fbf27f179da7d9ec3c7ba918ac` |
| `src/integrations.ts` | 1387 | `a28ce0a77012fb5743dd8f30cd9831b26bc1bd48ef73f6feaedcbeecb0e4ac65` |
| `src/local.ts` | 21760 | `2512f88768a85b670b0b2679edd299f82992e6229e5af30f6538761ad27b7405` |
| `src/main.tsx` | 2843 | `41584122703e33d89ab64c0822e6a948546a2aa033c7d48e8ab0fb1c91595563` |
| `src/modules.css` | 5570 | `3d932da2e8ccc127a5ba339096a669c0df54159c3ff5cd9a8221f903cf11fd11` |
| `src/offline.tsx` | 14324 | `e150873fbb764606d450ce6a746b6d5167f6f919e3c5f3d4abf389c83d03d2d9` |
| `src/pdf.ts` | 7115 | `d192b2d552c6a9ca437d1f8e1a194ace292df245fbf8cb8ae9431c3cc935f3bd` |
| `src/style.css` | 21354 | `d696885c0a5b8e1ac7bd9ec325be429c01936519504233d31e82984e0f8c8587` |
| `src/transfer.ts` | 867 | `536f7c27ed9590d0b916e0c272758dd84e969826e280e004ab61cb63a74d31b3` |
| `src/ui.tsx` | 9295 | `18e8c88448455c4b9a498bfb0ec3d6b521debd5628fd9b9ac50af60e001c7f17` |
| `src/vite-env.d.ts` | 87 | `63402eb45931ed925cec4f2a9bc8bda714753d3fb9aef48bb09ea05493fe8fa8` |
| `supabase/bootstrap-owner.sql.example` | 441 | `03cf909f420316087c23ee8146af1ff9cdc71d167b366962dc8931b6d2251f96` |
| `supabase/migrations/001_core.sql` | 9070 | `511dc6f68c8838515a2b60d988a17b60cc3d3e7385ffd3a846d4cc57e456758f` |
| `supabase/migrations/002_workflow.sql` | 14164 | `b8ab90616b4e3428465056d00800c3861e411977532fae9a97f5fabf76f4676f` |
| `tests/backup.test.ts` | 3073 | `d813444cc3e7ea1348f20a293b28871c78a5392c9fed1c572975deeb665d9108` |
| `tests/business.test.ts` | 5694 | `4ed6dfc0e60cd96232247923cdcb40b4e8867dcd656870f7a2240718f579d371` |
| `tests/domain.test.ts` | 1713 | `34882e79d497537ae056bc0a1d19448b11b7253e1331274168716e934b46493c` |
| `tests/fixtures.ts` | 2084 | `5991ac11867125d440669af083f4204c14acebef4a5dc6a21a6bd2328c729d6d` |
| `tests/local.test.ts` | 4284 | `4481a55447e92db77fa956e9acacb82eecd75c06b4747514384e62820c6d3351` |
| `tests/offline.test.ts` | 3240 | `c06fa132cc7150e2e26fa60a0f69cbae381fbcf309e62f567ba430670efef805` |
| `tests/setup.ts` | 206 | `19a4dbe775b0ca04ad579b1e27327ec3ffcc5c014b238a308100c5f164d40fd8` |
| `tests/sql.test.ts` | 10160 | `833f0145f2949082552f5d0f329090190e02002ed11066addfe4318e5fb68c4b` |
| `tests/worker.test.ts` | 5203 | `d07dea9fb6e4c62c21f85075f8fc260d6da957c04d5542459c6dd0be8587d636` |
| `tsconfig.json` | 420 | `7612d55f2f40c2757f907213cdceed127fec77dce8833326c1d77df3fa6af9bd` |
| `vite.config.ts` | 1193 | `47eed8511114839c675ec2295cfc3ea29f9d62825ea0eb80a75ef6fd14c84a55` |
| `worker/index.ts` | 16079 | `e1d72876248084e9b1302c5c10a1206debf8fdd76251d707c00539d7cadf5281` |
| `worker/schema.sql` | 665 | `68d853e91b5e2421523bb44f5689d96a2d6fac6140c4f5c75a81571b814ab72d` |
| `worker/wrangler.toml` | 558 | `452bedc62117d77d8eea2132c0098a2fbd92dfe7aaa6681bbf639f8fafa8a98f` |

### D. A kiadáskor készített teljes tesztjelentés

Ez a kiadási jegyzék a korábbi 0.2.0 ellenőrzési kört is őrzi. Az átadás során újra lefuttatott baseline a főszöveg 5.1. pontjában van.

### Ellenőrzési jegyzék — E-RP 0.2.0

Dátum: 2026. október 23. Környezet: Linux, Node.js 24.19.0, Chromium 153.0.8010.0. Minden próba létrehozott mintaadatokon futott; a régi ERP és valódi ügyféladatok nem voltak elérve vagy módosítva.

| Ellenőrzés                               | Eredmény                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| TypeScript + Vite termelési build és PWA | Sikeres: `npm run build`                                                                                     |
| Vitest                                   | 35 sikeres teszt, 7 fájl: `npm test`                                                                         |
| Playwright                               | 4 sikeres böngészős teszt, asztali és 390 × 844 mobilnézettel                                                |
| Futásidejű csomagok npm auditja          | 0 ismert sérülékenység: `npm audit --omit=dev --audit-level=moderate`                                        |
| PDF                                      | Magyar szöveg és számítás kiolvasással ellenőrizve; ajánlat és kétoldalas jegyzőkönyv vizuálisan ellenőrizve |

#### Unit- és integrációs ellenőrzések

- Pontos pénzbeolvasás és magyar tizedesvessző, hibás/túl nagy mennyiség és összeg elutasítása; ajánlati számítás és kerekítés, anyagreceptek összesítése, kézi felülbírálás megőrzése.
- Végleges dokumentumok változtathatatlansága, számla/befizetés kapcsolatok, részfizetés és visszavonás, teszt/díjbekérő kizárása, előlegbeszámítás és devizák elkülönítése; budapesti DST időkezelés.
- Helyi titkosított adattár létrehozása, mentése, újranyitása; helytelen jelszó és sérült ciphertext elutasítása; olvasható üzleti adat hiánya a tárolt rekordban; párhuzamos íráskor verzióütközés.
- Teljes mentés titkosítása, visszaolvasása, fájlhash és kapcsolatok ellenőrzése, izolált visszaállítás; sérült fájl és hibás jelszó elutasítása. Visszavont befizetést tartalmazó mentés is ellenőrizhető.
- Offline műveletsor megmarad újranyitás után; elveszett szerverválasz után ugyanaz a műveletazonosító próbálódik újra; ütközésnél nincs csendes felülírás, kifejezett feloldás kell.
- Mindkét valódi SQL-migráció futtatása PGlite PostgreSQL-motoron modellezett Supabase `auth` és `storage` sémákkal. AAL1 tilalom, AAL2 tulajdonosok elkülönítése, idegen vállalkozásba írás tiltása, tulajdonos/azonosító változtathatatlansága, szerververzió és CAS.
- Szerveroldali `erp_apply` idempotencia: azonos művelet ismétlése ugyanazt az eredményt adja, nincs dupla rekord. Ismeretlen mező, hamis tenant és elavult verzió elutasítva. Végleges számla módosítása és jegyzőkönyv nélküli projektlezárás tiltva.
- Privát Storage-policyk: saját fájl feltölthető, idegené nem érhető el; eredeti fájl felülírása/törlése tiltott.
- Worker tényleges forrásának tesztje SQLite alapú D1-adapterrel és szimulált hálózattal: refresh token titkosítása, hibás kulcs/idegen origin/AAL1 elutasítása; elveszett Google-válasz után stabil azonosítóval egyetlen esemény marad, meghívott és automatikus értesítés nélkül.

#### Böngészőben végigpróbált működés

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

#### A bizonyítás határai

- Nincs élő Supabase-, Cloudflare-, SMTP- vagy Google-kapcsolat. Nem történt publikálás, fizetős megrendelés vagy régi adatimport.
- A PostgreSQL/RLS teszt tényleges SQL-t futtat, de modellezett Auth/Storage környezetben. A PostgREST, valódi JWT, élő TOTP, Storage API és több eszköz közötti éles szinkron külön elfogadási próba.
- A Worker-teszt szimulált Google-válaszokat használ. OAuth jóváhagyás, valós tokenlejárat, D1/Workers éles környezet és Google-kvóták nincsenek igazolva.
- A böngészőteszt helyi próbamódban fut; a helyi tárolót és PDF/offline visszaállítást bizonyítja. A valódi felhős teljes folyamatot nem helyettesíti. Fotó és számlaeredeti feltöltéshez további éles fájlpróba szükséges.
- A Playwright szokásos Chromium-letöltése ebben a környezetben üres/hibás ZIP-et adott. A sikeres futtatás külön Chromium 153 binárist használt az `ERP_CHROMIUM_PATH` változóval. A végfelhasználói csomag ezt nem igényli. Firefox/Safari, valódi telefon és Windows CMD futtatás nem volt elérhető; a Windows-indító tartalma átnézett, az általa hívott npm/build/preview lépések Linuxon működnek.
- A build méretfigyelmeztetése nem hiba: fő JS kb. 580 kB (gzip 167 kB), külön PDF-modul kb. 1,14 MB (gzip 507 kB). A PWA kb. 2,54 MiB saját alkalmazásfájlt precache-el. A dinamikusan és statikusan is importált dokumentumsegédre Vite figyelmeztet, a működés sikeresen ellenőrzött.
- Az audit az adott pillanatban ismert, futásidejű függőségi adatbázist ellenőrzi; nem teljes biztonsági audit.
- Valódi helyreállító e-mail, teljes elveszett-TOTP eljárás és tényleges havi költség saját fiókkal ellenőrizendő. Régi exportformátumhoz író importadapter még nincs.

A csomagban lévő `dist` publikus Supabase-beállítások nélküli próbabuild. Éles használathoz saját publikus konfigurációval új build és a fenti elfogadási kör szükséges.



## START HERE – CODEX

### Pontos folytatási állapot

Az ERP 0.2.0 helyi próbamódban végigviszi a fő munkafolyamatot, offline PDF-fel és titkosított mentésből visszaállított eredeti dokumentumokkal. 35 unit/integrációs és 4 böngészős teszt sikeres; éles szolgáltató nincs bekötve. A legutolsó alkalmazáskódos változások a mentés-visszaállítás és payment-reversal ellenőrzésének javítása, az átadási sablonszöveg bekötése és a valódi állapotot mutató felületi szövegek voltak. Ezek után build/unit/E2E sikeres. A jelen átadási kör már a teljes dokumentálás és forráscsomag előállítása volt, nem új funkciófejlesztés.

**A legelső konkrét teendőd:** a forrás átvizsgálása és baseline után reprodukáld a **D01 több függő műveletes konfliktusfeloldási sorrendhibát**, majd javítsd adatvesztés nélküli, célzott teszttel. Ne kezdj UI-újratervezéssel vagy Agent-bekötéssel.

### Elsőként olvasandó fájlok

`CODEX_HANDOVER.md` → `README.md` → `package.json`/lock/config → `src/domain.ts` és `src/business.ts` → `src/local.ts` (`resolveOperations` különösen) → `src/offline.tsx`/`SyncBar.tsx` → `src/cloud.ts` → `supabase/migrations/001_core.sql` és `002_workflow.sql` → `tests/offline.test.ts`/`sql.test.ts`/`backup.test.ts` → `e2e/workflow.spec.ts`. Ezután Workflow/Invoices/WorkspaceSettings/Auth/worker és a teljes elfogadott specifikáció a mellékletben.

### Kezdő ellenőrzések

Az `erp` munkamappából: `npm ci` → `npm test` → `npm run build` → Chromium telepítés vagy megfelelő saját `ERP_CHROMIUM_PATH` → `npm run test:e2e`. A böngészős teszt előtt a build legyen kész; közben ne írd át a distet. Rögzítsd Node/npm/browser verziót és minden valódi eltérést. Nincs szükség éles fiókra ehhez a baseline-hoz.

### Következő tíz lépés

1. Baseline és dokumentáció–kód eltérésjegyzék; a titkos/éles konfigurációk hiányát ne próbáld kitalált értékekkel elfedni.
2. D01/T01 konfliktus-sorrend célzott tesztje és javítása; helyi legújabb payload, history és függőségek megőrzése.
3. D02/T02 közvetlen online lost-reply/idempotencia és újrakattintás reprodukció; tartós műveleti szándék.
4. D03/D04/T03–T05 settings-conflict, singleton és kliens–SQL sémaparitás; közvetlen API negatív esetek.
5. T04/T07 pénzügyi és lezárási invariánsok: többszöri előleg, korrekciók/előjelek, végleges mezők és completed INSERT.
6. T14–T16/T21 backup-frissesség, hiányzó manifest/előnézet, anyaglista-diff és valós státuszok.
7. T08–T12 import- és visszaállítási infrastruktúra; valódi export nélküli részeket építs, konkrét adaptert csak a forrás alapján.
8. T17–T20 élő Supabase/Storage/Google és TOTP/SMTP átvétel előkészítése; szükséges saját hozzáféréseket a megfelelő ponton kérd, a titkokat szolgáltatói tárolóban kezeltesd.
9. Valódi eszközös offline/fotó/számlaPDF/többoldalas jegyzőkönyv, két eszköz konfliktus és teljes helyreállítás; majd ellenőrzött régi próbaimport.
10. Saját repo/CI, költség- és kvótaellenőrzés, HTTPS staging/éles átadás, friss tesztjelentés és forráscsomag. Agent és teljes bejövő modul csak külön későbbi ütemben.

**A cél a meglévő termék pontos, biztonságos befejezése. Minden kétséges pontnál a valós kód, a megőrzött felhasználói döntés és a tényleges ellenőrzés legyen az alap.**
