# CSV Import/Export Feature

## Overview
All management pages now support CSV import and export functionality, making it easy to bulk manage data.

## Features Added

### 1. **Institutions Page**
- **Export CSV**: Download all institutions as CSV
- **Import CSV**: Upload institutions from CSV
- **Format**: `name,code` (code is optional)

### 2. **Adjudicators Page**
- **Export CSV**: Download all adjudicators as CSV
- **Import CSV**: Upload adjudicators from CSV
- **Format**: `name,institution,strength,email,phone`
- **Smart Institution Matching**: Matches institution names to existing institutions

### 3. **Rooms Page**
- **Export CSV**: Download all rooms as CSV
- **Import CSV**: Upload rooms from CSV
- **Format**: `name,capacity`

### 4. **Teams Page** (Already existed)
- **Export CSV**: Download all teams as CSV
- **Import CSV**: Upload teams from CSV
- **Format**: `name,institution,speaker1,speaker2,speaker3`

## How to Use

### Export Data
1. Go to any management page (Institutions, Adjudicators, Rooms, Teams)
2. Click the **"Export CSV"** button
3. CSV file downloads automatically

### Import Data
1. Go to any management page
2. Click the **"Import CSV"** button
3. Paste your CSV data in the textarea
4. Click **"Import"**
5. Data is imported and page refreshes

## CSV Format Examples

### Institutions
```csv
name,code
Harvard University,HAR
Oxford University,OXF
Cambridge University,CAM
```

### Adjudicators
```csv
name,institution,strength,email,phone
Prof. Sarah Williams,Harvard University,9.5,sarah@harvard.edu,+1-617-555-0123
Dr. Michael Chen,Oxford University,9.0,michael@oxford.edu,+44-20-7946-0958
Judge Maria Rodriguez,Cambridge University,8.5,maria@cam.ac.uk,+44-1223-334400
```

### Rooms
```csv
name,capacity
Main Hall,50
Room 101,30
Room 102,30
Room 103,25
```

### Teams
```csv
name,institution,speaker1,speaker2,speaker3
Oxford Union,Oxford University,Alice Johnson,Bob Smith,Carol Davis
Cambridge Union,Cambridge University,David Wilson,Eva Brown,Frank Miller
Harvard Debate Society,Harvard University,Grace Lee,Henry Taylor,Ivy Chen
```

## Import Order

For best results, import in this order:
1. **Institutions** first
2. **Rooms** second
3. **Adjudicators** third (depends on institutions)
4. **Teams** last (depends on institutions)

## Error Handling

- **Validation**: Checks for required columns
- **Data Type Conversion**: Automatically converts numbers and handles nulls
- **Institution Matching**: For adjudicators, matches institution names to existing institutions
- **Error Messages**: Clear error messages for invalid data
- **Success Feedback**: Shows number of records imported

## Technical Details

### Files Modified
- `src/pages/dashboard/Institutions.tsx`
- `src/pages/dashboard/Adjudicators.tsx`
- `src/pages/dashboard/Rooms.tsx`
- `src/pages/dashboard/Teams.tsx` (already had this)

### Features
- **CSV Parsing**: Simple comma-separated parsing
- **Data Validation**: Required field checking
- **Type Conversion**: Automatic number parsing
- **Bulk Insert**: Efficient database operations
- **UI Integration**: Modal dialogs with format examples

### Sample Data Files
The following CSV files are provided for testing:
- `institutions_import.csv` - 12 sample institutions
- `adjudicators_import.csv` - 12 sample adjudicators
- `rooms_import.csv` - 12 sample rooms
- `teams_import.csv` - 12 sample teams

## Usage Tips

1. **Copy from Excel**: You can copy data from Excel and paste directly into the import modal
2. **Headers Required**: Always include header row in your CSV
3. **Institution Names**: For adjudicators, use exact institution names as they appear in the system
4. **Empty Fields**: Leave fields empty for optional data (will be stored as null)
5. **Capacity Defaults**: Rooms without capacity will default to 20

This feature makes it much easier to set up tournaments with large amounts of data!
