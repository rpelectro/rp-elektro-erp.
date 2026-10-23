# E-RP – működési specifikáció

Verzió: 1.0 · Dátum: 2026. október 23.

**Állapot:** kidolgozott működési specifikáció és tervezett adatmodell. Az offline működés, az adatátvétel és az indulási beállítások terve is szerepel benne. Ez fejlesztési alap, nem elkészült alkalmazás vagy végrehajtott adatátvétel. Az új alkalmazás forráskódja, az éles fiókok beállítása és a működés bizonyító tesztjei a megvalósítás következő feladatai.

**A mostani döntés:** első körben a számlát kézzel állítod ki a Számlázz.hu saját felületén. Az E-RP a számlázáshoz szükséges adatokat készíti elő, majd a már kiállított kimenő számlát, annak PDF-jét és fizetéseit tartja nyilván. A Számla Agent API-s kiállítás későbbi, külön bekapcsolható bővítés lesz. Az adatmodell továbbra is előkészíti a későbbi bejövő számlákat. A beszerzés nem része a jelenlegi feladatnak.

## 1. Rögzített keretek

- Saját React + TypeScript + Vite alkalmazás, a HomeHubnál használt fejlesztési iránnyal.
- Supabase Database az adatokhoz, Supabase Storage a fényképekhez, PDF-ekhez és aláírásokhoz.
- Cloudflare Pages a webes felület tervezett tárhelye. A szerveroldali műveleteket külön, védett háttérszolgáltatás kezeli.
- Számítógépen, tableten és telefonon használható felület; helyszíni munkához offline szerkesztés és későbbi szinkronizálás.
- Elsőként egy tulajdonosi fiók, zárt regisztrációval és kétlépcsős azonosítással.
- Teljes szolgáltatási keret: legfeljebb havi 5 000 Ft. A keretbe a tárhely és a számlázási kapcsolat is beletartozik.
- Meglévő Számlázz.hu-előfizetés: **#profi**, a felhasználó 2026. október 23-i pontosítása alapján. Nem #free csomaggal és nem új #start-előfizetéssel tervezünk.
- Első ütem: kézi kiállítás a Számlázz.hu-n, kézi számlanyilvántartás az E-RP-ben. Az E-RP ebben az ütemben nem indít Számla Agent API-hívásokat, és működéséhez nem kér Agent-kulcsot.
- Az első anyagkezelés csak a szükséges anyagokat és mennyiségeket kezeli. Nincs készlet, rendelés, beszerzési állapot vagy beszállítói árkatalógus.

## 2. A munka végigkövetése

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

## 3. Felmérés, ajánlat és anyagok

### Felmérés

A felmérésnek saját neve van. Az ügyfél és a helyszín a projektből átvehető. Helyiségenként és a teljes ingatlanra vonatkozóan is rögzíthetők munkák, mennyiségek, egységek, elhelyezések, megjegyzések és fényképek. A meglévő állapot és a tervezett munka elkülönül. A nem vizsgált vagy ismeretlen adat rögzíthető így; nem kell helyette kitalált értéket megadni.

A belső megjegyzések nem kerülnek automatikusan az ügyfél dokumentumaiba. Az eredeti felmérés és a fényképek megmaradnak, az árajánlat későbbi szerkesztése nem írja át őket.

### Árajánlat

Az ajánlat felmérésből állítható össze. Egy munkatételhez mennyiség, egység és munkadíj tartozik. A katalógus alapárát az adott ajánlatban felül lehet írni, és a későbbi katalógusmódosítás nem változtatja meg a már rögzített ajánlatot.

Az anyagköltség külön, kézzel megadott összeg. Az anyagmennyiségek listájából nem lesz automatikusan beszerzési vagy eladási ár. Kedvezmény csak kifejezett rögzítéssel jelenik meg.

Az ajánlat állapotai: tervezet, elküldött, módosításkérés, elfogadott, elutasított. Az elfogadás külön esemény; a PDF elkészítése nem jelent elfogadást. Az elküldött dokumentum pillanatfelvétel, módosításkor új verzió készül.

