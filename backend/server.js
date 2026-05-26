/**
 * Build Tracker Backend Server
 * Express server that serves RICE object data from Excel files
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const excelParser = require('./excelParser');
const contextStudioClient = require('./contextStudioClient');

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// API Routes
// ============================================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /api/builds
 * Get all RICE objects
 */
app.get('/api/builds', async (req, res) => {
  try {
    const data = await excelParser.parseExcel();
    const stats = excelParser.getStatistics(data);

    res.json({
      success: true,
      data: data,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching builds:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/builds/:riceId
 * Get specific RICE object by ID
 */
app.get('/api/builds/:riceId', async (req, res) => {
  try {
    const data = await excelParser.parseExcel();
    const riceId = req.params.riceId;
    
    const object = data.find(obj => obj.riceId === riceId);

    if (!object) {
      return res.status(404).json({
        success: false,
        error: `RICE object with ID "${riceId}" not found`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: object,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching build:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/refresh
 * Force refresh data from Excel (clear cache)
 */
app.post('/api/refresh', async (req, res) => {
  try {
    console.log('Refreshing data from Excel...');
    excelParser.clearCache();
    
    const data = await excelParser.parseExcel();
    const stats = excelParser.getStatistics(data);

    res.json({
      success: true,
      message: 'Data refreshed successfully',
      data: data,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error refreshing data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/search
 * Search RICE objects by file name or resource name
 */
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query parameter "q" is required',
        timestamp: new Date().toISOString()
      });
    }

    const data = await excelParser.parseExcel();
    const searchTerm = query.toLowerCase();

    // Search in files and resources
    const results = data.filter(obj => {
      // Search in files
      const fileMatch = obj.filesUsed.some(file => 
        file.toLowerCase().includes(searchTerm)
      );

      // Search in resources
      const resourceMatch = obj.resourceNames.some(resource => 
        resource.toLowerCase().includes(searchTerm)
      );

      // Search in object name and RICE ID
      const nameMatch = obj.objectName.toLowerCase().includes(searchTerm);
      const idMatch = obj.riceId.toLowerCase().includes(searchTerm);

      return fileMatch || resourceMatch || nameMatch || idMatch;
    });

    res.json({
      success: true,
      query: query,
      count: results.length,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/statistics
 * Get statistics about RICE objects
 */
app.get('/api/statistics', async (req, res) => {
  try {
    const data = await excelParser.parseExcel();
    const stats = excelParser.getStatistics(data);

    res.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// Context Studio API Routes
// ============================================

/**
 * GET /api/context-studio/status
 * Check Context Studio connection status
 */
app.get('/api/context-studio/status', async (req, res) => {
  try {
    const enabled = contextStudioClient.isEnabled();
    let tools = [];
    
    if (enabled) {
      // Try to list available tools
      try {
        tools = await contextStudioClient.listTools();
      } catch (error) {
        console.error('Could not list tools:', error.message);
      }
    }
    
    res.json({
      success: true,
      enabled: enabled,
      message: enabled
        ? 'Context Studio is connected and ready'
        : 'Context Studio is not configured',
      availableTools: tools.map(t => t.name),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/context-studio/upload-schema
 * Upload schema to Context Studio
 */
app.post('/api/context-studio/upload-schema', async (req, res) => {
  try {
    if (!contextStudioClient.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Context Studio is not configured or disabled',
        timestamp: new Date().toISOString()
      });
    }

    const result = await contextStudioClient.uploadSchema();
    
    res.json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error uploading schema:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/context-studio/upload-data
 * Upload current data to Context Studio
 */
app.post('/api/context-studio/upload-data', async (req, res) => {
  try {
    if (!contextStudioClient.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Context Studio is not configured or disabled',
        timestamp: new Date().toISOString()
      });
    }

    // Get current data
    const data = await excelParser.parseExcel();
    
    // Transform to JSON-LD
    const jsonLd = contextStudioClient.transformToJsonLd(data);
    
    // Upload to Context Studio
    const result = await contextStudioClient.uploadData(jsonLd);
    
    res.json({
      success: true,
      message: result.message,
      count: result.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error uploading data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/context-studio/query
 * Query Context Studio with natural language
 */
app.post('/api/context-studio/query', async (req, res) => {
  try {
    if (!contextStudioClient.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Context Studio is not configured or disabled',
        timestamp: new Date().toISOString()
      });
    }

    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required',
        timestamp: new Date().toISOString()
      });
    }

    const result = await contextStudioClient.query(question);
    
    res.json({
      success: result.success,
      question: result.question,
      answer: result.answer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error querying Context Studio:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/context-studio/debug
 * Diagnostic endpoint to test MCP tools and data flow
 */
app.get('/api/context-studio/debug', async (req, res) => {
  const logs = [];
  const log = (message, data = null) => {
    const entry = {
      timestamp: new Date().toISOString(),
      message,
      data
    };
    logs.push(entry);
    console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  };

  try {
    if (!contextStudioClient.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Context Studio is not configured or disabled',
        logs,
        timestamp: new Date().toISOString()
      });
    }

    log('Starting diagnostic test...');

    // Step 1: List all available MCP tools
    log('Step 1: Listing available MCP tools...');
    const tools = await contextStudioClient.listTools();
    log('Available tools found', {
      count: tools.length,
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      }))
    });

    // Step 2: Create a sample RICE object
    log('Step 2: Creating sample RICE object...');
    const sampleObject = {
      riceId: 'DEBUG-001',
      objectName: 'Debug Test Object',
      objectType: 'REPORT',
      progress: 50,
      status: 'In Progress',
      description: 'This is a diagnostic test object created at ' + new Date().toISOString(),
      startDate: '2024-01-01',
      targetDate: '2024-12-31',
      filesUsed: ['DEBUG_TEST.rdf', 'DEBUG_TEST.sql'],
      resourceNames: ['Debug Tester']
    };
    log('Sample object created', sampleObject);

    // Step 3: Transform to JSON-LD
    log('Step 3: Transforming to JSON-LD...');
    const jsonLd = contextStudioClient.transformToJsonLd([sampleObject]);
    log('JSON-LD transformation complete', {
      context: jsonLd['@context'],
      graphSize: jsonLd['@graph'].length,
      entities: jsonLd['@graph'].map(e => ({
        id: e['@id'],
        type: e['@type'],
        riceId: e['bt:riceId']
      }))
    });

    // Step 4: Get the actual context ID
    log('Step 4: Getting actual context ID...');
    const contextId = await contextStudioClient.getContextId();
    log('Context ID retrieved', { contextId });

    // Step 5: Upload the sample object
    log('Step 5: Uploading sample object to Context Studio...');
    const entity = jsonLd['@graph'].find(e => e['bt:riceId'] === 'DEBUG-001');
    
    const uploadEvent = {
      type: 'document',
      content: `
RICE Object: ${entity['bt:riceId']}
Name: ${entity['bt:objectName']}
Type: ${entity['@type']}
Status: ${entity['bt:status']}
Progress: ${entity['bt:progress']}%
Description: ${entity['bt:description']}
Files: ${entity['bt:hasFile']?.length || 0}
Resources: ${entity['bt:assignedTo']?.length || 0}
Start Date: ${entity['bt:startDate']}
Target Date: ${entity['bt:targetDate']}
      `.trim(),
      metadata: {
        title: `${entity['bt:riceId']} - ${entity['bt:objectName']}`,
        source: 'build-tracker-debug',
        type: entity['@type'],
        rice_id: entity['bt:riceId'],
        object_type: entity['bt:objectType'],
        status: entity['bt:status'],
        progress: entity['bt:progress'],
        context_id: contextId,
        entity_id: entity['@id']
      },
      timestamp: new Date().toISOString()
    };
    
    log('Upload event prepared', uploadEvent);
    
    const uploadResult = await contextStudioClient.callMCPTool('context-broker-post-events', {
      events: [uploadEvent]
    });
    log('Upload completed', uploadResult);

    // Step 6: Wait a moment for indexing
    log('Step 6: Waiting 3 seconds for indexing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 7: Query for the specific object using vector query
    log('Step 7: Querying for the uploaded object (vector query)...');
    let vectorQueryResult;
    try {
      vectorQueryResult = await contextStudioClient.callMCPTool('context-broker-vector-query', {
        query: 'DEBUG-001 Debug Test Object',
        top_k: 5,
        filter: {
          context_id: contextId
        }
      });
      log('Vector query result', vectorQueryResult);
    } catch (error) {
      log('Vector query failed', { error: error.message });
      vectorQueryResult = { error: error.message };
    }

    // Step 8: Try hybrid query as fallback
    log('Step 8: Querying with hybrid query...');
    let hybridQueryResult;
    try {
      hybridQueryResult = await contextStudioClient.callMCPTool('context-broker-hybrid-query', {
        query: 'DEBUG-001',
        top_k: 5,
        filter: {
          context_id: contextId
        }
      });
      log('Hybrid query result', hybridQueryResult);
    } catch (error) {
      log('Hybrid query failed', { error: error.message });
      hybridQueryResult = { error: error.message };
    }

    // Step 9: Try to get contexts
    log('Step 9: Listing all contexts...');
    let contexts;
    try {
      contexts = await contextStudioClient.callMCPTool('context-broker-get-contexts', {});
      log('Contexts found', contexts);
    } catch (error) {
      log('Failed to get contexts', { error: error.message });
      contexts = { error: error.message };
    }

    // Step 10: Analyze results
    log('Step 10: Analyzing results...');
    const analysis = {
      toolsAvailable: tools.length > 0,
      uploadSuccessful: uploadResult && !uploadResult.error,
      vectorQueryWorked: vectorQueryResult && !vectorQueryResult.error,
      hybridQueryWorked: hybridQueryResult && !hybridQueryResult.error,
      objectFound: false,
      recommendations: []
    };

    // Check if object was found in queries
    if (vectorQueryResult && vectorQueryResult.items) {
      const found = vectorQueryResult.items.some(item =>
        item.metadata?.rice_id === 'DEBUG-001' ||
        item.content?.includes('DEBUG-001')
      );
      if (found) {
        analysis.objectFound = true;
        analysis.recommendations.push('✓ Object found in vector query - system is working correctly');
      }
    }

    if (hybridQueryResult && hybridQueryResult.items) {
      const found = hybridQueryResult.items.some(item =>
        item.metadata?.rice_id === 'DEBUG-001' ||
        item.content?.includes('DEBUG-001')
      );
      if (found && !analysis.objectFound) {
        analysis.objectFound = true;
        analysis.recommendations.push('✓ Object found in hybrid query - use hybrid queries for better results');
      }
    }

    if (!analysis.objectFound) {
      analysis.recommendations.push('✗ Object not found in queries - possible indexing delay');
      analysis.recommendations.push(`→ Context ID used: ${contextId}`);
      analysis.recommendations.push('→ Try querying again in a few seconds');
      analysis.recommendations.push('→ Verify the context_id in metadata matches the query filter');
    }

    if (!analysis.vectorQueryWorked && analysis.hybridQueryWorked) {
      analysis.recommendations.push('→ Vector query not working, use hybrid query instead');
    }

    if (!analysis.uploadSuccessful) {
      analysis.recommendations.push('✗ Upload failed - check MCP tool parameters');
    }

    log('Analysis complete', analysis);

    // Return comprehensive diagnostic report
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        toolsAvailable: tools.length,
        contextId: contextId,
        uploadSuccessful: analysis.uploadSuccessful,
        objectFound: analysis.objectFound,
        queriesWorking: analysis.vectorQueryWorked || analysis.hybridQueryWorked
      },
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      })),
      sampleObject,
      uploadEvent,
      uploadResult,
      vectorQueryResult,
      hybridQueryResult,
      contexts,
      analysis,
      logs
    });

  } catch (error) {
    log('Diagnostic test failed', { error: error.message, stack: error.stack });
    console.error('Diagnostic error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      logs,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// Error Handling
// ============================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// Server Startup
// ============================================

const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
  console.log('='.repeat(50));
  console.log('Build Tracker Backend Server');
  console.log('='.repeat(50));
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`Frontend: http://${HOST}:${PORT}`);
  console.log(`API: http://${HOST}:${PORT}/api`);
  console.log(`Excel file: ${config.excel.filePath}`);
  console.log('='.repeat(50));
  console.log('Available endpoints:');
  console.log('  GET  /api/health                      - Health check');
  console.log('  GET  /api/builds                      - Get all RICE objects');
  console.log('  GET  /api/builds/:id                  - Get specific object');
  console.log('  POST /api/refresh                     - Refresh data from Excel');
  console.log('  GET  /api/search?q=...                - Search objects');
  console.log('  GET  /api/statistics                  - Get statistics');
  console.log('  GET  /api/context-studio/status       - Context Studio status');
  console.log('  POST /api/context-studio/upload-schema - Upload schema');
  console.log('  POST /api/context-studio/upload-data  - Upload data');
  console.log('  POST /api/context-studio/query        - AI query');
  console.log('  GET  /api/context-studio/debug        - Diagnostic test');
  console.log('='.repeat(50));
  
  // Initialize Context Studio
  if (contextStudioClient.isEnabled()) {
    console.log('✓ Context Studio client initialized');
  } else {
    console.log('✗ Context Studio not configured (AI features disabled)');
  }
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Made with Bob
