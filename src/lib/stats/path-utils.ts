/**
 * Path parsing utilities for tree test paths
 * Handles various path formats: "->", ">", "/"
 */

/**
 * Normalize different path separators to a consistent format
 * @param path - Path string with various separators
 * @returns Normalized path string
 */
export function normalizePath(path: string): string {
  if (!path || typeof path !== 'string') {
    return '';
  }

  try {
    // Replace various separators with a consistent delimiter
    // Handle: "->", ">", "/", and variations with/without spaces
    return path
      .replace(/\s*->\s*/g, '|')
      .replace(/\s*>\s*/g, '|')
      .replace(/\s*\/\s*/g, '|')
      .trim();
  } catch (error) {
    console.error('Path normalization error:', error);
    return '';
  }
}

/**
 * Parse a path string into an array of node names
 * @param path - Path string (e.g., "Home -> Products -> Electronics")
 * @returns Array of node names (e.g., ["Home", "Products", "Electronics"])
 */
export function parsePath(path: string): string[] {
  if (!path || typeof path !== 'string') {
    return [];
  }

  try {
    const normalized = normalizePath(path);
    
    if (!normalized) {
      return [];
    }

    return normalized
      .split('|')
      .map(node => node.trim())
      .filter(node => node.length > 0);
  } catch (error) {
    console.error('Path parsing error:', error);
    return [];
  }
}

/**
 * Get the node name at a specific level (1-indexed)
 * Level 1 = first node after root (index 1)
 * Level 2 = second node (index 2)
 * Level 3 = third node (index 3)
 * @param path - Array of node names
 * @param level - Level number (1, 2, or 3)
 * @returns Node name at the specified level, or null if level doesn't exist
 */
export function getNodeAtLevel(path: string[], level: number): string | null {
  if (!path || !Array.isArray(path) || path.length === 0) {
    return null;
  }

  if (level < 1 || level > path.length) {
    return null;
  }

  // Level is 1-indexed, but array is 0-indexed
  // Level 1 = index 1 (second element, first after root)
  // Level 2 = index 2 (third element)
  // Level 3 = index 3 (fourth element)
  const index = level; // Since we want level 1 to be the first node after root

  if (index >= path.length) {
    return null;
  }

  const node = path[index];
  return node && node.trim() ? node.trim() : null;
}

/**
 * Get the expected path up to a specific level
 * @param originalPath - Original path string (e.g., "Home -> Products -> Electronics -> Sale")
 * @param level - Level number (1, 2, or 3)
 * @returns Path up to the specified level (e.g., "Home -> Products" for level 1)
 */
export function getPathUpToLevel(originalPath: string, level: number): string {
  if (!originalPath || typeof originalPath !== 'string') {
    return '';
  }

  try {
    const parsed = parsePath(originalPath);
    
    if (parsed.length === 0 || level < 1) {
      return '';
    }

    // Get nodes up to and including the specified level
    // Level 1 = first 2 nodes (root + level 1)
    // Level 2 = first 3 nodes (root + level 1 + level 2)
    // Level 3 = first 4 nodes (root + level 1 + level 2 + level 3)
    const nodesUpToLevel = parsed.slice(0, level + 1);
    
    if (nodesUpToLevel.length === 0) {
      return '';
    }

    // Reconstruct path using " -> " separator
    return nodesUpToLevel.join(' -> ');
  } catch (error) {
    console.error('Error getting path up to level:', error);
    return '';
  }
}

/**
 * Check if a participant's path contains a specific target node
 * Case-insensitive comparison
 * @param participantPath - Participant's path string
 * @param targetNode - Node name to search for
 * @returns True if the path contains the target node
 */
export function pathContainsNode(participantPath: string, targetNode: string): boolean {
  if (!participantPath || !targetNode) {
    return false;
  }

  try {
    // Normalize both paths for comparison
    const normalizedParticipantPath = normalizePath(participantPath);
    const normalizedTargetNode = targetNode.trim().toLowerCase();

    if (!normalizedParticipantPath || !normalizedTargetNode) {
      return false;
    }

    // Parse participant path into array
    const participantNodes = parsePath(normalizedParticipantPath);

    // Check if any node in the path matches (case-insensitive)
    return participantNodes.some(node => 
      node.toLowerCase().trim() === normalizedTargetNode
    );
  } catch (error) {
    console.error('Path contains node check error:', error);
    return false;
  }
}
