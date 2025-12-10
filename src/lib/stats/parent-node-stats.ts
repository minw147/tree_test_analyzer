import type { Participant } from '../types';
import { parsePath, getNodeAtLevel, pathContainsNode } from './path-utils';

/**
 * Statistics for a single parent node level
 */
export interface ParentNodeLevelStats {
  rate: number;           // Success rate percentage
  count: number;          // Number who reached this node
  total: number;          // Total participants
  nodeName: string;       // Name of the node
}

/**
 * Statistics for all parent node levels (1, 2, 3)
 */
export interface ParentNodeStats {
  level1: ParentNodeLevelStats;
  level2: ParentNodeLevelStats | null;
  level3: ParentNodeLevelStats | null;
}

/**
 * Calculate parent node success rates for a task
 * 
 * For a path like "Home -> Products -> Electronics -> Sale -> Clearance":
 * - Level 1: Count participants who reached "Products"
 * - Level 2: Count participants who reached "Electronics"
 * - Level 3: Count participants who reached "Sale"
 * 
 * @param task - Task with expectedAnswer field
 * @param participants - Array of participants
 * @param taskIndex - Index of the task (for filtering task results)
 * @returns Parent node statistics, or null if calculation fails
 */
export function calculateParentNodeStats(
  task: { expectedAnswer: string; index: number },
  participants: Participant[]
): ParentNodeStats | null {
  try {
    // Parse expected path
    // Handle multiple expected answers (comma-separated)
    // Use the first expected answer for parent node calculation
    const expectedAnswers = task.expectedAnswer.split(',').map(a => a.trim());
    const firstExpectedAnswer = expectedAnswers[0] || '';

    if (!firstExpectedAnswer) {
      return null;
    }

    const expectedPath = parsePath(firstExpectedAnswer);

    if (expectedPath.length === 0) {
      return null;
    }

    // Get nodes at each level
    const level1Node = getNodeAtLevel(expectedPath, 1);
    const level2Node = getNodeAtLevel(expectedPath, 2);
    const level3Node = getNodeAtLevel(expectedPath, 3);

    // If no level 1 node exists, return null
    if (!level1Node) {
      return null;
    }

    // Filter participants who have results for this task
    const participantsWithResults = participants.filter(p => {
      return p.taskResults.some(r => r.taskIndex === task.index);
    });

    const totalParticipants = participantsWithResults.length;

    if (totalParticipants === 0) {
      return {
        level1: {
          rate: 0,
          count: 0,
          total: 0,
          nodeName: level1Node
        },
        level2: level2Node ? {
          rate: 0,
          count: 0,
          total: 0,
          nodeName: level2Node
        } : null,
        level3: level3Node ? {
          rate: 0,
          count: 0,
          total: 0,
          nodeName: level3Node
        } : null
      };
    }

    // Calculate for each level
    // Only count participants who didn't skip the task
    const level1Count = participantsWithResults.filter(p => {
      const result = p.taskResults.find(r => r.taskIndex === task.index);
      if (!result || result.skipped) return false;
      return pathContainsNode(result.pathTaken, level1Node);
    }).length;

    const level2Count = level2Node ? participantsWithResults.filter(p => {
      const result = p.taskResults.find(r => r.taskIndex === task.index);
      if (!result || result.skipped) return false;
      return pathContainsNode(result.pathTaken, level2Node);
    }).length : 0;

    const level3Count = level3Node ? participantsWithResults.filter(p => {
      const result = p.taskResults.find(r => r.taskIndex === task.index);
      if (!result || result.skipped) return false;
      return pathContainsNode(result.pathTaken, level3Node);
    }).length : 0;

    return {
      level1: {
        rate: totalParticipants > 0 ? (level1Count / totalParticipants) * 100 : 0,
        count: level1Count,
        total: totalParticipants,
        nodeName: level1Node
      },
      level2: level2Node ? {
        rate: totalParticipants > 0 ? (level2Count / totalParticipants) * 100 : 0,
        count: level2Count,
        total: totalParticipants,
        nodeName: level2Node
      } : null,
      level3: level3Node ? {
        rate: totalParticipants > 0 ? (level3Count / totalParticipants) * 100 : 0,
        count: level3Count,
        total: totalParticipants,
        nodeName: level3Node
      } : null
    };
  } catch (error) {
    console.error('Error calculating parent node stats:', error);
    return null;
  }
}

