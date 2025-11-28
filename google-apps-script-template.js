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
 * 
 * CROSS-DEVICE ACCESS:
 * This script supports public study lookup for cross-device access.
 * Participants can access studies from any device using:
 * - Standard link: /test/:studyId (works from same browser)
 * - Cross-device link: /test/:studyId?webhook=YOUR_WEBHOOK_URL (works from any device)
 * The cross-device link is automatically generated in the Creator's "Launch Study" tab.
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
 * Main doGet function - handles public GET requests for study lookup
 * Allows participants to fetch study config without authentication
 * Usage: ?action=lookup&studyId=study-123
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const studyId = e.parameter.studyId;
    
    if (action === 'lookup' && studyId) {
      // Public lookup endpoint - fetch study config by ID
      const result = handleFetchConfig(studyId);
      return createResponse(result);
    }
    
    // Default response for invalid requests
    return createResponse({ 
      success: false, 
      error: 'Invalid request. Use ?action=lookup&studyId=study-id' 
    });
  } catch (error) {
    return createResponse({ 
      success: false, 
      error: error.toString() 
    });
  }
}

/**
 * Main doPost function - handles incoming webhook requests
 * Supports both JSON and form-encoded data to avoid CORS preflight issues
 */
function doPost(e) {
  try {
    let requestData;
    
    // Handle form-encoded data (to avoid CORS preflight)
    if (e.parameter && e.parameter.payload) {
      requestData = JSON.parse(e.parameter.payload);
    } 
    // Handle JSON data (fallback for direct JSON requests)
    else if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    } 
    else {
      throw new Error('No data received');
    }

    const action = requestData.action;

    let result;
    switch (action) {
      case 'appendRow':
        result = handleAppendRow({
          data: requestData.data,
          studyId: requestData.studyId
        });
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
      case 'fetchResults':
        result = handleFetchResults(requestData.studyId);
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
function handleAppendRow(requestData) {
  try {
    const rowData = requestData.data;
    const studyId = requestData.studyId;
    
    // Check study status BEFORE allowing submission (server-side validation)
    if (studyId) {
      const statusResult = handleCheckStatus(studyId);
      if (statusResult.status === 'closed') {
        return { 
          success: false, 
          error: 'This study is currently closed and not accepting new submissions.' 
        };
      }
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    // If sheet doesn't exist, create it
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      // Determine number of tasks from the submitted data
      const numTasks = getTaskCountFromData(rowData);
      setupHeaders(newSheet, numTasks);
      return handleAppendRow(rowData); // Retry with new sheet
    }

    // Get or create headers
    const headers = getOrCreateHeaders(sheet, rowData);

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
 * Determine the number of tasks from submitted data
 */
function getTaskCountFromData(rowData) {
  let maxTaskNum = 0;
  Object.keys(rowData).forEach(key => {
    const match = key.match(/Task (\d+) Path Taken/);
    if (match) {
      const taskNum = parseInt(match[1]);
      if (taskNum > maxTaskNum) {
        maxTaskNum = taskNum;
      }
    }
  });
  // Return at least 1 task, or the maximum found
  return Math.max(1, maxTaskNum);
}

/**
 * Get or create headers in the sheet
 */
function getOrCreateHeaders(sheet, rowData) {
  const lastRow = sheet.getLastRow();
  const requiredTasks = getTaskCountFromData(rowData);
  
  // If sheet is empty or first row doesn't look like headers, create headers
  if (lastRow === 0 || !isHeaderRow(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0])) {
    // Determine number of tasks from the submitted data
    setupHeaders(sheet, requiredTasks);
  } else {
    // Headers exist - check if we need to expand them
    const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const existingTaskCount = getTaskCountFromHeaders(existingHeaders);
    
    // If submitted data has more tasks than existing headers, expand headers
    if (requiredTasks > existingTaskCount) {
      // Get base headers (first 5 columns)
      const baseHeaders = existingHeaders.slice(0, 5);
      
      // Add new task headers
      const newHeaders = [...baseHeaders];
      for (let i = existingTaskCount + 1; i <= requiredTasks; i++) {
        newHeaders.push(`Task ${i} Path Taken`);
        newHeaders.push(`Task ${i} Path Outcome`);
        newHeaders.push(`Task ${i}: How confident are you with your answer?`);
        newHeaders.push(`Task ${i} Time`);
      }
      
      // Update header row
      sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
      
      // Re-format header row
      const headerRange = sheet.getRange(1, 1, 1, newHeaders.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
    }
  }

  // Return current headers
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headerRow.filter(h => h !== ''); // Remove empty cells
}

/**
 * Determine the number of tasks from existing headers
 */
function getTaskCountFromHeaders(headers) {
  let maxTaskNum = 0;
  headers.forEach(header => {
    if (header) {
      const match = header.toString().match(/Task (\d+) Path Taken/);
      if (match) {
        const taskNum = parseInt(match[1]);
        if (taskNum > maxTaskNum) {
          maxTaskNum = taskNum;
        }
      }
    }
  });
  return maxTaskNum;
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
 * @param {Sheet} sheet - The Google Sheet to set up headers for
 * @param {number} numTasks - Number of tasks in the study (defaults to 20 for backward compatibility)
 */
function setupHeaders(sheet, numTasks = 20) {
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

  // Add task headers based on actual number of tasks
  for (let i = 1; i <= numTasks; i++) {
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
    const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);
    
    if (!configSheet) {
      return { status: 'not-found' };
    }

    const data = configSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === studyId) {
        // Parse the stored config to get the actual status
        try {
          const config = JSON.parse(data[i][1]);
          // Return the accessStatus from the config, default to 'active' if not set
          return { status: config.accessStatus || 'active' };
        } catch (parseError) {
          // If config can't be parsed, default to active
          return { status: 'active' };
        }
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
    const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);
    
    if (!configSheet) {
      return { success: false, error: 'Config sheet not found' };
    }

    const data = configSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === studyId) {
        // Parse the existing config
        try {
          const config = JSON.parse(data[i][1]);
          // Update the accessStatus
          config.accessStatus = status;
          // Update closedAt timestamp if closing, clear it if reopening
          if (status === 'closed') {
            config.closedAt = new Date().toISOString();
          } else if (status === 'active') {
            config.closedAt = undefined;
          }
          // Save the updated config back to the sheet
          configSheet.getRange(i + 1, 2).setValue(JSON.stringify(config));
          return { success: true };
        } catch (parseError) {
          return { success: false, error: 'Failed to parse config: ' + parseError.toString() };
        }
      }
    }

    return { success: false, error: 'Study not found' };
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

/**
 * Handle fetching all results for a study
 * Converts sheet rows back to ParticipantResult format
 */
function handleFetchResults(studyId) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    if (!sheet || sheet.getLastRow() === 0) {
      return { results: [] };
    }

    // Get headers and data
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const dataRows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    
    // Find study config to get study name
    const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);
    let studyName = 'Unknown Study';
    if (configSheet) {
      const configData = configSheet.getDataRange().getValues();
      for (let i = 1; i < configData.length; i++) {
        if (configData[i][0] === studyId) {
          try {
            const config = JSON.parse(configData[i][1]);
            studyName = config.name || studyName;
          } catch (e) {
            // Ignore parse errors
          }
          break;
        }
      }
    }

    const results = [];
    
    // Process each data row
    dataRows.forEach((row) => {
      // Skip empty rows
      if (!row[0]) return;
      
      // Build row object from headers
      const rowObj = {};
      headerRow.forEach((header, index) => {
        rowObj[header] = row[index];
      });
      
      // Extract participant metadata
      const participantId = rowObj['Participant ID'] || '';
      const status = rowObj['Status'] === 'Completed' ? 'completed' : 'abandoned';
      const startedAt = rowObj['Start Time (UTC)'] || new Date().toISOString();
      const completedAt = rowObj['End Time (UTC)'] || null;
      
      // Parse duration "HH:MM:SS" to seconds
      let totalActiveTime = 0;
      if (rowObj['Time Taken']) {
        const parts = rowObj['Time Taken'].toString().split(':');
        if (parts.length === 3) {
          totalActiveTime = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        }
      }
      
      // Extract task results
      const taskResults = [];
      let taskNum = 1;
      
      while (rowObj[`Task ${taskNum} Path Taken`] !== undefined) {
        const pathTaken = rowObj[`Task ${taskNum} Path Taken`] || '';
        const outcomeStr = rowObj[`Task ${taskNum} Path Outcome`] || '';
        const confidence = rowObj[`Task ${taskNum}: How confident are you with your answer?`];
        const timeSeconds = parseFloat(rowObj[`Task ${taskNum} Time`]) || 0;
        
        // Map outcome string back to PathOutcome type
        let outcome = 'failure';
        if (outcomeStr.includes('Direct Success')) outcome = 'direct-success';
        else if (outcomeStr.includes('Indirect Success')) outcome = 'indirect-success';
        else if (outcomeStr.includes('Direct Skip')) outcome = 'direct-skip';
        else if (outcomeStr.includes('Indirect Skip')) outcome = 'indirect-skip';
        else if (outcomeStr.includes('Failure')) outcome = 'failure';
        
        // Parse path taken (split by '/')
        const pathTakenArray = pathTaken ? pathTaken.split('/').filter(p => p.trim()) : [];
        
        taskResults.push({
          taskId: `task-${taskNum}`,
          taskDescription: `Task ${taskNum}`,
          pathTaken: pathTakenArray,
          outcome: outcome,
          confidence: confidence ? parseInt(confidence) : undefined,
          timeSeconds: timeSeconds,
          timestamp: startedAt // Use study start time as task timestamp
        });
        
        taskNum++;
      }
      
      // Only include results that have at least one task
      if (taskResults.length > 0) {
        results.push({
          participantId: participantId,
          studyId: studyId,
          studyName: studyName,
          status: status,
          startedAt: startedAt,
          completedAt: completedAt,
          totalActiveTime: totalActiveTime,
          taskResults: taskResults
        });
      }
    });
    
    return { results: results };
  } catch (error) {
    return { 
      results: null, 
      error: error.toString() 
    };
  }
}

