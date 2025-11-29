import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder, File, Home, Check, Loader2 } from "lucide-react";
import type { StudyConfig, TreeNode } from "@/lib/types/study";
import type { Item } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { sanitizeTreeTestLink } from "@/lib/utils";

interface ParticipantPreviewProps {
    study: StudyConfig;
    // Optional callbacks for data tracking (used in actual participant view)
    onTestStart?: (taskIndex: number) => void;
    onNodeClick?: (taskIndex: number, path: string) => void;
    onTaskComplete?: (taskIndex: number, selectedPath: string, confidence?: number) => void;
    onTestComplete?: (results: Array<{ taskIndex: number; selectedPath: string; confidence?: number }>) => void;
    isSubmitting?: boolean;
    isPreview?: boolean; // If true, shows preview banner and doesn't track data
}

// Convert TreeNode[] to Item[]
const convertTreeNodesToItems = (nodes: TreeNode[]): Item[] => {
    return nodes.map(node => ({
        name: node.name,
        link: node.link,
        children: node.children ? convertTreeNodesToItems(node.children) : []
    }));
};

type TestPhase = "welcome" | "instructions" | "task" | "completed";

export function ParticipantPreview({ 
    study, 
    onTestStart,
    onNodeClick,
    onTaskComplete,
    onTestComplete,
    isSubmitting = false,
    isPreview = false,
}: ParticipantPreviewProps) {
    const [phase, setPhase] = useState<TestPhase>("welcome");
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [lastClickedPath, setLastClickedPath] = useState<string>("");
    const [selectedPath, setSelectedPath] = useState<string>("");
    const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
    const [confidence, setConfidence] = useState<number | undefined>(undefined);
    const [taskResults, setTaskResults] = useState<Array<{ taskIndex: number; selectedPath: string; confidence?: number }>>([]);

    const items = convertTreeNodesToItems(study.tree);
    const currentTask = study.tasks[currentTaskIndex];
    const isLastTask = currentTaskIndex === study.tasks.length - 1;

    const buildPath = (parentPath: string, nodeName: string): string => {
        return parentPath ? `${parentPath}/${nodeName}` : `/${nodeName}`;
    };

    const toggleNode = (path: string) => {
        const newExpanded = new Set<string>();
        
        // If the node was already expanded, collapse it and all its descendants
        if (expandedNodes.has(path)) {
            // Keep only paths that are ancestors (not this path or its descendants)
            expandedNodes.forEach(expandedPath => {
                if (expandedPath !== path && !expandedPath.startsWith(path + "/")) {
                    // Check if this is an ancestor of the clicked path
                    if (path.startsWith(expandedPath + "/")) {
                        newExpanded.add(expandedPath);
                    }
                }
            });
        } else {
            // Expand this node (only one level below)
            // Collapse all other branches - only keep ancestors of the clicked path
            expandedNodes.forEach(expandedPath => {
                // Keep paths that are ancestors of the clicked path
                if (expandedPath !== path && path.startsWith(expandedPath + "/")) {
                    newExpanded.add(expandedPath);
                }
                // All other paths (siblings and their descendants) are removed
            });
            
            // Add the clicked path (this expands one level below)
            newExpanded.add(path);
        }
        
        setExpandedNodes(newExpanded);
    };

    const handleNodeClick = (path: string) => {
        setLastClickedPath(path);
        // Update breadcrumb
        const pathParts = path.split("/").filter(Boolean);
        setBreadcrumb(pathParts);
        
        // If this node has children, ensure proper expansion behavior
        // (toggleNode is already called in renderNode onClick, but we ensure consistency here)
        const node = findNodeByPath(items, path);
        if (node && node.children && node.children.length > 0) {
            // The toggleNode will be called from renderNode onClick
            // But we ensure the expansion state is correct
        }
        
        // Track node click if callback provided
        if (onNodeClick && phase === "task") {
            onNodeClick(currentTaskIndex, path);
        }
    };

    // Helper function to find a node by its path
    const findNodeByPath = (nodes: Item[], targetPath: string): Item | null => {
        const pathParts = targetPath.split("/").filter(Boolean);
        if (pathParts.length === 0) return null;
        
        function search(nodes: Item[], remainingParts: string[]): Item | null {
            if (remainingParts.length === 0) return null;
            
            const [firstPart, ...rest] = remainingParts;
            const node = nodes.find(n => sanitizeTreeTestLink(n.name) === firstPart);
            
            if (!node) return null;
            if (rest.length === 0) return node;
            
            return node.children ? search(node.children, rest) : null;
        }
        
        return search(nodes, pathParts);
    };

    const handleBreadcrumbClick = (index: number) => {
        const newBreadcrumb = breadcrumb.slice(0, index + 1);
        const newPath = "/" + newBreadcrumb.join("/");
        setBreadcrumb(newBreadcrumb);
        // Expand to show that path
        const parts = newPath.split("/").filter(Boolean);
        const pathsToExpand = new Set<string>();
        let currentPath = "";
        parts.forEach((part) => {
            currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
            pathsToExpand.add(currentPath);
        });
        setExpandedNodes(pathsToExpand);
        setSelectedPath("");
        setLastClickedPath(newPath);
        
        // Track breadcrumb click (backtracking) if callback provided
        // This ensures backtracking behavior is recorded for analysis
        if (onNodeClick && phase === "task") {
            onNodeClick(currentTaskIndex, newPath);
        }
    };

    const handleFindItHere = (path: string) => {
        // Set as selected path - this will show the confidence rating
        setSelectedPath(path);
        setLastClickedPath("");
        // Don't move to next task yet - wait for confidence submission
    };

    const handleSubmitConfidence = () => {
        if (!selectedPath) return;
        
        // Store task result
        const result = {
            taskIndex: currentTaskIndex,
            selectedPath: selectedPath,
            confidence: confidence,
        };
        setTaskResults(prev => [...prev, result]);
        
        // Call task complete callback if provided
        if (onTaskComplete) {
            onTaskComplete(currentTaskIndex, selectedPath, confidence);
        }
        
        // Move to next task or complete
        if (isLastTask) {
            // All tasks complete - submit results
            if (onTestComplete) {
                const allResults = [...taskResults, result];
                onTestComplete(allResults);
            }
            setPhase("completed");
        } else {
            setCurrentTaskIndex(currentTaskIndex + 1);
            setSelectedPath("");
            setExpandedNodes(new Set());
            setBreadcrumb([]);
            setLastClickedPath("");
            setConfidence(undefined); // Reset confidence for next task
        }
    };

    const handleSkipTask = () => {
        // Record skipped task with no selected path
        const result = {
            taskIndex: currentTaskIndex,
            selectedPath: "", // Empty path indicates skip
            confidence: undefined,
        };
        setTaskResults(prev => [...prev, result]);
        
        // Call task complete callback if provided (with empty path to indicate skip)
        if (onTaskComplete) {
            onTaskComplete(currentTaskIndex, "", undefined);
        }
        
        // Move to next task or complete
        if (isLastTask) {
            // All tasks complete - submit results
            if (onTestComplete) {
                const allResults = [...taskResults, result];
                onTestComplete(allResults);
            }
            setPhase("completed");
        } else {
            setCurrentTaskIndex(currentTaskIndex + 1);
            setSelectedPath("");
            setExpandedNodes(new Set());
            setBreadcrumb([]);
            setLastClickedPath("");
            setConfidence(undefined); // Reset confidence for next task
        }
    };

    const handleNext = () => {
        if (phase === "welcome") {
            setPhase("instructions");
        } else if (phase === "instructions") {
            if (study.tasks.length > 0) {
                setPhase("task");
            } else {
                setPhase("completed");
            }
        }
    };

    const handleStartTest = () => {
        if (study.tasks.length > 0) {
            setPhase("task");
            setCurrentTaskIndex(0);
            // Call test start callback if provided
            if (onTestStart) {
                onTestStart(0);
            }
        } else {
            setPhase("completed");
        }
    };
    
    // Track task start when task phase begins
    useEffect(() => {
        if (phase === "task" && onTestStart) {
            onTestStart(currentTaskIndex);
        }
    }, [phase, currentTaskIndex, onTestStart]);

    const renderNode = (node: Item, parentPath: string = "", level: number = 0): React.ReactElement => {
        const currentPath = buildPath(parentPath, node.name);
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(currentPath);
        const isSelected = currentPath === selectedPath;
        const isLastClicked = currentPath === lastClickedPath;

        return (
            <div key={currentPath}>
                <div
                    className={`flex items-center gap-2 py-1.5 px-2 rounded transition-colors ${
                        isSelected
                            ? "bg-blue-100 text-blue-700 font-medium"
                            : isLastClicked
                            ? "bg-green-50 border border-green-200"
                            : "hover:bg-gray-100 cursor-pointer"
                    }`}
                    style={{ paddingLeft: `${level * 20 + 8}px` }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasChildren) {
                            toggleNode(currentPath);
                        }
                        handleNodeClick(currentPath);
                    }}
                >
                    {hasChildren ? (
                        <>
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            )}
                            <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        </>
                    ) : (
                        <>
                            <div className="w-4" /> {/* Spacer for alignment */}
                            <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </>
                    )}
                    <span className={`text-sm ${isLastClicked ? "flex-1 text-gray-700" : "flex-1"}`}>
                        {node.name}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    {isLastClicked && !isSelected && (
                        <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-cyan-500 hover:bg-cyan-600 text-white flex-shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleFindItHere(currentPath);
                            }}
                        >
                            I'd find it here
                        </Button>
                    )}
                </div>

                {hasChildren && isExpanded && (
                    <div>
                        {node.children!.map((child) => renderNode(child, currentPath, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Preview Mode Banner - only show in preview mode */}
            {isPreview && (
            <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2">
                <div className="max-w-4xl mx-auto">
                    <p className="text-sm font-medium text-yellow-800">
                        ⚠️ Preview Mode - Not Collecting Responses
                    </p>
                </div>
            </div>
            )}

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-sm p-8">
                    {phase === "welcome" && (
                        <div className="space-y-6">
                            <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                                {study.settings.welcomeMessage.split('\n').map((line, i) => {
                                    if (line.startsWith('# ')) {
                                        return <h1 key={i} className="text-3xl font-bold mb-4">{line.substring(2)}</h1>;
                                    } else if (line.startsWith('## ')) {
                                        return <h2 key={i} className="text-2xl font-semibold mb-3">{line.substring(3)}</h2>;
                                    } else if (line.startsWith('### ')) {
                                        return <h3 key={i} className="text-xl font-medium mb-2">{line.substring(4)}</h3>;
                                    } else if (line.trim() === '') {
                                        return <br key={i} />;
                                    } else {
                                        return <p key={i} className="mb-2">{line}</p>;
                                    }
                                })}
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleNext} size="lg">
                                    {study.settings.customText?.nextButton || "Next"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {phase === "instructions" && (
                        <div className="space-y-6">
                            <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                                {study.settings.instructions.split('\n').map((line, i) => {
                                    if (line.startsWith('# ')) {
                                        return <h1 key={i} className="text-3xl font-bold mb-4">{line.substring(2)}</h1>;
                                    } else if (line.startsWith('## ')) {
                                        return <h2 key={i} className="text-2xl font-semibold mb-3">{line.substring(3)}</h2>;
                                    } else if (line.startsWith('### ')) {
                                        return <h3 key={i} className="text-xl font-medium mb-2">{line.substring(4)}</h3>;
                                    } else if (line.trim() === '') {
                                        return <br key={i} />;
                                    } else {
                                        return <p key={i} className="mb-2">{line}</p>;
                                    }
                                })}
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleStartTest} size="lg">
                                    {study.settings.customText?.startTest || "Start Test"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {phase === "task" && currentTask && (
                        <div className="space-y-6">
                            {/* Task Progress */}
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {study.settings.customText?.taskProgress || "Task"} {currentTaskIndex + 1} of {study.tasks.length}
                                    </h2>
                                    <p className="text-lg font-bold text-gray-900 mt-2">{currentTask.description}</p>
                                </div>
                            </div>

                            {/* Breadcrumb */}
                            {breadcrumb.length > 0 && (
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <Home className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">Path:</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {breadcrumb.map((crumb, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleBreadcrumbClick(index)}
                                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    {crumb}
                                                </button>
                                                {index < breadcrumb.length - 1 && (
                                                    <span className="text-gray-400">/</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Interactive Tree */}
                            <div className="border rounded-lg p-4 bg-white max-h-[500px] overflow-y-auto">
                                <div className="space-y-1">
                                    {items.map((node) => renderNode(node))}
                                </div>
                            </div>

                            {/* Confidence Rating */}
                            {selectedPath && (
                                <div className="border rounded-lg p-6 bg-gray-50">
                                    <div className="max-w-2xl mx-auto">
                                        <Label className="text-base font-medium text-gray-700 mb-4 block text-center">
                                            How confident are you with your answer?
                                        </Label>
                                        <div className="flex justify-center mb-4">
                                            <RadioGroup
                                                value={confidence?.toString() || ""}
                                                onValueChange={(value) => setConfidence(parseInt(value))}
                                                className="flex gap-4"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7].map((rating) => (
                                                    <div key={rating} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={rating.toString()} id={`confidence-${rating}`} />
                                                        <Label htmlFor={`confidence-${rating}`} className="cursor-pointer">
                                                            {rating}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                        <p className="text-xs text-gray-500 text-center mb-4">
                                            1 = Not confident, 7 = Very confident
                                        </p>
                                        <div className="flex justify-center">
                                            <Button
                                                onClick={handleSubmitConfidence}
                                                disabled={!confidence}
                                                size="lg"
                                                className="min-w-[120px]"
                                            >
                                                Submit
                                            </Button>
                                </div>
                            </div>
                                </div>
                            )}

                            {/* Navigation */}
                            {!selectedPath && (
                                <div className="flex justify-end items-center pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={handleSkipTask}
                                        className="text-gray-600 hover:text-gray-800"
                                    >
                                        Skip Task
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {phase === "completed" && (
                        <div className="space-y-6">
                            {isSubmitting && (
                                <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <p className="text-sm">Submitting your results...</p>
                                </div>
                            )}
                            <div className="prose max-w-none whitespace-pre-wrap text-gray-700">
                                {study.settings.completedMessage.split('\n').map((line, i) => {
                                    if (line.startsWith('# ')) {
                                        return <h1 key={i} className="text-3xl font-bold mb-4">{line.substring(2)}</h1>;
                                    } else if (line.startsWith('## ')) {
                                        return <h2 key={i} className="text-2xl font-semibold mb-3">{line.substring(3)}</h2>;
                                    } else if (line.startsWith('### ')) {
                                        return <h3 key={i} className="text-xl font-medium mb-2">{line.substring(4)}</h3>;
                                    } else if (line.trim() === '') {
                                        return <br key={i} />;
                                    } else {
                                        return <p key={i} className="mb-2">{line}</p>;
                                    }
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

