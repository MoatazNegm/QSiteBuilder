@echo off
taskkill /F /IM node.exe
start /B cmd /c "cd quickstor-backend && npm start"
start /B cmd /c "cd quickstor-admin && npm run dev"
start /B cmd /c "cd quickstor-frontend && npm run staging"
start /B cmd /c "cd quickstor-frontend && npm run dev"
timeout /t 5
