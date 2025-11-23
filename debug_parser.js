import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'c:/Users/wangm/usabilitree/Tree_Test_Results_App/Usabilitree_Sample-tree-test_results_2025-11-23.csv';
const fileBuffer = fs.readFileSync(filePath);
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(sheet);

// Find Participant 6
const participant = jsonData.find(row => row['Participant ID'] == 6);

if (participant) {
    console.log("Participant 6 found");
    const taskIndex = 5;
    const pathTakenKey = `Task ${taskIndex} Path Taken`;
    const outcomeKey = `Task ${taskIndex} Path Outcome`;

    const pathTaken = participant[pathTakenKey];
    const outcome = participant[outcomeKey];

    console.log(`Task ${taskIndex} Path Taken:`, pathTaken);
    console.log(`Task ${taskIndex} Path Taken Type:`, typeof pathTaken);
    console.log(`Task ${taskIndex} Path Outcome:`, outcome);

    const isSkipped = outcome?.includes("Skip") || false;
    let isDirect = outcome?.includes("Direct") || false;

    console.log("Initial isDirect:", isDirect);

    if (isSkipped && !outcome?.includes("Direct") && !outcome?.includes("Indirect")) {
        const isPathEmpty = !pathTaken || pathTaken.toString().trim() === "";
        console.log("isPathEmpty:", isPathEmpty);
        isDirect = isPathEmpty;
    }

    console.log("Final isDirect:", isDirect);
} else {
    console.log("Participant 6 not found");
}
