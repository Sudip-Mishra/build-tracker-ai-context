# Build Tracker Excel Template Guide

## Excel File Structure

Your Excel file should contain the following columns to properly map to the Build Tracker schema:

### Required Columns

| Column Name | Data Type | Description | Example |
|-------------|-----------|-------------|---------|
| RICE ID | Text | Unique identifier (R-xxx, I-xxx, C-xxx, E-xxx) | R-001 |
| Object Name | Text | Descriptive name of the object | Monthly Sales Report |
| Object Type | Text | REPORT, INTERFACE, CONVERSION, or ENHANCEMENT | REPORT |
| Progress % | Number | Completion percentage (0-100) | 75 |
| Status | Text | Current status | IN_PROGRESS |
| Files Used | Text | Comma-separated list of file names | SalesReport.java, report-config.xml |
| Resource Names | Text | Comma-separated list of people working | John Smith, Sarah Johnson |

### Optional Columns

| Column Name | Data Type | Description | Example |
|-------------|-----------|-------------|---------|
| Description | Text | Detailed description | Generates monthly sales summary |
| Start Date | Date | When work started | 2026-04-01 |
| Target Date | Date | Expected completion date | 2026-05-30 |
| Report Type | Text | For Reports: OPERATIONAL, ANALYTICAL, DASHBOARD, ADHOC | ANALYTICAL |
| Output Format | Text | For Reports: PDF, EXCEL, HTML, CSV | PDF |
| Interface Type | Text | For Interfaces: INBOUND, OUTBOUND, BIDIRECTIONAL | INBOUND |
| Protocol | Text | For Interfaces: REST, SOAP, FILE, DATABASE, MESSAGE_QUEUE | REST |
| Source System | Text | For Interfaces: Source system name | CRM |
| Target System | Text | For Interfaces: Target system name | SAP |
| Conversion Type | Text | For Conversions: ONE_TIME, RECURRING | ONE_TIME |
| Enhancement Type | Text | For Enhancements: NEW_FEATURE, MODIFICATION, OPTIMIZATION | NEW_FEATURE |
| Impact Level | Text | For Enhancements: LOW, MEDIUM, HIGH, CRITICAL | HIGH |

## Status Values

Use these exact values in the Status column:

- `NOT_STARTED` - Work has not begun
- `IN_PROGRESS` - Currently being worked on
- `ON_HOLD` - Temporarily paused
- `BLOCKED` - Blocked by dependencies or issues
- `IN_REVIEW` - Under review
- `TESTING` - Being tested
- `COMPLETED` - Work completed
- `DEPLOYED` - Deployed to production

## Sample Excel Data (Oracle EBS R12.2 Project)

### Sheet 1: RICE Objects

