import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, File, Home } from "lucide-react";
import type { TreeNode } from "@/lib/types/study";
import { Button } from "@/components/ui/button";

interface TreePreviewProps {
    tree: TreeNode[];
}

// TreeNode is used directly for preview
export function TreePreview({ tree }: TreePreviewProps) {
    const [expandedPath, setExpandedPath] = useState<string>("");
    const [selectedPath, setSelectedPath] = useState<string>("");
    const [breadcrumb, setBreadcrumb] = useState<string[]>([]);



    const buildPath = (parentPath: string, nodeName: string): string => {
        return parentPath ? `${parentPath}/${nodeName}` : `/${nodeName}`;
    };

    const handleNodeClick = (path: string, hasChildren: boolean) => {
        if (hasChildren) {
            // Only one branch can be open at a time (usabilitree behavior)
            setExpandedPath(path);
            // Update breadcrumb
            const pathParts = path.split("/").filter(Boolean);
            setBreadcrumb(pathParts);
        } else {
            // Leaf node - can be selected
            setSelectedPath(path);
            const pathParts = path.split("/").filter(Boolean);
            setBreadcrumb(pathParts);
        }
    };

    const handleBreadcrumbClick = (index: number) => {
        const newBreadcrumb = breadcrumb.slice(0, index + 1);
        const newPath = "/" + newBreadcrumb.join("/");
        setBreadcrumb(newBreadcrumb);
        setExpandedPath(newPath);
        setSelectedPath("");
    };

    const handleFindItHere = (path: string) => {
        setSelectedPath(path);
        // In actual participant view, this would submit the selection
        console.log("Selected path:", path);
    };

    const renderNode = (node: TreeNode, parentPath: string = "", level: number = 0): React.ReactElement => {
        const currentPath = buildPath(parentPath, node.name);
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedPath === currentPath;
        const isSelected = selectedPath === currentPath;
        const isLeaf = !hasChildren;

        return (
            <div key={currentPath}>
                <div
                    className={`flex items-center gap-2 py-2 px-3 rounded transition-colors ${isSelected
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : isExpanded
                            ? "bg-gray-50"
                            : "hover:bg-gray-50 cursor-pointer"
                        }`}
                    style={{ paddingLeft: `${level * 20 + 8}px` }}
                    onClick={() => handleNodeClick(currentPath, !!hasChildren)}
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
                    {isLeaf && (
                        <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-cyan-500 hover:bg-cyan-600 text-white"
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

    if (!tree || tree.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                <p className="text-gray-500 mb-2">No tree structure defined yet.</p>
                <p className="text-sm text-gray-400">
                    Go to the "Tree Structure" tab to create your tree.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Breadcrumb Trail */}
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
                    {selectedPath && (
                        <span className="ml-auto text-xs text-green-600 font-medium">
                            ✓ Selected
                        </span>
                    )}
                </div>
            )}

            {/* Interactive Tree */}
            <div className="border rounded-lg p-4 bg-white max-h-[600px] overflow-y-auto">
                <div className="space-y-1">
                    {tree.map((node) => renderNode(node))}
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Preview Mode:</strong> This is how participants will see and interact with your tree structure.
                    Click on nodes to expand branches, and use the "I'd find it here" button on leaf nodes to make a selection.
                </p>
            </div>
        </div>
    );
}

