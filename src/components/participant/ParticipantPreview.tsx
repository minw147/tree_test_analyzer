import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, File, Home, Check } from "lucide-react";
import type { StudyConfig, TreeNode } from "@/lib/types/study";
import type { Item } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface ParticipantPreviewProps {
    study: StudyConfig;
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

export function ParticipantPreview({ study }: ParticipantPreviewProps) {
    const [phase, setPhase] = useState<TestPhase>("welcome");
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [lastClickedPath, setLastClickedPath] = useState<string>("");
    const [selectedPath, setSelectedPath] = useState<string>("");
    const [breadcrumb, setBreadcrumb] = useState<string[]>([]);

    const items = convertTreeNodesToItems(study.tree);
    const currentTask = study.tasks[currentTaskIndex];
    const isLastTask = currentTaskIndex === study.tasks.length - 1;

    const buildPath = (parentPath: string, nodeName: string): string => {
        return parentPath ? `${parentPath}/${nodeName}` : `/${nodeName}`;
    };

    const toggleNode = (path: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedNodes(newExpanded);
    };

    const handleNodeClick = (path: string) => {
        setLastClickedPath(path);
        // Update breadcrumb
        const pathParts = path.split("/").filter(Boolean);
        setBreadcrumb(pathParts);
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
    };

    const handleFindItHere = (path: string) => {
        // Set as selected path
        setSelectedPath(path);
        setLastClickedPath("");
        // Move to next task or complete
        if (isLastTask) {
            setPhase("completed");
        } else {
            setCurrentTaskIndex(currentTaskIndex + 1);
            setSelectedPath("");
            setExpandedNodes(new Set());
            setBreadcrumb([]);
            setLastClickedPath("");
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
        } else {
            setPhase("completed");
        }
    };

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
            {/* Preview Mode Banner */}
            <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2">
                <div className="max-w-4xl mx-auto">
                    <p className="text-sm font-medium text-yellow-800">
                        ⚠️ Preview Mode - Not Collecting Responses
                    </p>
                </div>
            </div>

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
                                    <p className="text-gray-600 mt-1">{currentTask.description}</p>
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

                            {/* Navigation */}
                            <div className="flex justify-between items-center pt-4 border-t">
                                <div className="text-sm text-gray-500">
                                    {lastClickedPath ? "Click 'I'd find it here' to continue" : "Navigate the tree to find your answer"}
                                </div>
                            </div>
                        </div>
                    )}

                    {phase === "completed" && (
                        <div className="space-y-6">
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

