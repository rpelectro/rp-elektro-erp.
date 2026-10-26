# E-RP · RP Elektro — 0.2.0

Saját React + TypeScript + Vite alkalmazás, Supabase adatbázissal és Cloudflare Pages telepítésre előkészítve. A munkafolyamat helyi próbamódban végig használható. Az éles fiókok bekötése, a régi ERP adatainak átvétele és a valódi szolgáltatásokkal végzett elfogadási próba külön következő lépés. Az alkalmazás nem Sites-projekt.

## Kipróbálás Windows alatt

Node.js 22.12 vagy újabb szükséges; ellenőrzött környezet: Node 24. Csomagold ki a ZIP-et. Az `erp` mappán belül indítsd a **START-ERP.cmd** fájlt. Első alkalommal letölti a függőségeket, elkészíti a buildet és elindítja a helyi kiszolgálót. A terminál maradjon nyitva. Böngészőben: **http://127.0.0.1:5173**.

Kézi indítás PowerShellből, abban az `erp` mappában, ahol a `package.json` és a `package-lock.json` található:

```powershell
npm.cmd ci
```

```powershell
npm.cmd run build
```

```powershell
npm.cmd run preview -- --host 127.0.0.1 --port 5173 --strictPort
```

Válaszd a **Helyi próbamód megnyitása** gombot, és hozz létre legalább 12 karakteres helyi jelszót. Ehhez nem kell Supabase- vagy Számlázz.hu-fiók. Használj mintaadatokat. A korábbi 0.1.0 próba ugyanazon böngészőprofilon és pontosan ugyanazon címen megnyitható a korábbi jelszóval; először készíts mentést. Az új ZIP-et külön mappába csomagold ki, a régi forrást tartsd meg.

A `127.0.0.1`, `localhost`, más port, más böngésző és más profil külön adattárat jelent. Korábbi futó szervert állíts le Ctrl+C-vel. A `--strictPort` szándékosan megáll, ha az 5173 port foglalt. A próbamód helyi titkosítása nem felhős mentés. A feloldó jelszó elvesztésekor a csak helyben lévő adatok nem fejthetők vissza.

Az offline alkalmazás csak sikeres első online betöltés és gyorsítótárazás után nyitható újra internet nélkül. A fejlesztői `npm run dev` helyett a fenti build/preview indítás használható erre. Éles telepítésnél HTTPS szükséges; a helyi visszacsatolási cím fejlesztési kivétel.

## Működő modulok

| Terület             | Elkészült működés                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ügyfelek, projektek | Létrehozás, szerkesztés, keresés, archiválás, visszaállítás, külön számlázási és munkavégzési cím                                                                          |
| Beállítások         | Cégadatok, adózási mód, bank, logó, ajánlati és átadási sablon, munkakatalógus, anyagok és receptek                                                                        |
| Felmérés            | Teljes ingatlan és helyiségek, meglévő/tervezett/ismeretlen állapot, belső jegyzet, munkatételek és fotók                                                                  |
| Ajánlat             | Felmérésből vagy egyedi tételekkel, mennyiség, ár- és receptpillanat, anyagösszeg, kedvezmény, áfa, végleges magyar PDF, új verzió, kézzel rögzített kiküldés/ügyféldöntés |
| Anyagok             | Ajánlatverzióhoz tartozó mennyiségek, recept szerinti összesítés, felülbírálás és kézi sor; frissítés előnézettel                                                          |
| Átadás              | Tényleges munka, eltérések/pótmunkák/fennmaradó feladatok, három ellenőrzés, fotók, tartalomáttekintés, rajzolt aláírások, végleges PDF és új verzió                       |
| Számlák             | Kimenő kézi nyilvántartás, díjbekérő/előleg/végszámla/sztornó/helyesbítés, tesztjelölés, eredeti PDF-csatolás, részfizetés, visszafizetés, hibás befizetés visszavonása    |
| Pénzügy             | Devizánkénti összesítés valódi nyilvántartásból; tesztszámla és díjbekérő kizárva; hiányos tervezet külön jelölve                                                          |
| Dokumentumok        | Privát fájlkezelés, eredeti PDF/fotó, ellenőrzőösszeg, változtathatatlan dokumentumindex                                                                                   |
| Naptár              | Projekthez kapcsolható több időpont, budapesti helyi idő, ütközésjelzés, módosítás és lemondás                                                                             |
| Offline             | Titkosított helyi adattár, projektfájlok előkészítése, újranyitás, PDF, műveletsor, idempotens feltöltés és kézi ütközésfeloldás                                           |
| Mentés              | Külön jelszavas teljes üzleti csomag eredeti fájlokkal, visszaolvasásos ellenőrzés, elkülönített helyi próba-visszaállítás                                                 |
| Fiók                | Supabase jelszó + TOTP, saját eszközre választható munkamenet, tartalék TOTP felvételi felület és jelszó-helyreállítási kérés                                              |

