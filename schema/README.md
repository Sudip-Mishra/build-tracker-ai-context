# Build Tracker Schema Documentation

## Overview

This JSON-LD schema defines the domain model for a Project Build Tracker system that manages RICE objects (Reports, Interfaces, Conversions, Enhancements) used in software development projects.

## Schema Structure

The schema follows the Semantic Requirements Ontology (SRO) format and includes:

### Entities

1. **RICEObject** - Base entity for all RICE objects
   - Identity Key: `riceId`
   - Human Reference: `objectName`
   - States: NotStarted → InProgress → Testing → Completed → Deployed
   - Relationships: Files, Resources, Projects

2. **Report** - Reporting objects (extends RICEObject)
   - Additional attributes: reportType, outputFormat, schedule
   - Types: OPERATIONAL, ANALYTICAL, DASHBOARD, ADHOC

3. **Interface** - Integration interfaces (extends RICEObject)
   - Additional attributes: interfaceType, protocol, sourceSystem, targetSystem
   - Types: INBOUND, OUTBOUND, BIDIRECTIONAL
   - Protocols: REST, SOAP, FILE, DATABASE, MESSAGE_QUEUE

4. **Conversion** - Data conversion/migration objects (extends RICEObject)
   - Additional attributes: conversionType, sourceFormat, targetFormat, recordCount
   - Types: ONE_TIME, RECURRING

5. **Enhancement** - System enhancements (extends RICEObject)
   - Additional attributes: enhancementType, impactLevel, affectedModules
   - Types: NEW_FEATURE, MODIFICATION, OPTIMIZATION

6. **File** - Files used in RICE objects
   - Identity Key: `filePath`
   - Human Reference: `fileName`
   - Types: SOURCE_CODE, CONFIGURATION, DOCUMENTATION, DATABASE, TEST_SCRIPT

7. **Resource** - People working on objects
   - Identity Key: `resourceId`
   - Human Reference: `resourceName`
   - Roles: DEVELOPER, TECHNICAL_LEAD, ANALYST, TESTER, PROJECT_MANAGER, ARCHITECT

8. **Project** - Container for RICE objects
   - Identity Key: `projectId`
   - Human Reference: `projectName`
   - States: Planning → Active → Completed/Cancelled

### Operations

1. **UsesFile** - Links RICE objects to files
2. **AssignedTo** - Assigns resources to RICE objects
3. **DependsOn** - Defines dependencies between RICE objects
4. **BelongsToProject** - Associates RICE objects with projects
5. **UpdateProgress** - Updates progress percentage

### States

**RICE Object States:**
- NotStarted
- InProgress
- OnHold
- Blocked
- InReview
- Testing
- Completed (terminal)
- Deployed (terminal)

**Project States:**
- ProjectPlanning
- ProjectActive
- ProjectOnHold
- ProjectCompleted (terminal)
- ProjectCancelled (terminal)

## Key Invariants

### RICEObject
- `riceId` must be unique
- `progress` must be between 0 and 100
- Must have at least one file associated
- Must have at least one resource assigned

### File
- `filePath` must be unique
- `fileName` must not be empty

### Resource
- `resourceId` must be unique
- `email` must be valid format
- `availability` must be between 0 and 100

### Project
- `projectId` must be unique
- `endDate` must be after `startDate`
- Must have at least one RICE object

## Usage in Context Studio

### Uploading the Schema

1. Navigate to your Context Studio
2. Go to Schema Management
3. Upload `build-tracker-schema.jsonld`
4. The system will validate and register all entities, operations, and states

### Querying RICE Objects

Example queries you can perform:

```sparql
# Find all RICE objects in progress
SELECT ?object ?name ?progress
WHERE {
  ?object a bt:RICEObject ;
          bt:objectName ?name ;
          bt:progress ?progress ;
          bt:status "IN_PROGRESS" .
}

# Find all files used in a specific RICE object
SELECT ?file ?fileName
WHERE {
  bt:object-001 bt:usesFile ?file .
  ?file bt:fileName ?fileName .
}

# Find all resources working on blocked objects
SELECT ?resource ?name ?object
WHERE {
  ?object a bt:RICEObject ;
          bt:status "BLOCKED" ;
          bt:assignedTo ?resource .
  ?resource bt:resourceName ?name .
}

# Find objects by file name
SELECT ?object ?objectName
WHERE {
  ?file bt:fileName "SalesReportGenerator.java" ;
        bt:usedInObject ?object .
  ?object bt:objectName ?objectName .
}
```

## Integration with Excel Data

The schema is designed to map directly to Excel columns:

| Excel Column | Schema Attribute | Entity |
|--------------|------------------|--------|
| RICE ID | riceId | RICEObject |
| Object Name | objectName | RICEObject |
| Progress % | progress | RICEObject |
| Status | status | RICEObject |
| Files Used | fileName | File (via UsesFile) |
| Resource Names | resourceName | Resource (via AssignedTo) |

## Web Application Integration

The schema supports the following web application features:

1. **Tile Display**: Each tile shows `riceId`, `objectName`, and `progress`
2. **Progress Bar**: Visual representation of `progress` attribute (0-100)
3. **Status Colors**: Based on `status` state
4. **Modal Details**: Shows related `File` and `Resource` entities
5. **Search by File**: Query files to find which objects use them
6. **Filter by Status**: Query objects by their current state

## Events

The schema defines events emitted during state transitions:

- `ObjectStarted` - When object moves to InProgress
- `ObjectProgressUpdated` - When progress is updated
- `ObjectBlocked` - When object becomes blocked
- `ObjectCompleted` - When object reaches Completed state
- `ObjectDeployed` - When object is deployed

## Best Practices

1. **Always assign at least one resource** to each RICE object
2. **Track all files** used in an object for complete traceability
3. **Update progress regularly** to maintain accurate status
4. **Document dependencies** between objects to manage workflow
5. **Use appropriate object types** (Report, Interface, Conversion, Enhancement) for better categorization

## Example Data Structure

```json
{
  "@context": "build-tracker-schema.jsonld",
  "@graph": [
    {
      "@id": "bt:object-001",
      "@type": "bt:Report",
      "bt:riceId": "R-001",
      "bt:objectName": "Monthly Sales Report",
      "bt:progress": 75,
      "bt:status": "bt:InProgress",
      "bt:reportType": "ANALYTICAL",
      "bt:outputFormat": "PDF"
    }
  ]
}
```

## Support

For questions or issues with the schema:
1. Verify the schema structure matches SRO format
2. Check that all required attributes are present
3. Ensure invariants are satisfied
4. Validate state transitions are allowed

## Version

Schema Version: 1.0.0
Last Updated: 2026-05-25