Az ügyfél PDF-jén a cég, az ügyfél és a helyszín adatai, az ajánlat azonosítója és verziója, a dátumok, az érvényesség, a munkák és mennyiségek, a munkadíj, az anyagköltség, az esetleges kedvezmény és a végösszeg szerepelnek. A fizetési és vállalási feltételek szerkeszthető sablonból jönnek. Az adózási beállítás a cégadatokhoz tartozik.

### Anyagok

A munkatípusokhoz anyagrecept kapcsolható, mennyiséggel és egységgel. A kiválasztott ajánlatverzió alapján összesített anyaglista készül. Csak ténylegesen azonos anyag és egység vonható össze; azonos név önmagában nem elég.

Az anyaglista kézzel kiegészíthető és javítható. Ha változik az ajánlat, a rendszer jelzi a frissítés szükségességét, megmutatja az eltéréseket, és kezeli a kézi módosításokat. Több ajánlatverzió mennyiségeit nem adja össze.

A későbbi bejövő számlakezelés nem változtatja meg automatikusan az ajánlat anyagköltségét vagy ezt a szükségletlistát.

## 4. Naptár és átadás

A projekthez több időpont tartozhat: felmérés, munkavégzés vagy visszatérés. Minden eseménynek van kezdete, vége, helyszíne és megjegyzése. A megjelenítés Europe/Budapest időzónában történik. Az átfedések figyelmeztetést adnak; egy elmúlt időpont nem zárja le a munkát.

A Google Naptár kapcsolat kizárólag az alkalmazáshoz kapcsolt eseményeket módosítja. Egy esemény mentése önmagában nem küld ügyfélmeghívót. Offline változtatáskor szinkronizálási sor és duplikációvédelem szükséges.

Az átadási jegyzőkönyv a ténylegesen elvégzett munkát, a dátumot, eltéréseket, pótmunkákat, fennmaradó feladatokat és kiválasztott fényképeket tartalmazza. Projektenként több jegyzőkönyv készülhet.

Három kötelező lezárási ellenőrzés:

1. Rendezett munkaterület.
2. Ügyfél tájékoztatása.
3. Dokumentumok átadása.

A hiányos dokumentum tervezet maradhat. Az ügyfél és a vállalkozó rajzolt aláírása az adott dokumentumverzióhoz kötődik. Módosítás után új verzió készül; az ügyfél régi aláírása nem kerül automatikusan az új tartalomra. Aláíratlan és részben aláírt dokumentum is egyértelműen megkülönböztethető.

## 5. Kimenő számlák: először kézi kiállítás, később API

Kimenő számla: a saját vállalkozás állítja ki az ügyfélnek. Attól még kimenő marad, hogy a Számlázz.hu webes felületén készül, és az E-RP-be kézzel kerül be.

### Első ütem – kézi munkafolyamat

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

### Az API későbbi bekötésének előkészítése

- A vállalkozás számlázási módja kezdetben **kézi**. Az API-mód külön beállítás és későbbi, kifejezett bekapcsolás.
- Minden számla saját belső azonosítót kap. A számlairánytól külön mező jelöli a létrehozás forrását: kézzel rögzített vagy API-val kiállított.
- A számlázószolgáltató már kézi rögzítésnél is megadható. Az API külső azonosítója ekkor üresen maradhat; a felhasználónak nem kell kitalált értéket beírnia.
- Ugyanahhoz a számlához tartozik a projektkapcsolat, az eredeti PDF és a részfizetés attól függetlenül, hogy később melyik úton került be. Az API bekötése nem igényli e kapcsolatok újraépítését.
- A kézi rögzítés és az API-s kiállítás külön művelet. Egy már kiállított, kézzel rögzített számlát az API bekapcsolása nem állít ki újra, és a régi tervezeteket sem küldi be automatikusan.
- Későbbi lekérdezés vagy import során a már rögzített számlát egyeztetni kell az eredetivel. Nem jöhet létre automatikusan második nyilvántartási példány vagy dupla bevétel.
- A majdani API-művelet saját tartós műveletazonosítót és naplózott állapotot kap. Bizonytalan szolgáltatói válasz után először állapotegyeztetés szükséges; vak újraküldés nem megengedett.
- A majdani API-kulcs védett szerveroldali titok lesz. Az első kézi változat kulcs nélkül használható; a felület, az offline adatbázis és a naplók nem tárolhatják ezt a titkot.

