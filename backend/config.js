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
