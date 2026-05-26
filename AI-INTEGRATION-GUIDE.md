# 🤖 AI Integration Guide - Context Studio

Complete guide for using AI-powered queries in your Build Tracker.

## 🎯 What's Been Added

### **New Features:**
1. **AI Chat Widget** - Floating chat button in bottom-right corner
2. **Natural Language Queries** - Ask questions in plain English
3. **Schema Upload** - One-click upload to Context Studio
4. **Data Sync** - Automatic data transformation and upload
5. **Real-time Answers** - Get instant AI-powered insights

---

## 🚀 Quick Start

### **Step 1: Install New Dependency**

Stop your server (Ctrl+C) and run:

```powershell
cd backend
npm install
```

This installs the `axios` library needed for Context Studio communication.

### **Step 2: Restart Server**

```powershell
npm start
```

### **Step 3: Open Dashboard**

Go to http://localhost:3000

You'll see a new **🤖 AI button** in the bottom-right corner!

---

## 💬 Using the AI Chat

### **Opening the Chat**

Click the **🤖 button** in the bottom-right corner.

The chat panel will slide up showing:
- Connection status
- Welcome message with example questions
- Input box for your questions
- Upload buttons

### **First Time Setup**

Before asking questions, you need to upload your data:

1. **Click "📤 Upload Schema"**
   - Uploads the build tracker schema to Context Studio
   - Defines what entities and relationships exist
   - Only needs to be done once

2. **Click "📊 Upload Data"**
   - Uploads your current RICE objects
   - Transforms Excel data to semantic format
   - Do this whenever your data changes

3. **Start Asking Questions!**
   - Type your question in the input box
   - Press Enter or click ➤ to send
   - Wait for AI response

---

## 🎤 Example Questions You Can Ask

### **Status Queries**
```
"Which objects are blocked?"
"Show me all completed objects"
"What objects are in testing?"
"How many objects are in progress?"
```

### **File Queries**
```
"Which objects use XXPO_CUSTOM_ACCT_GEN_PKG.pkb?"
"Show me all files used in R-001"
"What files are used in iProcurement objects?"
"List all SQL files in the project"
```

### **Resource Queries**
```
"Who is working on blocked objects?"
"Show me all objects assigned to Rajesh Kumar"
"Which resources are working on Interface objects?"
"Who has the most objects assigned?"
```

### **Progress Queries**
```
"What's the average progress of all objects?"
"Show objects with less than 50% progress"
"Which objects are behind schedule?"
"What's the progress of Enhancement objects?"
```

### **Dependency Queries**
```
"What objects depend on E-004?"
"Show me the dependency chain for R-001"
"Which objects are blocking others?"
```

### **Complex Queries**
```
"Show me all blocked Interface objects and who's working on them"
"What files are shared between R-001 and I-002?"
"Which resources are overallocated?"
"What's the critical path to complete all PO objects?"
```

---

## 🔧 How It Works

### **Architecture**

```
Your Dashboard
     ↓
  Ask Question
     ↓
Node.js Backend
     ↓
Transform to Semantic Query
     ↓
Context Studio MCP
     ↓
AI Processing
     ↓
Answer Returned
     ↓
Display in Chat
```

### **Data Flow**

1. **Excel → JSON-LD Transformation**
   - Your Excel data is converted to semantic format
   - Entities: RICEObject, File, Resource
   - Relationships: UsesFile, AssignedTo, DependsOn

2. **Upload to Context Studio**
   - Schema defines the structure
   - Data populates the knowledge graph
   - AI can now reason over your data

3. **Query Processing**
   - Your question is sent to Context Studio
   - AI understands the semantic relationships
   - Generates answer based on your data

---

## 🎨 Chat Interface Features

### **Status Indicator**
- **Green dot (●)**: Connected to Context Studio
- **Red dot (●)**: Not connected or error

### **Message Types**
- **Blue bubbles**: Your questions
- **Gray bubbles**: AI answers
- **Light blue**: Welcome/info messages
- **Red**: Error messages

### **Upload Buttons**
- **📤 Upload Schema**: One-time setup
- **📊 Upload Data**: Sync current data

### **Input Box**
- Type your question
- Press Enter to send
- Shift+Enter for new line

---

## 🔄 Keeping Data in Sync

### **When to Re-upload Data**

Upload data again whenever:
- You update your Excel file
- You add new RICE objects
- Progress percentages change
- Resources are reassigned
- Files are added/removed

### **How to Re-upload**

1. Update your Excel file
2. Click "Refresh Data" in dashboard (loads new data)
3. Open AI chat
4. Click "📊 Upload Data"
5. Wait for confirmation
6. Ask questions with updated data!

---

## 🐛 Troubleshooting