A Számlázz.hu saját csomagjogosultságait és szabályait a későbbi API-s folyamatban is meg kell tartani. A több előleg egy végszámlához kapcsolásának szolgáltatói támogatását az API megvalósítása előtt külön ellenőrizni kell.

## 6. Előkészítés a későbbi bejövő számlákhoz

Bejövő számla: más vállalkozás állítja ki az E-RP-ben kezelt vállalkozásnak. Ilyenkor az E-RP-ben a már létező dokumentumot kell majd rögzíteni és követni. A rögzítés nem indíthat kimenő számlakiállítást.

**Most az adatmodell és a kapcsolódási pontok készülnek elő.** A bejövő számlák képernyői, feltöltése, importja és teljes munkafolyamata későbbi fejlesztési ütem. A közös alap önmagában nem jelent bejövőszámla-importot vagy új fizetős szolgáltatást.

### Közös adatok, külön folyamatok

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

### Tervezett adatmodell

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

### Már az alapban betartandó szabályok

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

### Később eldöntendő lehetőségek

Ezek bővítési irányok, jelenleg nem vállalt funkciók:

- Kézi számlarögzítés és eredeti PDF vagy fénykép csatolása.
- Szállító, határidő és fizetettség szerinti lista.
- Kapcsolás munkaprojekthez; később egy összeg megosztása több projekt között.
- Automatikus adatkinyerés vagy import, a ténylegesen elérhető szolgáltatás és költség ellenőrzése után.
- Projektenkénti kiadásösszesítés, a kifizetés és a rögzített költség világos elkülönítésével.

A bejövő számlák fejlesztésének megkezdése előtt külön tisztázandó a rögzítési mód, a szükséges mezők, az ellenőrzés, a javítás és törlés szabálya, valamint a fizetés követése. Automatikus NAV-import, OCR, banki egyeztetés vagy könyvelői adatátadás nincs most megígérve.

## 7. Ügyfelek, dokumentumok és beállítások

Az ügyfél a projekt létrehozásakor kiválasztható vagy felvehető. Az adatok név, telefonszám, cím és projekt alapján kereshetők. Hiányos ügyféladatokkal tervezet menthető, de a kiállításhoz szükséges mezőket az adott művelet előtt ellenőrizni kell.

A dokumentumtár közös hivatkozásokkal kezeli a fotókat, ajánlatverziókat, jegyzőkönyveket, számlákat és feltöltött fájlokat. Egy fájl több helyen megjelenhet anélkül, hogy minden nézethez új példány készülne. A dokumentum típusa, dátuma, verziója, kiküldési és aláírási állapota követhető.

A beállításokban szerepelnek a cég- és bankadatok, logó, adózási beállítás, munkakatalógus, anyagreceptek, dokumentumsablonok, kapcsolatok, fiók és adatmentés. Katalógustétel archiválható; ettől a korábbi ajánlatok és dokumentumok nem vesznek el.

## 8. Offline működés és adatvédelem

Az alábbi működést dolgoztuk ki az első változat fejlesztési alapjaként. A fiókok létrehozása, a levelezés bekötése, a mentés és a helyreállítás tényleges megvalósítása és ellenőrzése még a fejlesztés része; jelenleg ezek nincsenek bekapcsolva.

### 8.1. Belépés és hozzáférés

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

### 8.2. Elfelejtett jelszó és elveszett telefon

A helyreállítást három külön helyzetre bontjuk.

**Elfelejtett jelszó:** az alkalmazásból helyreállító e-mail kérhető. A visszatérési cím kizárólag az E-RP engedélyezett címére mutathat. A jelszó visszaállítása nem kapcsolja ki a TOTP-követelményt; az üzleti adatokhoz utána is teljesíteni kell a második lépcsőt.

