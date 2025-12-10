import type { Participant } from '../types';
import { parsePath, getNodeAtLevel } from './path-utils';

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
    // Parse all expected paths (comma-separated)
    const expectedAnswers = task.expectedAnswer.split(',').map(a => a.trim()).filter(a => a.length > 0);

    if (expectedAnswers.length === 0) {
      return null;
    }

    // Parse all expected paths
    const expectedPaths = expectedAnswers.map(answer => parsePath(answer)).filter(path => path.length > 0);

    if (expectedPaths.length === 0) {
      return null;
    }

    // Collect all possible nodes at each level from all expected paths
    // Level 1: All unique nodes at level 1 across all expected paths
    const level1Nodes = new Set<string>();
    const level2Nodes = new Set<string>();
    const level3Nodes = new Set<string>();

    // Track if any path actually has level 2 or level 3 (not just final destination)
    let hasActualLevel2 = false;
    let hasActualLevel3 = false;

    expectedPaths.forEach(path => {
      const node1 = getNodeAtLevel(path, 1);
      const node2 = getNodeAtLevel(path, 2);
      const node3 = getNodeAtLevel(path, 3);

      if (node1) level1Nodes.add(node1.toLowerCase().trim());
      if (node2) {
        level2Nodes.add(node2.toLowerCase().trim());
        hasActualLevel2 = true;
      }
      if (node3) {
        level3Nodes.add(node3.toLowerCase().trim());
        hasActualLevel3 = true;
      }
    });

    // If no level 1 nodes exist, return null
    if (level1Nodes.size === 0) {
      return null;
    }

    // For display, use the first expected path's node names (or combine if different)
    // This is just for the display name - the calculation uses all nodes
    const firstPath = expectedPaths[0];
    const level1Node = getNodeAtLevel(firstPath, 1) || '';
    // Only set level2Node if at least one path has an actual level 2
    const level2Node = hasActualLevel2 ? getNodeAtLevel(firstPath, 2) : null;
    // Only set level3Node if at least one path has an actual level 3
    const level3Node = hasActualLevel3 ? getNodeAtLevel(firstPath, 3) : null;

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
    // Count as success if they reached ANY of the correct nodes at that level from ANY expected path
    // This includes both direct and indirect paths - as long as they visited the node, it counts
    const level1Count = participantsWithResults.filter(p => {
      const result = p.taskResults.find(r => r.taskIndex === task.index);
      if (!result || result.skipped) return false;
      // Check if they reached ANY of the level 1 nodes anywhere in their path
      const participantNodes = parsePath(result.pathTaken);
      return participantNodes.some(node => 
        level1Nodes.has(node.toLowerCase().trim())
      );
    }).length;

    const level2Count = (hasActualLevel2 && level2Nodes.size > 0) ? participantsWithResults.filter(p => {
      const result = p.taskResults.find(r => r.taskIndex === task.index);
      if (!result || result.skipped) return false;
      // Check if they reached ANY of the level 2 nodes anywhere in their path
      const participantNodes = parsePath(result.pathTaken);
      return participantNodes.some(node => 
        level2Nodes.has(node.toLowerCase().trim())
      );
    }).length : 0;

    const level3Count = (hasActualLevel3 && level3Nodes.size > 0) ? participantsWithResults.filter(p => {
      const result = p.taskResults.find(r => r.taskIndex === task.index);
      if (!result || result.skipped) return false;
      
      // First, check if they reached the final destination of any expected path
      // This ensures that if they successfully completed the task, they count for level 3
      if (result.successful) {
        return true;
      }
      
      // Otherwise, check if they reached ANY of the level 3 nodes anywhere in their path
      const participantNodes = parsePath(result.pathTaken);
      return participantNodes.some(node => 
        level3Nodes.has(node.toLowerCase().trim())
      );
    }).length : 0;

    return {
      level1: {
        rate: totalParticipants > 0 ? (level1Count / totalParticipants) * 100 : 0,
        count: level1Count,
        total: totalParticipants,
        nodeName: level1Node
      },
      level2: (hasActualLevel2 && level2Nodes.size > 0) ? {
        rate: totalParticipants > 0 ? (level2Count / totalParticipants) * 100 : 0,
        count: level2Count,
        total: totalParticipants,
        nodeName: level2Node || Array.from(level2Nodes).join(' or ')
      } : null,
      level3: (hasActualLevel3 && level3Nodes.size > 0) ? {
        rate: totalParticipants > 0 ? (level3Count / totalParticipants) * 100 : 0,
        count: level3Count,
        total: totalParticipants,
        nodeName: level3Node || Array.from(level3Nodes).join(' or ')
      } : null
    };
  } catch (error) {
    console.error('Error calculating parent node stats:', error);
    return null;
  }
}