| RICE ID | Object Name | Object Type | Progress % | Status | Files Used | Resource Names | Description | Start Date | Target Date |
|---------|-------------|-------------|------------|--------|------------|----------------|-------------|------------|-------------|
| R-001 | iProcurement Requisition Status Report | REPORT | 75 | IN_PROGRESS | XXPO_IPROC_REQ_STATUS_RPT.rdf, XXPO_IPROC_REQ_STATUS_PKG.pks, XXPO_IPROC_REQ_STATUS_PKG.pkb, XXPO_IPROC_REQ_STATUS_RPT.xml | Rajesh Kumar, Priya Sharma | Custom report showing iProcurement requisition status with approval hierarchy and buyer assignments | 2026-04-01 | 2026-05-30 |
| I-002 | PO to External Vendor System Interface | INTERFACE | 45 | IN_PROGRESS | XXPO_VENDOR_INT_PKG.pks, XXPO_VENDOR_INT_PKG.pkb, XXPO_VENDOR_INT_STG.sql, XXPO_VENDOR_INT_CONC.prog, vendor_interface_mapping.xml | Amit Patel, Sneha Reddy | Outbound interface to send PO data to external vendor portal via REST API | 2026-03-15 | 2026-06-15 |
| C-003 | Legacy Supplier Data Migration | CONVERSION | 90 | TESTING | XXPO_SUPPLIER_CONV_STG.sql, XXPO_SUPPLIER_CONV_PKG.pks, XXPO_SUPPLIER_CONV_PKG.pkb, XXPO_SUPPLIER_CONV_VAL.sql, supplier_migration_test_cases.xlsx | Rajesh Kumar, Vikram Singh | One-time conversion to migrate supplier master data from legacy system to AP_SUPPLIERS and PO_VENDORS | 2026-02-01 | 2026-05-20 |
| E-004 | Custom Account Generator for PO | ENHANCEMENT | 30 | BLOCKED | XXPO_CUSTOM_ACCT_GEN_PKG.pks, XXPO_CUSTOM_ACCT_GEN_PKG.pkb, XXPO_ACCT_GEN_RULES.sql, po_account_generator_setup.doc | Priya Sharma | Custom workflow account generator to derive GL accounts based on item category, location, and cost center for PO distributions | 2026-04-20 | 2026-07-01 |
| E-005 | Custom AP Invoice Validation Rules | ENHANCEMENT | 100 | COMPLETED | XXAP_INVOICE_VALIDATION_PKG.pks, XXAP_INVOICE_VALIDATION_PKG.pkb, XXAP_CUSTOM_VALIDATIONS.sql, ap_validation_rules_config.xlsx | Amit Patel | Custom validation rules for AP invoices including tolerance checks, duplicate invoice detection, and mandatory field validations | 2026-01-10 | 2026-04-30 |

### Sheet 2: Files (Optional - for detailed file tracking)

| File Name | File Path | File Type | File Extension | Last Modified | Used In RICE ID |
|-----------|-----------|-----------|----------------|---------------|-----------------|
| XXPO_IPROC_REQ_STATUS_RPT.rdf | $XXPO_TOP/reports/US/XXPO_IPROC_REQ_STATUS_RPT.rdf | SOURCE_CODE | .rdf | 2026-05-20 | R-001 |
| XXPO_IPROC_REQ_STATUS_PKG.pks | $XXPO_TOP/sql/XXPO_IPROC_REQ_STATUS_PKG.pks | DATABASE | .pks | 2026-05-18 | R-001 |
| XXPO_IPROC_REQ_STATUS_PKG.pkb | $XXPO_TOP/sql/XXPO_IPROC_REQ_STATUS_PKG.pkb | DATABASE | .pkb | 2026-05-18 | R-001 |
| XXPO_VENDOR_INT_PKG.pks | $XXPO_TOP/sql/XXPO_VENDOR_INT_PKG.pks | DATABASE | .pks | 2026-05-22 | I-002 |
| XXPO_VENDOR_INT_PKG.pkb | $XXPO_TOP/sql/XXPO_VENDOR_INT_PKG.pkb | DATABASE | .pkb | 2026-05-22 | I-002 |
| XXPO_VENDOR_INT_STG.sql | $XXPO_TOP/sql/XXPO_VENDOR_INT_STG.sql | DATABASE | .sql | 2026-05-15 | I-002 |
| vendor_interface_mapping.xml | $XXPO_TOP/config/vendor_interface_mapping.xml | CONFIGURATION | .xml | 2026-05-21 | I-002 |
| XXPO_SUPPLIER_CONV_PKG.pks | $XXPO_TOP/sql/XXPO_SUPPLIER_CONV_PKG.pks | DATABASE | .pks | 2026-05-10 | C-003 |
| XXPO_SUPPLIER_CONV_PKG.pkb | $XXPO_TOP/sql/XXPO_SUPPLIER_CONV_PKG.pkb | DATABASE | .pkb | 2026-05-10 | C-003 |
| XXPO_CUSTOM_ACCT_GEN_PKG.pks | $XXPO_TOP/sql/XXPO_CUSTOM_ACCT_GEN_PKG.pks | DATABASE | .pks | 2026-05-05 | E-004 |
| XXPO_CUSTOM_ACCT_GEN_PKG.pkb | $XXPO_TOP/sql/XXPO_CUSTOM_ACCT_GEN_PKG.pkb | DATABASE | .pkb | 2026-05-05 | E-004 |
| XXAP_INVOICE_VALIDATION_PKG.pks | $XXAP_TOP/sql/XXAP_INVOICE_VALIDATION_PKG.pks | DATABASE | .pks | 2026-04-25 | E-005 |
| XXAP_INVOICE_VALIDATION_PKG.pkb | $XXAP_TOP/sql/XXAP_INVOICE_VALIDATION_PKG.pkb | DATABASE | .pkb | 2026-04-25 | E-005 |