### **"Context Studio is not connected"**

**Cause:** MCP configuration issue or server not running

**Solution:**
1. Check `.bob/mcp.json` exists
2. Verify MCP credentials are valid
3. Restart the server
4. Check server console for errors

### **"Failed to upload schema"**

**Possible Causes:**
- Network connectivity issue
- MCP server down
- Invalid credentials

**Solution:**
1. Check internet connection
2. Verify MCP URL is accessible
3. Check token expiration dates
4. Try again in a few minutes

### **"Failed to upload data"**

**Possible Causes:**
- No Excel data loaded
- Schema not uploaded first
- Data transformation error

**Solution:**
1. Upload schema first
2. Ensure Excel file has data
3. Click "Refresh Data" in dashboard
4. Try uploading data again

### **AI gives wrong answers**

**Possible Causes:**
- Data not uploaded
- Old data in Context Studio
- Question too vague

**Solution:**
1. Re-upload current data
2. Be more specific in questions
3. Use exact file/resource names
4. Try rephrasing the question

### **Chat widget not appearing**

**Solution:**
1. Hard refresh browser (Ctrl+F5)
2. Check browser console for errors
3. Verify all files are loaded
4. Restart server

---

## 🔐 Security Notes

### **MCP Credentials**

Your MCP credentials are stored in `.bob/mcp.json`:
- **Never commit this file to Git**
- **Keep tokens secure**
- **Tokens expire** - check expiration dates
- **Regenerate if compromised**

### **Token Expiration**

Current tokens expire around **March 2026**. When they expire:
1. Generate new tokens in Context Studio
2. Update `.bob/mcp.json`
3. Restart server

---

## 📊 API Endpoints Added

### **GET /api/context-studio/status**
Check if Context Studio is connected

```bash
curl http://localhost:3000/api/context-studio/status
```

### **POST /api/context-studio/upload-schema**
Upload schema to Context Studio

```bash
curl -X POST http://localhost:3000/api/context-studio/upload-schema
```

### **POST /api/context-studio/upload-data**
Upload current data to Context Studio

```bash
curl -X POST http://localhost:3000/api/context-studio/upload-data
```

### **POST /api/context-studio/query**
Query with natural language

```bash
curl -X POST http://localhost:3000/api/context-studio/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Which objects are blocked?"}'
```

---

## 🎓 Best Practices

### **1. Upload Schema Once**
- Only needs to be done on first use
- Or when schema structure changes
- Takes a few seconds

### **2. Upload Data Regularly**
- After Excel updates
- Before asking questions
- Keeps AI answers current

### **3. Be Specific in Questions**
- Use exact RICE IDs: "Show files in R-001"
- Use exact names: "Who is working on E-004?"
- Be clear: "blocked objects" not "stuck objects"

### **4. Use Follow-up Questions**
- Build on previous answers
- Ask for more details
- Explore relationships

### **5. Verify AI Answers**
- Cross-check with dashboard
- AI is helpful but not perfect
- Use for insights, verify for decisions

---

## 🚀 Advanced Usage

### **Combining with Dashboard**

1. **Find in Dashboard** → **Ask AI for Details**
   - See blocked object in dashboard
   - Ask AI: "Why is E-004 blocked?"

2. **AI Insight** → **Verify in Dashboard**
   - AI says "3 objects use file X"
   - Search file X in dashboard to verify

3. **Dashboard Filter** → **AI Analysis**
   - Filter to show Interface objects
   - Ask AI: "What's the average progress of Interface objects?"

### **Batch Questions**

Ask multiple related questions:
```
1. "Which objects are blocked?"
2. "Who is assigned to those objects?"
3. "What files do they use?"
4. "Are there any dependencies?"
```

### **Trend Analysis**

Track over time:
```
- Upload data daily
- Ask same questions
- Compare answers
- Identify trends
```

---

## 📝 Files Modified/Added

### **New Files:**
- `backend/contextStudioClient.js` (268 lines)
  - Context Studio MCP client
  - Data transformation
  - Query handling

### **Modified Files:**
- `backend/package.json` - Added axios dependency
- `backend/server.js` - Added 4 new API endpoints
- `frontend/index.html` - Added AI chat widget HTML
- `frontend/styles.css` - Added 324 lines of chat styling
- `frontend/app.js` - Added 217 lines of chat logic

### **Total Addition:**
- ~800 lines of new code
- 4 new API endpoints
- Complete AI chat interface

---

## 🎉 You're Ready!

Your Build Tracker now has AI superpowers! 🚀

**Next Steps:**
1. Restart your server with `npm start`
2. Open http://localhost:3000
3. Click the 🤖 button
4. Upload schema and data
5. Start asking questions!

**Have fun exploring your build tracker with AI!** 🎯