import type { StudyConfig, ParticipantResult } from "@/lib/types/study";
import type { UploadedData, Participant, TaskResult, Item } from "@/lib/types";

/**
 * Convert ParticipantResult[] from storage format to Participant[] for analyzer
 */
function convertParticipants(
    participantResults: ParticipantResult[],
    studyTasks: StudyConfig['tasks']
): Participant[] {
    // Create a map of taskId to task index for quick lookup
    const taskIdToIndex = new Map<string, number>();
    studyTasks.forEach((task, index) => {
        taskIdToIndex.set(task.id, index + 1); // Task index is 1-based in analyzer
    });

    // Create a map of task index (1-based) to actual task ID from study config
    // This handles cases where Google Sheets returns task-1, task-2, etc.
    const taskIndexToId = new Map<number, string>();
    studyTasks.forEach((task, index) => {
        taskIndexToId.set(index + 1, task.id);
    });

    return participantResults.map((result) => {
        // Convert task results
        const taskResults: TaskResult[] = result.taskResults.map((task) => {
            // Ensure pathTaken is an array
            const pathTakenArray = Array.isArray(task.pathTaken)
                ? task.pathTaken
                : (task.pathTaken ? [task.pathTaken] : []);

            // Map outcome to successful and directPathTaken
            let successful = false;
            let directPathTaken = false;

            switch (task.outcome) {
                case 'direct-success':
                    successful = true;
                    directPathTaken = true;
                    break;
                case 'indirect-success':
                    successful = true;
                    directPathTaken = false;
                    break;
                case 'failure':
                    successful = false;
                    directPathTaken = pathTakenArray.length <= 1; // Heuristic: direct if very short path
                    break;
                case 'direct-skip':
                    successful = false;
                    directPathTaken = true;
                    break;
                case 'indirect-skip':
                    successful = false;
                    directPathTaken = false;
                    break;
            }

            // Extract task number from taskId (e.g., "task-1" -> 1, "task-2" -> 2)
            // Or use the actual task ID if it's not in the format "task-N"
            let actualTaskId = task.taskId;
            let taskIndex = taskIdToIndex.get(task.taskId);

            // If taskId is in format "task-N", extract the number and map to actual task ID
            const taskNumMatch = task.taskId.match(/^task-(\d+)$/);
            if (taskNumMatch) {
                const taskNum = parseInt(taskNumMatch[1]);
                taskIndex = taskNum;
                // Map to the actual task ID from study config
                actualTaskId = taskIndexToId.get(taskNum) || task.taskId;
            } else {
                // Use the task ID as-is and find its index
                taskIndex = taskIdToIndex.get(task.taskId) || 1;
            }

            return {
                taskId: actualTaskId, // Use the actual task ID from study config
                taskIndex: taskIndex,
                description: task.taskDescription,
                successful: successful,
                directPathTaken: directPathTaken,
                completionTimeSeconds: task.timeSeconds,
                pathTaken: pathTakenArray.join('/'), // Join array to string
                skipped: task.outcome === 'direct-skip' || task.outcome === 'indirect-skip',
                confidenceRating: task.confidence || null,
            };
        });

        // Calculate duration in seconds
        // First try to use totalActiveTime, but if it's missing or 0, calculate from timestamps
        let durationSeconds: number | null = null;

        if (result.totalActiveTime !== undefined && result.totalActiveTime !== null && result.totalActiveTime > 0) {
            durationSeconds = result.totalActiveTime;
        } else if (result.startedAt && result.completedAt) {
            // Calculate duration from timestamps if totalActiveTime is not available
            const startTime = new Date(result.startedAt).getTime();
            const endTime = new Date(result.completedAt).getTime();
            if (!isNaN(startTime) && !isNaN(endTime) && endTime >= startTime) {
                durationSeconds = Math.floor((endTime - startTime) / 1000); // Convert to seconds
            }
        }

        return {
            id: result.participantId,
            status: (result.status || '').toString().toLowerCase() === 'completed' ? 'Completed' : 'Incomplete',
            startedAt: new Date(result.startedAt),
            completedAt: result.completedAt ? new Date(result.completedAt) : null,
            durationSeconds: durationSeconds,
            taskResults: taskResults,
        };
    });
}

/**
 * Convert StudyConfig.tasks to analyzer task format
 */
function convertTasks(studyConfig: StudyConfig): { id: string; index: number; description: string; expectedAnswer: string }[] {
    return studyConfig.tasks.map((task, index) => {
        // Join correctPath array to comma-separated string
        const expectedAnswer = task.correctPath && task.correctPath.length > 0
            ? task.correctPath.join(', ')
            : '';

        return {
            id: task.id,
            index: index + 1, // Task index is 1-based in analyzer
            description: task.description,
            expectedAnswer: expectedAnswer,
        };
    });
}

/**
 * Convert StudyConfig.tree (TreeNode[]) to Item[] format
 */
function convertTree(tree: StudyConfig['tree']): Item[] {
    function convertNode(node: typeof tree[0]): Item {
        const item: Item = {
            name: node.name,
        };

        if (node.link) {
            item.link = node.link;
        }

        if (node.children && node.children.length > 0) {
            item.children = node.children.map(convertNode);
        }

        return item;
    }

    return tree.map(convertNode);
}

/**
 * Convert study configuration and participant results to UploadedData format
 * for importing into the Analyzer
 */
export function convertResultsToUploadedData(
    studyConfig: StudyConfig,
    participantResults: ParticipantResult[]
): Omit<UploadedData, "id" | "createdAt" | "updatedAt"> {
    const participants = convertParticipants(participantResults, studyConfig.tasks);
    const tasks = convertTasks(studyConfig);
    const treeStructure = convertTree(studyConfig.tree);

    return {
        name: studyConfig.name,
        creator: studyConfig.creator,
        participants: participants,
        tasks: tasks,
        treeStructure: treeStructure,
    };
}

