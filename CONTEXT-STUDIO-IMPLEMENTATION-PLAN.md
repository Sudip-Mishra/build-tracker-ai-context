# Context Studio Integration - Implementation Plan

## Overview
This document outlines the complete plan to fix the Context Studio integration for the Build Tracker application using a Git-based ingestion approach.

## Problem Analysis

### Issues Identified from Diagnostic Test
1. ❌ **Upload Failure**: `context-broker-post-events` requires `event_type` parameter
2. ❌ **Incorrect Tool Usage**: Tool expects `context_id`, `event_type`, and `payload` parameters
3. ❌ **Missing Ingestion Source**: No connected Git source configured
4. ❌ **Query Parameter Issues**: Missing required `context_id` and `AgentPersona` parameters
5. ❌ **Hybrid Query Timeout**: Takes 120+ seconds due to inefficient parameters

### Current Status
- ✅ Context ID: `ctx_0285e494930b`
- ✅ Schema loaded in Context Studio
- ✅ Vector query works (but returns no results due to no data)
- ✅ GitHub repository: `https://github.com/Sudip-Mishra/build-tracker-ai-context`
- ✅ Git installed and configured

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Build Tracker Application                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Parse Excel → Transform to JSON-LD → Write to Git Files     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              context-exports/ (Git-tracked directory)            │
│  ├── schema/build-tracker-schema.jsonld                         │
│  ├── data/rice-objects-TIMESTAMP.jsonld                         │
│  └── metadata.json                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Git Commit & Push → Trigger context-broker-post-events      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Context Studio Ingestion Engine                     │
│  - Reads from GitHub repository                                 │
│  - Parses JSON-LD documents                                     │
│  - Extracts entities and relationships                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           Vector DB + Graph DB (Indexed & Queryable)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Query via context-broker-vector-query / hybrid-query        │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Directory Structure & Configuration

#### 1.1 Create Export Directory Structure
```
context-exports/
├── schema/
│   └── build-tracker-schema.jsonld
├── data/
│   └── .gitkeep
├── README.md
└── .gitignore
```

#### 1.2 Update Configuration Files

**backend/config.js** - Add Context Studio settings:
```javascript
contextStudio: {
  enabled: true,
  sourceId: 'src_build_tracker_git',
  sourceType: 'git',
  repositoryUrl: 'https://github.com/Sudip-Mishra/build-tracker-ai-context',
  exportPath: '../context-exports',
  agentPersona: 'BuildTrackerAgent',
  branch: 'main'
}
```

### Phase 2: Fix Query Methods

#### 2.1 Update query() Method
**File**: `backend/contextStudioClient.js`

**Current Issues**:
- Missing `context_id` parameter
- Missing `AgentPersona` parameter
- Using incorrect `filter` parameter

**Fixed Implementation**:
```javascript
async query(question) {
  const contextId = await this.getContextId();
  
  // Use vector query with correct parameters
  const result = await this.callMCPTool('context-broker-vector-query', {
    context_id: contextId,
    AgentPersona: 'BuildTrackerAgent',
    query: question,
    top_k: 5
  });
  
  // Fallback to hybrid query with optimized parameters
  if (!result?.items?.length) {
    return await this.callMCPTool('context-broker-hybrid-query', {
      context_id: contextId,
      AgentPersona: 'BuildTrackerAgent',
      query: question,
      sources: ['vector', 'graph'],
      graph_params: {
        max_depth: 1,
        limit: 5
      },
      vector_params: {
        top_k: 5
      }
    });
  }
  
  return result;
}
```

### Phase 3: Implement Git-Based Upload Workflow

#### 3.1 Add Helper Methods

**writeToExport()** - Write files to Git-tracked directory:
```javascript
async writeToExport(relativePath, content) {
  const exportPath = path.resolve(__dirname, '../context-exports');
  const fullPath = path.join(exportPath, relativePath);
  
  await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.promises.writeFile(fullPath, content);
  
  return relativePath;
}
```

