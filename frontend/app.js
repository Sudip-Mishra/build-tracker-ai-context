/**
 * Build Tracker Frontend Application
 * Handles UI interactions and API communication
 */

// ============================================
// Configuration
// ============================================
const API_BASE_URL = '/api';

// ============================================
// State Management
// ============================================
let allObjects = [];
let filteredObjects = [];
let currentFilters = {
  search: '',
  status: '',
  type: ''
};

// ============================================
// DOM Elements
// ============================================
const elements = {
  // Buttons
  refreshBtn: document.getElementById('refreshBtn'),
  searchBtn: document.getElementById('searchBtn'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  
  // Inputs
  searchInput: document.getElementById('searchInput'),
  statusFilter: document.getElementById('statusFilter'),
  typeFilter: document.getElementById('typeFilter'),
  
  // Containers
  objectsGrid: document.getElementById('objectsGrid'),
  loadingIndicator: document.getElementById('loadingIndicator'),
  errorMessage: document.getElementById('errorMessage'),
  successMessage: document.getElementById('successMessage'),
  emptyState: document.getElementById('emptyState'),
  
  // Statistics
  totalObjects: document.getElementById('totalObjects'),
  avgProgress: document.getElementById('avgProgress'),
  completedCount: document.getElementById('completedCount'),
  inProgressCount: document.getElementById('inProgressCount'),
  lastUpdated: document.getElementById('lastUpdated'),
  
  // Modal
  detailModal: document.getElementById('detailModal'),
  modalClose: document.getElementById('modalClose'),
  modalTitle: document.getElementById('modalTitle')
};

// ============================================
// API Functions
// ============================================

/**
 * Fetch all RICE objects from API
 */
async function fetchBuilds() {
  const response = await fetch(`${API_BASE_URL}/builds`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

/**
 * Refresh data from Excel
 */
async function refreshData() {
  const response = await fetch(`${API_BASE_URL}/refresh`, {
    method: 'POST'
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

/**
 * Search objects
 */
async function searchObjects(query) {
  const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

// ============================================
// UI Functions
// ============================================

/**
 * Show loading indicator
 */
function showLoading() {
  elements.loadingIndicator.style.display = 'block';
  elements.objectsGrid.style.display = 'none';
  elements.emptyState.style.display = 'none';
  hideMessages();
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  elements.loadingIndicator.style.display = 'none';
  elements.objectsGrid.style.display = 'grid';
}

/**
 * Show error message
 */
function showError(message) {
  elements.errorMessage.style.display = 'flex';
  document.getElementById('errorText').textContent = message;
  setTimeout(() => {
    elements.errorMessage.style.display = 'none';
  }, 5000);
}

/**
 * Show success message
 */
function showSuccess(message) {
  elements.successMessage.style.display = 'flex';
  document.getElementById('successText').textContent = message;
  setTimeout(() => {
    elements.successMessage.style.display = 'none';
  }, 3000);
}

/**
 * Hide all messages
 */
function hideMessages() {
  elements.errorMessage.style.display = 'none';
  elements.successMessage.style.display = 'none';
}

/**
 * Update statistics display
 */
function updateStatistics(stats) {
  elements.totalObjects.textContent = stats.total || 0;
  elements.avgProgress.textContent = `${stats.averageProgress || 0}%`;
  elements.completedCount.textContent = stats.byStatus?.COMPLETED || 0;
  elements.inProgressCount.textContent = stats.byStatus?.IN_PROGRESS || 0;
  elements.lastUpdated.textContent = new Date().toLocaleString();
}

/**
 * Get progress bar color class based on percentage
 */
function getProgressColorClass(progress) {
  if (progress < 30) return 'progress-low';
  if (progress < 70) return 'progress-medium';
  return 'progress-high';
}

/**
 * Format status for display
 */
function formatStatus(status) {
  return status.replace(/_/g, ' ');
}

/**
 * Create a tile element for a RICE object
 */
function createTile(obj) {
  const tile = document.createElement('div');
  tile.className = 'object-tile';
  tile.onclick = () => showObjectDetails(obj);
  
  const progressColorClass = getProgressColorClass(obj.progress);
  
  tile.innerHTML = `
    <div class="tile-header">
      <div class="tile-rice-id">${obj.riceId}</div>
      <div class="tile-object-name">${obj.objectName}</div>
      <span class="tile-type">${obj.objectType}</span>
    </div>
    <div class="tile-body">
      <div class="tile-info">
        <div class="tile-info-item">
          <span class="tile-info-label">Status:</span>
          <span class="status-badge status-${obj.status}">${formatStatus(obj.status)}</span>
        </div>
        <div class="tile-info-item">
          <span class="tile-info-label">Files:</span>
          <span class="tile-info-value">${obj.filesUsed.length}</span>
        </div>
        <div class="tile-info-item">
          <span class="tile-info-label">Resources:</span>
          <span class="tile-info-value">${obj.resourceNames.length}</span>
        </div>
      </div>
    </div>
    <div class="tile-footer">
      <div class="progress-container">
        <div class="progress-label">
          <span>Progress</span>
          <span>${obj.progress}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar ${progressColorClass}" style="width: ${obj.progress}%"></div>
        </div>
      </div>
    </div>
  `;
  
  return tile;
}

/**
 * Render tiles in the grid
 */
function renderTiles(objects) {
  elements.objectsGrid.innerHTML = '';
  
  if (objects.length === 0) {
    elements.objectsGrid.style.display = 'none';
    elements.emptyState.style.display = 'block';
    return;
  }
  
  elements.objectsGrid.style.display = 'grid';
  elements.emptyState.style.display = 'none';
  
  objects.forEach(obj => {
    const tile = createTile(obj);
    elements.objectsGrid.appendChild(tile);
  });
}

/**
 * Show object details in modal
 */
function showObjectDetails(obj) {
  // Update modal title
  elements.modalTitle.textContent = `${obj.riceId} - ${obj.objectName}`;
  
  // Update basic information
  document.getElementById('detailRiceId').textContent = obj.riceId;
  document.getElementById('detailObjectName').textContent = obj.objectName;
  document.getElementById('detailObjectType').textContent = obj.objectType;
  
  const statusBadge = document.getElementById('detailStatus');
  statusBadge.textContent = formatStatus(obj.status);
  statusBadge.className = `status-badge status-${obj.status}`;
  
  document.getElementById('detailProgress').textContent = `${obj.progress}%`;
  document.getElementById('detailStartDate').textContent = obj.startDate || 'Not set';
  document.getElementById('detailTargetDate').textContent = obj.targetDate || 'Not set';
  
  // Update description
  document.getElementById('detailDescription').textContent = obj.description || 'No description available.';
  
  // Update files list
  const filesList = document.getElementById('detailFiles');
  filesList.innerHTML = '';
  if (obj.filesUsed.length === 0) {
    filesList.innerHTML = '<li>No files specified</li>';
  } else {
    obj.filesUsed.forEach(file => {
      const li = document.createElement('li');
      li.textContent = file;
      filesList.appendChild(li);
    });
  }
  
  // Update resources list
  const resourcesList = document.getElementById('detailResources');
  resourcesList.innerHTML = '';
  if (obj.resourceNames.length === 0) {
    resourcesList.innerHTML = '<li>No resources assigned</li>';
  } else {
    obj.resourceNames.forEach(resource => {
      const li = document.createElement('li');
      li.textContent = resource;
      resourcesList.appendChild(li);
    });
  }
  
  // Show modal
  elements.detailModal.classList.add('active');
}

/**
 * Close modal
 */
function closeModal() {
  elements.detailModal.classList.remove('active');
}

/**
 * Apply filters to objects
 */
function applyFilters() {
  filteredObjects = allObjects.filter(obj => {
    // Search filter
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      const matchesSearch = 
        obj.riceId.toLowerCase().includes(searchLower) ||
        obj.objectName.toLowerCase().includes(searchLower) ||
        obj.filesUsed.some(f => f.toLowerCase().includes(searchLower)) ||
        obj.resourceNames.some(r => r.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (currentFilters.status && obj.status !== currentFilters.status) {
      return false;
    }
    
    // Type filter
    if (currentFilters.type && obj.objectType !== currentFilters.type) {
      return false;
    }
    
    return true;
  });
  
  renderTiles(filteredObjects);
}

/**
 * Load and display data
 */
async function loadData() {
  try {
    showLoading();
    
    const result = await fetchBuilds();
    
    if (result.success) {
      allObjects = result.data;
      filteredObjects = allObjects;
      updateStatistics(result.statistics);
      applyFilters();
      hideLoading();
    } else {
      throw new Error(result.error || 'Failed to load data');
    }
  } catch (error) {
    console.error('Error loading data:', error);
    hideLoading();
    showError(`Failed to load data: ${error.message}`);
  }
}

/**
 * Handle refresh button click
 */
async function handleRefresh() {
  try {
    showLoading();
    
    const result = await refreshData();
    
    if (result.success) {
      allObjects = result.data;
      filteredObjects = allObjects;
      updateStatistics(result.statistics);
      applyFilters();
      hideLoading();
      showSuccess(`Data refreshed successfully! Loaded ${result.data.length} objects.`);
    } else {
      throw new Error(result.error || 'Failed to refresh data');
    }
  } catch (error) {
    console.error('Error refreshing data:', error);
    hideLoading();
    showError(`Failed to refresh data: ${error.message}`);
  }
}

/**
 * Handle search
 */
function handleSearch() {
  currentFilters.search = elements.searchInput.value.trim();
  applyFilters();
}

/**
 * Clear search and filters
 */
function clearSearch() {
  elements.searchInput.value = '';
  elements.statusFilter.value = '';
  elements.typeFilter.value = '';
  currentFilters = {
    search: '',
    status: '',
    type: ''
  };
  applyFilters();
}

// ============================================
// Event Listeners
// ============================================

// Refresh button
elements.refreshBtn.addEventListener('click', handleRefresh);

// Search button
elements.searchBtn.addEventListener('click', handleSearch);

// Clear search button
elements.clearSearchBtn.addEventListener('click', clearSearch);

// Search on Enter key
elements.searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleSearch();
  }
});

// Status filter
elements.statusFilter.addEventListener('change', (e) => {
  currentFilters.status = e.target.value;
  applyFilters();
});

// Type filter
elements.typeFilter.addEventListener('change', (e) => {
  currentFilters.type = e.target.value;
  applyFilters();
});

// Modal close button
elements.modalClose.addEventListener('click', closeModal);

// Close modal when clicking outside
elements.detailModal.addEventListener('click', (e) => {
  if (e.target === elements.detailModal) {
    closeModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && elements.detailModal.classList.contains('active')) {
    closeModal();
  }
});

// ============================================
// Initialization
// ============================================

// Load data when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Build Tracker initialized');
  loadData();
});

// Auto-refresh every 5 minutes (optional)
// setInterval(loadData, 5 * 60 * 1000);

// Made with Bob


// ============================================
// AI Chat Widget Functions
// ============================================

const aiChat = {
  isOpen: false,
  isConnected: false,
  
  elements: {
    toggle: document.getElementById('aiChatToggle'),
    panel: document.getElementById('aiChatPanel'),
    close: document.getElementById('aiChatClose'),
    messages: document.getElementById('aiChatMessages'),
    input: document.getElementById('aiChatInput'),
    send: document.getElementById('aiChatSend'),
    statusIndicator: document.getElementById('aiStatusIndicator'),
    statusText: document.getElementById('aiStatusText'),
    uploadSchema: document.getElementById('aiUploadSchema'),
    uploadData: document.getElementById('aiUploadData')
  },
  
  /**
   * Initialize AI chat
   */
  init() {
    this.checkStatus();
    this.attachEventListeners();
  },
  
  /**
   * Check Context Studio connection status
   */
  async checkStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/context-studio/status`);
      const result = await response.json();
      
      this.isConnected = result.enabled;
      this.updateStatus(result.enabled, result.message);
    } catch (error) {
      console.error('Error checking AI status:', error);
      this.updateStatus(false, 'Connection error');
    }
  },
  
  /**
   * Update status indicator
   */
  updateStatus(connected, message) {
    this.elements.statusIndicator.className = `status-indicator ${connected ? 'connected' : 'disconnected'}`;
    this.elements.statusText.textContent = message;
    
    // Enable/disable upload buttons
    this.elements.uploadSchema.disabled = !connected;
    this.elements.uploadData.disabled = !connected;
  },
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Toggle chat panel
    this.elements.toggle.addEventListener('click', () => this.toggle());
    this.elements.close.addEventListener('click', () => this.close());
    
    // Send message
    this.elements.send.addEventListener('click', () => this.sendMessage());
    this.elements.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Upload actions
    this.elements.uploadSchema.addEventListener('click', () => this.uploadSchema());
    this.elements.uploadData.addEventListener('click', () => this.uploadData());
  },
  
  /**
   * Toggle chat panel
   */
  toggle() {
    this.isOpen = !this.isOpen;
    this.elements.panel.style.display = this.isOpen ? 'flex' : 'none';
    
    if (this.isOpen) {
      this.elements.input.focus();
    }
  },
  
  /**
   * Close chat panel
   */
  close() {
    this.isOpen = false;
    this.elements.panel.style.display = 'none';
  },
  
  /**
   * Add message to chat
   */
  addMessage(text, type = 'assistant') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${type}`;
    messageDiv.textContent = text;
    
    this.elements.messages.appendChild(messageDiv);
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    
    return messageDiv;
  },
  
  /**
   * Add loading message
   */
  addLoadingMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'ai-message loading';
    messageDiv.textContent = 'Thinking';
    
    this.elements.messages.appendChild(messageDiv);
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    
    return messageDiv;
  },
  
  /**
   * Send message to AI
   */
  async sendMessage() {
    const question = this.elements.input.value.trim();
    
    if (!question) return;
    
    if (!this.isConnected) {
      this.addMessage('⚠️ Context Studio is not connected. Please upload schema and data first.', 'error');
      return;
    }
    
    // Add user message
    this.addMessage(question, 'user');
    this.elements.input.value = '';
    
    // Add loading message
    const loadingMsg = this.addLoadingMessage();
    this.elements.send.disabled = true;
    
    try {
      const response = await fetch(`${API_BASE_URL}/context-studio/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
      });
      
      const result = await response.json();
      
      // Remove loading message
      loadingMsg.remove();
      
      if (result.success) {
        this.addMessage(result.answer, 'assistant');
      } else {
        this.addMessage(`❌ ${result.error || 'Failed to get answer'}`, 'error');
      }
    } catch (error) {
      console.error('Error querying AI:', error);
      loadingMsg.remove();
      this.addMessage('❌ Error communicating with AI. Please try again.', 'error');
    } finally {
      this.elements.send.disabled = false;
      this.elements.input.focus();
    }
  },
  
  /**
   * Upload schema to Context Studio
   */
  async uploadSchema() {
    this.elements.uploadSchema.disabled = true;
    const loadingMsg = this.addMessage('📤 Uploading schema to Context Studio...', 'assistant');
    
    try {
      const response = await fetch(`${API_BASE_URL}/context-studio/upload-schema`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      loadingMsg.remove();
      
      if (result.success) {
        this.addMessage('✅ Schema uploaded successfully! You can now upload data.', 'assistant');
      } else {
        this.addMessage(`❌ Failed to upload schema: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error uploading schema:', error);
      loadingMsg.remove();
      this.addMessage('❌ Error uploading schema. Please try again.', 'error');
    } finally {
      this.elements.uploadSchema.disabled = false;
    }
  },
  
  /**
   * Upload data to Context Studio
   */
  async uploadData() {
    this.elements.uploadData.disabled = true;
    const loadingMsg = this.addMessage('📊 Uploading current data to Context Studio...', 'assistant');
    
    try {
      const response = await fetch(`${API_BASE_URL}/context-studio/upload-data`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      loadingMsg.remove();
      
      if (result.success) {
        this.addMessage(`✅ Data uploaded successfully! ${result.count} objects are now queryable. Try asking me questions!`, 'assistant');
      } else {
        this.addMessage(`❌ Failed to upload data: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error uploading data:', error);
      loadingMsg.remove();
      this.addMessage('❌ Error uploading data. Please try again.', 'error');
    } finally {
      this.elements.uploadData.disabled = false;
    }
  }
};

// Initialize AI chat when page loads
document.addEventListener('DOMContentLoaded', () => {
  aiChat.init();
});
