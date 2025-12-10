export interface TreeNode {
    id: string;
    name: string;
    link?: string; // Destination URL for leaf nodes
    children?: TreeNode[];
}

export interface Task {
    id: string;
    description: string;
    correctPath?: string[]; // Optional: defines the "correct" answer path
}

export type StorageType = 'hosted-backend' | 'google-sheets' | 'custom-api' | 'local-download';

export interface StorageConfig {
    type: StorageType;
    // For Custom API
    endpointUrl?: string;
    authType?: 'none' | 'api-key' | 'bearer-token';
    apiKey?: string;
    // For Google Sheets
    googleSheetsMethod?: 'apps-script' | 'oauth-api'; // Which method to use
    sheetId?: string;        // Google Sheet ID
    sheetName?: string;      // Sheet tab name (default: "Results")
    webhookUrl?: string;     // For Apps Script method (webhook URL)
    // OAuth token will be stored in sessionStorage/localStorage securely
}

export interface StudySettings {
    welcomeMessage: string;
    instructions: string;
    completedMessage: string;
    randomizeTasks?: boolean; // Randomize task order for each participant
    customText?: {
        startTest?: string;
        nextButton?: string;
        submitButton?: string;
        taskProgress?: string;
    };
}

export type StudyStatus = 'draft' | 'published';
export type StudyAccessStatus = 'active' | 'closed';

export interface StudyConfig {
    id: string;
    name: string;
    creator?: string; // Optional creator/researcher name
    tree: TreeNode[];
    tasks: Task[];
    storage: StorageConfig;
    settings: StudySettings;
    status?: StudyStatus; // 'draft' | 'published' - whether study is published
    accessStatus?: StudyAccessStatus; // 'active' | 'closed' - whether study accepts new participants
    publishedAt?: string; // ISO timestamp when study was published
    closedAt?: string; // ISO timestamp when study was closed
    createdAt: string;
    updatedAt: string;
}

// Participant result data structures
// Participant result data structures
export type PathOutcome = 'direct-success' | 'indirect-success' | 'failure' | 'direct-skip' | 'indirect-skip';

export interface TaskResult {
    taskId: string;
    taskDescription: string;
    pathTaken: string[]; // Array of node names clicked
    outcome: PathOutcome;
    confidence?: number; // 1-7 rating
    timeSeconds: number; // Time spent on this task in seconds
    timestamp: string;
}

export interface ParticipantResult {
    participantId: string;
    studyId: string;
    studyName: string;
    status: 'completed' | 'abandoned';
    startedAt: string; // ISO timestamp
    completedAt?: string; // ISO timestamp (null if abandoned)
    totalActiveTime: number; // Total active time in seconds
    taskResults: TaskResult[];
    userAgent?: string;
}
