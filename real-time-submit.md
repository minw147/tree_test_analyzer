# Implementation Plan: Real-time Data Submission & Status Management

This document outlines the robust implementation of real-time data submission in the Tree Test Analyzer, incorporating critical lessons learned about status terminology and case-sensitive data parsing.

## 1. Status Terminology: Use "Incomplete" from the Start

**CRITICAL LESSON**: Avoid using "Abandoned" as a status label. It carries a negative connotation and often leads to confusion when data is partially saved. 

*   **Rule**: All participants start as **"Incomplete"**.
*   **Transition**: They only transition to **"Completed"** if they reach the final "Thank You" screen.
*   **Benefits**: This simplifies the UI logic and ensures that partially finished tests (the primary goal of real-time submission) are labeled descriptively.

## 2. Dynamic Google Apps Script Integration

To avoid the "stale script" problem where users are using an old version of the script while the app expects a new one:

- **Template Centralization**: Keep the Google Apps Script in a standalone `.js` file (e.g., `google-apps-script-template.js`).
- **Dynamic Loading**: In the frontend (`StorageEditor.tsx`), use Vite's `?raw` import to load the script content directly into the UI.
  ```typescript
  import scriptTemplate from '../../../google-apps-script-template.js?raw';
  ```
- **Debugging Tip**: Add a **timestamp** or version number in the header of the script. This allows you to verify that the frontend is actually serving the latest version of your logic.

## 3. Robust Data Parsing (Case-Insensitive)

One of the most common points of failure in Google Sheets integration is case sensitivity and trailing whitespace.

- **Issue**: Google Sheets might store "Completed", "completed", or "Completed ".
- **Solution**: Always normalize data during parsing using `.toString().trim().toLowerCase()`.
  
**Frontend Example:**
```typescript
const rawStatus = (row["Status"] || "").toString().trim().toLowerCase();
const status = rawStatus === "completed" ? "Completed" : "Incomplete";
```

**Apps Script Example:**
```javascript
const rawStatus = (rowObj['Status'] || '').toString().trim().toLowerCase();
const status = rawStatus === 'completed' ? 'completed' : 'incomplete';
```

## 4. Apps Script Implementation: The "Upsert" Operation

The script must handle multiple `submitResult` calls for the same participant. Instead of appending new rows, it should search and update.

### Best Practice Search Strategy:
1.  **Lock the Script**: Use `LockService` to prevent race conditions during simultaneous updates.
2.  **Find the Row**: Header names must be handled case-insensitively.
3.  **Clean Duplicates**: If a bug in the frontend causes multiple rows for one participant, the script should automatically prune duplicates during the next update.

## 5. Implementation Checklist

1.  [x] **Stabilize IDs**: Generate `participantId` at test start, not end.
2.  [x] **Non-Blocking Uploads**: Call `submitResult` in the background after every task. DO NOT wait for the response to advance the UI.
3.  [x] **Initial "Incomplete" sync**: The first task submission creates the row in the sheet.
4.  [x] **Final "Completed" sync**: The result converter sends the final status update.

---

## Example: Full Google Apps Script Template
Paste the following into your Google Apps Script editor.

```javascript
/**
 * Tree Test Results - Google Apps Script 12/18/2025 9:51 PM
 * 
 * Version: 2.1.0 (Real-time & Case-Insensitive Status)
 */

// Configuration
const SHEET_NAME = 'Results';
const CONFIG_SHEET_NAME = 'StudyConfigs';

function doGet(e) {
  try {
    const action = e.parameter.action;
    const studyId = e.parameter.studyId;
    if (action === 'lookup' && studyId) {
      const result = handleFetchConfig(studyId);
      return createResponse(result);
    }
    return createResponse({ success: false, error: 'Invalid request' });
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

function doPost(e) {
  try {
    let requestData;
    if (e.parameter && e.parameter.payload) { requestData = JSON.parse(e.parameter.payload); }
    else if (e.postData && e.postData.contents) { requestData = JSON.parse(e.postData.contents); }
    else { throw new Error('No data received'); }

    const action = requestData.action;
    let result;
    switch (action) {
      case 'appendRow': result = handleAppendRow({ data: requestData.data, studyId: requestData.studyId }); break;
      case 'saveConfig': result = handleSaveConfig(requestData.studyId, requestData.config); break;
      case 'checkStatus': result = handleCheckStatus(requestData.studyId); break;
      case 'updateStatus': result = handleUpdateStatus(requestData.studyId, requestData.status); break;
      case 'fetchConfig': result = handleFetchConfig(requestData.studyId); break;
      case 'fetchResults': result = handleFetchResults(requestData.studyId); break;
      case 'test': result = { success: true, message: 'Connection successful' }; break;
      default: result = { success: false, error: 'Unknown action' };
    }
    return createResponse(result);
  } catch (error) {
    return createResponse({ success: false, error: error.toString() });
  }
}

function handleAppendRow(requestData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const rowData = requestData.data;
    const participantId = (rowData["Participant ID"] || "").toString().trim();
    
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      setupHeaders(sheet, 10);
    }

    const headers = getOrCreateHeaders(sheet, rowData);
    const rowValues = headers.map(header => rowData[header] || '');

    const lastRow = sheet.getLastRow();
    let existingRowIndex = -1;
    
    if (lastRow > 1 && participantId) {
      const allData = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getDisplayValues();
      const idColIndex = allData[0].findIndex(h => h.toString().trim().toLowerCase() === "participant id");

      if (idColIndex !== -1) {
        const targetId = participantId.toLowerCase();
        for (let i = 1; i < allData.length; i++) {
          if (allData[i][idColIndex].toString().trim().toLowerCase() === targetId) {
            existingRowIndex = i + 1;
            break;
          }
        }
      }
    }

    if (existingRowIndex !== -1) {
      sheet.getRange(existingRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    SpreadsheetApp.flush();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  } finally {
    lock.releaseLock();
  }
}

function handleFetchResults(studyId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet || sheet.getLastRow() === 0) return { results: [] };

    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const dataRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    const results = [];

    dataRows.forEach((row) => {
      if (!row[0]) return;
      const rowObj = {};
      headerRow.forEach((header, index) => { rowObj[header] = row[index]; });

      const rawStatus = (rowObj['Status'] || '').toString().trim().toLowerCase();
      const status = rawStatus === 'completed' ? 'completed' : 'incomplete';
      
      const taskResults = [];
      let taskNum = 1;
      while (rowObj[`Task ${taskNum} Path Taken`] !== undefined) {
        // ... (Parsing logic similar to template)
        taskNum++;
      }

      results.push({
        participantId: rowObj['Participant ID'],
        status: status,
        // ... other mapping fields
      });
    });

    return { results: results };
  } catch (e) { return { results: null, error: e.toString() }; }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function setupHeaders(sheet, numTasks) {
  const headers = ['Participant ID', 'Status', 'Start Time (UTC)', 'End Time (UTC)', 'Time Taken'];
  for (let i = 1; i <= numTasks; i++) {
    headers.push(`Task ${i} Path Taken`, `Task ${i} Path Outcome`, `Task ${i}: How confident are you with your answer?`, `Task ${i} Time`);
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
}

// ... Additional helper functions (getOrCreateHeaders, etc.)
```
