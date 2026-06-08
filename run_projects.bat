@echo off
echo Starting all projects...

:: Start Spring Boot Backend
cd /d "%~dp0demo"
start cmd /k "gradlew bootrun"

:: Start Node/Frontend project
cd /d "%~dp0meetings"
start cmd /k "npm run dev"

:: Start Flutter Android TV App
cd /d "%~dp0android_tv"
start cmd /k "flutter run"

echo All projects are running in separate windows!