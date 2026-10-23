# Tulajdonosi hozzáférés és helyreállítás — 0.2.0

Külön kezelendő az alkalmazás Supabase Auth-fiókja, a Supabase kezelőfelület üzemeltetői fiókja, a helyi adattár feloldó jelszava és a mentési jelszó. Egyik sem helyettesíti a másikat. Az üzemeltetői fiókhoz is külön, biztonságosan őrzött tartalék hitelesítő kell.

## Indulás előtt

1. A valódi tulajdonosi e-mailen érkezzen meg és legyen kipróbálva a helyreállító levél. Ellenőrizni kell a Site URL és az engedélyezett redirect beállításokat, a feladót és az SMTP-kézbesítést.
2. A normál TOTP után a Beállítások / Fiók alatt vegyél fel külön eszközön tartalék TOTP-t. Ehhez a működő hitelesítő friss kódja és az új hitelesítő kódellenőrzése is szükséges. A QR-t és a titkot ne tedd az üzleti mentés mellé.
3. Készíts titkosított üzleti mentést. Olvasd vissza a ténylegesen letöltött fájlt, állítsd vissza elkülönített próbaadattárba, nyiss meg projektet és eredeti PDF-et is.
4. Rögzítsd saját biztonságos helyen a projekt és az üzemeltető azonosításához szükséges adatokat. Adminisztrátori titkot ne másolj az alkalmazás konfigurációjába.

## Elfelejtett alkalmazásjelszó

Az online belépési felületen kérhető helyreállító levél. A hivatkozás a beállított alkalmazáscímre tér vissza, ahol új jelszó adható meg. A jelszócsere nem kerüli meg az üzleti adatok AAL2/TOTP követelményét. Hibás, lejárt és ismét felhasznált hivatkozást a saját projektben is próbálni kell. A jelen csomaghoz nincs élő SMTP-kézbesítési eredmény.

## Elveszett telefon, működő tartalék hitelesítő

Belépéskor válaszd a tartalék hitelesítőt. Az elveszett eszköz hitelesítőjének törlése üzemeltetői feladat; a felület jelenleg felvételt és kódellenőrzést ad, önkiszolgáló hitelesítőtörlést nem. Ellenőrzött belépés után új tartalékot kell készíteni. Az ellopott eszköz és munkamenetek kezelését külön végezd el a Supabase Auth felügyeletén.

## Minden alkalmazásos hitelesítő elveszett

Az alkalmazásban nincs TOTP-megkerülés vagy univerzális helyreállító kód. A külön védett Supabase üzemeltetői hozzáférésből, a tulajdonos személyének és pontos Auth UUID-jának ellenőrzése után, a Supabase támogatott adminisztrációs MFA-folyamatával lehet a hozzáférést helyreállítani. Ez kizárólag védett üzemeltetői környezetben végezhető. Adminisztrátori kulcs nem kerülhet a böngészőbe. Az RLS/AAL2 szabályt a helyreállítás kedvéért sem szabad kikapcsolni, a vállalkozás tulajdonosát sem kell átírni.

A helyreállítás után új TOTP és külön tartalék hitelesítő szükséges, majd ellenőrizni kell, hogy AAL1 munkamenettel továbbra sincs üzleti hozzáférés. A korábbi munkamenetek visszavonását és lejárását is ellenőrizni kell; egy már kiadott JWT nem feltétlenül válik azonnal érvénytelenné. Az eljárást élesítés előtt elkülönített próbatulajdonoson végre kell hajtani. Ebben a csomagban nincs élő adminisztrátori helyreállítási próba.

## Helyi feloldó vagy mentési jelszó elveszett

A helyi AES-kulcsot és a mentési kulcsot a megadott jelszó származtatja. Nincs hátsó kulcs vagy jelszó-visszaállítás. A szerverre már sikeresen feltöltött adatok új, engedélyezett eszközre letölthetők. A csak helyi, fel nem töltött munkát a helyi jelszó nélkül nem lehet visszafejteni. A mentési fájl csak a saját külön jelszavával nyitható.

A régi adattárat ne töröld egy sikertelen belépés vagy szinkronhiba miatt. Előbb azonosítsd a pontos címet, portot, profilt és kiválasztott adattárat. A visszaállítás új adattárat készít, az eredetit megtartja.
