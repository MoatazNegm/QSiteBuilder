---
description: Restart the full QuickStor stack (Backend, Admin, Live Frontend, Staging Preview)
---

This workflow restarts all 4 components of the QuickStor application on their designated ports.

1. Terminate existing Node.js processes to clear ports 3000, 5173, and 5176.
// turbo
```powershell
taskkill /F /IM node.exe
```

2. Start the Backend Service (Port 3000)
// turbo
```powershell
start /B cmd /c "cd C:\Users\Moata\OneDrive\Documents\QuickStor\quickstor-backend && npm start"
```

3. Start the Admin Panel (Port 5173)
// turbo
```powershell
start /B cmd /c "cd C:\Users\Moata\OneDrive\Documents\QuickStor\quickstor-admin && npm run dev"
```

4. Start the Staging Preview (Port 5176)
// turbo
```powershell
start /B cmd /c "cd C:\Users\Moata\OneDrive\Documents\QuickStor\quickstor-frontend && npm run staging"
```

5. Start the Live Frontend (Port 5174+)
// turbo
```powershell
start /B cmd /c "cd C:\Users\Moata\OneDrive\Documents\QuickStor\quickstor-frontend && npm run dev"
```

6. Wait for services to initialize
// turbo
```powershell
timeout /t 5
```
