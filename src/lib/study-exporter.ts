import type { StudyConfig, TreeNode } from "./types/study";

/**
 * Schema version for study configuration JSON files.
 * Increment this when making breaking changes to the schema.
 */
export const STUDY_CONFIG_SCHEMA_VERSION = "1.0";

/**
 * Convert TreeNode array to tree text format (comma-indented)
 */
export function treeNodesToText(nodes: TreeNode[], level: number = 0): string {
    const lines: string[] = [];
    
    for (const node of nodes) {
        const indent = ",".repeat(level);
        let line = indent + node.name;
        if (node.link) {
            line += `,${node.link}`;
        }
        lines.push(line);
        
        if (node.children && node.children.length > 0) {
            lines.push(treeNodesToText(node.children, level + 1));
        }
    }
    
    return lines.join("\n");
}

/**
 * Export study configuration to JSON file
 */
export function exportStudyConfig(study: StudyConfig): void {
    // Create export object with schema version
    const exportData = {
        schemaVersion: STUDY_CONFIG_SCHEMA_VERSION,
        ...study,
    };

    // Convert to JSON string with pretty formatting
    const jsonString = JSON.stringify(exportData, null, 2);

    // Create blob and download
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Generate filename from study name (sanitize for filesystem)
    const sanitizedName = study.name
        .replace(/[^a-z0-9]/gi, "-")
        .replace(/-+/g, "-")
        .toLowerCase();
    link.download = `${sanitizedName}-config.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
}

/**
 * Validate imported study config JSON
 */
export function validateStudyConfig(data: any): { valid: boolean; error?: string } {
    if (!data || typeof data !== "object") {
        return { valid: false, error: "Invalid JSON format" };
    }

    // Check required fields
    const requiredFields = ["id", "name", "tree", "tasks", "storage", "settings"];
    for (const field of requiredFields) {
        if (!(field in data)) {
            return { valid: false, error: `Missing required field: ${field}` };
        }
    }

    // Validate tree structure
    if (!Array.isArray(data.tree)) {
        return { valid: false, error: "Tree must be an array" };
    }

    // Validate tasks
    if (!Array.isArray(data.tasks)) {
        return { valid: false, error: "Tasks must be an array" };
    }

    // Validate storage config
    if (!data.storage || typeof data.storage.type !== "string") {
        return { valid: false, error: "Invalid storage configuration" };
    }

    // Validate settings
    if (!data.settings || typeof data.settings !== "object") {
        return { valid: false, error: "Invalid settings configuration" };
    }

    return { valid: true };
}

