import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample Data Configuration
const participantsCount = 20;
const tasks = [
    { index: 1, name: "Find Laptops", correctPath: "/Home/Products/Electronics/Laptops" },
    { index: 2, name: "Find Career Opportunities", correctPath: "/Home/About Us/Careers" },
    { index: 3, name: "Contact Support", correctPath: "/Home/Contact" } // Intentionally ambiguous with Services/Support
];

const outcomes = [
    "Success",
    "Direct Success",
    "Failure",
    "Direct Failure",
    "Skip"
];

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function generateRandomPath(taskIndex) {
    // Simplified path generation
    const paths = [
        "/Home/Products/Electronics/Laptops",
        "/Home/Products/Electronics/Smartphones",
        "/Home/About Us/Careers",
        "/Home/About Us/Team",
        "/Home/Contact",
        "/Home/Services/Support",
        "/Home/Products/Clothing/Men/Shirts"
    ];
    return paths[getRandomInt(paths.length)];
}

const data = [];

for (let i = 1; i <= participantsCount; i++) {
    const participant = {
        "Participant ID": `P${i.toString().padStart(3, '0')}`,
        "Status": Math.random() > 0.1 ? "Completed" : "Abandoned",
        "Start Time (UTC)": new Date().toISOString(),
        "End Time (UTC)": new Date(Date.now() + getRandomInt(600000)).toISOString(),
        "Time Taken": `00:${getRandomInt(10).toString().padStart(2, '0')}:${getRandomInt(60).toString().padStart(2, '0')}`
    };

    tasks.forEach(task => {
        // 70% chance of success, 20% fail, 10% skip
        const rand = Math.random();
        let outcome = "Skip";
        let pathTaken = "";
        let confidence = "";

        if (rand < 0.6) {
            // Success
            const isDirect = Math.random() > 0.3;
            outcome = isDirect ? "Direct Success" : "Success";
            pathTaken = task.correctPath; // Simplified: assume correct path for success
            confidence = (getRandomInt(3) + 5).toString(); // 5-7
        } else if (rand < 0.8) {
            // Failure
            const isDirect = Math.random() > 0.3;
            outcome = isDirect ? "Direct Failure" : "Failure";
            pathTaken = generateRandomPath(task.index);
            confidence = (getRandomInt(4) + 1).toString(); // 1-4
        } else {
            // Skip
            outcome = "Skip";
            // Randomize Direct vs Indirect Skip
            if (Math.random() > 0.5) {
                // Direct Skip: No path taken
                pathTaken = "";
            } else {
                // Indirect Skip: Path taken but abandoned
                pathTaken = generateRandomPath(task.index);
            }
            confidence = "";
        }

        participant[`Task ${task.index} Path Taken`] = pathTaken;
        participant[`Task ${task.index} Path Outcome`] = outcome;
        participant[`Task ${task.index}: How confident are you with your answer?`] = confidence;
        participant[`Task ${task.index} Time`] = getRandomInt(120).toString(); // Random time 0-120 seconds
    });

    data.push(participant);
}

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Tree Test Data");

const outputPath = path.join(__dirname, 'public', 'sample_data', 'results.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`Sample Excel file generated at: ${outputPath}`);
