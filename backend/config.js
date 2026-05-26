/**
 * Configuration file for Build Tracker Backend
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },

  // Excel file configuration
  excel: {
    // Path to the Excel file (relative to backend directory)
    filePath: process.env.EXCEL_PATH || '../data/build-tracker.xlsx',
    
    // Sheet name to read from
    sheetName: 'Sheet1',
    
    // Column mappings (Excel column names)
    columns: {
      riceId: 'RICE ID',
      objectName: 'Object Name',
      objectType: 'Object Type',
      progress: 'Progress %',
      status: 'Status',
      filesUsed: 'Files Used',
      resourceNames: 'Resource Names',
      description: 'Description',
      startDate: 'Start Date',
      targetDate: 'Target Date'
    }
  },

  // Context Studio configuration
  contextStudio: {
    enabled: true,
    sourceId: process.env.CONTEXT_STUDIO_SOURCE_ID || 'src_build_tracker_git',
    sourceType: 'git',
    repositoryUrl: 'https://github.com/Sudip-Mishra/build-tracker-ai-context',
    exportPath: '../context-exports',
    agentPersona: 'BuildTrackerAgent',
    branch: 'main',
    // Ingestion settings
    autoCommit: true,
    autoPush: true,
    commitMessage: 'Update Context Studio data'
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
  },

  // Cache configuration
  cache: {
    enabled: true,
    ttl: 300000 // 5 minutes in milliseconds
  }
};

// Made with Bob
