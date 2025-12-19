import type { StorageAdapter } from "../types";
import type { ParticipantResult, StudyConfig, StorageConfig } from "@/lib/types/study";

export class CustomApiAdapter implements StorageAdapter {
    private config: StorageConfig;

    constructor(config: StorageConfig) {
        this.config = config;
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (this.config.authType === 'api-key' && this.config.apiKey) {
            // Supabase PostgREST requires 'apikey' header (lowercase)
            // Other APIs typically use 'X-API-Key'
            const isSupabase = this.config.endpointUrl?.includes('supabase.co');
            if (isSupabase) {
                headers['apikey'] = this.config.apiKey;
            } else {
                headers['X-API-Key'] = this.config.apiKey;
            }
        } else if (this.config.authType === 'bearer-token' && this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        return headers;
    }

    async saveConfig(config: StudyConfig): Promise<{ success: boolean; error?: string }> {
        if (!this.config.endpointUrl) {
            return { success: false, error: "No endpoint URL configured" };
        }

        try {
            const isSupabase = this.config.endpointUrl.includes('supabase.co');

            // For Supabase, wrap the config in the table schema format
            // For other APIs, send the config directly
            const payload = isSupabase ? {
                id: config.id,
                config: config, // Store entire StudyConfig in JSONB column
                updated_at: new Date().toISOString(),
            } : config;

            if (isSupabase) {
                // For Supabase, use upsert pattern: try PATCH first, if no rows updated, use POST
                // If POST gets 409, the study exists, so retry with PATCH
                let response = await fetch(`${this.config.endpointUrl}/studies?id=eq.${config.id}`, {
                    method: 'PATCH',
                    headers: this.getHeaders(),
                    body: JSON.stringify(payload),
                });

                // Check if PATCH actually updated a row
                if (response.ok) {
                    const responseText = await response.text();
                    // If PATCH returns empty array, no rows were updated (study doesn't exist)
                    if (responseText === '[]') {
                        // Study doesn't exist, create it
                        const createPayload = {
                            ...payload,
                            created_at: config.createdAt || new Date().toISOString(),
                        };

                        response = await fetch(`${this.config.endpointUrl}/studies`, {
                            method: 'POST',
                            headers: this.getHeaders(),
                            body: JSON.stringify(createPayload),
                        });

                        // If POST returns 409 (duplicate), study exists, retry with PATCH
                        if (response.status === 409) {
                            // Study exists, update it with PATCH
                            response = await fetch(`${this.config.endpointUrl}/studies?id=eq.${config.id}`, {
                                method: 'PATCH',
                                headers: this.getHeaders(),
                                body: JSON.stringify(payload),
                            });
                        }
                    }
                } else if (response.status === 404) {
                    // If PATCH returns 404, try POST to create
                    const createPayload = {
                        ...payload,
                        created_at: config.createdAt || new Date().toISOString(),
                    };

                    response = await fetch(`${this.config.endpointUrl}/studies`, {
                        method: 'POST',
                        headers: this.getHeaders(),
                        body: JSON.stringify(createPayload),
                    });

                    // If POST returns 409, study exists, retry with PATCH
                    if (response.status === 409) {
                        response = await fetch(`${this.config.endpointUrl}/studies?id=eq.${config.id}`, {
                            method: 'PATCH',
                            headers: this.getHeaders(),
                            body: JSON.stringify(payload),
                        });
                    }
                }

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                return { success: true };
            } else {
                // For other APIs, use standard PUT/POST flow
                let response = await fetch(`${this.config.endpointUrl}/studies/${config.id}`, {
                    method: 'PUT',
                    headers: this.getHeaders(),
                    body: JSON.stringify(payload),
                });

                // If PUT returns 404, try POST to create new
                if (response.status === 404) {
                    response = await fetch(`${this.config.endpointUrl}/studies`, {
                        method: 'POST',
                        headers: this.getHeaders(),
                        body: JSON.stringify(payload),
                    });
                }

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                return { success: true };
            }
        } catch (error) {
            console.error("Failed to save study config to custom API:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async submitResult(result: ParticipantResult): Promise<{ success: boolean; error?: string }> {
        if (!this.config.endpointUrl) {
            return { success: false, error: "No endpoint URL configured" };
        }

        try {
            const isSupabase = this.config.endpointUrl.includes('supabase.co');

            if (isSupabase) {
                // For Supabase, POST to the results table with upsert preference
                const payload = {
                    study_id: result.studyId,
                    participant_id: result.participantId,
                    result_data: result, // Store entire ParticipantResult in JSONB column
                };

                const headers = {
                    ...(this.getHeaders() as Record<string, string>),
                    'Prefer': 'upsert=true'
                };

                const response = await fetch(`${this.config.endpointUrl}/results`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                return { success: true };
            } else {
                // For other APIs, use standard endpoint
                const response = await fetch(`${this.config.endpointUrl}/studies/${result.studyId}/results`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify(result),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return { success: true };
            }
        } catch (error) {
            console.error("Failed to submit results to custom API:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async checkStatus(studyId: string): Promise<{ status: 'active' | 'closed' | 'not-found'; error?: string }> {
        if (!this.config.endpointUrl) {
            return { status: 'not-found', error: "No endpoint URL configured" };
        }

        try {
            const isSupabase = this.config.endpointUrl.includes('supabase.co');

            if (isSupabase) {
                // For Supabase, use the SQL function via RPC endpoint
                const response = await fetch(`${this.config.endpointUrl}/rpc/get_study_status`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ study_id_param: studyId }),
                });

                if (response.status === 404) {
                    return { status: 'not-found' };
                }

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const data = await response.json();
                if (data.status === 'not-found') {
                    return { status: 'not-found' };
                }
                return { status: data.status as 'active' | 'closed' };
            } else {
                // For other APIs, use the standard /status endpoint
                const response = await fetch(`${this.config.endpointUrl}/studies/${studyId}/status`, {
                    method: 'GET',
                    headers: this.getHeaders(),
                });

                if (response.status === 404) {
                    return { status: 'not-found' };
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return { status: data.status };
            }
        } catch (error) {
            return { status: 'not-found', error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async updateStatus(studyId: string, status: 'active' | 'closed'): Promise<{ success: boolean; error?: string }> {
        if (!this.config.endpointUrl) {
            return { success: false, error: "No endpoint URL configured" };
        }

        try {
            const isSupabase = this.config.endpointUrl.includes('supabase.co');

            if (isSupabase) {
                // For Supabase, use the SQL function via RPC endpoint
                const response = await fetch(`${this.config.endpointUrl}/rpc/update_study_status`, {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        study_id_param: studyId,
                        new_status: status
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const data = await response.json();
                if (data.success === false) {
                    return { success: false, error: data.error || "Failed to update status" };
                }

                return { success: true };
            } else {
                // For other APIs, use the standard /status endpoint
                const response = await fetch(`${this.config.endpointUrl}/studies/${studyId}/status`, {
                    method: 'PUT',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ status }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return { success: true };
            }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async fetchConfig(studyId: string): Promise<{ config: StudyConfig | null; error?: string }> {
        if (!this.config.endpointUrl) {
            return { config: null, error: "No endpoint URL configured" };
        }

        try {
            const isSupabase = this.config.endpointUrl.includes('supabase.co');

            if (isSupabase) {
                // For Supabase, use query parameter to get by ID
                const response = await fetch(`${this.config.endpointUrl}/studies?id=eq.${studyId}`, {
                    method: 'GET',
                    headers: this.getHeaders(),
                });

                if (response.status === 404) {
                    return { config: null, error: "Study not found" };
                }

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const data = await response.json();

                // Supabase returns an array, get first element
                if (!Array.isArray(data) || data.length === 0) {
                    return { config: null, error: "Study not found" };
                }

                // Extract the config from the JSONB column
                const config = data[0].config;

                if (!config) {
                    return { config: null, error: "Study config not found" };
                }

                return { config };
            } else {
                // For other APIs, use standard endpoint
                const response = await fetch(`${this.config.endpointUrl}/studies/${studyId}`, {
                    method: 'GET',
                    headers: this.getHeaders(),
                });

                if (response.status === 404) {
                    return { config: null, error: "Study not found" };
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return { config: data };
            }
        } catch (error) {
            return { config: null, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async testConnection(): Promise<{ success: boolean; error?: string }> {
        if (!this.config.endpointUrl) {
            return { success: false, error: "No endpoint URL configured" };
        }

        try {
            const isSupabase = this.config.endpointUrl.includes('supabase.co');

            if (isSupabase) {
                // For Supabase, test by querying the studies table
                // Use a dummy query that will return empty or 404, but confirms API is reachable
                const response = await fetch(`${this.config.endpointUrl}/studies?limit=1`, {
                    method: 'GET',
                    headers: this.getHeaders(),
                });

                // Accept 200 (OK) or 401 (Unauthorized means API is reachable but auth failed)
                // 404 means endpoint doesn't exist (table not created)
                if (response.status === 401) {
                    // API is reachable but auth failed - this is actually a connection success
                    // (the auth issue will be caught elsewhere)
                    return { success: true };
                } else if (response.status === 200 || response.status === 404) {
                    return { success: true };
                } else {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    return { success: false, error: `API returned status ${response.status}: ${errorText}` };
                }
            } else {
                // For other APIs, try /health endpoint
                const response = await fetch(`${this.config.endpointUrl}/health`, {
                    method: 'GET',
                    headers: this.getHeaders(),
                });

                // Accept 200 (OK) or 404 (Not Found - but server reachable)
                if (response.status === 200 || response.status === 404) {
                    return { success: true };
                } else {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    return { success: false, error: `API returned status ${response.status}: ${errorText}` };
                }
            }
        } catch (error) {
            // If fetch fails (network error), then connection failed
            return { success: false, error: error instanceof Error ? error.message : "Connection failed" };
        }
    }

    async fetchAllStudies(): Promise<{ studies: StudyConfig[] | null; error?: string }> {
        if (!this.config.endpointUrl) {
            return { studies: null, error: "No endpoint URL configured" };
        }

        try {
            const isSupabase = this.config.endpointUrl.includes('supabase.co');

            const response = await fetch(`${this.config.endpointUrl}/studies`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();

            if (isSupabase) {
                // For Supabase, data is an array of rows, each with a 'config' JSONB column
                if (Array.isArray(data)) {
                    // Extract the config from each row
                    const studies = data
                        .map((row: any) => row.config)
                        .filter((config: any) => config !== null && config !== undefined);
                    return { studies };
                } else {
                    return { studies: null, error: "Invalid response format: expected array of study rows" };
                }
            } else {
                // For other APIs, expect array of StudyConfig or { studies: [...] }
                if (Array.isArray(data)) {
                    return { studies: data };
                } else {
                    // Some APIs might return { studies: [...] } format
                    if (data.studies && Array.isArray(data.studies)) {
                        return { studies: data.studies };
                    }
                    return { studies: null, error: "Invalid response format: expected array of studies" };
                }
            }
        } catch (error) {
            console.error("Failed to fetch all studies from custom API:", error);
            return { studies: null, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async fetchResults(studyId: string): Promise<{ results: ParticipantResult[] | null; error?: string }> {
        if (!this.config.endpointUrl) {
            return { results: null, error: "No endpoint URL configured" };
        }

        try {
            const isSupabase = this.config.endpointUrl.includes('supabase.co');

            if (isSupabase) {
                // For Supabase, query the results table directly using study_id filter
                const response = await fetch(`${this.config.endpointUrl}/results?study_id=eq.${studyId}`, {
                    method: 'GET',
                    headers: this.getHeaders(),
                });

                if (response.status === 404) {
                    return { results: [] }; // No results yet, return empty array
                }

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const data = await response.json();

                // Supabase returns an array of rows, each with result_data JSONB column
                if (Array.isArray(data)) {
                    // Extract the result_data from each row
                    const results = data.map((row: any) => row.result_data).filter((r: any) => r !== null);
                    return { results };
                } else {
                    return { results: null, error: "Invalid response format: expected array of results" };
                }
            } else {
                // For other APIs, use standard endpoint
                const response = await fetch(`${this.config.endpointUrl}/studies/${studyId}/results`, {
                    method: 'GET',
                    headers: this.getHeaders(),
                });

                if (response.status === 404) {
                    return { results: [] }; // No results yet, return empty array
                }

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const results = await response.json();

                // Ensure we return an array
                if (Array.isArray(results)) {
                    return { results };
                } else {
                    // Some APIs might return { results: [...] } format
                    if (results.results && Array.isArray(results.results)) {
                        return { results: results.results };
                    }
                    return { results: null, error: "Invalid response format: expected array of results" };
                }
            }
        } catch (error) {
            console.error("Failed to fetch results from custom API:", error);
            return { results: null, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }
}
