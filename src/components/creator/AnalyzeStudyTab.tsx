import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { StudyConfig } from "@/lib/types/study";
import { createStorageAdapter } from "@/lib/storage/factory";
import { convertResultsToUploadedData } from "@/lib/utils/result-converter";
import { exportStudyConfig } from "@/lib/study-exporter";
import { generateId } from "@/lib/utils/id-generator";
import type { UploadedData } from "@/lib/types";

const STORAGE_KEY_ANALYZER_STUDIES = "tree-test-analyzer-studies";

interface AnalyzeStudyTabProps {
    study: StudyConfig;
}

// Helper to find existing analyzer study by sourceStudyId
function findAnalyzerStudyBySourceId(sourceStudyId: string): UploadedData | undefined {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_ANALYZER_STUDIES);
        if (saved) {
            const studies: UploadedData[] = JSON.parse(saved);
            return studies.find(s => s.sourceStudyId === sourceStudyId);
        }
    } catch (error) {
        console.error("Failed to load analyzer studies:", error);
    }
    return undefined;
}

// Helper to save analyzer study
function saveAnalyzerStudy(study: UploadedData): void {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_ANALYZER_STUDIES);
        const studies: UploadedData[] = saved ? JSON.parse(saved) : [];
        
        // Check if study already exists (by sourceStudyId or id)
        const existingIndex = studies.findIndex(s => 
            s.sourceStudyId === study.sourceStudyId || s.id === study.id
        );
        
        if (existingIndex >= 0) {
            // Replace existing study
            studies[existingIndex] = study;
        } else {
            // Add new study
            studies.push(study);
        }
        
        localStorage.setItem(STORAGE_KEY_ANALYZER_STUDIES, JSON.stringify(studies));
    } catch (error) {
        console.error("Failed to save analyzer study:", error);
    }
}

