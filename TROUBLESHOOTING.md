# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### ❌ Error: "Could not read package.json: ENOENT"

**Full Error:**
```
npm error code ENOENT
npm error syscall open
npm error path C:\Users\YourName\package.json
npm error errno -4058
npm error enoent Could not read package.json
```

**Cause:** You're running `npm start` from the wrong directory.

**Solution:**

1. **Navigate to the project directory first:**
   ```powershell
   cd C:\Users\SudipMishra\Documents\build-tracker-ai-context
   ```

2. **Then navigate to the backend folder:**
   ```powershell
   cd backend
   ```

3. **Now run npm install and start:**
   ```powershell
   npm install
npm start
   ```

**Quick Fix - One Command:**
```powershell
cd C:\Users\SudipMishra\Documents\build-tracker-ai-context\backend; npm install; npm start
```

---

### ❌ Error: "npm is not recognized"

**Cause:** Node.js is not installed or not in your PATH.

**Solution:**

1. Download Node.js from: https://nodejs.org/
2. Install it (choose LTS version)
3. **Restart PowerShell** (important!)
4. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

---

### ❌ Error: "Excel file not found"

**Full Error:**
```
Excel file not found at: ../data/build-tracker.xlsx
```

**Solution:**

**Option 1: Create from CSV**
1. Open Excel
2. Open file: `data/sample-build-tracker.csv`
3. Save As → `data/build-tracker.xlsx` (Excel Workbook format)

**Option 2: Create manually**
1. Create new Excel file
2. Add column headers (see QUICKSTART.md)
3. Add your data
4. Save as `data/build-tracker.xlsx`

**Option 3: Change config to use CSV**
Edit `backend/config.js`:
```javascript
excel: {
  filePath: '../data/sample-build-tracker.csv',  // Change to .csv
  // ... rest of config
}
```

---

### ❌ Error: "Port 3000 already in use"

**Full Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Cause:** Another application is using port 3000.

**Solution 1: Use different port**
Edit `backend/config.js`:
```javascript
server: {
  port: 3001,  // Change from 3000 to 3001
  host: 'localhost'
}
```

**Solution 2: Stop the other application**
Find and stop the process using port 3000:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

---

### ❌ Dashboard shows "No Objects Found"

**Possible Causes:**
1. Excel file is empty
2. Column names don't match
3. Wrong sheet name

**Solution:**

1. **Check Excel has data:**
   - Open your Excel file
   - Verify it has rows beyond the header

2. **Verify column names match exactly:**
   ```
   RICE ID | Object Name | Object Type | Progress % | Status | Files Used | Resource Names
   ```
   (Case-sensitive, spaces matter!)

3. **Check sheet name:**
   - Default is "Sheet1" or "RICE Objects"
   - Update `backend/config.js` if different:
   ```javascript
   excel: {
     sheetName: 'Your Sheet Name',  // Update this
   }
   ```

4. **Click "Refresh Data" button** in the dashboard

---

### ❌ Error: "Cannot find module 'express'"

**Cause:** Dependencies not installed.

**Solution:**
```powershell
cd backend
npm install
```

Wait for installation to complete, then:
```powershell
npm start
```

---

### ❌ Browser shows "Cannot GET /"

**Cause:** Server is not running or wrong URL.

**Solution:**

1. **Check server is running:**
   - Look for "Server running at http://localhost:3000" message
   - If not, run `npm start` in backend directory

2. **Use correct URL:**
   - Should be: `http://localhost:3000`
   - NOT: `http://localhost:3000/index.html`

3. **Check firewall:**
   - Windows Firewall might be blocking
   - Allow Node.js when prompted

---

### ❌ Data not updating after Excel changes

**Solution:**

1. **Click "Refresh Data" button** in the dashboard
2. If that doesn't work, restart the server:
   - Press `Ctrl+C` in PowerShell to stop
   - Run `npm start` again

---

## 📍 Correct Directory Structure

Your project should be at:
```
C:\Users\SudipMishra\Documents\build-tracker-ai-context\
├── backend\
│   ├── server.js
│   ├── package.json
│   └── ...
├── frontend\
│   ├── index.html
│   └── ...
├── data\
│   └── build-tracker.xlsx
└── README.md
```

## ✅ Step-by-Step Startup Checklist

1. **Open PowerShell**
   - Press `Win + X`, choose "Windows PowerShell"

2. **Navigate to project:**
   ```powershell
   cd C:\Users\SudipMishra\Documents\build-tracker-ai-context
   ```

3. **Go to backend:**
   ```powershell
   cd backend
   ```

4. **Install dependencies (first time only):**
   ```powershell
   npm install
   ```

5. **Start server:**
   ```powershell
   npm start
   ```

6. **Open browser:**
   - Go to: http://localhost:3000

7. **Load data:**
   - Click "Refresh Data" button

## 🎯 Quick Commands Reference

**From project root directory:**
```powershell
# Install and start (first time)
cd backend
npm install
npm start

# Start server (subsequent times)
cd backend
npm start

# Stop server
Ctrl+C
```

**From anywhere:**
```powershell
# One-liner to start
cd C:\Users\SudipMishra\Documents\build-tracker-ai-context\backend; npm start
```

## 🆘 Still Having Issues?

### Check These:

1. **Node.js installed?**
   ```powershell
   node --version
   npm --version
   ```
   Should show version numbers (e.g., v18.x.x)

2. **In correct directory?**
   ```powershell
   pwd
   ```
   Should show: `...\build-tracker-ai-context\backend`

3. **package.json exists?**
   ```powershell
   dir package.json
   ```
   Should show the file

4. **Excel file exists?**
   ```powershell
   dir ..\data\build-tracker.xlsx
   ```
   Should show the file

### Get Help:

1. Check the full error message
2. Look for the specific error in this guide
3. Verify all prerequisites are met
4. Try the "Clean Start" below

## 🔄 Clean Start (Reset Everything)

If nothing works, try this:

```powershell
# 1. Navigate to project
cd C:\Users\SudipMishra\Documents\build-tracker-ai-context

# 2. Go to backend
cd backend

# 3. Remove old installations
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue

# 4. Fresh install
npm install

# 5. Start server
npm start
```

## 📞 Success Indicators

When everything is working, you should see:

**In PowerShell:**
```
==================================================
Build Tracker Backend Server
==================================================
Server running at http://localhost:3000
Frontend: http://localhost:3000
API: http://localhost:3000/api
Excel file: ../data/build-tracker.xlsx
==================================================
```

**In Browser:**
- Dashboard loads
- Statistics show numbers
- Tiles display your objects
- Clicking tiles opens details

---

**If you're still stuck, double-check you're in the right directory!** 
Most issues come from running commands in the wrong folder. 😊