Éles jelszó-helyreállításhoz saját SMTP-kapcsolatot kell beállítani és kipróbálni. Lehetőség szerint a meglévő levelezési szolgáltatás használható, ha támogatja ezt. A Supabase alapértelmezett tesztlevelezésére nem építünk éles helyreállítást. A konkrét szolgáltató és feladó beállítása a beüzemelés része; új fizetős előfizetés nincs most kiválasztva vagy megrendelve.

**Elveszett telefon:** a működő fiókhoz előre felvett és kipróbált tartalék TOTP-lehetőség ad elsődleges helyreállítási utat. Ez lehet második, elkülönítetten tárolt hitelesítő vagy biztonságos helyen őrzött beállítási titok. Nem elegendő, ha a tartalék kizárólag ugyanazon az elveszett telefonon van. Egy visszaállítási próba után az elveszett hitelesítő eltávolítható és az új telefon felvehető.

A Supabase dokumentációjában már szerepel kísérleti helyreállítókód-API is. Az első változat helyreállításának biztos alapja a kipróbált tartalék TOTP, a kísérleti kódlistát nem ígérjük kész szolgáltatásként.

**Minden alkalmazásos hitelesítő elveszett:** külön vészhelyzeti üzemeltetési leírás készül a saját Supabase-projekt tulajdonosi hozzáférésével végzett visszaállításhoz. Az adminisztrációs tényezőtörlés nem érhető el az E-RP nyilvános felületéről és nem járhat általános adathozzáférési feloldással. Utána az új TOTP beállítása és ellenőrzése ismét kötelező, az AAL2-követelmény megmarad.

A Supabase kezelőfelületéhez tartozó fiók külön hozzáférés, saját tartalék hitelesítéssel. Ha ehhez is minden hitelesítő elveszik, nem ígérünk garantált szolgáltatói visszaállítást. Ezért a projektátadás része az alkalmazás és az üzemeltetői fiók tartalék hozzáférésének külön ellenőrzése.

Más munkamenetek kijelentkeztetése is szükséges a helyreállítás után. A már kiadott hozzáférési token élettartamát és az offline helyi másolatot ettől külön kell kezelni: a kijelentkeztetés nem jelent minden offline eszközön azonnali távoli adattörlést.

### 8.3. Saját eszköz és offline adatok

A helyi adatbázis kezeli a tervezeteket és a szinkronizálási sort. A felület külön jelzi a helyben mentett, feltöltésre váró, szinkronizált és hibás állapotot. A fájlok feltöltése külön állapotot kaphat az adatrekord mentésétől. A „helyben mentve” jelzés nem jelent szerverre feltöltött vagy külön biztonsági másolatba mentett adatot.

Offline üzleti adatok csak korábban online, teljesen azonosított és sajátként engedélyezett eszközre kerülhetnek. Ismeretlen eszközön az első belépés online történik. A telefonos TOTP-kód szerveroldali ellenőrzését nem utánozzuk offline, és nem másoljuk ehhez a TOTP titkát az alkalmazásba.

A helyi adatok védelméhez az eszköz képernyőzárát és felhasználói hozzáférését is használni kell. Az online kétlépcsős védelmet kiegészítő, titkosított helyi tároló és az offline dokumentumkészítés működése a 8.7–8.9. pontban szerepel.

Lejárt munkamenetnél a helyi módosításokat megőrizzük, a szerverre feltöltést új azonosításig megállítjuk. A böngésző bezárása utáni háttérszinkron nem garantált; a következő megnyitáskor folytatni kell. Kijelentkezés vagy helyi adatok törlése előtt a még nem szinkronizált munka mennyisége látható, és nem veszhet el figyelmeztetés és kifejezett döntés nélkül.

### 8.4. Üzleti adatok és fájlok mentése

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

### 8.5. Visszaállítás

Először az éles környezettől elkülönített próbakörnyezetben történik a helyreállítás. A visszaállítás előnézete megmutatja a mentés idejét, a verziót, a rekordok és fájlok számát, a hiányokat, valamint a meglévő adatokkal várható ütközéseket. Sérült vagy nem támogatott csomag nem írhatja felül az éles adatokat.

