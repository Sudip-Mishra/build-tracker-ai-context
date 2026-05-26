# Oracle EBS Build Tracker

A modern web-based dashboard for tracking Oracle EBS R12.2 RICE objects (Reports, Interfaces, Conversions, Enhancements) with visual progress indicators and detailed object information.

## 🎯 Features

- **Visual Dashboard**: Tile-based layout showing all RICE objects at a glance
- **Progress Tracking**: Color-coded progress bars for each object
- **Search & Filter**: Find objects by file name, resource, status, or type
- **Detailed View**: Click any tile to see complete object details
- **Excel Integration**: Reads data directly from Excel files
- **Real-time Statistics**: Overview of project progress and status distribution
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Excel** or compatible spreadsheet software

To check if Node.js is installed:
```bash
node --version
npm --version
```

## 🚀 Quick Start

### 1. Install Dependencies

Navigate to the backend directory and install required packages:

```bash
cd backend
npm install
```

This will install:
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `xlsx` - Excel file parser

### 2. Prepare Your Excel File

Create an Excel file named `build-tracker.xlsx` in the `data/` directory with the following structure:

**Required Columns:**
- RICE ID
- Object Name
- Object Type
- Progress %
- Status
- Files Used
- Resource Names

**Optional Columns:**
- Description
- Start Date
- Target Date

See `schema/excel-template-guide.md` for detailed Excel structure and sample data.

### 3. Start the Server

From the backend directory:

```bash
npm start
```

The server will start on `http://localhost:3000`

### 4. Access the Dashboard

Open your web browser and navigate to:
```
http://localhost:3000
```

## 📁 Project Structure

```
build-tracker/
├── backend/
│   ├── server.js           # Express server
│   ├── excelParser.js      # Excel file parser
│   ├── config.js           # Configuration
│   └── package.json        # Dependencies
├── frontend/
│   ├── index.html          # Main dashboard page
│   ├── styles.css          # Styling
│   └── app.js              # Frontend logic
├── data/
│   └── build-tracker.xlsx  # Your Excel file (create this)
├── schema/
│   ├── build-tracker-schema.jsonld
│   ├── excel-template-guide.md
│   └── sample-data-oracle-ebs.jsonld
└── README.md
```

## 📊 Excel File Setup

### Step 1: Create the Excel File

1. Create a new Excel file
2. Name it `build-tracker.xlsx`
3. Save it in the `data/` directory

### Step 2: Add Column Headers

In the first row, add these column headers:

| RICE ID | Object Name | Object Type | Progress % | Status | Files Used | Resource Names | Description | Start Date | Target Date |
|---------|-------------|-------------|------------|--------|------------|----------------|-------------|------------|-------------|

### Step 3: Add Your Data

Example row:
```
R-001 | iProcurement Requisition Status Report | REPORT | 75 | IN_PROGRESS | XXPO_IPROC_REQ_STATUS_RPT.rdf, XXPO_IPROC_REQ_STATUS_PKG.pks | Rajesh Kumar, Priya Sharma | Custom report showing requisition status | 2026-04-01 | 2026-05-30
```

### Valid Status Values

- `NOT_STARTED`
- `IN_PROGRESS`
- `ON_HOLD`
- `BLOCKED`
- `IN_REVIEW`
- `TESTING`
- `COMPLETED`
- `DEPLOYED`

### Valid Object Types

- `REPORT`
- `INTERFACE`
- `CONVERSION`
- `ENHANCEMENT`

## 🔧 Configuration

Edit `backend/config.js` to customize:

### Change Excel File Location
```javascript
excel: {
  filePath: '../data/your-file.xlsx',  // Change this path
  sheetName: 'RICE Objects'            // Change sheet name if needed
}
```

### Change Server Port
```javascript
server: {
  port: 3000,  // Change to your preferred port
  host: 'localhost'
}
```

## 🎨 Using the Dashboard

### Main Features

1. **Refresh Data**: Click the "Refresh Data" button to reload from Excel
2. **Search**: Enter file name, resource name, or RICE ID in the search box
3. **Filter**: Use dropdown filters to show specific statuses or types
4. **View Details**: Click any tile to see complete object information
5. **Statistics**: View overall project statistics at the top

### Tile Information

