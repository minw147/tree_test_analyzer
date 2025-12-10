/**
 * Task Randomization Utility
 * 
 * Implements Fisher-Yates shuffle algorithm to randomize task order
 * for each participant, reducing order bias in tree test results.
 */

/**
 * Shuffles an array of tasks using Fisher-Yates algorithm
 * @param tasks Array of tasks with id property
 * @returns New shuffled array (original array is not modified)
 */
export function shuffleTasks<T extends { id: string }>(tasks: T[]): T[] {
    // Create a copy to avoid mutating the original array
    const shuffled = [...tasks];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
        // Pick a random index from 0 to i (inclusive)
        const j = Math.floor(Math.random() * (i + 1));
        
        // Swap elements at positions i and j
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
}

