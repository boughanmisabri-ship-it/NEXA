@echo off
chcp 65001 >nul
title NEXA - serveur
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js n'est pas installe. Installe la version LTS depuis https://nodejs.org puis relance ce fichier.
  pause
  exit /b
)
for /f %%v in ('node -p "process.versions.node.split('.')[0]"') do set MAJ=%%v
if %MAJ% LSS 22 (
  echo Ton Node est trop ancien. Installe Node 22 ou plus depuis https://nodejs.org puis relance ce fichier.
  pause
  exit /b
)
set NEXA_DEV_CODES=1
set NEXA_THRESHOLD=60
set NEXA_ADMIN_TOKEN=nexa-admin-%RANDOM%%RANDOM%%RANDOM%%RANDOM%
echo.
echo ===============================================================
echo  NEXA demarre sur http://localhost:3000
echo  Page de moderation : http://localhost:3000/admin
echo  Jeton administrateur (a noter) : %NEXA_ADMIN_TOKEN%
echo  Laisse cette fenetre OUVERTE tant que tes amis testent.
echo ===============================================================
echo.
node --no-warnings src\index.js
pause
