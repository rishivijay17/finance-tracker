@echo off
title Finance Tracker - Starting...
color 0A
cls

echo.
echo  +--------------------------------------------------+
echo  ^|         Finance Tracker is starting...          ^|
echo  +--------------------------------------------------+
echo.

echo  [1/3] Starting backend server (FastAPI + Uvicorn)...
start "Finance Tracker - Backend" cmd /k "cd /d "%~dp0backend" && (if exist venv\Scripts\activate.bat call venv\Scripts\activate) && uvicorn main:app --reload --port 8000"

timeout /t 1 /nobreak > nul

echo  [2/3] Starting frontend (React + Vite)...
start "Finance Tracker - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo  [3/3] Waiting 5 seconds for services to boot...
timeout /t 5 /nobreak > nul

echo  Opening Finance Tracker in your default browser...
start http://localhost:5173

echo.
echo  +--------------------------------------------------+
echo  ^|  Finance Tracker is running!                    ^|
echo  ^|                                                  ^|
echo  ^|  Backend:   http://localhost:8000               ^|
echo  ^|  Frontend:  http://localhost:5173               ^|
echo  +--------------------------------------------------+
echo.
echo  Close the Backend and Frontend windows to stop the app.
echo  Press any key to close this launcher window.
echo.
pause > nul
