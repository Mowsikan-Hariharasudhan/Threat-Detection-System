@echo off
echo Starting Backend Server...
start "Backend Server" cmd /k "python server.py"

echo Starting Frontend...
cd frontend
start "Frontend" cmd /k "npm run dev"

echo System Started!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5000