A rajzolt aláírás és eszközidő nem minősített elektronikus aláírás vagy hiteles időbélyeg. A végleges dokumentum tartalmát a szerkesztő nem írja felül; módosításhoz új verzió készül, új aláírásokkal.

## Számlázz.hu és későbbi bővítés

A meglévő **#profi** előfizetésen kézzel állítod ki és küldöd el a számlát. Az E-RP adatokat készít elő és a ténylegesen kiállított számlát tartja nyilván. **Nincs Agent-hívás, automatikus számlakiállítás, banki vagy NAV-egyeztetés.** A kézi befizetésrögzítés nem módosítja a Számlázz.hu állapotát.

A forrás/szolgáltató/külső azonosító, irány, felek pillanatfelvétele, kapcsolt bizonylatok és pénzmozgások elkülönítve szerepelnek az adatmodellben. A bejövő számla munkafolyamata jelenleg tiltott. A későbbi Agent-integráció szerveroldali adaptert, titokkezelést és külön elfogadási próbákat igényel; a kézi működés most nem támaszkodik rá. Beszerzés, készlet és anyagár-nyilvántartás nincs.

## Supabase és Cloudflare éles bekötése

1. Hozz létre az E-RP-hez külön Supabase-projektet. A régi ERP és a HomeHub adatbázisát ne módosítsd.
2. Új adatbázison futtasd sorrendben a `supabase/migrations/001_core.sql`, majd a `002_workflow.sql` migrációt. Meglévő 0.1.0 adatbázis esetén csak a 002 szükséges, előzetes mentéssel. Ezek nem általános, tetszőleges meglévő sémára telepíthető migrációk.
3. Hozd létre az egyetlen tulajdonosi Auth-felhasználót, kapcsold ki a nyilvános regisztrációt. A valódi Auth UUID-val töltsd ki és futtasd a `bootstrap-owner.sql.example` mintát. Ezt ne futtasd kétszer ugyanarra a tulajdonosra.
4. Állítsd be a tényleges alkalmazáscímet, a helyreállító visszatérési címeket és a saját SMTP-t. A levélkézbesítést valódi postaládában kell próbálni.
5. Másold a `.env.example` fájlt `.env` névre. Csak a saját projektcímet és publishable/anon kulcsot add meg. **Titkos vagy service_role kulcs soha nem kerülhet a Vite-változókba, böngészőbe vagy ZIP-be.**
6. Buildelj újra, telepítsd a `dist` tartalmát Cloudflare Pages-re. Buildparancs: `npm run build`; kimenet: `dist`; Node 24. A csomagban lévő kész build kulcs nélküli próbabuild.
7. Állítsd be és ellenőrizd a TOTP-t, majd külön eszközön a tartalék hitelesítőt. Próbáld végig az élő Auth, adatbázis, privát Storage, offline egyeztetés és mentés működését az átadási jegyzék szerint.

A publikus változók buildkor épülnek a felületbe. Az RLS csak engedélyezett tulajdonosnak, AAL2 hitelesítéssel enged üzleti adatelérést. A szerver kezeli a verziókat és műveletazonosítókat. A privát `erp-files` Storage-ban a fájlok tartalomazonosított útvonalra kerülnek; a kliensnek nincs felülírási/törlési joga. Más vállalkozásra mutató kapcsolatok tiltottak. Az eredeti fájlokat az alkalmazás ellenőrzőösszeggel ellenőrzi.

