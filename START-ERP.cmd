@echo off
setlocal
cd /d "%~dp0"
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.12 vagy ujabb szukseges. Telepitsd, majd inditsd ujra ezt az ablakot.
  pause
  exit /b 1
)
if not exist package-lock.json (
  echo Hianyzik a package-lock.json. A teljes ZIP-et csomagold ki.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 goto failed
)
call npm.cmd run build
if errorlevel 1 goto failed
echo.
echo Bongeszoben: http://127.0.0.1:5173
echo Az ablak maradjon nyitva. Leallitas: Ctrl+C.
call npm.cmd run preview -- --host 127.0.0.1 --port 5173 --strictPort
if errorlevel 1 goto failed
exit /b 0
:failed
echo.
echo Az inditas megallt. A fenti hibauzenetet masold ki.
echo Ha az 5173 port foglalt, a korabbi szervert allitsd le Ctrl+C-vel.
pause
exit /b 1