Új Supabase-projekt esetén előbb a sémát és a hozzáférési szabályokat kell létrehozni, a tulajdonosi fiókot pedig ismét azonosítani és TOTP-vel ellátni. Az üzleti rekordok belső kapcsolatait megtartjuk; a régi és új hitelesítési tulajdonos azonosítója külön, ellenőrzött megfeleltetést kap. A fájlok a megfelelő privát területre kerülnek vissza.

A próba akkor sikeres, ha megnyitható egy helyreállított projekt, felmérés és ajánlatverzió, egy számla eredeti PDF-je, egy fotó és egy aláírt jegyzőkönyv; a részfizetések és a jogosultságok is helyesek. A teljes hozzáférési szabályzatot ilyenkor újra ellenőrizni kell, nem elég a rekordok megszámolása.

Az első sikeres visszaállítási próba az éles indulás feltétele. Újabb próba szükséges a mentési formátumot vagy az adatkapcsolatokat érintő jelentős változtatás után. Visszaállításkor legfeljebb az utolsó jó mentésig meglévő adatok állíthatók vissza; a két mentés közötti munka megőrzését nem lehet pusztán a mentési funkció létezéséből garantálni.

### 8.6. Ingyenes Supabase-csomag: ellenőrzött keretek

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

### 8.7. Offline munkavégzés – pontos funkciók

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

### 8.8. Szinkronizálás és ütközések

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

### 8.9. Offline dokumentumok, tárhely és frissítések

Az ajánlat és jegyzőkönyv PDF-je kliensoldalon készülhet, magyar ékezeteket és többoldalas tartalmat is kezelő, helyben elérhető betűkészlettel. A sablonhoz, logóhoz és felhasznált fotóhoz rendelkezésre kell állnia a helyi fájlnak. Hiányzó kötelező elemnél nem készülhet teljesnek látszó végleges dokumentum.

Az ajánlat számozása offline ütközésmentes belső azonosítóból indul. A végleges, ember által olvasható azonosító online kiosztása nem írhatja át a már elküldött PDF tartalmát; az offline kiadott ajánlat is tartós, saját azonosítót kap. A számlaszám ettől teljesen külön adat, azt a Számlázz.hu adja.

A jegyzőkönyv aláírása előtt ugyanaz a tartalom tekinthető át, amelyhez az aláírás kapcsolódik. A helyi dátum és az eszköz időzónája rögzíthető, de az offline időpontot nem nevezzük külső szolgáltató által hitelesített időbélyegnek. Szerkesztés után új verzió kell, a régi aláírás nem használható fel automatikusan.

Az offline fájl mentése és az ügyfélnek való elküldése külön állapot. A megosztás vagy e-mail-küldés elmaradásakor a dokumentum nem jelölhető automatikusan elküldöttnek. A helyi aláírt PDF és a hozzá tartozó adatok a szinkron befejezéséig a titkosított helyi tárban is megmaradnak.

A böngésző tartós tárolási engedélyét kérjük, és becsüljük a rendelkezésre álló helyet. Az engedély vagy elegendő tárhely hiánya látható állapot, nem eltitkolt hiba. A böngésző saját adattörlését, privát módját vagy az eszköz meghibásodását az alkalmazás nem tudja általánosan megakadályozni. Offline munkára a kipróbált normál böngésző/PWA-környezetet használjuk.

Tárhelyhiba esetén a sikertelen írás nem kap sikeres mentési jelzést. A még fel nem töltött fájlokat és műveleteket nem töröljük automatikusan helyfelszabadítás céljából. A már szinkronizált, ismét letölthető példányok és előnézetek takaríthatók ellenőrzött módon.

Friss alkalmazásverzió telepítése nem töltheti újra csendben a szerkesztett űrlapot. A függő műveletsor és a helyi séma migrációját ellenőrizni kell; az éppen futó alkalmazás és a régi tároló együttműködését sem szabad feltételezni teszt nélkül. Hibás frissítésnél a helyi munka megőrzése az elsődleges, nem az automatikus adattár-ürítés.

