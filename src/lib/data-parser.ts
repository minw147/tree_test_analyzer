import * as XLSX from "xlsx";
import type { Item, Participant, TaskResult, UploadedData } from "./types";

export async function parseResponseData(file: File): Promise<Omit<UploadedData, "id" | "createdAt" | "updatedAt">> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                if (jsonData.length === 0) {
                    reject(new Error("No data found in the Excel file"));
                    return;
                }

                // Parse participants and tasks
                const participants: Participant[] = [];
                const tasksMap = new Map<string, { id: string; index: number; description: string; expectedAnswer: string }>();

                // Identify task columns dynamically
                const firstRow = jsonData[0] as any;
                const taskIndices = new Set<number>();

                Object.keys(firstRow).forEach(key => {
                    const match = key.match(/Task (\d+) Path Taken/);
                    if (match) {
                        taskIndices.add(parseInt(match[1]));
                    }
                });

                const sortedTaskIndices = Array.from(taskIndices).sort((a, b) => a - b);

                // Create task definitions (we might not have description/answer in the excel, 
                // so we might need to infer or use placeholders if not provided elsewhere)
                // For now, we'll create placeholders based on the indices found.
                sortedTaskIndices.forEach(index => {
                    tasksMap.set(`task-${index}`, {
                        id: `task-${index}`,
                        index: index,
                        description: `Task ${index}`, // Placeholder
                        expectedAnswer: "" // Placeholder, usually needs separate input or inference
                    });
                });

                jsonData.forEach((row: any, index) => {
                    const participantId = row["Participant ID"]?.toString() || `p-${index}`;
                    const rawStatus = (row["Status"] || "").toString().trim().toLowerCase();
                    const status = rawStatus === "completed" ? "Completed" : "Incomplete";
                    const startedAt = new Date(row["Start Time (UTC)"] || new Date());
                    const completedAt = row["End Time (UTC)"] ? new Date(row["End Time (UTC)"]) : null;

                    // Parse duration "HH:MM:SS" to seconds
                    let durationSeconds = 0;
                    if (row["Time Taken"]) {
                        const parts = row["Time Taken"].toString().split(':');
                        if (parts.length === 3) {
                            durationSeconds = (+parts[0]) * 3600 + (+parts[1]) * 60 + (+parts[2]);
                        }
                    }

                    const taskResults: TaskResult[] = [];

                    sortedTaskIndices.forEach(taskIndex => {
                        const pathTaken = row[`Task ${taskIndex} Path Taken`];
                        const outcome = row[`Task ${taskIndex} Path Outcome`];
                        const confidence = row[`Task ${taskIndex}: How confident are you with your answer?`];

                        // Skip if no data for this task (e.g. abandoned before reaching it)
                        if (pathTaken === undefined && outcome === undefined) return;

                        const isSkipped = outcome?.includes("Skip") || false;
                        const isSuccess = outcome?.includes("Success") || false;
                        let isDirect = outcome?.includes("Direct") || false;

                        // If skipped and not explicitly marked as Direct/Indirect, infer from path
                        if (isSkipped && !outcome?.includes("Direct") && !outcome?.includes("Indirect")) {
                            isDirect = !pathTaken || pathTaken.trim() === "";
                        }

                        const timeTaken = row[`Task ${taskIndex} Time`];
                        const parsedTime = timeTaken ? parseFloat(timeTaken) : 0;

                        taskResults.push({
                            taskId: `task-${taskIndex}`,
                            taskIndex: taskIndex,
                            description: `Task ${taskIndex}`,
                            successful: isSuccess,
                            directPathTaken: isDirect,
                            completionTimeSeconds: parsedTime,
                            pathTaken: pathTaken || "",
                            skipped: isSkipped,
                            confidenceRating: confidence ? parseInt(confidence) : null
                        });
                    });

                    participants.push({
                        id: participantId,
                        status,
                        startedAt,
                        completedAt,
                        durationSeconds,
                        taskResults
                    });
                });

                resolve({
                    participants,
                    tasks: Array.from(tasksMap.values())
                });

            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}

export function parseTreeFromJson(jsonString: string): Item[] {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        throw new Error("Invalid JSON string");
    }
}

export function parseTreeFromString(text: string): Item[] {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const root: Item[] = [];
    const stack: { item: Item, level: number }[] = [];

    lines.forEach(line => {
        let level = 0;
        let name = line.trim();

        // Check if line starts with commas (comma-based indentation)
        const commaMatch = line.match(/^(,*)/);
        if (commaMatch && commaMatch[1].length > 0) {
            // Comma-based format: count leading commas
            level = commaMatch[1].length;
            name = line.substring(commaMatch[1].length).trim();
        } else {
            // Space/tab-based format: count leading whitespace
            const indentMatch = line.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1].length : 0;
            level = indent;
        }

        // Remove trailing period if present
        name = name.replace(/\.$/, '');

        // Split by comma to check for optional link (for space-based format compatibility)
        const parts = name.split(',');
        const itemName = parts[0].trim();
        const link = parts.length > 1 ? parts[1].trim() : undefined;

        const newItem: Item = { name: itemName, link, children: [] };

        // Find parent based on level
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
            stack.pop();
        }

        if (stack.length === 0) {
            root.push(newItem);
        } else {
            stack[stack.length - 1].item.children = stack[stack.length - 1].item.children || [];
            stack[stack.length - 1].item.children!.push(newItem);
        }

        stack.push({ item: newItem, level });
    });

    return root;
}