export function AnalyzeStudyTab({ study }: AnalyzeStudyTabProps) {
    const navigate = useNavigate();
    const [isImporting, setIsImporting] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const [existingAnalyzerStudy, setExistingAnalyzerStudy] = useState<UploadedData | undefined>(
        () => findAnalyzerStudyBySourceId(study.id)
    );

    // Check for existing analyzer study on mount
    useEffect(() => {
        setExistingAnalyzerStudy(findAnalyzerStudyBySourceId(study.id));
    }, [study.id]);

    const handleImportToAnalyzer = async (showWarning: boolean = true) => {
        // Check if study already exists
        const existing = findAnalyzerStudyBySourceId(study.id);
        if (existing && showWarning) {
            const confirmed = window.confirm(
                "This will replace your previous analysis with updated data. Continue?"
            );
            if (!confirmed) {
                return;
            }
        }

        setIsImporting(true);
        setImportError(null);
        setImportSuccess(false);

        try {
            const adapter = createStorageAdapter(study.storage);

            // Check if adapter supports fetchResults
            if (!adapter.fetchResults) {
                throw new Error("This storage type does not support importing results. Please use manual download.");
            }

            // Fetch results (required)
            const resultsResult = await adapter.fetchResults(study.id);

            if (resultsResult.error) {
                throw new Error(resultsResult.error);
            }

            const results = resultsResult.results || [];

            if (results.length === 0) {
                setImportError("No results found. The study hasn't collected any responses yet.");
                setIsImporting(false);
                return;
            }

            // Try to fetch latest config, but fall back to local study config if fetch fails
            let studyConfig = study;
            try {
                const configResult = await adapter.fetchConfig(study.id);
                if (configResult.config && !configResult.error) {
                    studyConfig = configResult.config;
                }
            } catch (configError) {
                // Use local study config as fallback
                console.warn("Failed to fetch latest config, using local config:", configError);
            }

            // Convert to UploadedData format
            const uploadedData = convertResultsToUploadedData(studyConfig, results);

            // Create full UploadedData with ID and timestamps
            const analyzerStudy: UploadedData = {
                ...uploadedData,
                id: existing?.id || generateId(), // Keep existing ID if replacing
                sourceStudyId: study.id, // Track source study
                createdAt: existing?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Save to analyzer storage
            saveAnalyzerStudy(analyzerStudy);

            setImportSuccess(true);
            setExistingAnalyzerStudy(analyzerStudy);

            // Navigate to analyzer after a short delay
            setTimeout(() => {
                navigate(`/analyze/${analyzerStudy.id}`);
            }, 1500);
        } catch (error) {
            console.error("Failed to import to analyzer:", error);
            setImportError(error instanceof Error ? error.message : "Failed to import study");
        } finally {
            setIsImporting(false);
        }
    };

    const handleCheckForNewResponses = async () => {
        setIsChecking(true);
        setImportError(null);
        
        const confirmed = window.confirm(
            "This will replace your previous analysis with updated data if new responses are found. Continue?"
        );
        
        if (!confirmed) {
            setIsChecking(false);
            return;
        }

        await handleImportToAnalyzer(false);
        setIsChecking(false);
    };

    // Render based on storage type
    const storageType = study.storage.type;
    const isGoogleSheets = storageType === 'google-sheets';
    const googleSheetsMethod = study.storage.googleSheetsMethod;

    if (storageType === 'custom-api' || (isGoogleSheets && googleSheetsMethod === 'apps-script')) {
        // One-click import available
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            Import to Analyzer
                        </CardTitle>
                        <CardDescription>
                            Import your study configuration and collected results directly into the Analyzer for visualization.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {importSuccess && (
                            <Alert variant="default">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertTitle>Import Successful!</AlertTitle>
                                <AlertDescription>
                                    Your study has been imported. Redirecting to Analyzer...
                                </AlertDescription>
                            </Alert>
                        )}

                        {importError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Import Failed</AlertTitle>
                                <AlertDescription>{importError}</AlertDescription>
                            </Alert>
                        )}

                        {existingAnalyzerStudy ? (
                            <div className="space-y-4">
                                <Alert variant="default">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Analysis Already Exists</AlertTitle>
                                    <AlertDescription>
                                        This study has already been imported to the Analyzer. You can check for new responses or view the existing analysis.
                                    </AlertDescription>
                                </Alert>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleCheckForNewResponses}
                                        disabled={isChecking || isImporting}
                                        className="flex-1"
                                    >
                                        {isChecking ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Checking...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Check for New Responses
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(`/analyze/${existingAnalyzerStudy.id}`)}
                                    >
                                        View Existing Analysis
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                onClick={() => handleImportToAnalyzer(false)}
                                disabled={isImporting}
                                className="w-full"
                                size="lg"
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Import to Analyzer
                                    </>
                                )}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    } else if (storageType === 'local-download' || (isGoogleSheets && googleSheetsMethod === 'oauth-api')) {
        // Manual import required
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5 text-blue-600" />
                            Manual Import Instructions
                        </CardTitle>
                        <CardDescription>
                            Download your study configuration and results, then import them in the Analyzer page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h4 className="font-semibold text-sm">Study Configuration</h4>
                                    <p className="text-xs text-gray-600 mt-1">
                                        Download the JSON configuration file
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportStudyConfig(study)}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Config
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h4 className="font-semibold text-sm">Results Data</h4>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {storageType === 'local-download' 
                                            ? "Results are downloaded individually by participants. Combine all result files into one Excel/CSV file."
                                            : "Export results from Google Sheets as Excel or CSV format."
                                        }
                                    </p>
                                </div>
                                {storageType === 'local-download' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled
                                        title="Results are downloaded individually by participants"
                                    >
                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                        N/A
                                    </Button>
                                )}
                            </div>
                        </div>

                        <Alert variant="default">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Next Steps</AlertTitle>
                            <AlertDescription>
                                <ol className="list-decimal list-inside space-y-1 mt-2">
                                    <li>Download the study configuration (JSON file)</li>
                                    <li>Prepare your results file (Excel or CSV with all participant data)</li>
                                    <li>Go to the <strong>Analyzer</strong> page</li>
                                    <li>Upload both files to analyze your results</li>
                                </ol>
                            </AlertDescription>
                        </Alert>

                        <Button
                            variant="default"
                            onClick={() => navigate("/analyze")}
                            className="w-full"
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Go to Analyzer
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    } else if (storageType === 'hosted-backend') {
        // Hosted backend - one-click import with live updates (future)
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            One-Click Import (Coming Soon)
                        </CardTitle>
                        <CardDescription>
                            Hosted backend will support live connection that updates automatically as new responses come in.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="default">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Feature Not Available Yet</AlertTitle>
                            <AlertDescription>
                                Live import for hosted backend is not yet implemented. Please use manual download for now.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        );
    } else {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Unknown Storage Type</AlertTitle>
                <AlertDescription>
                    Unable to determine import method for this storage configuration.
                </AlertDescription>
            </Alert>
        );
    }
}

