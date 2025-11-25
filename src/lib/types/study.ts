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

export interface StorageConfig {
    type: 'google-sheets' | 'webhook' | 'local-download';
    url?: string; // For Google Sheets script URL or Webhook endpoint
    headers?: Record<string, string>; // For webhook authentication
}

export interface StudySettings {
    welcomeMessage: string;
    instructions: string;
    completedMessage: string;
    customText?: {
        startTest?: string;
        nextButton?: string;
        submitButton?: string;
        taskProgress?: string;
    };
}

export interface StudyConfig {
    id: string;
    name: string;
    creator?: string; // Optional creator/researcher name
    tree: TreeNode[];
    tasks: Task[];
    storage: StorageConfig;
    settings: StudySettings;
    createdAt: string;
    updatedAt: string;
}

// Participant result data structures
export interface TaskResult {
    taskId: string;
    taskDescription: string;
    pathTaken: string[]; // Array of node names clicked
    selectedNode?: string; // Final selected node
    timeMs: number; // Time spent on this task
    timestamp: string;
}

export interface ParticipantResult {
    participantId: string;
    studyId: string;
    studyName: string;
    taskResults: TaskResult[];
    totalActiveTime: number; // Total active time across all tasks
    completedAt: string;
}
