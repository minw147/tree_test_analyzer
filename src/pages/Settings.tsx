import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Settings as SettingsIcon, Loader2, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
    getGlobalCustomApiConfig,
    saveGlobalCustomApiConfig
} from "@/lib/utils/global-settings";
import { createStorageAdapter } from "@/lib/storage/factory";
import type { StorageConfig, StudyConfig } from "@/lib/types/study";

const STORAGE_KEY_STUDIES = "tree-test-studies";

export function Settings() {
    const [customApiConfig, setCustomApiConfig] = useState<{
        endpointUrl: string;
        authType: 'none' | 'api-key' | 'bearer-token';
        apiKey: string;
    }>({
        endpointUrl: "",
        authType: 'none',
        apiKey: "",
    });

    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

    // Sync state
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

    // Load global config on mount
    useEffect(() => {
        const globalConfig = getGlobalCustomApiConfig();
        if (globalConfig) {
            setCustomApiConfig({
                endpointUrl: globalConfig.endpointUrl || "",
                authType: globalConfig.authType || 'none',
                apiKey: globalConfig.apiKey || "",
            });
        }
    }, []);

    const handleTestConnection = async () => {
        if (!customApiConfig.endpointUrl) {
            setTestResult({ success: false, message: "Please enter an API endpoint URL" });
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const storageConfig: StorageConfig = {
                type: 'custom-api',
                endpointUrl: customApiConfig.endpointUrl,
                authType: customApiConfig.authType,
                apiKey: customApiConfig.apiKey,
            };

            const adapter = createStorageAdapter(storageConfig);
            const result = await adapter.testConnection();

            if (result.success) {
                setTestResult({ success: true, message: "Connection successful!" });
            } else {
                setTestResult({ success: false, message: result.error || "Connection failed" });
            }
        } catch (error) {
            setTestResult({ 
                success: false, 
                message: error instanceof Error ? error.message : 'Connection test failed. Please check your configuration.' 
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        setSaveResult(null);

        try {
            const storageConfig: StorageConfig = {
                type: 'custom-api',
                endpointUrl: customApiConfig.endpointUrl,
                authType: customApiConfig.authType,
                apiKey: customApiConfig.apiKey,
            };

            saveGlobalCustomApiConfig(storageConfig);
            setSaveResult({ success: true, message: "Custom API configuration saved successfully!" });
        } catch (error) {
            setSaveResult({ 
                success: false, 
                message: error instanceof Error ? error.message : "Failed to save configuration" 
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSyncFromApi = async () => {
        const globalConfig = getGlobalCustomApiConfig();
        if (!globalConfig || !globalConfig.endpointUrl) {
            setSyncResult({ 
                success: false, 
                message: "Please configure Custom API settings first" 
            });
            return;
        }

        setIsSyncing(true);
        setSyncResult(null);

        try {
            const adapter = createStorageAdapter(globalConfig);
            
            if (!adapter.fetchAllStudies) {
                setSyncResult({ 
                    success: false, 
                    message: "Sync is not supported for this storage type" 
                });
                return;
            }

            const result = await adapter.fetchAllStudies();

            if (!result.studies) {
                setSyncResult({ 
                    success: false, 
                    message: result.error || "Failed to fetch studies from API" 
                });
                return;
            }

            // Load current local studies
            const localStudiesJson = localStorage.getItem(STORAGE_KEY_STUDIES);
            const localStudies: StudyConfig[] = localStudiesJson ? JSON.parse(localStudiesJson) : [];

            // Create a map of local study IDs for quick lookup
            const localStudyMap = new Map<string, StudyConfig>();
            localStudies.forEach(study => {
                localStudyMap.set(study.id, study);
            });

            // Merge: Add API studies that don't exist locally
            // If study exists in both, prefer local version (keep local)
            let addedCount = 0;
            const mergedStudies = [...localStudies];

            result.studies.forEach(apiStudy => {
                if (!localStudyMap.has(apiStudy.id)) {
                    mergedStudies.push(apiStudy);
                    addedCount++;
                }
                // If exists in both, we keep the local version (already in mergedStudies)
            });

            // Save merged studies
            localStorage.setItem(STORAGE_KEY_STUDIES, JSON.stringify(mergedStudies));

            setSyncResult({ 
                success: true, 
                message: `Sync completed successfully! ${addedCount} new study${addedCount !== 1 ? 'ies' : ''} added.`,
                count: addedCount
            });

            // Trigger a storage event so Landing page can refresh
            window.dispatchEvent(new StorageEvent('storage', {
                key: STORAGE_KEY_STUDIES,
                newValue: JSON.stringify(mergedStudies)
            }));
        } catch (error) {
            setSyncResult({ 
                success: false, 
                message: error instanceof Error ? error.message : "Failed to sync studies from API" 
            });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <SettingsIcon className="h-8 w-8" />
                        Settings
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Configure global settings for your Tree Test Suite
                    </p>
                </div>

                {/* Custom API Configuration */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle>Custom API Configuration</CardTitle>
                                <CardDescription>
                                    Set your default Custom API endpoint and authentication. This will be used for all new studies unless overridden.
                                </CardDescription>
                            </div>
                            <Link 
                                to="/help#custom-api-tools" 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                            >
                                View Help
                                <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="endpoint-url">API Endpoint URL</Label>
                            <Input
                                id="endpoint-url"
                                type="url"
                                placeholder="https://api.example.com"
                                value={customApiConfig.endpointUrl}
                                onChange={(e) => setCustomApiConfig({ ...customApiConfig, endpointUrl: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Authentication Method</Label>
                            <RadioGroup
                                value={customApiConfig.authType}
                                onValueChange={(val) => setCustomApiConfig({ ...customApiConfig, authType: val as 'none' | 'api-key' | 'bearer-token' })}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="none" id="auth-none" />
                                    <Label htmlFor="auth-none">None</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="api-key" id="auth-api-key" />
                                    <Label htmlFor="auth-api-key">API Key</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="bearer-token" id="auth-bearer" />
                                    <Label htmlFor="auth-bearer">Bearer Token</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {(customApiConfig.authType === 'api-key' || customApiConfig.authType === 'bearer-token') && (
                            <div className="space-y-2">
                                <Label htmlFor="api-key">
                                    {customApiConfig.authType === 'api-key' ? 'API Key' : 'Bearer Token'}
                                </Label>
                                <Input
                                    id="api-key"
                                    type="password"
                                    placeholder={customApiConfig.authType === 'api-key' ? 'Enter your API key' : 'Enter your bearer token'}
                                    value={customApiConfig.apiKey}
                                    onChange={(e) => setCustomApiConfig({ ...customApiConfig, apiKey: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                onClick={handleTestConnection}
                                disabled={isTesting || !customApiConfig.endpointUrl}
                                variant="outline"
                            >
                                {isTesting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Testing...
                                    </>
                                ) : (
                                    "Test Connection"
                                )}
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !customApiConfig.endpointUrl}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Configuration"
                                )}
                            </Button>
                        </div>

                        {testResult && (
                            <Alert variant={testResult.success ? "default" : "destructive"}>
                                {testResult.success ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <AlertCircle className="h-4 w-4" />
                                )}
                                <AlertTitle>{testResult.success ? "Success" : "Error"}</AlertTitle>
                                <AlertDescription>{testResult.message}</AlertDescription>
                            </Alert>
                        )}

                        {saveResult && (
                            <Alert variant={saveResult.success ? "default" : "destructive"}>
                                {saveResult.success ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <AlertCircle className="h-4 w-4" />
                                )}
                                <AlertTitle>{saveResult.success ? "Saved" : "Error"}</AlertTitle>
                                <AlertDescription>{saveResult.message}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Sync from API */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sync Studies from API</CardTitle>
                        <CardDescription>
                            Fetch all studies from your Custom API and add them to your dashboard. Existing local studies will be preserved.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleSyncFromApi}
                            disabled={isSyncing || !getGlobalCustomApiConfig()}
                            variant="outline"
                            className="w-full"
                        >
                            {isSyncing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Sync from API
                                </>
                            )}
                        </Button>

                        {!getGlobalCustomApiConfig() && (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Configuration Required</AlertTitle>
                                <AlertDescription>
                                    Please configure Custom API settings above before syncing.
                                </AlertDescription>
                            </Alert>
                        )}

                        {syncResult && (
                            <Alert variant={syncResult.success ? "default" : "destructive"}>
                                {syncResult.success ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <AlertCircle className="h-4 w-4" />
                                )}
                                <AlertTitle>{syncResult.success ? "Sync Complete" : "Sync Failed"}</AlertTitle>
                                <AlertDescription>{syncResult.message}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

