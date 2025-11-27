/**
 * Tree Test Results - Google Apps Script
 * 
 * This script creates a webhook endpoint that receives participant results
 * and appends them to your Google Sheet.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Delete ALL existing code (select all and delete)
 * 4. Paste this entire script (make sure you copy the complete script)
 * 5. Click Save (Ctrl+S or Cmd+S) - IMPORTANT: Wait for "Saved" confirmation
 * 6. Click Deploy → New deployment (or Manage deployments → Edit existing)
 * 7. Click the gear icon next to "Select type" and choose "Web app"
 * 8. Set Execute as: Me
 * 9. Set Who has access: Anyone
 * 10. Click Deploy
 * 11. Copy the Web app URL (this is your webhook URL)
 * 12. Paste the URL in the Tree Test Creator Storage configuration
 * 
 * TROUBLESHOOTING:
 * - If you get "function was deleted" error: Make sure you saved the script before deploying
 * - If updating an existing deployment: Click "Manage deployments" → Edit (pencil icon) → Deploy again
 * - Always verify the script saved successfully before deploying
 */

// Configuration
const SHEET_NAME = 'Results'; // Change this if you want to use a different sheet tab
const CONFIG_SHEET_NAME = 'StudyConfigs'; // Sheet for storing study configurations

/**
 * Helper function to create JSON response
 */
function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Main doPost function - handles incoming webhook requests
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;

    let result;
    switch (action) {
      case 'appendRow':
        result = handleAppendRow(requestData.data);
        break;
      case 'saveConfig':
        result = handleSaveConfig(requestData.studyId, requestData.config);
        break;
      case 'checkStatus':
        result = handleCheckStatus(requestData.studyId);
        break;
      case 'updateStatus':
        result = handleUpdateStatus(requestData.studyId, requestData.status);
        break;
      case 'fetchConfig':
        result = handleFetchConfig(requestData.studyId);
        break;
      case 'test':
        result = { success: true, message: 'Connection successful' };
        break;
      default:
        result = { success: false, error: 'Unknown action' };
    }
    
    return createResponse(result);
  } catch (error) {
    return createResponse({ 
      success: false, 
      error: error.toString() 
    });
  }
}

/**
 * Handle appending a participant result row
 */
function handleAppendRow(rowData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    // If sheet doesn't exist, create it
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      setupHeaders(newSheet);
      return handleAppendRow(rowData); // Retry with new sheet
    }

    // Get or create headers
    const headers = getOrCreateHeaders(sheet);

    // Build row array in correct order
    const row = [];
    headers.forEach(header => {
      row.push(rowData[header] || '');
    });

    // Append the row
    sheet.appendRow(row);

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

/**
 * Get or create headers in the sheet
 */
function getOrCreateHeaders(sheet) {
  const lastRow = sheet.getLastRow();
  
  // If sheet is empty or first row doesn't look like headers, create headers
  if (lastRow === 0 || !isHeaderRow(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0])) {
    setupHeaders(sheet);
  }

  // Return current headers
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headerRow.filter(h => h !== ''); // Remove empty cells
}

/**
 * Check if a row looks like headers
 */
function isHeaderRow(row) {
  const expectedHeaders = ['Participant ID', 'Status', 'Start Time (UTC)'];
  const rowText = row.join(' ').toLowerCase();
  return expectedHeaders.some(header => rowText.includes(header.toLowerCase()));
}

/**
 * Setup headers in the sheet
 * This creates all the required columns for analyzer compatibility
 */
function setupHeaders(sheet) {
  // Clear existing content if any
  sheet.clear();
  
  // Base headers
  const headers = [
    'Participant ID',
    'Status',
    'Start Time (UTC)',
    'End Time (UTC)',
    'Time Taken'
  ];

  // Add task headers (we'll add up to 20 tasks - adjust if needed)
  for (let i = 1; i <= 20; i++) {
    headers.push(`Task ${i} Path Taken`);
    headers.push(`Task ${i} Path Outcome`);
    headers.push(`Task ${i}: How confident are you with your answer?`);
    headers.push(`Task ${i} Time`);
  }

  // Set headers in first row
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

/**
 * Handle saving study configuration
 */
function handleSaveConfig(studyId, config) {
  try {
    let configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);
    
    // Create config sheet if it doesn't exist
    if (!configSheet) {
      configSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(CONFIG_SHEET_NAME);
      configSheet.getRange(1, 1, 1, 2).setValues([['Study ID', 'Config JSON']]);
      configSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    }

    // Check if study already exists
    const data = configSheet.getDataRange().getValues();
    let found = false;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === studyId) {
        // Update existing
        configSheet.getRange(i + 1, 2).setValue(JSON.stringify(config));
        found = true;
        break;
      }
    }

    if (!found) {
      // Append new
      configSheet.appendRow([studyId, JSON.stringify(config)]);
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

/**
 * Handle checking study status
 */
function handleCheckStatus(studyId) {
  try {
    // For simplicity, we'll check if the study config exists
    // In a full implementation, you might store status separately
    const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);
    
    if (!configSheet) {
      return { status: 'not-found' };
    }

    const data = configSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === studyId) {
        // Study exists - default to active
        // You could extend this to read status from a separate column
        return { status: 'active' };
      }
    }

    return { status: 'not-found' };
  } catch (error) {
    return { 
      status: 'not-found', 
      error: error.toString() 
    };
  }
}

/**
 * Handle updating study status
 */
function handleUpdateStatus(studyId, status) {
  try {
    // For now, we'll just acknowledge the update
    // In a full implementation, you might store status in the config sheet
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

/**
 * Handle fetching study configuration
 */
function handleFetchConfig(studyId) {
  try {
    const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);
    
    if (!configSheet) {
      return { config: null, error: 'Study not found' };
    }

    const data = configSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === studyId) {
        const config = JSON.parse(data[i][1]);
        return { config: config };
      }
    }

    return { config: null, error: 'Study not found' };
  } catch (error) {
    return { 
      config: null, 
      error: error.toString() 
    };
  }
}

