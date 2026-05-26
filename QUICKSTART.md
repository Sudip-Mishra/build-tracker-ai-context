# 🚀 Quick Start Guide - Build Tracker

Get your Build Tracker up and running in 5 minutes!

## Prerequisites Check

Open PowerShell or Command Prompt and run:

```powershell
node --version
npm --version
```

**If you see version numbers** (e.g., v18.x.x), you're good to go! Skip to Step 2.

**If you get an error**, you need to install Node.js:
1. Download from: https://nodejs.org/ (choose LTS version)
2. Run the installer
3. Restart your terminal
4. Run the version check again

## Step 1: Install Dependencies

Open PowerShell/Command Prompt in the project directory:

```powershell
cd backend
npm install
```

Wait for installation to complete (1-2 minutes).

## Step 2: Prepare Your Excel File

### Option A: Use Sample Data (Fastest)

1. Open Excel
2. Open the file: `data/sample-build-tracker.csv`
3. Save it as: `data/build-tracker.xlsx` (Excel format)

### Option B: Create Your Own

1. Create a new Excel file
2. Add these column headers in row 1:
   ```
   RICE ID | Object Name | Object Type | Progress % | Status | Files Used | Resource Names | Description | Start Date | Target Date
   ```
3. Add your Oracle EBS objects (one per row)
4. Save as: `data/build-tracker.xlsx`

**Valid Status Values:**
- NOT_STARTED
- IN_PROGRESS
- ON_HOLD
- BLOCKED
- IN_REVIEW
- TESTING
- COMPLETED
- DEPLOYED

**Valid Object Types:**
- REPORT
- INTERFACE
- CONVERSION
- ENHANCEMENT

## Step 3: Start the Server

From the backend directory:

```powershell
npm start
```

You should see:
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

## Step 4: Open the Dashboard

1. Open your web browser
2. Go to: **http://localhost:3000**
3. Click the **"Refresh Data"** button
4. See your RICE objects displayed as tiles!

## 🎉 You're Done!

### What You Can Do Now:

✅ **View All Objects**: See all your RICE objects in a tile layout
✅ **Check Progress**: Color-coded progress bars show status at a glance
✅ **Search**: Find objects by file name, resource, or RICE ID
✅ **Filter**: Filter by status (Blocked, In Progress, etc.) or type
✅ **View Details**: Click any tile to see complete information
✅ **Update Data**: Modify Excel, click "Refresh Data" to reload

### Tips:

- **Update Excel**: Edit your Excel file anytime, then click "Refresh Data"
- **Search Files**: Type a file name (e.g., "XXPO_CUSTOM") to find which objects use it
- **Filter Status**: Use the dropdown to show only "BLOCKED" or "IN_PROGRESS" objects
- **Mobile Friendly**: Open on your phone or tablet - it works everywhere!

## 🐛 Troubleshooting

### "Excel file not found"
- Make sure `build-tracker.xlsx` exists in the `data/` folder
- Check the file name is exactly `build-tracker.xlsx`

### "Port 3000 already in use"
- Another app is using port 3000
- Edit `backend/config.js` and change `port: 3000` to `port: 3001`
- Restart the server

### "No data showing"
- Click the "Refresh Data" button
- Check your Excel file has data rows (not just headers)
- Verify column names match exactly (case-sensitive)

### "npm is not recognized"
- Node.js is not installed or not in PATH
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

## 📝 Next Steps

1. **Add Your Real Data**: Replace sample data with your actual Oracle EBS objects
2. **Customize**: Edit `frontend/styles.css` to match your company colors
3. **Share**: Share the URL with your team (http://your-computer-ip:3000)
4. **Explore**: Check out the full README.md for advanced features

## 🆘 Need Help?

- **Full Documentation**: See `README.md`
- **Excel Template**: See `schema/excel-template-guide.md`
- **Sample Data**: See `data/sample-build-tracker.csv`

---

**Happy Tracking! 🎯**