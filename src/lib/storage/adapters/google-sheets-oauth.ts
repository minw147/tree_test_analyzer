import type { StorageAdapter } from "../types";
import type { ParticipantResult, StudyConfig, StorageConfig } from "@/lib/types/study";

/**
 * Google Sheets adapter using OAuth API method.
 * This requires OAuth authentication and direct access to Google Sheets API.
 * 
 * Note: This is a simplified implementation. In production, you'd want to:
 * - Use Google's official OAuth flow
 * - Store tokens securely
 * - Handle token refresh
 * - Use the googleapis npm package
 */
export class GoogleSheetsOAuthAdapter implements StorageAdapter {
    private config: StorageConfig;
    private accessToken: string | null = null;

    constructor(config: StorageConfig) {
        this.config = config;
        // In a real implementation, we'd load the token from secure storage
        // For now, we'll expect it to be set via a method or stored in sessionStorage
        this.loadToken();
    }

    private loadToken(): void {
        // Load OAuth token from sessionStorage (in production, use more secure storage)
        if (typeof window !== 'undefined') {
            const tokenKey = `google_oauth_token_${this.config.sheetId || 'default'}`;
            this.accessToken = sessionStorage.getItem(tokenKey);
        }
    }

    private setToken(token: string): void {
        this.accessToken = token;
        if (typeof window !== 'undefined') {
            const tokenKey = `google_oauth_token_${this.config.sheetId || 'default'}`;
            sessionStorage.setItem(tokenKey, token);
        }
    }

    private formatDuration(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    private formatResultForSheet(result: ParticipantResult): (string | number | null)[] {
        const row: (string | number | null)[] = [
            result.participantId,
            result.status === 'completed' ? 'Completed' : 'Incomplete',
            result.startedAt,
            result.completedAt || null,
            this.formatDuration(result.totalActiveTime),
        ];

        // Add task specific columns
        result.taskResults.forEach((task) => {
            row.push(task.pathTaken.join('/'));

            // Map outcome to string expected by analyzer
            let outcomeStr = "";
            switch (task.outcome) {
                case 'direct-success': outcomeStr = "Direct Success"; break;
                case 'indirect-success': outcomeStr = "Indirect Success"; break;
                case 'failure': outcomeStr = "Failure"; break;
                case 'direct-skip': outcomeStr = "Direct Skip"; break;
                case 'indirect-skip': outcomeStr = "Indirect Skip"; break;
            }
            row.push(outcomeStr);
            row.push(task.confidence || null);
            row.push(task.timeSeconds);
        });

        return row;
    }

    private async getHeaders(): Promise<HeadersInit> {
        if (!this.accessToken) {
            throw new Error("Not authenticated. Please connect to Google Sheets first.");
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
        };
    }

    private getSheetName(): string {
        return this.config.sheetName || 'Results';
    }

    async submitResult(result: ParticipantResult): Promise<{ success: boolean; error?: string }> {
        if (!this.config.sheetId) {
            return { success: false, error: "No sheet ID configured" };
        }

        if (!this.accessToken) {
            return { success: false, error: "Not authenticated. Please connect to Google Sheets first." };
        }

        try {
            const rowData = this.formatResultForSheet(result);
            const sheetName = this.getSheetName();

            // Use Google Sheets API v4 to append row
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.config.sheetId}/values/${sheetName}!A:Z:append?valueInputOption=RAW`,
                {
                    method: 'POST',
                    headers: await this.getHeaders(),
                    body: JSON.stringify({
                        values: [rowData],
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
            }

            return { success: true };
        } catch (error) {
            console.error("Failed to submit results to Google Sheets:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async saveConfig(config: StudyConfig): Promise<{ success: boolean; error?: string }> {
        if (!this.config.sheetId) {
            return { success: false, error: "No sheet ID configured" };
        }

        if (!this.accessToken) {
            return { success: false, error: "Not authenticated. Please connect to Google Sheets first." };
        }

        try {
            // Store config in a separate sheet or as metadata
            // For simplicity, we'll store it in a "StudyConfigs" sheet
            const configSheetName = 'StudyConfigs';
            const configData = JSON.stringify(config);

            // Try to create the sheet if it doesn't exist, then append the config
            // This is a simplified approach - in production you'd want better error handling
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.config.sheetId}/values/${configSheetName}!A1:append?valueInputOption=RAW`,
                {
                    method: 'POST',
                    headers: await this.getHeaders(),
                    body: JSON.stringify({
                        values: [[config.id, configData]],
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
            }

            return { success: true };
        } catch (error) {
            console.error("Failed to save study config to Google Sheets:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async checkStatus(_studyId: string): Promise<{ status: 'active' | 'closed' | 'not-found'; error?: string }> {
        // For OAuth API, we'd need to read from a status sheet or metadata
        // For now, return active as default
        return { status: 'active' };
    }

    async updateStatus(_studyId: string, _status: 'active' | 'closed'): Promise<{ success: boolean; error?: string }> {
        // For OAuth API, we'd need to update a status sheet or metadata
        // For now, return success
        return { success: true };
    }

    async fetchConfig(studyId: string): Promise<{ config: StudyConfig | null; error?: string }> {
        if (!this.config.sheetId || !this.accessToken) {
            return { config: null, error: "Not configured or authenticated" };
        }

        try {
            // Read from StudyConfigs sheet
            const configSheetName = 'StudyConfigs';
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.config.sheetId}/values/${configSheetName}!A:Z`,
                {
                    method: 'GET',
                    headers: await this.getHeaders(),
                }
            );

            if (!response.ok) {
                return { config: null, error: "Study not found" };
            }

            const data = await response.json();
            // Find the config for this studyId
            if (data.values) {
                for (const row of data.values) {
                    if (row[0] === studyId && row[1]) {
                        return { config: JSON.parse(row[1]) };
                    }
                }
            }

            return { config: null, error: "Study not found" };
        } catch (error) {
            return { config: null, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async testConnection(): Promise<{ success: boolean; error?: string }> {
        if (!this.config.sheetId) {
            return { success: false, error: "No sheet ID configured" };
        }

        if (!this.accessToken) {
            return { success: false, error: "Not authenticated. Please connect to Google Sheets first." };
        }

        try {
            // Try to read the sheet metadata to test connection
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.config.sheetId}`,
                {
                    method: 'GET',
                    headers: await this.getHeaders(),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Connection failed" };
        }
    }

    async fetchResults(_studyId: string): Promise<{ results: ParticipantResult[] | null; error?: string }> {
        // OAuth API method not fully implemented yet
        return { results: null, error: "OAuth API method does not support fetching results yet" };
    }

    // Method to set OAuth token (called after OAuth flow completes)
    setAccessToken(token: string): void {
        this.setToken(token);
    }
}