A `public/_headers` Supabase- és workers.dev-címeket enged a kapcsolat számára. Élesítéskor szűkítsd a tényleges végpontokra; saját domainnél az adott HTTPS/WSS-origin pontosan hozzáadandó. A helyi preview nem Cloudflare, ezért a Pages-fejléceket külön az éles oldalon is ellenőrizni kell.

## Offline használat és mentés

### Hosszú leírások és projekt-PDF

A felmérés munkatételeinél az **Ár megadásának módja** mezőben számszerű összeg
vagy **Szöveges ár** választható (például „Egyeztetés szerint”). Ez a teljes
ingatlan és az egyes helyiségek munkáinál is használható, és a felmérés PDF-jében
is megjelenik. Ajánlatba átemelés után a szöveges ár mellé számszerű munkadíjat
kell beírni; addig az ajánlat nem menthető és nem véglegesíthető. A szöveges
ár nem számít automatikusan 0 Ft-os tételnek.

A felmérés önálló, teljes oldalas munkaterületen nyílik meg. Balra az alapadatok,
leírások, ingatlanmunkák, általános fotók és az egyes helyiségek választhatók;
telefonon ugyanez legördülő listaként jelenik meg. A leírások külön füleket kapnak,
egyszerre egy nagy, belül görgethető szerkesztővel. A meglévő hosszú szöveg rögtön
görgethető, fülváltáskor megmarad a tartalom és a görgetési hely. A keresővel és az
Előző/Következő találat gombokkal a hosszú leírásban is lehet navigálni.

A leírások vizuális, Office-szerű szerkesztőt használnak. Szövegkijelölés után a
**Félkövér** és **Dőlt** gombbal formázhatsz; külön gomb van a címsorokhoz,
felsorolásokhoz és számozott listákhoz. A Ctrl+B, Ctrl+I, visszavonás és ismétlés
is használható. Nem kell Markdown-jeleket gépelni. A korábbi leírások automatikusan
formázottan nyílnak meg, a módosítások továbbra is a Mentés gombbal rögzíthetők.
A félkövér, dőlt, címsoros és listás formázás a projektkivonatokban, valamint az
ajánlat és átadás végleges PDF-jében is megmarad. A meglévő szöveges adattárolás
és mentési formátum változatlan, új Supabase-migráció nem szükséges.

A fejlécben mindig elérhető a **Mentés**, **PDF letöltése** és **Vissza a projekthez**.
A mentés a munkaterületen tart, a következő mentés az új verziót használja.
A részek közötti váltás nem dobja el a módosításokat. Mentetlen felmérés
elhagyásakor megerősítést kér. A felmérés leírásaihoz nem nyílik felugró ablak.
Más űrlapok hosszú szövegeinél továbbra is használható a Nagyobb szerkesztőnézet.

Az **árajánlat, anyaglista, átadási jegyzőkönyv és számlanyilvántartás** szerkesztői
szintén teljes oldalas munkaterületet használnak, bal oldali részekkel és felső
mentési művelettel. A fő projektfülek (Felmérés, Árajánlat, Anyagok stb.) felül
maradnak; az oldalsó navigáció a megnyitott dokumentum belső részeit tartalmazza.
Az ajánlatban külön érhetők el a felek, tételek, árazás,
feltételek és PDF-véglegesítés. Az átadás hosszú leírásai fülek között válthatók;
a tartalomáttekintés és az aláírás külön lépés marad. A számla befizetései és
eredeti csatolmányai külön részek. Az anyaglista a **Szerkesztés** gombbal nyitható
meg, a mennyiségek, kézi kiegészítések és megjegyzések külön kezelhetők.
A részek közötti váltás megőrzi a módosításokat; hibás mező esetén a mentés a
megfelelő részhez navigál. A végleges dokumentumok változtathatatlansága és az
új verziós módosítás szabálya megmarad.