### Sheet 3: Resources (Optional - for detailed resource tracking)

| Resource ID | Resource Name | Email | Role | Availability % | Working On RICE IDs |
|-------------|---------------|-------|------|----------------|---------------------|
| EMP001 | Rajesh Kumar | rajesh.kumar@company.com | DEVELOPER | 80 | R-001, C-003 |
| EMP002 | Priya Sharma | priya.sharma@company.com | TECHNICAL_LEAD | 60 | R-001, E-004 |
| EMP003 | Amit Patel | amit.patel@company.com | DEVELOPER | 100 | I-002, E-005 |
| EMP004 | Sneha Reddy | sneha.reddy@company.com | ANALYST | 75 | I-002 |
| EMP005 | Vikram Singh | vikram.singh@company.com | TESTER | 90 | C-003 |

## Data Validation Rules

### RICE ID Format
- Reports: `R-###` (e.g., R-001, R-002)
- Interfaces: `I-###` (e.g., I-001, I-002)
- Conversions: `C-###` (e.g., C-001, C-002)
- Enhancements: `E-###` (e.g., E-001, E-002)

### Progress Percentage
- Must be a number between 0 and 100
- No decimal places recommended
- Automatically updates status when reaches 100

### Comma-Separated Lists
- Files Used: Separate multiple files with commas
  - Example: `file1.java, file2.xml, file3.sql`
- Resource Names: Separate multiple people with commas
  - Example: `John Smith, Sarah Johnson, Michael Chen`

## Tips for Data Entry

1. **Keep RICE IDs Unique**: Never reuse a RICE ID
2. **Update Progress Regularly**: Keep progress percentages current
3. **Use Consistent Names**: Use the same resource names across all entries
4. **Track All Files**: List all files associated with each object
5. **Set Realistic Dates**: Ensure target dates are achievable
6. **Update Status**: Change status as work progresses
7. **Document Blockers**: Use BLOCKED status and add notes in description

## Excel File Location

Place your Excel file in a designated directory that the web application can access:

**Recommended Path Structure:**
```
project-root/
├── data/
│   └── build-tracker.xlsx  (Your Excel file)
├── backend/
│   └── server.js
└── frontend/
    └── index.html
```

## Automated Updates

The web application will:
1. Read the Excel file from the configured directory
2. Parse all sheets (primarily the RICE Objects sheet)
3. Transform data into the schema format
4. Display on the web dashboard
5. Allow manual refresh to reload latest data

## Common Issues and Solutions

### Issue: Data not appearing in web app
**Solution:** 
- Check Excel file is in correct directory
- Verify column names match exactly (case-sensitive)
- Ensure no empty required fields

### Issue: Progress bar not showing correctly
**Solution:**
- Verify Progress % column contains numbers (not text)
- Check values are between 0-100
- Remove any % symbols from the data

### Issue: Files or Resources not displaying
**Solution:**
- Check comma separation (no extra spaces)
- Verify names are spelled consistently
- Ensure no special characters causing parsing issues

### Issue: Status colors not working
**Solution:**
- Use exact status values from the list above
- Check for typos or extra spaces
- Use uppercase with underscores (e.g., IN_PROGRESS not In Progress)

## Next Steps

1. Create your Excel file using this template
2. Save it as `build-tracker.xlsx`
3. Place it in the `data/` directory
4. Configure the backend to read from this location
5. Start the web application
6. Click refresh to load the data

## Support

If you encounter issues:
1. Verify Excel file format matches this guide
2. Check that all required columns are present
3. Validate data types are correct
4. Review the schema documentation for entity requirements