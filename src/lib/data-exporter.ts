import * as XLSX from "xlsx";
import type { UploadedData } from "./types";

export function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function exportToExcel(data: UploadedData, filename: string = "tree-test-data-export.xlsx"): void {
    const wb = XLSX.utils.book_new();

    // 1. Tasks Sheet
    const tasksData = data.tasks.map(t => ({
        "Task Index": t.index,
        "Task ID": t.id,
        "Description": t.description,
        "Expected Answer": t.expectedAnswer
    }));
    const wsTasks = XLSX.utils.json_to_sheet(tasksData);
    XLSX.utils.book_append_sheet(wb, wsTasks, "Tasks");

    // 2. Tree Structure Sheet (if available)
    if (data.treeStructure) {
        // Flatten tree for export
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: any[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const traverse = (items: any[], path: string) => {
            items.forEach(item => {
                const currentPath = path ? `${path}/${item.name}` : item.name;
                rows.push({ "Path": currentPath, "Name": item.name, "Link": item.link || "" });
                if (item.children) traverse(item.children, currentPath);
            });
        };
        traverse(data.treeStructure, "");
        const wsTree = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, wsTree, "Tree Structure");
    }

    // 3. Participants & Results Sheet
    // Flattening participant data: One row per task result per participant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultsData: any[] = [];
    data.participants.forEach(p => {
        p.taskResults.forEach(r => {
            resultsData.push({
                "Participant ID": p.id,
                "Status": p.status,
                "Duration (s)": p.durationSeconds,
                "Task Index": r.taskIndex,
                "Task Success": r.successful,
                "Direct Path": r.directPathTaken,
                "Skipped": r.skipped,
                "Time (s)": r.completionTimeSeconds,
                "Path Taken": r.pathTaken,
                "Confidence": r.confidenceRating
            });
        });
    });
    const wsResults = XLSX.utils.json_to_sheet(resultsData);
    XLSX.utils.book_append_sheet(wb, wsResults, "Results");

    XLSX.writeFile(wb, filename);
}
