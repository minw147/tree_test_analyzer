import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { ParticipantPreview } from "@/components/participant/ParticipantPreview";
import type { StudyConfig, ParticipantResult, TaskResult, PathOutcome, Task } from "@/lib/types/study";
import { createStorageAdapter } from "@/lib/storage/factory";
import { Loader2, AlertCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { shuffleTasks } from "@/lib/utils/task-randomizer";

type LoadingState = 'loading' | 'error' | 'closed' | 'ready';

interface ParticipantViewState {
    study: StudyConfig | null;
    loadingState: LoadingState;
    errorMessage: string | null;
    loadedFromApi?: boolean; // Track if study was loaded from API (true) or local fallback (false)
}

export function ParticipantView() {
    const { studyId } = useParams<{ studyId: string }>();
    const [state, setState] = useState<ParticipantViewState>({
        study: null,
        loadingState: 'loading',
        errorMessage: null,
    });

    // Track test data
    const [participantId] = useState(() => `P${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const testStartTime = useRef<number>(Date.now());
    const taskStartTimes = useRef<Map<number, number>>(new Map());
    const taskPaths = useRef<Map<number, string[]>>(new Map());
    const taskClicks = useRef<Map<number, number>>(new Map());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRealTime = useRef(false);
    const pendingUpdate = useRef<{ status: 'incomplete' | 'completed', results: any[] } | null>(null);

    // Maintain a list of completed task results for real-time submission
    const currentTaskResults = useRef<Array<{
        taskIndex: number;
        selectedPath: string;
        confidence?: number;
    }>>([]);

    // Task randomization state
    const [shuffledTasks, setShuffledTasks] = useState<Task[] | null>(null);
    const shuffledTaskIdToIndex = useRef<Map<string, number>>(new Map()); // Maps task ID → shuffled index
    const shuffledIndexToTaskId = useRef<Map<number, string>>(new Map()); // Maps shuffled index → task ID

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

    // Initialize shuffled tasks when study loads
    useEffect(() => {
        if (state.study && state.loadingState === 'ready') {
            initializeShuffledTasks(state.study);
        }
    }, [state.study, state.loadingState]);

    const initializeShuffledTasks = (study: StudyConfig) => {
        if (study.settings.randomizeTasks === true && study.tasks.length > 1) {
            const shuffled = shuffleTasks(study.tasks);
            setShuffledTasks(shuffled);

            // Create mapping: taskId → shuffled index
            const idToIndex = new Map<string, number>();
            const indexToId = new Map<number, string>();
            shuffled.forEach((task, index) => {
                idToIndex.set(task.id, index);
                indexToId.set(index, task.id);
            });
            shuffledTaskIdToIndex.current = idToIndex;
            shuffledIndexToTaskId.current = indexToId;
        } else {
            // No randomization
            setShuffledTasks(null);
            shuffledTaskIdToIndex.current.clear();
            shuffledIndexToTaskId.current.clear();
        }
    };

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
                            loadedFromApi: false, // Loaded from sessionStorage (preview)
                        });
                        return;
                    }
                } catch (error) {
                    console.error("Failed to parse preview study:", error);
                }
            }

            // Try to fetch from localStorage (new array structure)
            const storedStudiesJson = localStorage.getItem("tree-test-studies");
            if (storedStudiesJson) {
                try {
                    const storedStudies: StudyConfig[] = JSON.parse(storedStudiesJson);
                    const parsed = storedStudies.find(s => s.id === id);
                    console.log("Found stored studies, looking for ID:", id);

                    if (parsed) {
                        console.log("Study ID matches!");

                        // Check status FIRST - before any other checks
                        const isStudyClosed = parsed.accessStatus === 'closed';
                        if (isStudyClosed) {
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
                            // Check status from in-memory config first (already checked above, but double-check)
                            if (isStudyClosed) {
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
                                loadedFromApi: false, // Loaded from sessionStorage
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
                                    loadedFromApi: true, // Successfully loaded from API
                                });
                                return;
                            } else {
                                console.warn("Storage fetch returned no config, using local fallback");
                            }
                        } catch (fetchError) {
                            console.error("Failed to fetch from storage:", fetchError);
                            // Fall back to local config if fetch fails, but check status first
                            if (isStudyClosed) {
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
                        if (isStudyClosed) {
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
                            loadedFromApi: false, // Loaded from local storage fallback
                        });
                        return;
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
                            loadedFromApi: true, // Successfully loaded from Google Sheets
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

        // Prevent duplicate consecutive clicks (like Usabilitree)
        // Only add if it's different from the last node, OR if it's a backtrack
        const lastNode = currentPath[currentPath.length - 1];
        const isBacktrack = lastNode && pathParts.length > 0 &&
            pathParts.slice(0, -1).includes(nodeName);

        if (lastNode !== nodeName || isBacktrack) {
            // Add node to path (track full sequence, including backtracking)
            taskPaths.current.set(taskIndex, [...currentPath, nodeName]);

            // Increment click count
            const clicks = taskClicks.current.get(taskIndex) || 0;
            taskClicks.current.set(taskIndex, clicks + 1);
        }
    };

    const calculateTaskResult = (
        task: Task,
        allTaskResults: Array<{ taskIndex: number; selectedPath: string; confidence?: number }>
    ): TaskResult => {
        // Find result by taskId (handles both randomized and non-randomized cases)
        // If randomized, we need to find the shuffled index for this task
        const shuffledIndex = shuffledTaskIdToIndex.current.get(task.id);
        const displayIndex = shuffledIndex !== undefined
            ? shuffledIndex
            : (state.study?.tasks.findIndex(t => t.id === task.id) ?? -1);

        const taskResult = allTaskResults.find(tr => tr.taskIndex === displayIndex);

        // If the task hasn't been completed yet, return placeholder data
        if (!taskResult) {
            return {
                taskId: task.id,
                taskDescription: task.description,
                pathTaken: [],
                outcome: '' as PathOutcome, // Empty string in sheet
                confidence: undefined,
                timeSeconds: 0,
                timestamp: new Date().toISOString(),
            };
        }

        const taskStartTime = taskStartTimes.current.get(displayIndex) || testStartTime.current;
        const taskTime = Math.floor((Date.now() - taskStartTime) / 1000);
        const pathTaken = taskPaths.current.get(displayIndex) || [];

        // Determine outcome based on correct path
        let outcome: PathOutcome = 'failure';
        // Check if task was skipped (empty selectedPath)
        if (!taskResult.selectedPath || taskResult.selectedPath === "") {
            // Determine if direct skip (no interaction) or indirect skip (some interaction)
            const clicks = taskClicks.current.get(displayIndex) || 0;
            const pathTakenForSkip = taskPaths.current.get(displayIndex) || [];
            outcome = (clicks === 0 && pathTakenForSkip.length === 0) ? 'direct-skip' : 'indirect-skip';
        } else {
            const selectedPathParts = taskResult.selectedPath.split('/').filter(Boolean);
            const pathTakenForCheck = taskPaths.current.get(displayIndex) || [];
            const correctPaths = task.correctPath || [];

            const isCorrect = correctPaths.some(correctPath => {
                const correctParts = correctPath.split('/').filter(Boolean);
                if (selectedPathParts.length !== correctParts.length) return false;
                return selectedPathParts.every((part, i) => part === correctParts[i]);
            });

            if (isCorrect) {
                const pathTakenMatchesExactly = correctPaths.some(correctPath => {
                    const correctParts = correctPath.split('/').filter(Boolean);
                    if (pathTakenForCheck.length !== correctParts.length) return false;
                    return pathTakenForCheck.every((node, i) => node === correctParts[i]);
                });
                outcome = pathTakenMatchesExactly ? 'direct-success' : 'indirect-success';
            } else {
                outcome = 'failure';
            }
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
    };

    const submitRealTimeUpdate = async (
        status: 'incomplete' | 'completed',
        allTaskResults: Array<{ taskIndex: number; selectedPath: string; confidence?: number }>
    ) => {
        if (!state.study) return;

        // If a submission is already in progress, queue this one and return
        if (isSubmittingRealTime.current) {
            pendingUpdate.current = { status, results: allTaskResults };
            return;
        }

        isSubmittingRealTime.current = true;

        try {
            const totalActiveTime = Math.floor((Date.now() - testStartTime.current) / 1000);
            const taskResults = state.study.tasks.map(task => calculateTaskResult(task, allTaskResults));

            const result: ParticipantResult = {
                participantId: participantId,
                studyId: state.study.id,
                studyName: state.study.name,
                status: status,
                startedAt: new Date(testStartTime.current).toISOString(),
                completedAt: status === 'completed' ? new Date().toISOString() : undefined,
                totalActiveTime: totalActiveTime,
                taskResults: taskResults,
                userAgent: navigator.userAgent,
            };

            const adapter = createStorageAdapter(state.study.storage);

            console.log(`[RealTime] Submitting update (${status}) with ${allTaskResults.length} task results...`, {
                participantId,
                tasksInPayload: taskResults.filter(t => t.outcome !== ('' as PathOutcome)).length
            });

            const submitResult = await adapter.submitResult(result);

            if (!submitResult.success) {
                console.error("Failed to submit real-time update:", submitResult.error);
            } else {
                console.log(`Real-time update submitted successfully (${status})`);
            }
        } catch (error) {
            console.error("Error during real-time submission:", error);
        } finally {
            isSubmittingRealTime.current = false;

            // If an update was queued while we were submitting, trigger it now
            if (pendingUpdate.current) {
                const next = pendingUpdate.current;
                pendingUpdate.current = null;
                submitRealTimeUpdate(next.status, next.results);
            }
        }
    };

    const handleTaskComplete = (
        taskIndex: number,
        selectedPath: string,
        confidence?: number
    ) => {
        const newResult = { taskIndex, selectedPath, confidence };
        console.log(`[RealTime] Task ${taskIndex} complete. Accumulating result. Current count:`, currentTaskResults.current.length);

        currentTaskResults.current = [...currentTaskResults.current, newResult];

        // Background submission (don't await)
        submitRealTimeUpdate('incomplete', currentTaskResults.current);
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
        // Only check status from API if study was loaded from API
        // If loaded from local fallback, trust the local config's accessStatus
        if (state.loadedFromApi === true) {
            try {
                const adapter = createStorageAdapter(state.study.storage);
                const statusResult = await adapter.checkStatus(state.study.id);

                if (statusResult.status === 'closed') {
                    alert('This study is currently closed and not accepting new submissions.');
                    return;
                }

                // If status check returns 'not-found', but we successfully loaded config from API,
                // trust the config's accessStatus instead of blocking (study exists, status endpoint might have issue)
                if (statusResult.status === 'not-found') {
                    console.warn("Status check returned not-found, but config was loaded. Using config's accessStatus.");
                    // Continue with submission - we already checked config's accessStatus above
                }
            } catch (statusError) {
                console.error("Failed to check study status:", statusError);
                // If we successfully loaded config from API, trust the config's accessStatus
                // Don't block submission - the study exists, status endpoint might have temporary issue
                console.warn("Status check failed, but config was loaded. Using config's accessStatus.");
            }
        }
        // If loadedFromApi is false/undefined (local fallback), we already checked config's accessStatus above

        setIsSubmitting(true);

        try {
            // Use the consistent participantId
            const totalActiveTime = Math.floor((Date.now() - testStartTime.current) / 1000);
            const taskResults = state.study.tasks.map((task) => calculateTaskResult(task, allTaskResults));

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
            shuffledTasks={shuffledTasks}
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
    shuffledTasks: Task[] | null;
    onTestStart: (taskIndex: number) => void;
    onNodeClick: (taskIndex: number, path: string) => void;
    onTestComplete: (results: Array<{ taskIndex: number; selectedPath: string; confidence?: number }>) => void;
    isSubmitting: boolean;
    handleTaskComplete: (taskIndex: number, selectedPath: string, confidence?: number) => void;
}

function ParticipantViewWithTracking({
    study,
    shuffledTasks,
    onTestStart,
    onNodeClick,
    onTestComplete,
    isSubmitting,
    handleTaskComplete,
}: ParticipantViewWithTrackingProps) {
    return (
        <ParticipantPreview
            study={study}
            shuffledTasks={shuffledTasks}
            onTestStart={onTestStart}
            onNodeClick={onNodeClick}
            onTaskComplete={handleTaskComplete}
            onTestComplete={onTestComplete}
            isSubmitting={isSubmitting}
            isPreview={false}
        />
    );
}