## 9. Költségek és az éles integráció döntési pontja

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

## 10. Fejlesztési sorrend és elfogadási feltételek

### Jelenlegi tervezési lépés

A tervezési feladat az 1.0 változatban az offline működés, az adatátvétel és az indulási/költségbeállítások kidolgozásával kiegészült. Az első ütemhez számlázási adatlap, külső kiállítás utáni számlarögzítés, PDF-csatolás és kézi fizetéskövetés tartozik. A bejövő számlák részletes működése továbbra is későbbi ütem.

A következő érdemi lépés az első működő alkalmazás megvalósítása a 13. fejezet szerint. A tényleges tulajdonosi e-mail, SMTP, Supabase- és Cloudflare-hozzáférés, a #profi tényleges számlázási díja, valamint a régi adatok ellenőrzött exportja beüzemelési bemenetek. Ezek ismeretlen értékeit nem találtuk ki és nem állítottuk be; az éles átadás feltételeit a 12. fejezet rögzíti. A korábbi kattintható felületterv vizuális irány, mintaadatokkal.

### A belépés és mentés későbbi ellenőrzése

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

### A számlázás alapjainak későbbi ellenőrzése

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

## 11. A régi ERP adatainak átvétele

### 11.1. Az átvétel köre és a forrás állapota

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

### 11.2. Az import folyamata

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

### 11.3. Adatátvétel és fejlesztés elkülönítése

Az alkalmazás fejlesztése elkezdhető valós ügyféladatok nélkül, elkülönített és egyértelműen megjelölt próbaadatokkal. Az éles rendszer induló katalógusa tényleges importból vagy kézi felvitelből készül; mintaárat nem tekintünk a vállalkozás elfogadott árlistájának.

Ha az ellenőrzött régi export csak később érhető el, az új rendszerbe később is beolvasható ugyanilyen előnézetes folyamatban. Ez nem jelenti a régi adatok eldobását. A régi ERP lezárása vagy törlése nem része ennek az előkészítési feladatnak.

## 12. Indulási beállítások és havi költség

### 12.1. Kiválasztott induló felépítés

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

### 12.2. Beüzemelési adatlap

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

### 12.3. Költségterv az első kézi számlázási ütemhez

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

### 12.4. Google Naptár beüzemelési feltételei

A kapcsolat az E-RP saját eseményeire korlátozódik. A Google-hozzáférés naptárengedély, nem az E-RP jelszavas/TOTP-belépésének helyettesítése. A frissítőtoken szerveroldali titok, az alkalmazás csak a szükséges műveletet kéri a saját védett háttérszolgáltatásától.

Az engedélykérés a szükséges legszűkebb jogosultságokat és a tényleges alkalmazáscímet használja. A Google által előírt alkalmazás-ellenőrzési vagy személyes használati feltételeket a valódi Google-projekten kell ellenőrizni; nem állítjuk, hogy bármelyik ellenőrzés már megtörtént.

A Google hivatalos leírása szerint külső, **Testing** állapotú OAuth-alkalmazásnál a naptárhoz kért frissítőtoken hét nap után lejárhat. Az éles átadáskor ezért a publikálási állapotot, a szükséges engedélyeket és az újracsatlakozást is teszteljük. Lejárt vagy visszavont Google-kapcsolat nem veszítheti el az E-RP saját időpontjait; az események helyi kezelése folytatódhat, a külső szinkron állapota látható marad.

A Calendar API 2026. október 23-án olvasott leírása napi projektalapú díjmentes küszöböt és perces kvótákat közöl. Az első egyfelhasználós változat normál használatát jóval ezek alatt tervezzük. Az alkalmazás oldali napi védőkorlát legfeljebb 1 000 Calendar API-hívás, visszavett újrapróbálással és hurok elleni védelemmel; ez saját tervezett korlát, nem a Google szolgáltatói kvótája. A szolgáltatói feltételeket élesítéskor újra ellenőrizni kell.

### 12.5. Éles indulás ellenőrzési sorrendje

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

## 13. Megvalósítási sorrend és a következő lépés

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