Each tile displays:
- RICE ID (e.g., R-001, I-002)
- Object Name
- Object Type badge
- Current Status
- Number of files used
- Number of resources assigned
- Progress bar with percentage

### Color Coding

**Progress Bars:**
- 🔴 Red (0-29%): Needs attention
- 🟡 Yellow (30-69%): In progress
- 🟢 Green (70-100%): Near completion

**Status Badges:**
- Gray: Not Started
- Blue: In Progress
- Yellow: On Hold
- Red: Blocked
- Cyan: In Review
- Orange: Testing
- Green: Completed
- Teal: Deployed

## 🔍 API Endpoints

The backend provides these REST API endpoints:

### GET /api/health
Health check endpoint
```bash
curl http://localhost:3000/api/health
```

### GET /api/builds
Get all RICE objects
```bash
curl http://localhost:3000/api/builds
```

### GET /api/builds/:riceId
Get specific object by RICE ID
```bash
curl http://localhost:3000/api/builds/R-001
```

### POST /api/refresh
Force refresh data from Excel
```bash
curl -X POST http://localhost:3000/api/refresh
```

### GET /api/search?q=query
Search objects
```bash
curl http://localhost:3000/api/search?q=XXPO
```

### GET /api/statistics
Get project statistics
```bash
curl http://localhost:3000/api/statistics
```

## 🐛 Troubleshooting

### Excel File Not Found

**Error:** `Excel file not found at: ../data/build-tracker.xlsx`

**Solution:**
1. Create the `data/` directory if it doesn't exist
2. Ensure your Excel file is named correctly
3. Check the path in `backend/config.js`

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
1. Change the port in `backend/config.js`
2. Or stop the process using port 3000

### No Data Showing

**Possible Causes:**
1. Excel file is empty
2. Column names don't match exactly
3. Sheet name is different

**Solution:**
1. Check Excel file has data
2. Verify column names match the template
3. Update `sheetName` in config if needed

### npm install fails

**Solution:**
1. Ensure Node.js is installed: `node --version`
2. Delete `node_modules` folder and `package-lock.json`
3. Run `npm install` again
4. Check internet connection

## 📝 Sample Data

See `schema/sample-data-oracle-ebs.jsonld` for complete sample data with 5 Oracle EBS objects:

1. **R-001**: iProcurement Requisition Status Report
2. **I-002**: PO to External Vendor System Interface
3. **C-003**: Legacy Supplier Data Migration
4. **E-004**: Custom Account Generator for PO
5. **E-005**: Custom AP Invoice Validation Rules

## 🔄 Updating Data

### Daily Workflow

1. Update your Excel file with latest progress
2. Open the dashboard in your browser
3. Click "Refresh Data" button
4. View updated tiles and statistics

### Automated Refresh (Optional)

Uncomment the last line in `frontend/app.js` to enable auto-refresh every 5 minutes:

```javascript
// Auto-refresh every 5 minutes
setInterval(loadData, 5 * 60 * 1000);
```

## 🚀 Advanced Features

### Context Studio Integration (Future)

The schema is designed to integrate with IBM Context Studio for:
- Semantic queries
- AI-powered insights
- Dependency analysis
- Predictive analytics

See `schema/README.md` for details on the semantic schema.

### Custom Styling

Edit `frontend/styles.css` to customize:
- Colors (CSS variables at top of file)
- Tile sizes
- Fonts
- Layout

## 📚 Additional Documentation

- **Excel Template Guide**: `schema/excel-template-guide.md`
- **Schema Documentation**: `schema/README.md`
- **Sample Data**: `schema/sample-data-oracle-ebs.jsonld`

## 🤝 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the Excel template guide
3. Verify your Excel file structure matches the template

## 📄 License

MIT License - Feel free to use and modify for your organization.

## 🎉 Getting Started Checklist

- [ ] Install Node.js and npm
- [ ] Clone/download the project
- [ ] Run `npm install` in backend directory
- [ ] Create `data/` directory
- [ ] Create `build-tracker.xlsx` with your data
- [ ] Run `npm start` in backend directory
- [ ] Open `http://localhost:3000` in browser
- [ ] Click "Refresh Data" to load your Excel file
- [ ] Start tracking your Oracle EBS build objects!

---

**Built with ❤️ for Oracle EBS Development Teams**