import type { StorageConfig } from "@/lib/types/study";

export interface GlobalSettings {
    customApi?: {
        endpointUrl?: string;
        authType?: 'none' | 'api-key' | 'bearer-token';
        apiKey?: string;
    };
}

const STORAGE_KEY = "tree-test-global-settings";

/**
 * Load global settings from localStorage
 */
export function loadGlobalSettings(): GlobalSettings {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error("Failed to load global settings:", error);
    }
    return {};
}

/**
 * Save global settings to localStorage
 */
export function saveGlobalSettings(settings: GlobalSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Failed to save global settings:", error);
    }
}

/**
 * Get global Custom API configuration as StorageConfig
 */
export function getGlobalCustomApiConfig(): StorageConfig | null {
    const settings = loadGlobalSettings();
    if (settings.customApi && settings.customApi.endpointUrl) {
        return {
            type: 'custom-api',
            endpointUrl: settings.customApi.endpointUrl,
            authType: settings.customApi.authType || 'none',
            apiKey: settings.customApi.apiKey,
        };
    }
    return null;
}

/**
 * Save Custom API configuration to global settings
 */
export function saveGlobalCustomApiConfig(config: StorageConfig): void {
    if (config.type !== 'custom-api') {
        console.warn("Attempted to save non-Custom API config as global Custom API config");
        return;
    }

    const settings = loadGlobalSettings();
    settings.customApi = {
        endpointUrl: config.endpointUrl,
        authType: config.authType,
        apiKey: config.apiKey,
    };
    saveGlobalSettings(settings);
}

