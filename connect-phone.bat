@echo off
title NUFOTEC - Connexion Expo Go par USB
echo.
echo ================================================
echo   NUFOTEC - Connexion Expo Go via USB (ADB)
echo ================================================
echo.
echo  1. Branchez le telephone au PC avec un cable USB
echo  2. Sur le telephone: activez "Debogage USB"
echo     (Parametres > Options developpeur > Debogage USB)
echo  3. Acceptez la demande d'autorisation sur le telephone
echo.
"C:\Users\Dell\AppData\Local\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081
if %errorlevel% equ 0 (
  echo.
  echo  SUCCES ! Maintenant dans Expo Go, tapez :
  echo.
  echo    exp://localhost:8081
  echo.
  echo  La connexion passe par le cable USB : plus besoin du WiFi.
) else (
  echo.
  echo  ECHEC. Verifiez le cable USB et le debogage USB.
)
pause
