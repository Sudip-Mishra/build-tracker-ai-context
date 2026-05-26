# Context Studio Export Directory

This directory contains files exported for Context Studio ingestion via Git.

## Structure

```
context-exports/
├── schema/
│   └── build-tracker-schema.jsonld    # Build Tracker ontology schema
├── data/
│   └── rice-objects-*.jsonld          # RICE object data exports
└── README.md                          # This file
```

## How It Works

1. **Data Export**: When you upload data via the Build Tracker app, it writes JSON-LD files to this directory
2. **Git Commit**: The app automatically commits and pushes changes to GitHub
3. **Context Studio Ingestion**: Context Studio monitors this directory and ingests new/updated files
4. **Indexing**: Data is indexed in vector and graph databases for querying

## Files

### Schema Files
- `schema/build-tracker-schema.jsonld` - The Build Tracker ontology defining entities, relationships, and states

### Data Files
- `data/rice-objects-TIMESTAMP.jsonld` - Timestamped exports of RICE objects with all their relationships

## Configuration

This directory is monitored by Context Studio ingestion source:
- **Source ID**: `src_build_tracker_git`
- **Source Type**: Git
- **Repository**: https://github.com/Sudip-Mishra/build-tracker-ai-context
- **Branch**: main
- **Path**: context-exports/

## Notes

- All files in this directory are Git-tracked
- Files are automatically committed and pushed by the application
- Do not manually edit files in this directory
- Context Studio polls for changes every 5 minutes (or uses webhooks)