A projekt minden fülén van **PDF letöltése** gomb az adott fül mentett adataihoz.
A felmérés listájában egyenként, a szerkesztőjében pedig az aktuális űrlaptartalomból
is készíthető PDF. A hosszú szövegek több oldalra tördelődnek, a helyiségfotók a
saját helyiségük alatt szerepelnek. A belső felmérésjegyzet és a projekt belső
megjegyzése nem kerül az exportba. A Markdownból bemásolt `#` címsorok PDF-ben
címsorként jelennek meg. A projekt-PDF külön főcímet, projektadat-blokkot,
ismétlődő fejlécet és oldal/összes oldal számozást kap. A szöveg szóhatáron
tördelődik; a `**félkövér**` kiemelés és a felsorolások is formázva jelennek meg.

Az új export letölthető kivonat; nem küldi ki és nem archiválja automatikusan a
dokumentumot. A számlafül exportja számlanyilvántartás, nem új számla. Az ajánlat és
az átadás végleges, eredeti PDF-je továbbra is a meglévő véglegesítési művelettel
készül. A Dokumentumok fül PDF-je fájljegyzék, nem a csatolmányok összefűzése.

A felmérés **Helyiségek** részében alaphelyiségek választhatók (például nappali,
konyha, hálószoba, fürdőszoba), és egyedi helyiség is felvehető. Minden helyiségnek
saját fotófeltöltője van: több kép is kiválasztható, és a képek előnézete az adott
helyiségnél jelenik meg. A helyiséghez rendelést a felmérés **Mentés** gombja rögzíti.
A helyiség feltöltőkeretére több kép egyszerre ráhúzható a fájlkezelőből.
A Dokumentumok és az általános csatolmányfeltöltők is támogatják a csoportos
behúzást. Egy hibás fájl nem állítja meg a többi feltöltését; a hibákat név szerint
jelzi a felület. A céges logónál továbbra is egy fájl adható meg egyszerre.
A képek leválaszthatók; az eredeti fájlok a Dokumentumok között megmaradnak.
A régi, közös felmérésfotók továbbra is elérhetők az általános képek között.
Ehhez a változáshoz nem szükséges új Supabase SQL-migráció.

Saját eszközön online bejelentkezés után, a Beállítások / Offline és kapcsolatok alatt engedélyezhető az offline adattár. A projektfájlok külön előkészíthetők és ellenőrizhetők. A helyben mentett változás nem jelent feltöltést: a szinkronsáv mutatja a függő műveleteket és az utolsó egyeztetést. Ez mindig az adott eszköz állapota. Ütközéskor mindkét változat megtekinthető, és kifejezett választás szükséges; az előzmény megmarad.

A helyi titkosítás AES-256-GCM, PBKDF2-SHA256 310 000 iterációval; a nyitott alkalmazás kulcsa memóriában él. Kijelentkezés előtt a függő műveletekre figyelmeztetés jelenik meg. Böngésző-adattörlés, profilcsere vagy tárhely-eltávolítás elveszítheti a csak helyi munkát. Az offline adatbázis nem helyettesíti a független mentést.

Beállítások / Adatok és mentések: adj külön mentési jelszót, töltsd le a teljes csomagot, majd válaszd vissza a ténylegesen elmentett fájlt. Csak a visszaolvasás és ellenőrzés után lesz ellenőrzött a mentés. A helyreállítás új, elkülönített helyi adattárba történik; az aktív adattár a belépésnél kiválasztható. A korábbi adatbázist nem törli, és nem tölti fel automatikusan a felhőbe.

Jelenlegi korlát: fájlonként 10 MiB, teljes mentésnél legfeljebb 100 MiB eredeti fájl. Túl nagy vagy hiányos csomagnál hiba történik, nem készül sikeresnek jelölt részmentés. Nagyobb állományhoz külön üzemeltetői export kell. Nincs automatikus időzített mentés; 24 óra után emlékeztető látható.

## Google Naptár és régi adatok: pontos állapot

A `worker/` tartalmazza az ERP → Google egyirányú kapcsolat szerverkódját, D1-sémáját és konfigurációmintáját. A token szerveroldalon titkosított, a jogosultság és az eseménytulajdon ellenőrzött, a létrehozás stabil azonosítójú. Ez a háttérszolgáltatás **nincs telepítve**, az OAuth és a valódi Google-fiók nincs összekapcsolva vagy élőben tesztelve. Az alapváltozat az elsődleges naptárat használja. Google → ERP szinkron nincs. A telepítési lépések a fejlesztői átadásban találhatók.

