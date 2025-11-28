import type { ParticipantResult, StudyConfig } from "@/lib/types/study";

export interface StorageAdapter {
    /**
     * Submit a participant's result to storage.
     * Must ensure data is in analyzer-compatible format.
     */
    submitResult(result: ParticipantResult): Promise<{ success: boolean; error?: string }>;

    /**
     * Save or update a study configuration.
     * Used when publishing or updating a study.
     */
    saveConfig(config: StudyConfig): Promise<{ success: boolean; error?: string }>;

    /**
     * Check the status of a study.
     */
    checkStatus(studyId: string): Promise<{ status: 'active' | 'closed' | 'not-found'; error?: string }>;

    /**
     * Update the status of a study (e.g. close it).
     */
    updateStatus(studyId: string, status: 'active' | 'closed'): Promise<{ success: boolean; error?: string }>;

    /**
     * Fetch the study configuration.
     * Used by participant view to load the study.
     */
    fetchConfig(studyId: string): Promise<{ config: StudyConfig | null; error?: string }>;

    /**
     * Test the connection to the storage backend.
     * Used in the Creator UI when configuring storage.
     */
    testConnection(): Promise<{ success: boolean; error?: string }>;

    /**
     * Fetch all studies from storage.
     * Optional method - only implemented by adapters that support listing studies (e.g., Custom API).
     * Used for syncing studies from remote storage.
     */
    fetchAllStudies?(): Promise<{ studies: StudyConfig[] | null; error?: string }>;

    /**
     * Fetch all participant results for a study.
     * Optional method - only implemented by adapters that can fetch historical results.
     * Used for importing study data into the Analyzer.
     */
    fetchResults?(studyId: string): Promise<{ results: ParticipantResult[] | null; error?: string }>;
}
