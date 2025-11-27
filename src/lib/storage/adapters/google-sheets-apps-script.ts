import type { StorageAdapter } from "../types";
import type { ParticipantResult, StudyConfig, StorageConfig } from "@/lib/types/study";

/**
 * Google Sheets adapter using Apps Script webhook method.
 * This is the simpler method - user installs a Google Apps Script that creates a webhook endpoint.
 */
export class GoogleSheetsAppsScriptAdapter implements StorageAdapter {
    private config: StorageConfig;

    constructor(config: StorageConfig) {
        this.config = config;
    }

    private formatDuration(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    private formatResultForSheet(result: ParticipantResult): Record<string, string | number | null> {
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
                case 'skip': outcomeStr = "Skip"; break;
            }
            row[`Task ${taskNum} Path Outcome`] = outcomeStr;

            row[`Task ${taskNum}: How confident are you with your answer?`] = task.confidence || null;
            row[`Task ${taskNum} Time`] = task.timeSeconds;
        });

        return row;
    }

    async submitResult(result: ParticipantResult): Promise<{ success: boolean; error?: string }> {
        if (!this.config.webhookUrl) {
            return { success: false, error: "No webhook URL configured" };
        }

        try {
            const rowData = this.formatResultForSheet(result);

            // Use form-encoded data to avoid CORS preflight issues with Google Apps Script
            const formData = new URLSearchParams();
            formData.append('payload', JSON.stringify({
                action: 'appendRow',
                data: rowData,
            }));

            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            return { success: true };
        } catch (error) {
            console.error("Failed to submit results to Google Sheets via Apps Script:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async saveConfig(config: StudyConfig): Promise<{ success: boolean; error?: string }> {
        if (!this.config.webhookUrl) {
            return { success: false, error: "No webhook URL configured" };
        }

        try {
            // Use form-encoded data to avoid CORS preflight issues with Google Apps Script
            const formData = new URLSearchParams();
            formData.append('payload', JSON.stringify({
                action: 'saveConfig',
                studyId: config.id,
                config: config,
            }));

            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            return { success: true };
        } catch (error) {
            console.error("Failed to save study config to Google Sheets via Apps Script:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async checkStatus(studyId: string): Promise<{ status: 'active' | 'closed' | 'not-found'; error?: string }> {
        if (!this.config.webhookUrl) {
            return { status: 'not-found', error: "No webhook URL configured" };
        }

        try {
            // Use form-encoded data to avoid CORS preflight issues with Google Apps Script
            const formData = new URLSearchParams();
            formData.append('payload', JSON.stringify({
                action: 'checkStatus',
                studyId: studyId,
            }));

            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            if (!response.ok) {
                return { status: 'not-found' };
            }

            const data = await response.json();
            return { status: data.status || 'active' };
        } catch (error) {
            return { status: 'not-found', error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async updateStatus(studyId: string, status: 'active' | 'closed'): Promise<{ success: boolean; error?: string }> {
        if (!this.config.webhookUrl) {
            return { success: false, error: "No webhook URL configured" };
        }

        try {
            // Use form-encoded data to avoid CORS preflight issues with Google Apps Script
            const formData = new URLSearchParams();
            formData.append('payload', JSON.stringify({
                action: 'updateStatus',
                studyId: studyId,
                status: status,
            }));

            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async fetchConfig(studyId: string): Promise<{ config: StudyConfig | null; error?: string }> {
        if (!this.config.webhookUrl) {
            return { config: null, error: "No webhook URL configured" };
        }

        try {
            // Use form-encoded data to avoid CORS preflight issues with Google Apps Script
            const formData = new URLSearchParams();
            formData.append('payload', JSON.stringify({
                action: 'fetchConfig',
                studyId: studyId,
            }));

            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            if (!response.ok) {
                return { config: null, error: "Study not found" };
            }

            const data = await response.json();
            return { config: data.config || null };
        } catch (error) {
            return { config: null, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async testConnection(): Promise<{ success: boolean; error?: string }> {
        if (!this.config.webhookUrl) {
            return { success: false, error: "No webhook URL configured" };
        }

        try {
            // Use form-encoded data to avoid CORS preflight issues with Google Apps Script
            const formData = new URLSearchParams();
            formData.append('payload', JSON.stringify({
                action: 'test',
            }));

            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Connection failed" };
        }
    }
}