A régi ERP tényleges exportja és eredeti fájljai nem álltak rendelkezésre. Az importfelületen formátumellenőrzés és az ismert belső JSON-formátum előnézete van, **éles adatimportot nem hajt végre**. A régi formátumhoz adapter, megfeleltetési előnézet, tételes hibajegyzék és ellenőrzött import még szükséges. A régi rendszer nem változott, adatátvételt nem állítunk késznek.

## Költség és éles átvétel

A havi 5 000 Ft teljes keret tervezési feltétel, a meglévő #profi díjával együtt. A csomag nem rendel meg fizetős szolgáltatást. A saját előfizetés valós díját, a Supabase/Cloudflare/Google aktuális kereteit és a tényleges SMTP-megoldást élesítés előtt ellenőrizni kell. A forrás nem garantál korlátlan ingyenes üzemet.

A teljes, korábban elfogadott specifikáció változatlan másolata: `docs/ELFOGADOTT-SPECIFIKACIO.md`. Ez a tervezési állapotot is őrzi; a tényleges kiadási állapotot ez a README, a `TEST-REPORT.md` és a `docs/FEJLESZTOI-ATADAS.md` írja le. A fiókhelyreállítási eljárás a `docs/FIOK-HELYREALLITAS.md` fájlban van.

## Ellenőrzések

### Munkakatalógus tömeges feltöltése

A **Beállítások → Munkakatalógus → Tömeges munkatétel-felvitel** alatt az
**50 alapvető villanyszerelési munka betöltése** gombbal előkészíthető az alaplista.
Az **Előnézet és ellenőrzés**, majd a **munkatétel mentése** gomb menti a tételeket
az aktuálisan megnyitott adattárba. Az alapmunkák munkadíja 0 Ft; ajánlat előtt
meg kell adni a saját árakat.

Saját lista is bemásolható Excelből tabulátorral, vagy pontosvesszővel elválasztva:
`név;egység;munkadíj Ft;kategória;leírás`. Csak a név és egység kötelező.
Egyszerre legfeljebb 500 sor adható meg. Az azonos nevű és egységű meglévő
tételeket (az archiváltakat is) a rendszer kihagyja; meglévő árakat nem ír felül.
Mentési hiba után a lista megmarad, és az újrapróbálás kihagyja a már elmentett tételeket.

```powershell
npm.cmd test
```

```powershell
npm.cmd run build
```

```powershell
npx.cmd playwright install chromium
```

```powershell
npm.cmd run test:e2e
```

A böngészős tesztek a már elkészített `dist` buildet indítják a 4173 porton, elkülönített böngészőadatokkal. A tesztek nem igényelnek valódi fiókot. Az élő integrációs átvételt nem helyettesítik.

### Munkakatalógus végleges törlése

A Beállítások → Munkakatalógus részben egyedi törlés és teljes ürítés is elérhető. A teljes ürítés az aktív és archivált munkatételeket is törli, kereséstől és szűréstől függetlenül. Megerősítéshez a `TÖRLÉS` szót kell beírni. A korábbi ajánlatok, felmérések és anyaglisták saját tételpillanatképei változatlanok; az újra importált katalógus új azonosítókat kap. A művelet nem vonható vissza (biztonsági mentés visszaállíthatja a régi katalógust is).

Felhős használat előtt a Supabase SQL Editorban egyszer le kell futtatni a `supabase/migrations/003_catalog_delete.sql` fájlt. A migráció csak a törlés lehetőségét telepíti, önmagában nem töröl adatot. A törlés hitelesített, kétlépcsős belépést igényel, vállalkozásonként elkülönített és verzióellenőrzött; hibánál a teljes kijelölés érintetlen marad. Offline felhős használatnál előbb szinkronizálni kell minden helyi módosítást, és a törléshez élő kapcsolat szükséges. Helyi próbamódban a törlés a titkosított adattárra korlátozódik.
