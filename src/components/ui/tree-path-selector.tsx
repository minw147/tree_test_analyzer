import { useState, useEffect, useRef } from "react";
import type { Item } from "@/lib/types";
import { ChevronRight, ChevronDown, Folder, File, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TreePathSelectorProps {
    tree: Item[];
    selectedPath: string;
    onPathSelect: (path: string) => void;
}

export function TreePathSelector({ tree, selectedPath, onPathSelect }: TreePathSelectorProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [lastClickedPath, setLastClickedPath] = useState<string>("");
    const [isExpanded, setIsExpanded] = useState<boolean>(!selectedPath);
    const containerRef = useRef<HTMLDivElement>(null);

    // Format path for display (remove leading slash, replace slashes with arrows)
    const formatPathForDisplay = (path: string): string => {
        if (!path) return "";
        return path.replace(/^\//, "").replace(/\//g, " / ");
    };

    // Expand necessary nodes to show the selected path
    useEffect(() => {
        if (selectedPath && isExpanded) {
            const parts = selectedPath.split("/").filter(Boolean);
            const pathsToExpand = new Set<string>();
            let currentPath = "";
            parts.forEach((part) => {
                currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
                pathsToExpand.add(currentPath);
            });
            setExpandedNodes(pathsToExpand);
        }
    }, [selectedPath, isExpanded]);

    // Handle click outside to collapse
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (isExpanded) {
                    // If we have a selected path, collapse to show it
                    // If we don't have a selected path but have a last clicked, keep it expanded
                    if (selectedPath) {
                        setIsExpanded(false);
                        setLastClickedPath("");
                    }
                }
            }
        };

        if (isExpanded) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [isExpanded, selectedPath]);

    const toggleNode = (path: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedNodes(newExpanded);
    };

    const buildPath = (parentPath: string, nodeName: string): string => {
        return parentPath ? `${parentPath}/${nodeName}` : `/${nodeName}`;
    };

    const handleNodeClick = (path: string) => {
        setLastClickedPath(path);
        // Expand the tree when clicking
        if (!isExpanded) {
            setIsExpanded(true);
        }
    };

    const handleConfirmPath = (path: string) => {
        onPathSelect(path);
        setLastClickedPath("");
        setIsExpanded(false);
    };

    const renderNode = (node: Item, parentPath: string = "", level: number = 0): React.ReactElement => {
        const currentPath = buildPath(parentPath, node.name);
        const hasChildren = !!(node.children && node.children.length > 0);
        const isExpanded = expandedNodes.has(currentPath);
        const isSelected = currentPath === selectedPath;
        const isLastClicked = currentPath === lastClickedPath;

        return (
            <div key={currentPath}>
                <div
                    className={`flex items-center gap-2 py-1.5 px-2 rounded transition-colors ${isSelected
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
                                handleConfirmPath(currentPath);
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

    if (!tree || tree.length === 0) {
        return (
            <div className="text-sm text-gray-500 text-center py-4">
                No tree structure loaded. Please upload a tree structure first.
            </div>
        );
    }

    // Collapsed view - show path as text (only if we have a selected path and not expanded)
    if (!isExpanded && selectedPath) {
        return (
            <div
                ref={containerRef}
                className="border rounded-lg p-2 bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => {
                    setIsExpanded(true);
                    setLastClickedPath(selectedPath);
                }}
            >
                <div className="text-sm font-medium text-gray-700">
                    {formatPathForDisplay(selectedPath)}
                </div>
            </div>
        );
    }

    // Expanded view - show interactive tree (when expanded or when no path selected yet)
    return (
        <div ref={containerRef} className="border rounded-lg p-2 max-h-64 overflow-y-auto bg-white">
            {tree.map((node) => renderNode(node))}
        </div>
    );
}
