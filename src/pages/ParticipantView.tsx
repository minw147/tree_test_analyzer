import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { ParticipantPreview } from "@/components/participant/ParticipantPreview";
import type { StudyConfig, ParticipantResult, TaskResult, PathOutcome } from "@/lib/types/study";
import { createStorageAdapter } from "@/lib/storage/factory";
import { Loader2, AlertCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type LoadingState = 'loading' | 'error' | 'closed' | 'ready';

interface ParticipantViewState {
    study: StudyConfig | null;
    loadingState: LoadingState;
    errorMessage: string | null;
}

export function ParticipantView() {
    const { studyId } = useParams<{ studyId: string }>();
    const [state, setState] = useState<ParticipantViewState>({
        study: null,
        loadingState: 'loading',
        errorMessage: null,
    });

    // Track test data
    const testStartTime = useRef<number>(Date.now());
    const taskStartTimes = useRef<Map<number, number>>(new Map());
    const taskPaths = useRef<Map<number, string[]>>(new Map());
    const taskClicks = useRef<Map<number, number>>(new Map());
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!studyId) {
            setState({
                study: null,
                loadingState: 'error',
                errorMessage: 'No study ID provided',
            });
            return;
        }

        loadStudyConfig(studyId);
    }, [studyId]);

    const loadStudyConfig = async (id: string) => {
        try {
            console.log("Loading study with ID:", id);
            
            // Strategy for loading study config:
            // 1. Try sessionStorage first (for preview/testing)
            // 2. Try localStorage (for local studies)
            // 3. Try to fetch from storage adapters
            
            // Try sessionStorage first (for preview/testing)
            const previewStudy = sessionStorage.getItem("previewStudy");
            if (previewStudy) {
                try {
                    const parsed = JSON.parse(previewStudy);
                    console.log("Found preview study, ID:", parsed.id);
                    if (parsed.id === id) {
                        // Check status FIRST - check in-memory config immediately
                        if (parsed.accessStatus === 'closed') {
                            setState({
                                study: null,
                                loadingState: 'closed',
                                errorMessage: 'This study is currently closed and not accepting new participants.',
                            });
                            return;
                        }
                        
                        // Then verify with storage adapter
                        try {
                            const adapter = createStorageAdapter(parsed.storage);
                            const statusResult = await adapter.checkStatus(id);
                            
                            if (statusResult.status === 'closed') {
                                setState({
                                    study: null,
                                    loadingState: 'closed',
                                    errorMessage: 'This study is currently closed and not accepting new participants.',
                                });
                                return;
                            }
                        } catch (statusError) {
                            console.warn("Could not check status from storage, using in-memory status:", statusError);
                            // If storage check fails but in-memory says closed, still block
                            if (parsed.accessStatus === 'closed') {
                                setState({
                                    study: null,
                                    loadingState: 'closed',
                                    errorMessage: 'This study is currently closed and not accepting new participants.',
                                });
                                return;
                            }
                        }
                        
                        setState({
                            study: parsed,
                            loadingState: 'ready',
                            errorMessage: null,
                        });
                        return;
                    }
                } catch (error) {
                    console.error("Failed to parse preview study:", error);
                }
            }

            // Try to fetch from localStorage
            const storedStudy = localStorage.getItem("tree-test-study-config");
            if (storedStudy) {
                try {
                    const parsed = JSON.parse(storedStudy);
                    console.log("Found stored study, ID:", parsed.id, "Looking for:", id);
                    
                    if (parsed.id === id) {
                        console.log("Study ID matches!");
                        
                        // Check status FIRST - before any other checks
                        if (parsed.accessStatus === 'closed') {
                            setState({
                                study: null,
                                loadingState: 'closed',
                                errorMessage: 'This study is currently closed and not accepting new participants.',
                            });
                            return;
                        }
                        
                        // Check if study is published (for local testing, we'll allow draft studies too)
                        // But show a warning if it's not published
                        if (parsed.status !== 'published') {
                            console.warn("Study is not published, but loading anyway for testing");
                        }
                        
                        // For local-download or when storage is not configured, check status first
                        if (!parsed.storage || parsed.storage.type === 'local-download') {
                            console.log("Using local config (local-download storage)");
                            // Check status from in-memory config first
                            if (parsed.accessStatus === 'closed') {
                                setState({
                                    study: null,
                                    loadingState: 'closed',
                                    errorMessage: 'This study is currently closed and not accepting new participants.',
                                });
                                return;
                            }
                            setState({
                                study: parsed,
                                loadingState: 'ready',
                                errorMessage: null,
                            });
                            return;
                        }
                        
                        // Try to fetch from storage adapter
                        try {
                            console.log("Attempting to fetch from storage adapter:", parsed.storage.type);
                            const adapter = createStorageAdapter(parsed.storage);
                            const fetchResult = await adapter.fetchConfig(id);
                            
                            if (fetchResult.config) {
                                console.log("Successfully fetched config from storage");
                                // Check status FIRST before allowing access
                                const statusResult = await adapter.checkStatus(id);
                                
                                if (statusResult.status === 'closed') {
                                    setState({
                                        study: null,
                                        loadingState: 'closed',
                                        errorMessage: 'This study is currently closed and not accepting new participants.',
                                    });
                                    return;
                                }
                                
                                // Also check the config's accessStatus as a double-check
                                if (fetchResult.config.accessStatus === 'closed') {
                                    setState({
                                        study: null,
                                        loadingState: 'closed',
                                        errorMessage: 'This study is currently closed and not accepting new participants.',
                                    });
                                    return;
                                }
                                
                                setState({
                                    study: fetchResult.config,
                                    loadingState: 'ready',
                                    errorMessage: null,
                                });
                                return;
                            } else {
                                console.warn("Storage fetch returned no config, using local fallback");
                            }
                        } catch (fetchError) {
                            console.error("Failed to fetch from storage:", fetchError);
                            // Fall back to local config if fetch fails, but check status first
                            if (parsed.accessStatus === 'closed') {
                                setState({
                                    study: null,
                                    loadingState: 'closed',
                                    errorMessage: 'This study is currently closed and not accepting new participants.',
                                });
                                return;
                            }
                        }
                        
                        // Use local config as fallback, but check status first
                        console.log("Using local config as fallback");
                        if (parsed.accessStatus === 'closed') {
                            setState({
                                study: null,
                                loadingState: 'closed',
                                errorMessage: 'This study is currently closed and not accepting new participants.',
                            });
                            return;
                        }
                        setState({
                            study: parsed,
                            loadingState: 'ready',
                            errorMessage: null,
                        });
                        return;
                    } else {
                        console.log("Study ID mismatch. Stored:", parsed.id, "Requested:", id);
                    }
                } catch (error) {
                    console.error("Failed to parse stored study:", error);
                }
            } else {
                console.log("No study found in localStorage");
            }
            
            // Try to fetch from Google Sheets if webhook URL is provided in URL parameter
            // This enables cross-device access for Google Sheets storage
            const urlParams = new URLSearchParams(window.location.search);
            const webhookUrl = urlParams.get('webhook');
            if (webhookUrl && webhookUrl.includes('script.google.com')) {
                try {
                    console.log("Attempting to fetch from Google Sheets via webhook URL parameter");
                    const adapter = createStorageAdapter({
                        type: 'google-sheets',
                        googleSheetsMethod: 'apps-script',
                        webhookUrl: webhookUrl,
                    });
                    const fetchResult = await adapter.fetchConfig(id);
                    
                    if (fetchResult.config) {
                        console.log("Successfully fetched config from Google Sheets via webhook parameter");
                        // Check status FIRST before allowing access
                        const statusResult = await adapter.checkStatus(id);
                        
                        if (statusResult.status === 'closed') {
                            setState({
                                study: null,
                                loadingState: 'closed',
                                errorMessage: 'This study is currently closed and not accepting new participants.',
                            });
                            return;
                        }
                        
                        // Also check the config's accessStatus as a double-check
                        if (fetchResult.config.accessStatus === 'closed') {
                            setState({
                                study: null,
                                loadingState: 'closed',
                                errorMessage: 'This study is currently closed and not accepting new participants.',
                            });
                            return;
                        }
                        
                        setState({
                            study: fetchResult.config,
                            loadingState: 'ready',
                            errorMessage: null,
                        });
                        return;
                    }
                } catch (webhookError) {
                    console.error("Failed to fetch from webhook URL parameter:", webhookError);
                }
            }
            
            // TODO: For production, implement:
            // 1. Try hosted backend first (default for published studies)
            // 2. Study registry that maps studyId to storage type/config
            // 3. Or try multiple storage types with common patterns

            // If we get here, we couldn't find the study
            console.error("Study not found. ID:", id);
            setState({
                study: null,
                loadingState: 'error',
                errorMessage: `Study not found (ID: ${id}). Please check the study link and try again. Make sure the study is saved in the Creator and the link is correct.`,
            });
        } catch (error) {
            console.error("Failed to load study:", error);
            setState({
                study: null,
                loadingState: 'error',
                errorMessage: error instanceof Error ? error.message : 'Failed to load study',
            });
        }
    };

    const handleTestStart = (taskIndex: number) => {
        taskStartTimes.current.set(taskIndex, Date.now());
        taskPaths.current.set(taskIndex, []);
        taskClicks.current.set(taskIndex, 0);
    };

    const handleNodeClick = (taskIndex: number, path: string) => {
        // Track the full path taken (sequence of all nodes clicked)
        const currentPath = taskPaths.current.get(taskIndex) || [];
        const pathParts = path.split('/').filter(Boolean);
        const nodeName = pathParts[pathParts.length - 1];
        
        // Add node to path (track full sequence, including duplicates if user goes back and forth)
        taskPaths.current.set(taskIndex, [...currentPath, nodeName]);
        
        // Increment click count
        const clicks = taskClicks.current.get(taskIndex) || 0;
        taskClicks.current.set(taskIndex, clicks + 1);
    };

    const handleTaskComplete = (
        _taskIndex: number,
        _selectedPath: string,
        _confidence?: number
    ) => {
        // Task result is stored, will be submitted when all tasks complete
        // This is just a callback for tracking if needed
    };

    const handleTestComplete = async (allTaskResults: Array<{
        taskIndex: number;
        selectedPath: string;
        confidence?: number;
    }>) => {
        if (!state.study || isSubmitting) return;

        // Check study status before allowing submission
        // First check the in-memory study config (fast check)
        if (state.study.accessStatus === 'closed') {
            alert('This study is currently closed and not accepting new submissions.');
            return;
        }

        // Then verify with storage (in case status changed after page load)
        try {
            const adapter = createStorageAdapter(state.study.storage);
            const statusResult = await adapter.checkStatus(state.study.id);
            
            if (statusResult.status === 'closed') {
                alert('This study is currently closed and not accepting new submissions.');
                return;
            }
            
            // If status check returns 'not-found', block submission to be safe
            if (statusResult.status === 'not-found') {
                alert('Unable to verify study status. Please refresh the page and try again.');
                return;
            }
        } catch (statusError) {
            console.error("Failed to check study status:", statusError);
            // Block submission if we can't verify status (safer approach)
            alert('Unable to verify study status. Please refresh the page and try again.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Generate participant ID
            const participantId = `P${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Calculate total active time
            const totalActiveTime = Math.floor((Date.now() - testStartTime.current) / 1000);

            // Build task results
            const taskResults: TaskResult[] = state.study.tasks.map((task, index) => {
                const taskResult = allTaskResults.find(tr => tr.taskIndex === index);
                const taskStartTime = taskStartTimes.current.get(index) || testStartTime.current;
                const taskTime = Math.floor((Date.now() - taskStartTime) / 1000);
                const pathTaken = taskPaths.current.get(index) || [];
                
                // Determine outcome based on correct path
                let outcome: PathOutcome = 'failure';
                if (taskResult) {
                    // Check if task was skipped (empty selectedPath)
                    if (!taskResult.selectedPath || taskResult.selectedPath === "") {
                        // Determine if direct skip (no interaction) or indirect skip (some interaction)
                        const clicks = taskClicks.current.get(index) || 0;
                        const pathTaken = taskPaths.current.get(index) || [];
                        // If no clicks and no path taken, it's a direct skip
                        // If there were clicks or path taken, it's an indirect skip
                        outcome = (clicks === 0 && pathTaken.length === 0) ? 'direct-skip' : 'indirect-skip';
                    } else {
                        // Normalize selected path (remove leading slash, split into parts)
                        const selectedPathParts = taskResult.selectedPath.split('/').filter(Boolean);
                        const correctPaths = task.correctPath || [];
                        
                        // Check if selected path matches any correct path
                        const isCorrect = correctPaths.some(correctPath => {
                            // correctPath is a string path like "/Online Store/Shop/Categories/Electronics"
                            const correctParts = correctPath.split('/').filter(Boolean);
                            // Compare path parts
                            if (selectedPathParts.length !== correctParts.length) {
                                return false;
                            }
                            return selectedPathParts.every((part, i) => part === correctParts[i]);
                        });
                        
                        if (isCorrect) {
                            // Determine if direct or indirect success
                            // Direct: minimal clicks, took the most efficient path
                            // Indirect: found the right answer but wandered/explored more
                            const clicks = taskClicks.current.get(index) || 0;
                            const minClicksNeeded = selectedPathParts.length; // Minimum clicks to reach this depth
                            // If clicks are close to minimum (within 2-3), it's direct
                            // Otherwise, it's indirect (wandered but found it)
                            outcome = clicks <= (minClicksNeeded + 2) ? 'direct-success' : 'indirect-success';
                        } else {
                            outcome = 'failure';
                        }
                    }
                } else {
                    // No task result at all - treat as direct skip
                    outcome = 'direct-skip';
                }

                return {
                    taskId: task.id,
                    taskDescription: task.description,
                    pathTaken: pathTaken,
                    outcome: outcome,
                    confidence: taskResult?.confidence,
                    timeSeconds: taskTime,
                    timestamp: new Date().toISOString(),
                };
            });

            // Build participant result
            const result: ParticipantResult = {
                participantId: participantId,
                studyId: state.study.id,
                studyName: state.study.name,
                status: 'completed',
                startedAt: new Date(testStartTime.current).toISOString(),
                completedAt: new Date().toISOString(),
                totalActiveTime: totalActiveTime,
                taskResults: taskResults,
                userAgent: navigator.userAgent,
            };

            // Submit to storage
            const adapter = createStorageAdapter(state.study.storage);
            const submitResult = await adapter.submitResult(result);

            if (!submitResult.success) {
                throw new Error(submitResult.error || 'Failed to submit results');
            }

            // Success - the ParticipantPreview will show completion message
        } catch (error) {
            console.error("Failed to submit results:", error);
            alert(`Failed to submit results: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (state.loadingState === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading study...</p>
                </div>
            </div>
        );
    }

    if (state.loadingState === 'error') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Loading Study</AlertTitle>
                        <AlertDescription>
                            {state.errorMessage || 'Failed to load the study. Please check the link and try again.'}
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    if (state.loadingState === 'closed') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <Alert>
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Study Closed</AlertTitle>
                        <AlertDescription>
                            {state.errorMessage || 'This study is currently closed and not accepting new participants.'}
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    if (!state.study) {
        return null;
    }

    return (
        <ParticipantViewWithTracking
            study={state.study}
            onTestStart={handleTestStart}
            onNodeClick={handleNodeClick}
            onTestComplete={handleTestComplete}
            isSubmitting={isSubmitting}
            handleTaskComplete={handleTaskComplete}
        />
    );
}

// Wrapper component that adds tracking to ParticipantPreview
interface ParticipantViewWithTrackingProps {
    study: StudyConfig;
    onTestStart: (taskIndex: number) => void;
    onNodeClick: (taskIndex: number, path: string) => void;
    onTestComplete: (results: Array<{ taskIndex: number; selectedPath: string; confidence?: number }>) => void;
    isSubmitting: boolean;
    handleTaskComplete: (taskIndex: number, selectedPath: string, confidence?: number) => void;
}

function ParticipantViewWithTracking({
    study,
    onTestStart,
    onNodeClick,
    onTestComplete,
    isSubmitting,
    handleTaskComplete,
}: ParticipantViewWithTrackingProps) {
    return (
        <ParticipantPreview 
            study={study}
            onTestStart={onTestStart}
            onNodeClick={onNodeClick}
            onTaskComplete={handleTaskComplete}
            onTestComplete={onTestComplete}
            isSubmitting={isSubmitting}
            isPreview={false}
        />
    );
}
