---
description: Restart the QuickStor stack in Single-Port Production Mode (Port 3000)
---

This workflow rebuilds the application and starts the backend server, serving all components (Admin, Staging, Live) from a single port (3000).

1. Terminate existing Node.js processes.
// turbo
```powershell
taskkill /F /IM node.exe
```

2. Build all projects (Admin & Staging are built to backend/public)
// turbo
```powershell
node build-all.js
```

3. Start the Backend Server (Port 3000)
// turbo
```powershell
start /B cmd /c "cd C:\Users\Moata\OneDrive\Documents\QuickStor\quickstor-backend && node index.js"
```

4. Wait for services to initialize
// turbo
```powershell
timeout /t 5
```
