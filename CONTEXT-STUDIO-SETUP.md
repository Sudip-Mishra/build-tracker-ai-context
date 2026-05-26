# Context Studio Setup Guide

This guide walks you through configuring the Git-based ingestion source in IBM Context Studio for the Build Tracker application.

## Prerequisites

✅ GitHub repository created: `https://github.com/Sudip-Mishra/build-tracker-ai-context`  
✅ Git installed and configured  
✅ Code changes implemented  
✅ Access to IBM Context Studio web interface  

## Step 1: Create GitHub Personal Access Token

Context Studio needs access to your GitHub repository to read files for ingestion.

### 1.1 Generate Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Configure the token:
   - **Note**: `Context Studio Ingestion - Build Tracker`
   - **Expiration**: 90 days (or custom)
   - **Scopes**: Check `repo` (Full control of private repositories)
4. Click **"Generate token"**
5. **IMPORTANT**: Copy the token immediately (you won't see it again!)
   - Format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 1.2 Save Token Securely

Store the token in a secure location (password manager recommended). You'll need it in Step 3.

## Step 2: Access Context Studio

### 2.1 Login

1. Navigate to: https://context-studio.ibm.com (or your organization's Context Studio URL)
2. Login with your IBM credentials
3. Verify you have access to the Build Tracker context

### 2.2 Navigate to Your Context

1. From the dashboard, find your context:
   - **Context ID**: `ctx_0285e494930b`
   - **Context Name**: Build Tracker Context
2. Click to open the context

## Step 3: Configure GitHub Ingestion Source

### 3.1 Add New Connector

1. In your context, navigate to **"Sources"** or **"Connectors"**
2. Click **"Add New Connector"** button
3. From the **Data Source** dropdown, select **"GitHub"**

### 3.2 Select Repository Type

You'll see two radio button options:
- **Public** - For public GitHub repositories
- **Private** - For private GitHub repositories (select this)

**Select "Private"** since your repository is private.

### 3.3 Configure Private GitHub Connector

Fill in the following fields:

| Field | Value | Notes |
|-------|-------|-------|
| **Base URL** | `https://api.github.com` | GitHub API endpoint |
| **Org** | `Sudip-Mishra` | Your GitHub username/organization |
| **Access Token** | Paste your token from Step 1 | Format: `ghp_xxxx...` |

### 3.4 Load Repositories

1. Click the **"Enter Github Credentials to load Repositories"** button
2. Wait 5-10 seconds for Context Studio to fetch your repositories
3. The system will authenticate and retrieve your repository list

### 3.5 Select Repository

1. From the **"Select Github Repositories"** dropdown, find and select:
   ```
   build-tracker-ai-context
   ```
2. Check the **"Re-ingestion Required"** checkbox: ☑️
   - This allows Context Studio to re-process files when they change

### 3.6 Save Configuration

1. Review all settings carefully:
   - Base URL: `https://api.github.com`
   - Org: `Sudip-Mishra`
   - Repository: `build-tracker-ai-context`
   - Re-ingestion: Checked
2. Click **"Save"** or **"Create Connector"**
3. Wait for confirmation message
4. The connector should now appear in your sources list

### 3.7 Verify Connector Status

After saving:
1. Check the connector status - should show **"Active"** or **"Connected"**
2. If there's an error, verify:
   - GitHub token is valid and not expired
   - Token has `repo` scope permissions
   - Organization name is correct
   - Repository name is correct

## Step 4: Verify GitHub Connector

### 4.1 Check Connector Status

1. Navigate back to **"Sources"** or **"Connectors"** list
2. Find your newly created GitHub connector
3. Verify status shows: **"Active"** or **"Connected"**
4. If status shows error, click on it to see error details

### 4.2 Initial Sync

After creating the connector:
1. Context Studio will automatically scan your repository
2. It will discover files in the `context-exports/` directory
3. This initial scan may take 1-2 minutes
4. Check the connector details to see discovered files

## Step 5: Initial Data Upload

Now that the ingestion source is configured, let's upload the schema and test data.

### 5.1 Upload Schema

From your Build Tracker application:

```bash
# Start the backend server
cd backend
npm start

# In another terminal, upload schema
curl -X POST http://localhost:3000/api/context-studio/upload-schema
```

Expected response:
```json
{
  "success": true,
  "message": "Schema uploaded and ingestion triggered",
  "contextId": "ctx_0285e494930b",
  "file": "context-exports/schema/build-tracker-schema.jsonld"
}
```

### 5.2 Upload Data

```bash
# Upload your RICE objects data
curl -X POST http://localhost:3000/api/context-studio/upload-data
```

Expected response:
```json
{
  "success": true,
  "message": "Data uploaded and ingestion triggered",
  "contextId": "ctx_0285e494930b",
  "file": "context-exports/data/rice-objects-2026-05-26T14-30-00-000Z.jsonld",
  "count": 25
}
```

### 5.3 Monitor Ingestion

1. Go back to Context Studio web interface
2. Navigate to your ingestion source
3. Check **"Recent Ingestions"** or **"Activity Log"**
4. Wait 2-5 minutes for files to be processed
5. Verify ingestion status: **"Completed"**

## Step 6: Verify Data is Indexed

### 6.1 Check Ingestion Status

In Context Studio:
1. Navigate to **"Data Explorer"** or **"Knowledge Graph"**
2. Search for: `Build Tracker` or `RICE`
3. You should see your uploaded entities

### 6.2 Test Query

From your application:

```bash
# Query the data
curl -X POST http://localhost:3000/api/context-studio/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me all RICE objects"}'
```

Expected: Results containing your uploaded RICE objects

## Step 7: Quick Start Guide

Once your GitHub connector is configured, here's how to use it:

### 7.1 Upload Schema (One-time)

```bash
# Start the backend server
cd backend
npm start

# Upload schema (in another terminal)
curl -X POST http://localhost:3000/api/context-studio/upload-schema
```

**What happens:**
1. Schema file is written to `context-exports/schema/`
2. Changes are committed and pushed to GitHub
3. Ingestion event is triggered
4. Context Studio detects the new file and ingests it

### 7.2 Upload Data (Anytime)

```bash
# Upload your RICE objects
curl -X POST http://localhost:3000/api/context-studio/upload-data
```

**What happens:**
1. Data file is written to `context-exports/data/`
2. Changes are committed and pushed to GitHub
3. Ingestion event is triggered
4. Context Studio ingests and indexes the data

### 7.3 Query Data (After 2-3 minutes)

```bash
# Query your data
curl -X POST http://localhost:3000/api/context-studio/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me all RICE objects"}'
```

**Expected Response:**
```json
{
  "success": true,
  "question": "Show me all RICE objects",
  "answer": "**REPORT-001 - Customer Report**\n...",
  "contextId": "ctx_0285e494930b"
}
```

## Troubleshooting

### Issue: "Repository not found"

**Solution**:
- Verify repository URL is correct
- Check GitHub token has `repo` scope
- Ensure repository is accessible (not deleted)

### Issue: "Authentication failed"

**Solution**:
- Regenerate GitHub Personal Access Token
- Update token in Context Studio
- Verify token hasn't expired

### Issue: "No files ingested"

**Solution**:
- Check `context-exports/` directory exists in repository
- Verify files are committed and pushed to GitHub
- Check file patterns in ingestion source settings
- Review ingestion logs for errors

### Issue: "Ingestion stuck in 'Processing'"

**Solution**:
- Wait 5-10 minutes (large files take time)
- Check Context Studio system status
- Review error logs in ingestion source
- Contact Context Studio support if persists

### Issue: "Query returns no results"

**Solution**:
- Wait 2-3 minutes after ingestion completes (indexing delay)
- Verify data was successfully ingested (check logs)
- Try a simpler query: "RICE objects"
- Check context_id matches in query

## Configuration Summary

After completing this setup, you should have:

✅ GitHub Personal Access Token created  
✅ Git ingestion source configured in Context Studio  
✅ Source ID: `src_build_tracker_git`  
✅ Repository monitored: `context-exports/`  
✅ Schema uploaded and indexed  
✅ Data uploaded and indexed  
✅ Queries working correctly  

## Next Steps

1. **Regular Usage**: Upload data via the Build Tracker web interface
2. **Monitoring**: Check ingestion logs periodically
3. **Maintenance**: Rotate GitHub token before expiration
4. **Optimization**: Adjust polling interval based on usage

## Support

- **Context Studio Documentation**: https://context-studio.ibm.com/docs
- **GitHub Issues**: https://github.com/Sudip-Mishra/build-tracker-ai-context/issues
- **IBM Support**: Contact your IBM representative

---

**Last Updated**: 2026-05-26  
**Version**: 1.0  
**Context ID**: ctx_0285e494930b