**commitAndPush()** - Commit and push to GitHub:
```javascript
async commitAndPush(files, message) {
  const { execSync } = require('child_process');
  const cwd = path.resolve(__dirname, '..');
  
  try {
    // Add files
    files.forEach(file => {
      execSync(`git add ${file}`, { cwd });
    });
    
    // Commit
    execSync(`git commit -m "${message}"`, { cwd });
    
    // Push
    execSync('git push origin main', { cwd });
    
    return true;
  } catch (error) {
    console.error('Git operation failed:', error.message);
    throw error;
  }
}
```

**triggerIngestion()** - Trigger Context Studio ingestion:
```javascript
async triggerIngestion(files, action = 'update') {
  const contextId = await this.getContextId();
  const config = require('./config');
  
  return await this.callMCPTool('context-broker-post-events', {
    context_id: contextId,
    event_type: 'gitUpdate',
    payload: {
      source_id: config.contextStudio.sourceId,
      source_type: 'git',
      paths: [{
        parent_folder: 'context-exports',
        sub_folder: files.map(file => ({
          folder_name: path.dirname(file).replace('context-exports/', ''),
          action: action,
          file_names: [path.basename(file)]
        }))
      }]
    }
  });
}
```

#### 3.2 Refactor uploadData() Method

**New Implementation**:
```javascript
async uploadData(jsonLdData) {
  if (!this.enabled) {
    throw new Error('Context Studio is not enabled');
  }

  try {
    console.log('Uploading data to Context Studio via Git ingestion...');
    
    // Step 1: Write JSON-LD to Git-tracked file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `rice-objects-${timestamp}.jsonld`;
    const relativePath = `data/${filename}`;
    
    await this.writeToExport(
      relativePath,
      JSON.stringify(jsonLdData, null, 2)
    );
    
    console.log(`Data written to: context-exports/${relativePath}`);
    
    // Step 2: Commit and push to GitHub
    const fullPath = `context-exports/${relativePath}`;
    await this.commitAndPush(
      [fullPath],
      `Upload RICE objects data - ${timestamp}`
    );
    
    console.log('Data pushed to GitHub');
    
    // Step 3: Trigger Context Studio ingestion
    const result = await this.triggerIngestion([fullPath], 'add');
    
    console.log('Ingestion triggered successfully');
    
    const contextId = await this.getContextId();
    return {
      success: true,
      message: 'Data uploaded and ingestion triggered',
      contextId: contextId,
      file: fullPath,
      timestamp: timestamp,
      data: result
    };
  } catch (error) {
    console.error('Error uploading data:', error.message);
    throw new Error(`Failed to upload data: ${error.message}`);
  }
}
```

#### 3.3 Refactor uploadSchema() Method

**New Implementation**:
```javascript
async uploadSchema() {
  if (!this.enabled) {
    throw new Error('Context Studio is not enabled');
  }

  try {
    console.log('Uploading schema to Context Studio via Git ingestion...');
    
    // Step 1: Copy schema to export directory
    const schemaPath = path.resolve(__dirname, '../schema/build-tracker-schema.jsonld');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    await this.writeToExport(
      'schema/build-tracker-schema.jsonld',
      JSON.stringify(schema, null, 2)
    );
    
    console.log('Schema written to: context-exports/schema/');
    
    // Step 2: Commit and push to GitHub
    const fullPath = 'context-exports/schema/build-tracker-schema.jsonld';
    await this.commitAndPush(
      [fullPath],
      'Upload Build Tracker schema'
    );
    
    console.log('Schema pushed to GitHub');
    
    // Step 3: Trigger Context Studio ingestion
    const result = await this.triggerIngestion([fullPath], 'update');
    
    console.log('Schema ingestion triggered successfully');
    
    const contextId = await this.getContextId();
    return {
      success: true,
      message: 'Schema uploaded and ingestion triggered',
      contextId: contextId,
      file: fullPath,
      data: result
    };
  } catch (error) {
    console.error('Error uploading schema:', error.message);
    throw new Error(`Failed to upload schema: ${error.message}`);
  }
}
```

### Phase 4: Context Studio Configuration

#### 4.1 Configure Git Ingestion Source

**Steps to configure in Context Studio UI**:

