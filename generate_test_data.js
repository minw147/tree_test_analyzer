import XLSX from 'xlsx';

// Sample data matching the test study config
// Task: "Buy laptop" with correct path "/Home/Products/Laptop"

const participants = [
    {
        "Participant ID": "P001",
        "Status": "Completed",
        "Start Time (UTC)": "2025-01-26T10:00:00Z",
        "End Time (UTC)": "2025-01-26T10:02:30Z",
        "Time Taken": "00:02:30",
        "Task 1 Path Taken": "Home/Products/Laptop",
        "Task 1 Path Outcome": "Direct Success",
        "Task 1: How confident are you with your answer?": 5,
        "Task 1 Time": 150
    },
    {
        "Participant ID": "P002",
        "Status": "Completed",
        "Start Time (UTC)": "2025-01-26T10:05:00Z",
        "End Time (UTC)": "2025-01-26T10:08:15Z",
        "Time Taken": "00:03:15",
        "Task 1 Path Taken": "Home/Products/Laptop",
        "Task 1 Path Outcome": "Direct Success",
        "Task 1: How confident are you with your answer?": 4,
        "Task 1 Time": 195
    },
    {
        "Participant ID": "P003",
        "Status": "Completed",
        "Start Time (UTC)": "2025-01-26T10:10:00Z",
        "End Time (UTC)": "2025-01-26T10:14:45Z",
        "Time Taken": "00:04:45",
        "Task 1 Path Taken": "Home/Products/Phone/Home/Products/Laptop",
        "Task 1 Path Outcome": "Indirect Success",
        "Task 1: How confident are you with your answer?": 3,
        "Task 1 Time": 285
    },
    {
        "Participant ID": "P004",
        "Status": "Completed",
        "Start Time (UTC)": "2025-01-26T10:15:00Z",
        "End Time (UTC)": "2025-01-26T10:18:20Z",
        "Time Taken": "00:03:20",
        "Task 1 Path Taken": "Home/Contact Us",
        "Task 1 Path Outcome": "Failure",
        "Task 1: How confident are you with your answer?": 2,
        "Task 1 Time": 200
    },
    {
        "Participant ID": "P005",
        "Status": "Completed",
        "Start Time (UTC)": "2025-01-26T10:20:00Z",
        "End Time (UTC)": "2025-01-26T10:23:10Z",
        "Time Taken": "00:03:10",
        "Task 1 Path Taken": "Home/Products/headset",
        "Task 1 Path Outcome": "Failure",
        "Task 1: How confident are you with your answer?": 1,
        "Task 1 Time": 190
    },
    {
        "Participant ID": "P006",
        "Status": "Completed",
        "Start Time (UTC)": "2025-01-26T10:25:00Z",
        "End Time (UTC)": "2025-01-26T10:27:45Z",
        "Time Taken": "00:02:45",
        "Task 1 Path Taken": "Home/Products/Laptop",
        "Task 1 Path Outcome": "Direct Success",
        "Task 1: How confident are you with your answer?": 5,
        "Task 1 Time": 165
    },
    {
        "Participant ID": "P007",
        "Status": "Completed",
        "Start Time (UTC)": "2025-01-26T10:30:00Z",
        "End Time (UTC)": "2025-01-26T10:35:30Z",
        "Time Taken": "00:05:30",
        "Task 1 Path Taken": "Home/Career/Home/Products/Laptop",
        "Task 1 Path Outcome": "Indirect Success",
        "Task 1: How confident are you with your answer?": 3,
        "Task 1 Time": 330
    },
    {
        "Participant ID": "P008",
        "Status": "Abandoned",
        "Start Time (UTC)": "2025-01-26T10:35:00Z",
        "End Time (UTC)": null,
        "Time Taken": "00:01:20",
        "Task 1 Path Taken": "Home/Service",
        "Task 1 Path Outcome": "Skip",
        "Task 1: How confident are you with your answer?": null,
        "Task 1 Time": 80
    },
    {
        "Participant ID": "P009",
        "Status": "Completed",
        "Start Time (UTC)": "2025-01-26T10:40:00Z",
        "End Time (UTC)": "2025-01-26T10:42:15Z",
        "Time Taken": "00:02:15",
        "Task 1 Path Taken": "Home/Products/Laptop",
        "Task 1 Path Outcome": "Direct Success",
        "Task 1: How confident are you with your answer?": 4,
        "Task 1 Time": 135
    },
    {
        "Participant ID": "P010",
        "Status": "Completed",
        "Start Time (UTC)": "2025-01-26T10:45:00Z",
        "End Time (UTC)": "2025-01-26T10:50:20Z",
        "Time Taken": "00:05:20",
        "Task 1 Path Taken": "Home/Products/Phone/Home/Products/headset/Home/Products/Laptop",
        "Task 1 Path Outcome": "Indirect Success",
        "Task 1: How confident are you with your answer?": 2,
        "Task 1 Time": 320
    }
];

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(participants);

// Set column widths for better readability
ws['!cols'] = [
    { wch: 15 }, // Participant ID
    { wch: 12 }, // Status
    { wch: 25 }, // Start Time
    { wch: 25 }, // End Time
    { wch: 12 }, // Time Taken
    { wch: 40 }, // Task 1 Path Taken
    { wch: 25 }, // Task 1 Path Outcome
    { wch: 50 }, // Task 1 Confidence
    { wch: 12 }  // Task 1 Time
];

XLSX.utils.book_append_sheet(wb, ws, "Results");

// Write file
XLSX.writeFile(wb, "test-study-results.xlsx");

console.log("✅ Generated test-study-results.xlsx");
console.log(`   ${participants.length} participants`);
console.log("   Ready to use with test-study-config.json");

