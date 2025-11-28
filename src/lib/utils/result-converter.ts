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

    return participantResults.map((result) => {
        // Convert task results
        const taskResults: TaskResult[] = result.taskResults.map((task) => {
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
                    directPathTaken = task.pathTaken.length <= 1; // Heuristic: direct if very short path
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

            // Find task index from study config
            const taskIndex = taskIdToIndex.get(task.taskId) || 1; // Default to 1 if not found

            return {
                taskId: task.taskId,
                taskIndex: taskIndex,
                description: task.taskDescription,
                successful: successful,
                directPathTaken: directPathTaken,
                completionTimeSeconds: task.timeSeconds,
                pathTaken: task.pathTaken.join('/'), // Join array to string
                skipped: task.outcome === 'direct-skip' || task.outcome === 'indirect-skip',
                confidenceRating: task.confidence || null,
            };
        });

        // Calculate duration in seconds
        const durationSeconds = result.totalActiveTime || null;

        return {
            id: result.participantId,
            status: result.status === 'completed' ? 'Completed' : 'Abandoned',
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

