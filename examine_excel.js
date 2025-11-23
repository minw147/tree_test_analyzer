import XLSX from 'xlsx';

const wb = XLSX.readFile('../Usabilitree_Sample-tree-test_results_2025-11-23.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log('Total rows:', data.length);
console.log('\nAll columns:');
const cols = Object.keys(data[0]);
cols.forEach((c, i) => {
    console.log(`${i + 1}. ${c}`);
});

console.log('\n\nFirst participant data sample:');
const first = data[0];
console.log('Participant ID:', first['Participant ID']);
console.log('Status:', first['Status']);
console.log('Time Taken:', first['Time Taken']);

// Check task columns
const taskCols = cols.filter(c => c.startsWith('Task '));
console.log('\n\nTask-related columns (first 20):');
taskCols.slice(0, 20).forEach(c => console.log('  -', c));

console.log('\n\nSample task data for Task 1:');
console.log('Path Taken:', first['Task 1 Path Taken']);
console.log('Path Outcome:', first['Task 1 Path Outcome']);
console.log('Confidence:', first['Task 1: How confident are you with your answer?']);
console.log('Confidence Label:', first['Task 1 Confidence Label']);
