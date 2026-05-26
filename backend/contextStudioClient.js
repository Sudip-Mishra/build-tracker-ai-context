/**
 * Context Studio MCP Client
 * Handles communication with IBM Context Studio via MCP Gateway
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ContextStudioClient {
  constructor() {
    // Load MCP configuration
    const mcpConfigPath = path.resolve(__dirname, '../.bob/mcp.json');
    
    if (!fs.existsSync(mcpConfigPath)) {
      console.warn('MCP configuration not found. Context Studio features will be disabled.');
      this.enabled = false;
      return;
    }

    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    const contextStudio = mcpConfig.mcpServers['context-studio'];

    if (!contextStudio || contextStudio.disabled) {
      console.warn('Context Studio MCP server is disabled.');
      this.enabled = false;
      return;
    }

    this.config = {
      url: contextStudio.url,
      headers: contextStudio.headers
    };
    this.enabled = true;
    this.contextId = null; // Will be fetched dynamically

    console.log('Context Studio MCP client initialized');
  }

  /**
   * Check if Context Studio is available
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * List available MCP tools
   */
  async listTools() {
    try {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list',
        params: {}
      };

      const response = await axios.post(
        this.config.url,
        mcpRequest,
        {
          headers: {
            ...this.config.headers,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.result?.tools || [];
    } catch (error) {
      console.error('Error listing MCP tools:', error.message);
      return [];
    }
  }

  /**
   * Call MCP tool via gateway
   * @param {string} toolName - Name of the MCP tool
   * @param {Object} params - Tool parameters
   */
  async callMCPTool(toolName, params) {
    try {
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: params
        }
      };

      console.log(`Calling MCP tool: ${toolName}`);
      console.log('Tool parameters:', JSON.stringify(params, null, 2));

      const response = await axios.post(
        this.config.url,
        mcpRequest,
        {
          headers: {
            ...this.config.headers,
            'Content-Type': 'application/json'
          },
          timeout: 120000 // Increased to 2 minutes
        }
      );

      if (response.data.error) {
        throw new Error(response.data.error.message || 'MCP tool call failed');
      }

      console.log('MCP tool response received');
      return response.data.result;
    } catch (error) {
      console.error(`Error calling MCP tool ${toolName}:`, error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Get the actual context ID from Context Studio
   * This fetches the real context ID from the x-api-key token
   */
  async getContextId() {
    // Return cached context ID if available
    if (this.contextId) {
      return this.contextId;
    }

    try {
      // Extract context ID from x-api-key header
      const apiKey = this.config.headers['x-api-key'];
      if (apiKey) {
        // Decode JWT token (it's base64 encoded)
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
        // Use the first available context
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

  /**
   * Get or create build-tracker context
   * @deprecated Use getContextId() instead
   */
  async ensureContext() {
    return this.getContextId();
  }

  /**
   * Upload schema to Context Studio
   */
  async uploadSchema() {
    if (!this.enabled) {
      throw new Error('Context Studio is not enabled');
    }

    try {
      const schemaPath = path.resolve(__dirname, '../schema/build-tracker-schema.jsonld');
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

      console.log('Uploading schema to Context Studio via MCP...');

      // Get the actual context ID
      const contextId = await this.getContextId();
      console.log('Using context ID for schema upload:', contextId);

      // Format schema as text content for upload
      const schemaText = JSON.stringify(schema, null, 2);
      
      const result = await this.callMCPTool('context-broker-post-events', {
        events: [{
          type: 'document',
          content: schemaText,
          metadata: {
            title: 'Build Tracker Schema',
            source: 'build-tracker-schema.jsonld',
            type: 'schema',
            context_id: contextId
          },
          timestamp: new Date().toISOString()
        }]
      });

      console.log('Schema uploaded successfully');
      return {
        success: true,
        message: 'Schema uploaded to Context Studio',
        contextId: contextId,
        data: result
      };
    } catch (error) {
      console.error('Error uploading schema:', error.message);
      throw new Error(`Failed to upload schema: ${error.message}`);
    }
  }

  /**
   * Upload data to Context Studio
   * @param {Object} jsonLdData - JSON-LD formatted data
   */
  async uploadData(jsonLdData) {
    if (!this.enabled) {
      throw new Error('Context Studio is not enabled');
    }

    try {
      console.log('Uploading data to Context Studio via MCP...');

      // Get the actual context ID
      const contextId = await this.getContextId();
      console.log('Using context ID for data upload:', contextId);

      const entities = jsonLdData['@graph'] || [];
      
      // Convert each entity to a document event
      const events = entities.map((entity, index) => {
        // Create human-readable content
        const content = `
RICE Object: ${entity['bt:riceId'] || entity['@id']}
Name: ${entity['bt:objectName'] || 'N/A'}
Type: ${entity['@type'] || 'N/A'}
Status: ${entity['bt:status'] || 'N/A'}
Progress: ${entity['bt:progress'] || 0}%
Description: ${entity['bt:description'] || 'N/A'}
Files: ${entity['bt:hasFile']?.length || 0}
Resources: ${entity['bt:assignedTo']?.length || 0}
Start Date: ${entity['bt:startDate'] || 'N/A'}
Target Date: ${entity['bt:targetDate'] || 'N/A'}
        `.trim();

        return {
          type: 'document',
          content: content,
          metadata: {
            title: `${entity['bt:riceId']} - ${entity['bt:objectName']}`,
            source: 'build-tracker',
            type: entity['@type'] || 'RICEObject',
            rice_id: entity['bt:riceId'],
            object_type: entity['bt:objectType'],
            status: entity['bt:status'],
            progress: entity['bt:progress'],
            context_id: contextId,
            entity_id: entity['@id']
          },
          timestamp: new Date().toISOString()
        };
      });

      // Upload in batches of 5 to avoid timeout
      const batchSize = 5;
      let uploadedCount = 0;

      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        await this.callMCPTool('context-broker-post-events', {
          events: batch
        });
        uploadedCount += batch.length;
        console.log(`Uploaded ${uploadedCount}/${events.length} entities...`);
      }

      console.log(`Data uploaded successfully: ${events.length} entities`);
      return {
        success: true,
        message: 'Data uploaded to Context Studio',
        contextId: contextId,
        count: events.length
      };
    } catch (error) {
      console.error('Error uploading data:', error.message);
      throw new Error(`Failed to upload data: ${error.message}`);
    }
  }

  /**
   * Query Context Studio with natural language
   * @param {string} question - Natural language question
   */
  async query(question) {
    if (!this.enabled) {
      throw new Error('Context Studio is not enabled');
    }

    try {
      console.log(`Querying Context Studio: "${question}"`);

      // Get the actual context ID
      const contextId = await this.getContextId();
      console.log('Using context ID for query:', contextId);

      // Try vector query with context filter
      let result;
      try {
        result = await this.callMCPTool('context-broker-vector-query', {
          query: question,
          top_k: 10,
          filter: {
            context_id: contextId
          }
        });
      } catch (vectorError) {
        console.log('Vector query failed, trying hybrid query...');
        // Fallback to hybrid query
        result = await this.callMCPTool('context-broker-hybrid-query', {
          query: question,
          top_k: 10,
          filter: {
            context_id: contextId
          }
        });
      }

      console.log('Query completed successfully');
      
      // Extract and format answer from result
      let answer = 'No results found for your build tracker data.';
      
      if (result && result.items && Array.isArray(result.items)) {
        // Filter results to only build-tracker context
        const buildTrackerItems = result.items.filter(item =>
          item.metadata?.context_id === contextId ||
          item.metadata?.source === 'build-tracker'
        );

        if (buildTrackerItems.length > 0) {
          answer = buildTrackerItems.map((item, i) => {
            const metadata = item.metadata || {};
            const score = metadata.score ? ` (relevance: ${(metadata.score * 100).toFixed(0)}%)` : '';
            const title = metadata.title || metadata.rice_id || `Result ${i + 1}`;
            const content = item.content || '';
            
            return `**${title}**${score}\n${content}`;
          }).join('\n\n---\n\n');
        } else {
          answer = 'No build tracker objects found matching your query. Make sure you have uploaded your data first.';
        }
      } else if (result && result.content) {
        if (Array.isArray(result.content)) {
          answer = result.content.map(item => {
            if (typeof item === 'string') return item;
            if (item.text) return item.text;
            if (item.type === 'text' && item.text) return item.text;
            return JSON.stringify(item);
          }).join('\n\n');
        } else if (typeof result.content === 'string') {
          answer = result.content;
        } else if (result.content.text) {
          answer = result.content.text;
        }
      }

      return {
        success: true,
        question: question,
        answer: answer,
        contextId: contextId,
        data: result
      };
    } catch (error) {
      console.error('Error querying Context Studio:', error.message);
      console.error('Full error:', error);
      
      // Return a helpful error message
      return {
        success: false,
        question: question,
        answer: `I couldn't process your question. Error: ${error.message}\n\nPlease make sure you've uploaded the schema and data first.`,
        error: error.message
      };
    }
  }

  /**
   * Transform RICE objects to JSON-LD format
   * @param {Array} objects - Array of RICE objects
   */
  transformToJsonLd(objects) {
    const graph = [];

    objects.forEach((obj, index) => {
      // Create RICE object entity
      const riceObject = {
        '@id': `bt:object-${String(index + 1).padStart(3, '0')}`,
        '@type': this.getObjectType(obj.objectType),
        'bt:riceId': obj.riceId,
        'bt:objectName': obj.objectName,
        'bt:objectType': `bt:${obj.objectType}`,
        'bt:progress': obj.progress,
        'bt:status': `bt:${obj.status}`,
        'bt:description': obj.description || '',
        'bt:startDate': obj.startDate || null,
        'bt:targetDate': obj.targetDate || null
      };

      // Add files
      const fileIds = [];
      obj.filesUsed.forEach((fileName, fileIndex) => {
        const fileId = `bt:file-${obj.riceId}-${fileIndex + 1}`;
        fileIds.push(fileId);
        
        graph.push({
          '@id': fileId,
          '@type': 'bt:File',
          'bt:fileName': fileName,
          'bt:filePath': fileName,
          'bt:fileType': this.guessFileType(fileName),
          'bt:usedInObject': riceObject['@id']
        });
      });
      riceObject['bt:hasFile'] = fileIds;

      // Add resources
      const resourceIds = [];
      obj.resourceNames.forEach((resourceName, resIndex) => {
        const resourceId = `bt:resource-${resourceName.replace(/\s+/g, '-').toLowerCase()}`;
        
        // Check if resource already exists in graph
        if (!graph.find(item => item['@id'] === resourceId)) {
          graph.push({
            '@id': resourceId,
            '@type': 'bt:Resource',
            'bt:resourceName': resourceName,
            'bt:workingOn': [riceObject['@id']]
          });
        } else {
          // Update existing resource's workingOn
          const existingResource = graph.find(item => item['@id'] === resourceId);
          if (!existingResource['bt:workingOn'].includes(riceObject['@id'])) {
            existingResource['bt:workingOn'].push(riceObject['@id']);
          }
        }
        resourceIds.push(resourceId);
      });
      riceObject['bt:assignedTo'] = resourceIds;

      graph.push(riceObject);
    });

    return {
      '@context': '../schema/build-tracker-schema.jsonld',
      '@graph': graph
    };
  }

  /**
   * Get object type for JSON-LD
   */
  getObjectType(type) {
    const typeMap = {
      'REPORT': 'bt:Report',
      'INTERFACE': 'bt:Interface',
      'CONVERSION': 'bt:Conversion',
      'ENHANCEMENT': 'bt:Enhancement'
    };
    return typeMap[type] || 'bt:RICEObject';
  }

  /**
   * Guess file type from extension
   */
  guessFileType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const typeMap = {
      'rdf': 'bt:SourceCode',
      'pks': 'bt:Database',
      'pkb': 'bt:Database',
      'sql': 'bt:Database',
      'xml': 'bt:Configuration',
      'json': 'bt:Configuration',
      'java': 'bt:SourceCode',
      'js': 'bt:SourceCode',
      'py': 'bt:SourceCode',
      'doc': 'bt:Documentation',
      'docx': 'bt:Documentation',
      'xlsx': 'bt:TestScript',
      'prog': 'bt:SourceCode'
    };
    return typeMap[ext] || 'bt:SourceCode';
  }
}

module.exports = new ContextStudioClient();

// Made with Bob
