import type { StorageAdapter } from "./types";
import type { StorageConfig } from "@/lib/types/study";
import { CustomApiAdapter } from "./adapters/custom-api";
import { LocalDownloadAdapter } from "./adapters/local-download";
import { GoogleSheetsAppsScriptAdapter } from "./adapters/google-sheets-apps-script";
import { GoogleSheetsOAuthAdapter } from "./adapters/google-sheets-oauth";

/**
 * Creates a storage adapter instance based on the storage configuration.
 */
export function createStorageAdapter(config: StorageConfig): StorageAdapter {
    switch (config.type) {
        case 'custom-api':
            return new CustomApiAdapter(config);
        case 'local-download':
            return new LocalDownloadAdapter();
        case 'google-sheets':
            // Choose adapter based on method
            if (config.googleSheetsMethod === 'oauth-api') {
                return new GoogleSheetsOAuthAdapter(config);
            } else {
                // Default to Apps Script method
                return new GoogleSheetsAppsScriptAdapter(config);
            }
        case 'hosted-backend':
            // TODO: Implement HostedBackendAdapter when backend is ready
            throw new Error("Hosted Backend adapter not yet implemented");
        default:
            throw new Error(`Unknown storage type: ${(config as any).type}`);
    }
}

