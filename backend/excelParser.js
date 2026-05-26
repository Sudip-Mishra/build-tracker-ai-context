/**
 * Excel Parser Module
 * Reads and parses Excel files containing RICE object data
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const config = require('./config');

class ExcelParser {
  constructor() {
    this.cache = null;
    this.lastModified = null;
  }

  /**
   * Read and parse Excel file
   * @returns {Promise<Array>} Array of RICE objects
   */
  async parseExcel() {
    try {
      const filePath = path.resolve(__dirname, config.excel.filePath);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`Excel file not found at: ${filePath}`);
      }

      // Check if file has been modified (for caching)
      const stats = fs.statSync(filePath);
      const fileModified = stats.mtime.getTime();

      // Return cached data if file hasn't changed
      if (config.cache.enabled && this.cache && this.lastModified === fileModified) {
        console.log('Returning cached data');
        return this.cache;
      }

      console.log(`Reading Excel file: ${filePath}`);
      
      // Read the Excel file
      const workbook = XLSX.readFile(filePath);
      
      // Get the first sheet or specified sheet
      const sheetName = config.excel.sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error(`Sheet "${sheetName}" not found in Excel file`);
      }

      // Convert sheet to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet);

      if (rawData.length === 0) {
        console.warn('No data found in Excel sheet');
        return [];
      }

      // Transform data to our format
      const transformedData = this.transformData(rawData);

      // Update cache
      if (config.cache.enabled) {
        this.cache = transformedData;
        this.lastModified = fileModified;
      }

      console.log(`Successfully parsed ${transformedData.length} RICE objects`);
      return transformedData;

    } catch (error) {
      console.error('Error parsing Excel file:', error.message);
      throw error;
    }
  }

  /**
   * Transform raw Excel data to structured format
   * @param {Array} rawData - Raw data from Excel
   * @returns {Array} Transformed data
   */
  transformData(rawData) {
    const cols = config.excel.columns;

    return rawData.map((row, index) => {
      try {
        // Parse files (comma-separated string to array)
        const filesUsed = row[cols.filesUsed] 
          ? row[cols.filesUsed].split(',').map(f => f.trim()).filter(f => f)
          : [];

        // Parse resources (comma-separated string to array)
        const resourceNames = row[cols.resourceNames]
          ? row[cols.resourceNames].split(',').map(r => r.trim()).filter(r => r)
          : [];

        // Parse progress (ensure it's a number)
        let progress = 0;
        if (row[cols.progress] !== undefined && row[cols.progress] !== null) {
          progress = typeof row[cols.progress] === 'number' 
            ? row[cols.progress] 
            : parseFloat(row[cols.progress]) || 0;
        }

        // Ensure progress is between 0 and 100
        progress = Math.max(0, Math.min(100, progress));

        // Determine object type category
        const riceId = row[cols.riceId] || '';
        const objectType = this.determineObjectType(riceId, row[cols.objectType]);

        return {
          riceId: riceId,
          objectName: row[cols.objectName] || 'Unnamed Object',
          objectType: objectType,
          progress: progress,
          status: this.normalizeStatus(row[cols.status]),
          filesUsed: filesUsed,
          resourceNames: resourceNames,
          description: row[cols.description] || '',
          startDate: this.parseDate(row[cols.startDate]),
          targetDate: this.parseDate(row[cols.targetDate]),
          // Additional metadata
          rowIndex: index + 2 // Excel row number (accounting for header)
        };
      } catch (error) {
        console.error(`Error transforming row ${index + 2}:`, error.message);
        return null;
      }
    }).filter(obj => obj !== null && obj.riceId); // Filter out invalid rows
  }

  /**
   * Determine object type from RICE ID or explicit type
   * @param {string} riceId - RICE ID
   * @param {string} explicitType - Explicit object type from Excel
   * @returns {string} Object type
   */
  determineObjectType(riceId, explicitType) {
    if (explicitType) {
      return explicitType.toUpperCase();
    }

    // Determine from RICE ID prefix
    const prefix = riceId.charAt(0).toUpperCase();
    const typeMap = {
      'R': 'REPORT',
      'I': 'INTERFACE',
      'C': 'CONVERSION',
      'E': 'ENHANCEMENT'
    };

    return typeMap[prefix] || 'UNKNOWN';
  }

  /**
   * Normalize status values
   * @param {string} status - Raw status value
   * @returns {string} Normalized status
   */
  normalizeStatus(status) {
    if (!status) return 'NOT_STARTED';

    const normalized = status.toString().toUpperCase().replace(/\s+/g, '_');
    
    // Valid statuses
    const validStatuses = [
      'NOT_STARTED',
      'IN_PROGRESS',
      'ON_HOLD',
      'BLOCKED',
      'IN_REVIEW',
      'TESTING',
      'COMPLETED',
      'DEPLOYED'
    ];

    return validStatuses.includes(normalized) ? normalized : 'IN_PROGRESS';
  }

  /**
   * Parse date from various formats
   * @param {*} dateValue - Date value from Excel
   * @returns {string|null} ISO date string or null
   */
  parseDate(dateValue) {
    if (!dateValue) return null;

    try {
      // If it's already a Date object
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
      }

      // If it's an Excel serial date number
      if (typeof dateValue === 'number') {
        const date = XLSX.SSF.parse_date_code(dateValue);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }

      // If it's a string, try to parse it
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }

      return null;
    } catch (error) {
      console.warn('Error parsing date:', dateValue);
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = null;
    this.lastModified = null;
    console.log('Cache cleared');
  }

  /**
   * Get statistics about the data
   * @param {Array} data - RICE objects data
   * @returns {Object} Statistics
   */
  getStatistics(data) {
    if (!data || data.length === 0) {
      return {
        total: 0,
        byType: {},
        byStatus: {},
        averageProgress: 0
      };
    }

    const stats = {
      total: data.length,
      byType: {},
      byStatus: {},
      averageProgress: 0
    };

    let totalProgress = 0;

    data.forEach(obj => {
      // Count by type
      stats.byType[obj.objectType] = (stats.byType[obj.objectType] || 0) + 1;
      
      // Count by status
      stats.byStatus[obj.status] = (stats.byStatus[obj.status] || 0) + 1;
      
      // Sum progress
      totalProgress += obj.progress;
    });

    stats.averageProgress = Math.round(totalProgress / data.length);

    return stats;
  }
}

module.exports = new ExcelParser();

// Made with Bob
