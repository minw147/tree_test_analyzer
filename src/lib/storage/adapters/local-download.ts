import type { StorageAdapter } from "../types";
import type { ParticipantResult, StudyConfig } from "@/lib/types/study";
import * as XLSX from "xlsx";

export class LocalDownloadAdapter implements StorageAdapter {
    async saveConfig(_config: StudyConfig): Promise<{ success: boolean; error?: string }> {
        // For local download, config is already saved to localStorage by Creator
        // This is a no-op, but we return success for consistency
        return { success: true };
    }

    async submitResult(result: ParticipantResult): Promise<{ success: boolean; error?: string }> {
        try {
            // Format data for CSV/Excel export
            // We need to flatten the task results into columns
            const row: Record<string, string | number | null> = {
                "Participant ID": result.participantId,
                "Status": result.status === 'completed' ? 'Completed' : 'Abandoned',
                "Start Time (UTC)": result.startedAt,
                "End Time (UTC)": result.completedAt || null,
                "Time Taken": this.formatDuration(result.totalActiveTime),
            };

            // Add task specific columns
            result.taskResults.forEach((task, index) => {
                const taskNum = index + 1;
                row[`Task ${taskNum} Path Taken`] = task.pathTaken.join('/');

                // Map outcome to string expected by analyzer
                let outcomeStr = "";
                switch (task.outcome) {
                    case 'direct-success': outcomeStr = "Direct Success"; break;
                    case 'indirect-success': outcomeStr = "Indirect Success"; break;
                    case 'failure': outcomeStr = "Failure"; break;
                    case 'direct-skip': outcomeStr = "Direct Skip"; break;
                    case 'indirect-skip': outcomeStr = "Indirect Skip"; break;
                }
                row[`Task ${taskNum} Path Outcome`] = outcomeStr;

                row[`Task ${taskNum}: How confident are you with your answer?`] = task.confidence || null;
                row[`Task ${taskNum} Time`] = task.timeSeconds;
            });

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet([row]);
            XLSX.utils.book_append_sheet(wb, ws, "Results");

            // Generate filename
            const filename = `tree-test-result-${result.studyId}-${result.participantId}.xlsx`;

            // Download file
            XLSX.writeFile(wb, filename);

            return { success: true };
        } catch (error) {
            console.error("Failed to download results:", error);
            return { success: false, error: "Failed to generate download" };
        }
    }

    async checkStatus(_studyId: string): Promise<{ status: 'active' | 'closed' | 'not-found'; error?: string }> {
        // Local download is always active for testing
        return { status: 'active' };
    }

    async updateStatus(_studyId: string, _status: 'active' | 'closed'): Promise<{ success: boolean; error?: string }> {
        // Cannot update status for local download
        return { success: true };
    }

    async fetchConfig(_studyId: string): Promise<{ config: StudyConfig | null; error?: string }> {
        // For local testing, we might load from localStorage or return null
        // The participant view will likely handle loading from localStorage/sessionStorage for preview
        return { config: null, error: "Local adapter does not support fetching config" };
    }

    async testConnection(): Promise<{ success: boolean; error?: string }> {
        return { success: true };
    }

    private formatDuration(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}
