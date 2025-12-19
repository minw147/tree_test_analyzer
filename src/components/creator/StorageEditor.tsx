import { Download, Globe, Server, CheckCircle2, AlertCircle, Loader2, HelpCircle, ExternalLink, Sheet, Copy, Check } from "lucide-react";
import type { StorageConfig, StorageType } from "@/lib/types/study";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createStorageAdapter } from "@/lib/storage/factory";
import { getGlobalCustomApiConfig, saveGlobalCustomApiConfig } from "@/lib/utils/global-settings";
import gasScript from "../../../google-apps-script-template.js?raw";

interface StorageEditorProps {
  config: StorageConfig;
  onChange: (config: StorageConfig) => void;
}

export function StorageEditor({ config, onChange }: StorageEditorProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showCustomApiTooltip, setShowCustomApiTooltip] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [usingGlobalConfig, setUsingGlobalConfig] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hasAutoPopulatedRef = useRef(false);

  // Auto-populate Custom API from global settings if config is empty
  useEffect(() => {
    if (config.type === 'custom-api' && !hasAutoPopulatedRef.current) {
      const globalConfig = getGlobalCustomApiConfig();
      if (globalConfig) {
        // Only populate if current config is completely empty
        const isEmpty = !config.endpointUrl && !config.authType && !config.apiKey;
        if (isEmpty) {
          onChange({
            ...config,
            endpointUrl: globalConfig.endpointUrl,
            authType: globalConfig.authType,
            apiKey: globalConfig.apiKey,
          });
          hasAutoPopulatedRef.current = true;
        }
      }
    }
    // Reset flag when type changes away from custom-api
    if (config.type !== 'custom-api') {
      hasAutoPopulatedRef.current = false;
    }
  }, [config.type]); // Only depend on type, not full config

  // Check if using global config
  useEffect(() => {
    if (config.type === 'custom-api') {
      const globalConfig = getGlobalCustomApiConfig();
      if (globalConfig) {
        // Check if current config matches global config
        if (globalConfig.endpointUrl === config.endpointUrl &&
          globalConfig.authType === config.authType &&
          globalConfig.apiKey === config.apiKey) {
          setUsingGlobalConfig(true);
        } else {
          setUsingGlobalConfig(false);
        }
      } else {
        setUsingGlobalConfig(false);
      }
    } else {
      setUsingGlobalConfig(false);
    }
  }, [config]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowCustomApiTooltip(false);
      }
    };

    if (showCustomApiTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomApiTooltip]);

  const handleTypeChange = (type: StorageType) => {
    let newConfig: StorageConfig = {
      ...config,
      type,
    };

    // Initialize Google Sheets method if not set
    if (type === 'google-sheets' && !newConfig.googleSheetsMethod) {
      newConfig.googleSheetsMethod = 'apps-script';
    }

    // Auto-populate Custom API from global settings if config is empty
    if (type === 'custom-api') {
      const globalConfig = getGlobalCustomApiConfig();
      if (globalConfig) {
        // Only populate if current config is empty/not set
        if (!newConfig.endpointUrl && !newConfig.authType && !newConfig.apiKey) {
          newConfig = {
            ...newConfig,
            endpointUrl: globalConfig.endpointUrl,
            authType: globalConfig.authType,
            apiKey: globalConfig.apiKey,
          };
        }
      }
    }

    onChange(newConfig);
    setTestResult(null); // Clear test result when changing storage type
  };

  const getAppsScriptContent = (): string => {
    return gasScript;
  };

  const handleTestConnection = async () => {
    if (config.type === 'local-download') {
      setTestResult({ success: true, message: 'Local download requires no connection.' });
      return;
    }

    if (config.type === 'google-sheets') {
      if (config.googleSheetsMethod === 'apps-script' && !config.webhookUrl) {
        setTestResult({ success: false, message: 'Please enter a webhook URL first.' });
        return;
      }
      if (config.googleSheetsMethod === 'oauth-api' && !config.sheetId) {
        setTestResult({ success: false, message: 'Please enter a Google Sheet ID first.' });
        return;
      }
    }

    if (config.type === 'custom-api' && !config.endpointUrl) {
      setTestResult({ success: false, message: 'Please enter an API endpoint URL first.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const adapter = createStorageAdapter(config);
      const result = await adapter.testConnection();

      if (result.success) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        setTestResult({ success: false, message: result.error || 'Connection failed. Please check your configuration.' });
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Storage Configuration</h2>
        <p className="text-gray-600">
          Choose where participant results will be stored.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Option 1: Hosted Backend */}
        <Card
          className={`cursor - pointer transition - all hover: border - purple - 400 ${config.type === 'hosted-backend' ? 'border-purple-500 ring-2 ring-purple-200' : ''} `}
          onClick={() => handleTypeChange('hosted-backend')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <Server className={`h - 8 w - 8 ${config.type === 'hosted-backend' ? 'text-purple-600' : 'text-gray-400'} `} />
              {config.type === 'hosted-backend' && <CheckCircle2 className="h-5 w-5 text-purple-600" />}
            </div>
            <CardTitle className="mt-4">Hosted Backend</CardTitle>
            <CardDescription>
              Secure, managed storage with dashboard and analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded inline-block">
              Recommended
            </div>
          </CardContent>
        </Card>

        {/* Option 2: Google Sheets */}
        <Card
          className={`cursor - pointer transition - all hover: border - blue - 400 ${config.type === 'google-sheets' ? 'border-blue-500 ring-2 ring-blue-200' : ''} `}
          onClick={() => handleTypeChange('google-sheets')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <Sheet className={`h - 8 w - 8 ${config.type === 'google-sheets' ? 'text-blue-500' : 'text-gray-400'} `} />
              {config.type === 'google-sheets' && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
            </div>
            <CardTitle className="mt-4">Google Sheets</CardTitle>
            <CardDescription>
              Store results directly in Google Sheets. Easy setup, free to use.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded inline-block">
              Free / Popular
            </div>
          </CardContent>
        </Card>

        {/* Option 3: Custom API */}
        <Card
          className={`cursor - pointer transition - all hover: border - purple - 400 ${config.type === 'custom-api' ? 'border-purple-500 ring-2 ring-purple-200' : ''} `}
          onClick={() => handleTypeChange('custom-api')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <Globe className={`h - 8 w - 8 ${config.type === 'custom-api' ? 'text-purple-600' : 'text-gray-400'} `} />
              {config.type === 'custom-api' && <CheckCircle2 className="h-5 w-5 text-purple-600" />}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <CardTitle>Custom API</CardTitle>
              <div className="relative" ref={tooltipRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCustomApiTooltip(!showCustomApiTooltip);
                  }}
                  className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-gray-500" />
                  <span className="hidden sm:inline">API tools</span>
                </button>
                {showCustomApiTooltip && (
                  <div className="absolute left-full top-0 ml-2 z-50 w-72 rounded-lg border bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5">
                    <h4 className="mb-2 font-semibold text-gray-900">Custom API Tools & Platforms</h4>
                    <p className="mb-3 text-xs text-gray-600">
                      Need help choosing a platform to host your Custom API? We've compiled a list of recommended tools and platforms that work with our API requirements.
                    </p>
                    <a
                      href="/help#custom-api-tools"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCustomApiTooltip(false);
                      }}
                    >
                      View recommended tools
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            <CardDescription>
              Connect to your own server or database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded inline-block">
              Free / BYOS
            </div>
          </CardContent>
        </Card>

        {/* Option 4: Local Download */}
        <Card
          className={`cursor - pointer transition - all hover: border - blue - 400 ${config.type === 'local-download' ? 'border-blue-500 ring-2 ring-blue-200' : ''} `}
          onClick={() => handleTypeChange('local-download')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <Download className={`h - 8 w - 8 ${config.type === 'local-download' ? 'text-blue-500' : 'text-gray-400'} `} />
              {config.type === 'local-download' && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
            </div>
            <CardTitle className="mt-4">Local Download</CardTitle>
            <CardDescription>
              Participants download their results file manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-1 rounded inline-block">
              Testing Only
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Forms */}
      <Card>
        <CardContent className="pt-6">
          {config.type === 'hosted-backend' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-purple-600">
                <Server className="h-5 w-5" />
                <h3 className="font-semibold">Hosted Backend Configuration</h3>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Coming Soon</AlertTitle>
                <AlertDescription>
                  The hosted backend service is currently under development. Please use Local Download for testing or Custom API if you have your own backend.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {config.type === 'google-sheets' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-purple-600">
                <Sheet className="h-5 w-5" />
                <h3 className="font-semibold">Google Sheets Configuration</h3>
              </div>

              <div className="grid gap-2">
                <Label>Setup Method</Label>
                <RadioGroup
                  value={config.googleSheetsMethod || 'apps-script'}
                  onValueChange={(val: string) => onChange({ ...config, googleSheetsMethod: val as 'apps-script' | 'oauth-api' })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="apps-script" id="method-apps-script" />
                    <Label htmlFor="method-apps-script">Apps Script (Recommended - Easy)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oauth-api" id="method-oauth" />
                    <Label htmlFor="method-oauth">OAuth API (Advanced)</Label>
                  </div>
                </RadioGroup>
              </div>

              {(config.googleSheetsMethod === 'apps-script' || !config.googleSheetsMethod) && (
                <>
                  <Alert className="bg-purple-50 border-purple-200">
                    <AlertCircle className="h-4 w-4 text-purple-600" />
                    <AlertTitle className="text-purple-800">Apps Script Setup</AlertTitle>
                    <AlertDescription className="text-purple-700">
                      <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
                        <li>Create a Google Sheet for your results</li>
                        <li>Get the Apps Script code below and install it in your sheet</li>
                        <li>Deploy the script as a web app and copy the webhook URL</li>
                        <li>Paste the webhook URL below</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Google Apps Script Code</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const scriptContent = getAppsScriptContent();
                          await navigator.clipboard.writeText(scriptContent);
                          setScriptCopied(true);
                          setTimeout(() => setScriptCopied(false), 2000);
                        }}
                        className="gap-2"
                      >
                        {scriptCopied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Script
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowScript(!showScript)}
                        className="absolute top-2 right-2 z-10"
                      >
                        {showScript ? 'Hide' : 'Show'} Script
                      </Button>
                      {showScript && (
                        <Textarea
                          readOnly
                          value={getAppsScriptContent()}
                          className="font-mono text-xs min-h-[400px] max-h-[600px] overflow-auto"
                          onClick={(e) => {
                            (e.target as HTMLTextAreaElement).select();
                          }}
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Click "Show Script" to view the code, then copy it. In Google Sheets, go to Extensions → Apps Script, paste the code, save, and deploy as a web app.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      placeholder="https://script.google.com/macros/s/..."
                      value={config.webhookUrl || ''}
                      onChange={(e) => onChange({ ...config, webhookUrl: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      The webhook URL provided by your Google Apps Script.
                    </p>
                  </div>

                  {testResult && (
                    <Alert variant={testResult.success ? "default" : "destructive"}>
                      {testResult.success ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertTitle>{testResult.success ? 'Success' : 'Error'}</AlertTitle>
                      <AlertDescription>{testResult.message}</AlertDescription>
                    </Alert>
                  )}

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={isTesting || !config.webhookUrl}
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </Button>
                  </div>
                </>
              )}

              {config.googleSheetsMethod === 'oauth-api' && (
                <>
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">OAuth API Setup</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      This method requires OAuth authentication with Google. You'll need to:
                      <ol className="list-decimal list-inside space-y-1 mt-2 text-sm">
                        <li>Create a Google Cloud project</li>
                        <li>Enable Google Sheets API</li>
                        <li>Configure OAuth credentials</li>
                        <li>Connect your Google account</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-2">
                    <Label htmlFor="sheet-id">Google Sheet ID</Label>
                    <Input
                      id="sheet-id"
                      placeholder="1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9"
                      value={config.sheetId || ''}
                      onChange={(e) => onChange({ ...config, sheetId: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      Found in your Google Sheet URL: <code>docs.google.com/spreadsheets/d/[SHEET_ID]/edit</code>
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="sheet-name">Sheet Name (optional)</Label>
                    <Input
                      id="sheet-name"
                      placeholder="Results"
                      value={config.sheetName || ''}
                      onChange={(e) => onChange({ ...config, sheetName: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      Name of the sheet tab. Defaults to "Results" or "Sheet1".
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement OAuth flow
                        alert("OAuth flow not yet implemented. Please use Apps Script method for now.");
                      }}
                    >
                      Connect to Google
                    </Button>
                  </div>

                  {testResult && (
                    <Alert variant={testResult.success ? "default" : "destructive"}>
                      {testResult.success ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertTitle>{testResult.success ? 'Success' : 'Error'}</AlertTitle>
                      <AlertDescription>{testResult.message}</AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          )}

          {config.type === 'custom-api' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-purple-600">
                <Globe className="h-5 w-5" />
                <h3 className="font-semibold">Custom API Configuration</h3>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endpoint">API Endpoint URL</Label>
                <Input
                  id="endpoint"
                  placeholder="https://api.yourdomain.com"
                  value={config.endpointUrl || ''}
                  onChange={(e) => onChange({ ...config, endpointUrl: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Base URL for your API. We will append <code>/studies/:id/results</code> for submissions.
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Authentication Type</Label>
                <RadioGroup
                  value={config.authType || 'none'}
                  onValueChange={(val: string) => onChange({ ...config, authType: val as any })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="auth-none" />
                    <Label htmlFor="auth-none">None</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="api-key" id="auth-apikey" />
                    <Label htmlFor="auth-apikey">API Key Header</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bearer-token" id="auth-bearer" />
                    <Label htmlFor="auth-bearer">Bearer Token</Label>
                  </div>
                </RadioGroup>
              </div>

              {(config.authType === 'api-key' || config.authType === 'bearer-token') && (
                <div className="grid gap-2">
                  <Label htmlFor="apiKey">
                    {config.authType === 'api-key' ? 'API Key' : 'Token'}
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={config.authType === 'api-key' ? 'Enter API Key' : 'Enter Bearer Token'}
                    value={config.apiKey || ''}
                    onChange={(e) => onChange({ ...config, apiKey: e.target.value })}
                  />
                </div>
              )}

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{testResult.success ? 'Success' : 'Error'}</AlertTitle>
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}

              {!usingGlobalConfig && config.endpointUrl && (
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    id="save-as-default"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="save-as-default" className="text-sm cursor-pointer">
                    Save as default for all new studies
                  </Label>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                {!usingGlobalConfig && config.endpointUrl && saveAsDefault && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      saveGlobalCustomApiConfig(config);
                      setSaveAsDefault(false);
                      setTestResult({ success: true, message: "Saved as default Custom API configuration!" });
                    }}
                  >
                    Save as Default
                  </Button>
                )}
              </div>
            </div>
          )}

          {config.type === 'local-download' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Download className="h-5 w-5" />
                <h3 className="font-semibold">Local Download Configuration</h3>
              </div>
              <p className="text-sm text-gray-600">
                No configuration needed. At the end of the test, participants will be prompted to download an Excel file containing their results.
              </p>
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Note</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  This method is intended for testing and development. You will need to manually collect the Excel files from participants.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
