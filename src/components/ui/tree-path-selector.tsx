import { useState, useEffect } from "react";
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
    const [lastClickedPath, setLastClickedPath] = useState<string | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [collapsedPath, setCollapsedPath] = useState<string | null>(null);

    // Reset collapsed state if selectedPath changes externally
    useEffect(() => {
        if (collapsedPath !== null && selectedPath !== collapsedPath) {
            setIsCollapsed(false);
            setCollapsedPath(null);
        }
    }, [selectedPath, collapsedPath]);

    // Auto-expand path to selected node when tree is expanded
    useEffect(() => {
        if (!isCollapsed && selectedPath) {
            const pathParts = selectedPath.split('/').filter(p => p);
            const pathsToExpand = new Set<string>();
            let currentPath = '';
            
            // Build all parent paths that need to be expanded
            pathParts.forEach(part => {
                currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
                pathsToExpand.add(currentPath);
            });
            
            // Expand all parent nodes
            setExpandedNodes(prev => {
                const newExpanded = new Set(prev);
                pathsToExpand.forEach(path => newExpanded.add(path));
                return newExpanded;
            });
        }
    }, [isCollapsed, selectedPath]);

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

    const handleNodeClick = (path: string, hasChildren: boolean) => {
        setLastClickedPath(path);
        if (hasChildren) {
            toggleNode(path);
        }
        onPathSelect(path);
    };

    const handleConfirmPath = (path: string) => {
        onPathSelect(path);
        setLastClickedPath(null);
        setIsCollapsed(true);
        setCollapsedPath(path);
    };

    const handleExpandPath = () => {
        setIsCollapsed(false);
        setLastClickedPath(null);
        setCollapsedPath(null);
    };

    // Format path for display (remove leading slash, replace slashes with spaces and forward slashes)
    const formatPathForDisplay = (path: string): string => {
        return path.startsWith('/') ? path.substring(1).replace(/\//g, ' / ') : path.replace(/\//g, ' / ');
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
                    className={`flex items-center gap-2 py-1.5 px-2 rounded transition-colors ${isSelected
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : isLastClicked
                        ? "bg-green-50 border border-green-200"
                        : "hover:bg-gray-100 cursor-pointer"
                        }`}
                    style={{ paddingLeft: `${level * 20 + 8}px` }}
                    onClick={() => !isLastClicked && handleNodeClick(currentPath, hasChildren)}
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
                    <span className="text-sm flex-1">{node.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    {isLastClicked && (
                        <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white ml-2"
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

    // Show collapsed view when a path is confirmed
    if (isCollapsed && selectedPath) {
        return (
            <div className="border rounded-lg p-2 bg-white">
                <div
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-50 border border-green-200 cursor-pointer hover:bg-green-100 transition-colors w-full"
                    onClick={handleExpandPath}
                >
                    <span className="text-sm text-gray-800 font-medium">{formatPathForDisplay(selectedPath)}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="border rounded-lg p-2 max-h-64 overflow-y-auto bg-white">
            {tree.map((node) => renderNode(node))}
        </div>
    );
}