1. **Login to Context Studio**: https://context-studio.ibm.com
2. **Navigate to Context**: `ctx_0285e494930b` (Build Tracker Context)
3. **Add Ingestion Source**:
   - Click "Add Source" or "Configure Ingestion"
   - Select "Git" as source type
   - Configure settings:
     ```
     Source ID: src_build_tracker_git
     Source Type: Git
     Repository URL: https://github.com/Sudip-Mishra/build-tracker-ai-context
     Branch: main
     Path to Monitor: context-exports/
     Authentication: GitHub Personal Access Token
     Polling Interval: 5 minutes (or webhook-based)
     ```
4. **Add GitHub Token**:
   - Create a GitHub Personal Access Token with `repo` scope
   - Add token to Context Studio ingestion source configuration
5. **Test Connection**: Verify Context Studio can access the repository
6. **Save Configuration**

#### 4.2 GitHub Personal Access Token Setup

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Settings:
   - Note: "Context Studio Ingestion"
   - Expiration: 90 days (or custom)
   - Scopes: Check `repo` (Full control of private repositories)
4. Click "Generate token"
5. Copy the token (you won't see it again!)
6. Add to Context Studio ingestion source configuration

### Phase 5: Testing & Validation

#### 5.1 Test Workflow

1. **Upload Schema**:
   ```javascript
   POST /api/context-studio/upload-schema
   ```
   - Verify file appears in `context-exports/schema/`
   - Verify Git commit and push
   - Verify ingestion event triggered
   - Wait 30 seconds for indexing

2. **Upload Data**:
   ```javascript
   POST /api/context-studio/upload-data
   ```
   - Verify file appears in `context-exports/data/`
   - Verify Git commit and push
   - Verify ingestion event triggered
   - Wait 30 seconds for indexing

3. **Query Data**:
   ```javascript
   POST /api/context-studio/query
   Body: { "question": "Show me all RICE objects" }
   ```
   - Verify results are returned
   - Verify results contain uploaded data

#### 5.2 Validation Checklist

- [ ] Export directory created with correct structure
- [ ] Configuration updated with repository URL
- [ ] Query methods use correct parameters
- [ ] Upload methods write to Git-tracked files
- [ ] Git commits and pushes work correctly
- [ ] Ingestion events trigger successfully
- [ ] Context Studio ingestion source configured
- [ ] Schema is indexed in Context Studio
- [ ] Data is indexed in Context Studio
- [ ] Queries return correct results
- [ ] Error handling works properly

### Phase 6: Documentation

#### 6.1 Update Documentation Files

1. **README.md**: Add Context Studio setup section
2. **AI-INTEGRATION-GUIDE.md**: Update with Git-based workflow
3. **TROUBLESHOOTING.md**: Add Context Studio troubleshooting
4. **CONTEXT-STUDIO-SETUP.md**: Create detailed setup guide

#### 6.2 Create Setup Guide

Document the complete setup process:
- Prerequisites (Git, GitHub account, Context Studio access)
- GitHub repository setup
- Context Studio ingestion source configuration
- Testing the integration
- Common issues and solutions

## Benefits of This Approach

✅ **Automated**: No manual file uploads needed  
✅ **Version Controlled**: All data changes tracked in Git  
✅ **Auditable**: Clear history of what was uploaded and when  
✅ **Scalable**: Can handle large datasets efficiently  
✅ **Reliable**: Uses Context Studio's recommended ingestion pattern  
✅ **Debuggable**: Easy to inspect exported files and Git history  

## Timeline

- **Phase 1**: 15 minutes (Directory structure & configuration)
- **Phase 2**: 10 minutes (Fix query methods)
- **Phase 3**: 30 minutes (Implement upload workflow)
- **Phase 4**: 20 minutes (Context Studio configuration)
- **Phase 5**: 15 minutes (Testing & validation)
- **Phase 6**: 20 minutes (Documentation)

**Total Estimated Time**: ~2 hours

## Next Steps

1. Review and approve this implementation plan
2. Switch to Code mode to implement the changes
3. Configure Context Studio ingestion source
4. Test the complete workflow
5. Deploy to production

---

**Repository**: https://github.com/Sudip-Mishra/build-tracker-ai-context  
**Context ID**: ctx_0285e494930b  
**Date**: 2026-05-26