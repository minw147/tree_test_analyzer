export interface TreeNode {
    name: string;
    link?: string;
    children?: TreeNode[];
}

export interface Item {
    name: string;
    link?: string;
    children?: Item[];
}

export interface TreeTestOverviewStats {
    totalParticipants: number;
    completedParticipants: number;
    abandonedParticipants: number;
    completionRate: number;
    medianCompletionTime: number;
    shortestCompletionTime: number;
    longestCompletionTime: number;
    successRate: number;
    directnessRate: number;
    overallScore: number;
}

export interface ParentClickStats {
    path: string;
    isCorrect: boolean;
    firstClickCount: number;
    firstClickPercentage: number;
    totalClickCount: number;
    totalClickPercentage: number;
}

export interface TaskStats {
    id: string;
    index: number;
    description: string;
    expectedAnswer: string;
    maxTimeSeconds: number | null;
    parsedTree: string; // JSON string of Item[]
    stats: {
        success: {
            rate: number;
            margin: number;
        };
        directness: {
            rate: number;
            margin: number;
        };
        time: {
            median: number;
            min: number;
            max: number;
            q1: number;
            q3: number;
        };
        score: number;
        breakdown: {
            directSuccess: number;
            indirectSuccess: number;
            fail: number;
            directSkip: number;
            indirectSkip: number;
            total: number;
        };
        parentClicks: ParentClickStats[];
        incorrectDestinations: {
            path: string;
            count: number;
            percentage: number;
        }[];
        pathDistribution?: {
            path: string;
            count: number;
            percentage: number;
        }[];
        confidenceRatings: {
            value: number;
            count: number;
            percentage: number;
            breakdown: {
                directSuccess: number;
                directSuccessPercentage: number;
                indirectSuccess: number;
                indirectSuccessPercentage: number;
                fail: number;
                failPercentage: number;
                directSkip: number;
                directSkipPercentage: number;
                indirectSkip: number;
                indirectSkipPercentage: number;
            };
        }[];
        parentNodeStats?: {
            level1: {
                rate: number;
                count: number;
                total: number;
                nodeName: string;
            };
            level2: {
                rate: number;
                count: number;
                total: number;
                nodeName: string;
            } | null;
            level3: {
                rate: number;
                count: number;
                total: number;
                nodeName: string;
            } | null;
        };
    };
}

export interface Participant {
    id: string;
    status: "Completed" | "Abandoned";
    startedAt: Date;
    completedAt: Date | null;
    durationSeconds: number | null;
    taskResults: TaskResult[];
}

export interface TaskResult {
    taskId: string;
    taskIndex: number;
    description: string;
    successful: boolean;
    directPathTaken: boolean;
    completionTimeSeconds: number;
    pathTaken: string;
    skipped: boolean;
    confidenceRating: number | null;
}

// Data structure for the uploaded Excel file content
export interface UploadedData {
    id: string; // Unique identifier for the study
    name?: string; // Study name for organization
    creator?: string; // Creator/researcher name
    participants: Participant[];
    tasks: {
        id: string;
        index: number;
        description: string;
        expectedAnswer: string;
    }[];
    treeStructure?: Item[]; // Optional if provided separately or inferred
    createdAt: string; // ISO timestamp
    updatedAt: string; // ISO timestamp
    sourceStudyId?: string; // Optional: ID of the source study in Creator (for tracking imports)
}
