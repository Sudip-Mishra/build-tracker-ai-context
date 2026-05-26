# Testing Guide - How to Test Context Studio Integration

## Prerequisites

✅ Repository made public  
✅ GitHub connector configured in Context Studio  
✅ Node.js installed  

## Step-by-Step Testing Instructions

### Step 1: Open Two Terminal Windows

You'll need **two separate terminal/command prompt windows**:
- **Terminal 1**: For running the backend server
- **Terminal 2**: For running test commands

### Step 2: Start the Backend Server (Terminal 1)

**Open PowerShell or Command Prompt:**
- Press `Windows Key + R`
- Type `powershell` or `cmd`
- Press Enter

**Navigate to your project and start the server:**
```powershell
# Navigate to the project directory
cd C:\Users\SudipMishra\Documents\build-tracker-ai-context\backend

# Install dependencies (first time only)
npm install

# Start the server
npm start
```

**Expected Output:**
```
Server running on http://localhost:3000
Context Studio MCP client initialized
```

**Keep this terminal window open!** The server must stay running.

---

### Step 3: Run Test Commands (Terminal 2)

**Open a SECOND PowerShell or Command Prompt window:**
- Press `Windows Key + R` again
- Type `powershell` or `cmd`
- Press Enter

**Navigate to the project directory:**
```powershell
cd C:\Users\SudipMishra\Documents\build-tracker-ai-context
```

Now run the test commands one by one:

#### Test 1: Upload Schema

**Use this PowerShell command:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/context-studio/upload-schema" -Method Post
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Schema uploaded and ingestion triggered",
  "contextId": "ctx_0285e494930b",
  "file": "context-exports/schema/build-tracker-schema.jsonld"
}
```

**What happens:**
1. Schema file is written to `context-exports/schema/`
2. Changes are committed to Git
3. Changes are pushed to GitHub
4. Context Studio is notified to ingest the file

---

#### Test 2: Upload Data

**Use this PowerShell command:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/context-studio/upload-data" -Method Post
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Data uploaded and ingestion triggered",
  "contextId": "ctx_0285e494930b",
  "file": "context-exports/data/rice-objects-2026-05-26T14-30-00-000Z.jsonld",
  "count": 25
}
```

**What happens:**
1. Data file is written to `context-exports/data/`
2. Changes are committed to Git
3. Changes are pushed to GitHub
4. Context Studio is notified to ingest the file

---

#### Test 3: Wait for Indexing

**IMPORTANT:** Wait 2-3 minutes for Context Studio to:
- Detect the new files in GitHub
- Download and parse the files
- Extract entities and relationships
- Index data in vector and graph databases

You can check the progress in Context Studio:
1. Go to Context Studio web interface
2. Navigate to your connector
3. Check "Recent Ingestions" or "Activity Log"

---

#### Test 4: Query the Data

**Use this PowerShell command to see the full answer:**
```powershell
$body = @{
    question = "Show me all RICE objects"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/context-studio/query" -Method Post -Body $body -ContentType "application/json"

# Display the full answer (not truncated)
Write-Host "`nSuccess: $($response.success)" -ForegroundColor Green
Write-Host "`nQuestion: $($response.question)" -ForegroundColor Cyan
Write-Host "`nAnswer:" -ForegroundColor Yellow
Write-Host $response.answer
Write-Host "`nContext ID: $($response.contextId)" -ForegroundColor Gray
```

**Expected Output:**
```
Success: True

Question: Show me all RICE objects

Answer:
**REPORT-001 - Customer Report** (relevance: 95%)
RICE Object: REPORT-001
Name: Customer Report
Type: bt:Report
Status: bt:In Progress
Progress: 75%
...

Context ID: ctx_0285e494930b
```

**Alternative - Save to variable and access properties:**
```powershell
$body = @{ question = "Show me all RICE objects" } | ConvertTo-Json
$result = Invoke-RestMethod -Uri "http://localhost:3000/api/context-studio/query" -Method Post -Body $body -ContentType "application/json"

# Access individual properties
$result.success    # True
$result.question   # Show me all RICE objects
$result.answer     # Full answer text
$result.contextId  # ctx_0285e494930b
```

---

## Alternative: Using the Web Interface

Instead of curl commands, you can also test using your web browser:

### 1. Start the Server (Terminal 1)
```powershell
cd C:\Users\SudipMishra\Documents\build-tracker-ai-context\backend
npm start
```

### 2. Open the Web App
- Open your browser
- Go to: http://localhost:3000
- Or open: `C:\Users\SudipMishra\Documents\build-tracker-ai-context\frontend\index.html`

### 3. Use the Web Interface
- Click "Upload to Context Studio" button
- Wait 2-3 minutes
- Type a question in the chat box
- Click "Send" or press Enter

---

## Troubleshooting

### Issue: "curl: command not found"

**Solution 1 - Use PowerShell's Invoke-RestMethod:**
```powershell
# Upload Schema
Invoke-RestMethod -Uri "http://localhost:3000/api/context-studio/upload-schema" -Method Post

# Upload Data
Invoke-RestMethod -Uri "http://localhost:3000/api/context-studio/upload-data" -Method Post

# Query
$body = @{ question = "Show me all RICE objects" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/context-studio/query" -Method Post -Body $body -ContentType "application/json"
```

**Solution 2 - Install curl for Windows:**
- Download from: https://curl.se/windows/
- Or use Git Bash (comes with Git)

### Issue: "Cannot connect to localhost:3000"

**Check:**
1. Is the backend server running in Terminal 1?
2. Look for "Server running on http://localhost:3000" message
3. Try restarting the server

### Issue: "No results from query"

**Solutions:**
1. Wait 2-3 more minutes for indexing
2. Check Context Studio ingestion logs
3. Verify files were pushed to GitHub
4. Try uploading again

### Issue: "Git push failed"

**Check:**
1. Are you logged into Git?
2. Run: `git config --global user.name "Your Name"`
3. Run: `git config --global user.email "your.email@example.com"`

---

## Quick Reference

### Terminal 1 (Server)
```powershell
cd C:\Users\SudipMishra\Documents\build-tracker-ai-context\backend
npm start
# Keep running!
```

### Terminal 2 (Tests - PowerShell Commands)
```powershell
cd C:\Users\SudipMishra\Documents\build-tracker-ai-context

# Test 1: Upload Schema
Invoke-RestMethod -Uri "http://localhost:3000/api/context-studio/upload-schema" -Method Post

# Test 2: Upload Data
Invoke-RestMethod -Uri "http://localhost:3000/api/context-studio/upload-data" -Method Post

# Wait 2-3 minutes...

# Test 3: Query
$body = @{ question = "Show me all RICE objects" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/context-studio/query" -Method Post -Body $body -ContentType "application/json"
```

---

## Success Checklist

- [ ] Terminal 1: Server running without errors
- [ ] Terminal 2: Schema upload successful
- [ ] Terminal 2: Data upload successful
- [ ] GitHub: New files visible in `context-exports/` directory
- [ ] Context Studio: Ingestion logs show "Completed"
- [ ] Terminal 2: Query returns results with RICE objects

---

**Need Help?** See [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) for more solutions.