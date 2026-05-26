# Context Studio - Quick Setup Reference

## 🚀 3-Minute Setup Guide

### Step 1: Create GitHub Token (2 minutes)

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Settings:
   - Note: `Context Studio - Build Tracker`
   - Expiration: 90 days
   - Scopes: ☑️ `repo` (Full control of private repositories)
4. Click **"Generate token"**
5. **Copy the token** (format: `ghp_xxxxxxxxxxxx...`)

### Step 2: Configure Context Studio (2 minutes)

1. Login to Context Studio
2. Navigate to your context: **Build Tracker Context** (`ctx_0285e494930b`)
3. Go to **"Sources"** or **"Connectors"**
4. Click **"Add New Connector"**
5. Select **"GitHub"** from dropdown
6. Select **"Private"** radio button (not Public)
7. Fill in the following fields:
   ```
   Base URL: https://api.github.com
   Org: Sudip-Mishra
   Access Token: [paste your token from Step 1]
   ```
8. Click **"Enter Github Credentials to load Repositories"** button
9. Wait for repositories to load (may take 5-10 seconds)
10. From **"Select Github Repositories"** dropdown, select:
    ```
    build-tracker-ai-context
    ```
11. Check **"Re-ingestion Required"**: ☑️ Checked
12. Click **"Save"**
13. Verify status shows **"Active"** or **"Connected"**

### Step 3: Test It! (5 minutes)

```bash
# 1. Start server
cd backend
npm start

# 2. Upload schema (in another terminal)
curl -X POST http://localhost:3000/api/context-studio/upload-schema

# 3. Upload data
curl -X POST http://localhost:3000/api/context-studio/upload-data

# 4. Wait 2-3 minutes for indexing

# 5. Query
curl -X POST http://localhost:3000/api/context-studio/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me all RICE objects"}'
```

## ✅ Success Checklist

- [ ] GitHub token created with `repo` scope
- [ ] GitHub connector added in Context Studio
- [ ] Connector status shows "Active"
- [ ] Schema uploaded successfully
- [ ] Data uploaded successfully
- [ ] Files visible in `context-exports/` directory
- [ ] Git commits and pushes working
- [ ] Query returns results

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Repository not found" | Check token has `repo` scope |
| "Authentication failed" | Regenerate token, update in Context Studio |
| "No results from query" | Wait 2-3 minutes for indexing |
| "Git push failed" | Check Git credentials configured |

## 📚 Full Documentation

- **Detailed Setup**: [`CONTEXT-STUDIO-SETUP.md`](CONTEXT-STUDIO-SETUP.md)
- **Implementation Plan**: [`CONTEXT-STUDIO-IMPLEMENTATION-PLAN.md`](CONTEXT-STUDIO-IMPLEMENTATION-PLAN.md)
- **Complete Summary**: [`CONTEXT-STUDIO-INTEGRATION-SUMMARY.md`](CONTEXT-STUDIO-INTEGRATION-SUMMARY.md)

---

**Context ID**: `ctx_0285e494930b`  
**Repository**: https://github.com/Sudip-Mishra/build-tracker-ai-context  
**Source ID**: `src_build_tracker_git`