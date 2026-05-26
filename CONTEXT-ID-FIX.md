# Context ID Fix Documentation

## Problem Identified

The debug endpoint showed that data was being uploaded successfully to Context Studio, but queries were not finding the uploaded objects. The issue was:

```
"objectFound": false,
"recommendations": [
  "✗ Object not found in queries - possible indexing delay or filter issue",
  "→ Try querying again in a few seconds",
  "→ Check if context_id filter is correct"
]
```

## Root Cause

The application was using a hardcoded `context_id: 'build-tracker'` for all operations (upload and query), but the actual context ID in Context Studio was different. The real context ID is embedded in the JWT token in the `x-api-key` header.

## Solution Implemented

### 1. Added Dynamic Context ID Retrieval

**File: `backend/contextStudioClient.js`**

Added a new method `getContextId()` that:
- Extracts the actual context ID from the JWT token in the `x-api-key` header
- Caches the context ID for subsequent use
- Falls back to API call if token extraction fails
- Uses 'build-tracker' as last resort

```javascript
async getContextId() {
  // Return cached context ID if available
  if (this.contextId) {
    return this.contextId;
  }

  try {
    // Extract context ID from x-api-key header
    const apiKey = this.config.headers['x-api-key'];
    if (apiKey) {
      const parts = apiKey.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (payload.contextId) {
          this.contextId = payload.contextId;
          console.log('Context ID extracted from token:', this.contextId);
          return this.contextId;
        }
      }
    }

    // Fallback: Try to get contexts from API
    console.log('Attempting to fetch contexts from API...');
    const contexts = await this.callMCPTool('context-broker-get-contexts', {});
    
    if (contexts && Array.isArray(contexts) && contexts.length > 0) {
      this.contextId = contexts[0].context_id || contexts[0].id;
      console.log('Using context from API:', this.contextId);
      return this.contextId;
    }
    
    // Last resort: use default
    console.warn('Could not determine context ID, using default');
    this.contextId = 'build-tracker';
    return this.contextId;
  } catch (error) {
    console.warn('Error getting context ID:', error.message);
    this.contextId = 'build-tracker';
    return this.contextId;
  }
}
```

### 2. Updated Upload Methods

**Schema Upload (`uploadSchema()`):**
- Now calls `getContextId()` before uploading
- Uses the actual context ID in metadata
- Returns the context ID in the response

**Data Upload (`uploadData()`):**
- Now calls `getContextId()` before uploading
- Uses the actual context ID in metadata for all events
- Returns the context ID in the response

### 3. Updated Query Method

**Query (`query()`):**
- Now calls `getContextId()` before querying
- Uses the actual context ID in the filter parameter
- Filters results by the actual context ID
- Returns the context ID in the response

### 4. Updated Debug Endpoint

**File: `backend/server.js`**

The debug endpoint now:
- Retrieves the actual context ID as Step 4
- Uses the actual context ID for uploads (Step 5)
- Uses the actual context ID for queries (Steps 7-8)
- Displays the context ID in the summary and recommendations
- Increased indexing wait time from 2 to 3 seconds

## Expected Token Structure

The `x-api-key` JWT token contains:
```json
{
  "emailAddress": "user@example.com",
  "teamId": "...",
  "contextId": "ctx_xxxxxxxxxxxxx",  // This is what we extract
  "iat": 1779768003,
  "exp": 1782360003,
  "iss": "context-broker",
  "token_id": "..."
}
```

## Testing the Fix

1. **Start the server:**
   ```powershell
   cd backend
   npm start
   ```

2. **Run the debug endpoint:**
   ```
   GET http://localhost:3000/api/context-studio/debug
   ```

3. **Check the logs for:**
   - "Context ID extracted from token: ctx_xxxxxxxxxxxxx"
   - "Using context ID for data upload: ctx_xxxxxxxxxxxxx"
   - "Using context ID for query: ctx_xxxxxxxxxxxxx"

4. **Verify in the response:**
   - `summary.contextId` should show the actual context ID
   - `analysis.objectFound` should be `true`
   - Recommendations should show success messages

## Benefits

1. **Automatic Context Detection:** No need to manually configure context IDs
2. **Consistent Context Usage:** Same context ID used for upload and query
3. **Better Error Messages:** Context ID is logged and included in responses
4. **Backward Compatible:** Falls back to 'build-tracker' if detection fails

## Files Modified

1. `backend/contextStudioClient.js`
   - Added `getContextId()` method
   - Updated `uploadSchema()` to use dynamic context ID
   - Updated `uploadData()` to use dynamic context ID
   - Updated `query()` to use dynamic context ID
   - Added `contextId` property to constructor

2. `backend/server.js`
   - Updated debug endpoint to retrieve and use actual context ID
   - Added context ID to debug logs and response
   - Increased indexing wait time

## Verification Steps

After deploying this fix:

1. Upload schema: `POST /api/context-studio/upload-schema`
   - Check response includes `contextId`
   - Verify logs show "Context ID extracted from token"

2. Upload data: `POST /api/context-studio/upload-data`
   - Check response includes `contextId`
   - Verify same context ID is used

3. Query data: `POST /api/context-studio/query`
   - Check response includes `contextId`
   - Verify results are found

4. Run debug: `GET /api/context-studio/debug`
   - Check `summary.contextId` matches token
   - Verify `analysis.objectFound` is true

## Troubleshooting

If objects are still not found:

1. **Check the context ID in logs:**
   - Should start with "ctx_"
   - Should match the token's contextId

2. **Verify token is valid:**
   - Check token hasn't expired
   - Verify x-api-key header is present

3. **Wait for indexing:**
   - Context Studio may need 3-5 seconds to index
   - Try querying again after a short delay

4. **Check metadata:**
   - Uploaded events should have `context_id` in metadata
   - Query filter should use the same `context_id`

## Next Steps

Consider adding:
1. Context ID validation on startup
2. Automatic retry logic for queries
3. Context ID health check endpoint
4. Better error messages when context ID is invalid