/**
 * Context Studio MCP Client
 * Handles communication with IBM Context Studio via MCP Gateway
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    
    // Load app configuration
    this.appConfig = require('./config');

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
   * Write file to Git-tracked export directory
   * @param {string} relativePath - Path relative to context-exports/
   * @param {string} content - File content
   * @returns {Promise<string>} - Full path to written file
   */
  async writeToExport(relativePath, content) {
    const exportPath = path.resolve(__dirname, this.appConfig.contextStudio.exportPath);
    const fullPath = path.join(exportPath, relativePath);
    
    // Create directory if it doesn't exist
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    
    // Write file
    await fs.promises.writeFile(fullPath, content, 'utf8');
    
    console.log(`File written to: ${fullPath}`);
    return fullPath;
  }

  /**
   * Commit and push files to Git repository
   * @param {Array<string>} files - Array of file paths relative to project root
   * @param {string} message - Commit message
   * @returns {Promise<boolean>} - Success status
   */
  async commitAndPush(files, message) {
    if (!this.appConfig.contextStudio.autoCommit) {
      console.log('Auto-commit disabled, skipping Git operations');
      return false;
    }

    const cwd = path.resolve(__dirname, '..');
    
    try {
      console.log('Git: Adding files...');
      // Add files
      files.forEach(file => {
        const normalizedPath = file.replace(/\\/g, '/');
        execSync(`git add "${normalizedPath}"`, { cwd, stdio: 'pipe' });
      });
      
      console.log('Git: Committing...');
      // Commit
      execSync(`git commit -m "${message}"`, { cwd, stdio: 'pipe' });
      
      if (this.appConfig.contextStudio.autoPush) {
        console.log('Git: Pushing to remote...');
        // Push
        const branch = this.appConfig.contextStudio.branch || 'main';
        execSync(`git push origin ${branch}`, { cwd, stdio: 'pipe' });
        console.log('Git: Push successful');
      }
      
      return true;
    } catch (error) {
      // Check if error is "nothing to commit"
      if (error.message.includes('nothing to commit')) {
        console.log('Git: No changes to commit');
        return true;
      }
      console.error('Git operation failed:', error.message);
      throw new Error(`Git operation failed: ${error.message}`);
    }
  }

  /**
   * Trigger Context Studio ingestion event
   * @param {Array<string>} files - Array of file paths relative to context-exports/
   * @param {string} action - Action type: 'add', 'update', or 'delete'
   * @returns {Promise<Object>} - Ingestion result
   */
  async triggerIngestion(files, action = 'update') {
    const contextId = await this.getContextId();
    const config = this.appConfig.contextStudio;
    
    console.log(`Triggering Context Studio ingestion for ${files.length} file(s)...`);
    
    // Group files by directory
    const filesByDir = {};
    files.forEach(file => {
      const normalizedPath = file.replace(/\\/g, '/');
      const relativePath = normalizedPath.replace('context-exports/', '');
      const dir = path.dirname(relativePath);
      const filename = path.basename(relativePath);
      
      if (!filesByDir[dir]) {
        filesByDir[dir] = [];
      }
      filesByDir[dir].push(filename);
    });
    
    // Create sub_folder array
    const subFolders = Object.keys(filesByDir).map(dir => ({
      folder_name: dir === '.' ? '' : dir,
      action: action,
      file_names: filesByDir[dir]
    }));
    
    return await this.callMCPTool('context-broker-post-events', {
      context_id: contextId,
      event_type: 'gitUpdate',
      payload: {
        source_id: config.sourceId,
        source_type: config.sourceType,
        paths: [{
          parent_folder: 'context-exports',
          sub_folder: subFolders
        }]
      }
    });
  }

  /**
   * Upload schema to Context Studio via Git ingestion
   */
  async uploadSchema() {
    if (!this.enabled) {
      throw new Error('Context Studio is not enabled');
    }

    try {
      console.log('Uploading schema to Context Studio via Git ingestion...');
      
      // Step 1: Read schema file
      const schemaPath = path.resolve(__dirname, '../schema/build-tracker-schema.jsonld');
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      
      // Step 2: Write to export directory
      const relativePath = 'schema/build-tracker-schema.jsonld';
      await this.writeToExport(
        relativePath,
        JSON.stringify(schema, null, 2)
      );
      
      console.log('Schema written to context-exports/schema/');
      
      // Step 3: Commit and push to GitHub
      const fullPath = `context-exports/${relativePath}`;
      await this.commitAndPush(
        [fullPath],
        'Upload Build Tracker schema to Context Studio'
      );
      
      console.log('Schema pushed to GitHub');
      
      // Step 4: Trigger Context Studio ingestion
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

  /**
   * Upload data to Context Studio via Git ingestion
   * @param {Object} jsonLdData - JSON-LD formatted data
   */
  async uploadData(jsonLdData) {
    if (!this.enabled) {
      throw new Error('Context Studio is not enabled');
    }

    try {
      console.log('Uploading data to Context Studio via Git ingestion...');
      
      // Step 1: Create timestamped filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `rice-objects-${timestamp}.jsonld`;
      const relativePath = `data/${filename}`;
      
      // Step 2: Write JSON-LD to export directory
      await this.writeToExport(
        relativePath,
        JSON.stringify(jsonLdData, null, 2)
      );
      
      const entities = jsonLdData['@graph'] || [];
      console.log(`Data written to: context-exports/${relativePath} (${entities.length} entities)`);
      
      // Step 3: Commit and push to GitHub
      const fullPath = `context-exports/${relativePath}`;
      await this.commitAndPush(
        [fullPath],
        `Upload RICE objects data - ${timestamp}`
      );
      
      console.log('Data pushed to GitHub');
      
      // Step 4: Trigger Context Studio ingestion
      const result = await this.triggerIngestion([fullPath], 'add');
      
      console.log('Data ingestion triggered successfully');
      
      const contextId = await this.getContextId();
      return {
        success: true,
        message: 'Data uploaded and ingestion triggered',
        contextId: contextId,
        file: fullPath,
        timestamp: timestamp,
        count: entities.length,
        data: result
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
      const agentPersona = this.appConfig.contextStudio.agentPersona;
      console.log(`Using context ID: ${contextId}, Agent Persona: ${agentPersona}`);

      // Try vector query with correct parameters
      let result;
      try {
        result = await this.callMCPTool('context-broker-vector-query', {
          context_id: contextId,
          AgentPersona: agentPersona,
          query: question,
          top_k: 5
        });
      } catch (vectorError) {
        console.log('Vector query failed, trying hybrid query...');
        // Fallback to hybrid query with optimized parameters
        result = await this.callMCPTool('context-broker-hybrid-query', {
          context_id: contextId,
          AgentPersona: agentPersona,
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
