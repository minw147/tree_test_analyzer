import { useState } from "react";
import type { Item } from "@/lib/types";
import { ChevronRight, ChevronDown, Folder, File, Check } from "lucide-react";

interface TreePathSelectorProps {
    tree: Item[];
    selectedPath: string;
    onPathSelect: (path: string) => void;
}

export function TreePathSelector({ tree, selectedPath, onPathSelect }: TreePathSelectorProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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

    const renderNode = (node: Item, parentPath: string = "", level: number = 0): React.ReactElement => {
        const currentPath = buildPath(parentPath, node.name);
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(currentPath);
        const isSelected = currentPath === selectedPath;

        return (
            <div key={currentPath}>
                <div
                    className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors ${isSelected
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "hover:bg-gray-100"
                        }`}
                    style={{ paddingLeft: `${level * 20 + 8}px` }}
                    onClick={() => {
                        if (hasChildren) {
                            toggleNode(currentPath);
                        }
                        onPathSelect(currentPath);
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
                    <span className="text-sm flex-1">{node.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />}
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

    return (
        <div className="border rounded-lg p-2 max-h-64 overflow-y-auto bg-white">
            {tree.map((node) => renderNode(node))}
        </div>
    );
}
