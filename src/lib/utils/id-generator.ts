/**
 * Generate a unique ID for studies, nodes, tasks, etc.
 */
export function generateId(): string {
    return `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateStudyId(): string {
    return `study-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateParticipantId(): string {
    return `participant-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
