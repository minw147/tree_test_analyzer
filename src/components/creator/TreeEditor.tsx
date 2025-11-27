import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { TreeNode } from "@/lib/types/study";
import type { Item } from "@/lib/types";
import { generateId } from "@/lib/utils/id-generator";
import { parseTreeFromString } from "@/lib/data-parser";
import { treeNodesToText } from "@/lib/study-exporter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TreeEditorProps {
    tree: TreeNode[];
    onChange: (tree: TreeNode[]) => void;
}

export function TreeEditor({ tree, onChange }: TreeEditorProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [treeText, setTreeText] = useState("");
    const [parseError, setParseError] = useState<string | null>(null);
    const [isEditingText, setIsEditingText] = useState(false);
    const manualSectionRef = useRef<HTMLDivElement>(null);

    // Convert current tree to text format
    const currentTreeText = useMemo(() => {
        if (tree.length === 0) return "";
        return treeNodesToText(tree);
    }, [tree]);

    // Update textarea when tree changes (unless user is actively editing)
    useEffect(() => {
        if (!isEditingText && currentTreeText !== treeText) {
            setTreeText(currentTreeText);
        }
    }, [currentTreeText, isEditingText]);

    // Convert Item[] (from parser) to TreeNode[] (for study config)
    const convertItemsToTreeNodes = (items: Item[]): TreeNode[] => {
        return items.map(item => ({
            id: generateId(),
            name: item.name,
            link: item.link,
            children: item.children ? convertItemsToTreeNodes(item.children) : []
        }));
    };

    // Helper to get all node IDs recursively
    const getAllNodeIds = (nodes: TreeNode[]): string[] => {
        const ids: string[] = [];
        nodes.forEach(node => {
            ids.push(node.id);
            if (node.children) {
                ids.push(...getAllNodeIds(node.children));
            }
        });
        return ids;
    };

    const handleUpdateFromText = () => {
        if (!treeText.trim()) {
            setParseError("Please enter a tree structure.");
            return;
        }

        try {
            const parsedItems = parseTreeFromString(treeText);
            const treeNodes = convertItemsToTreeNodes(parsedItems);
            onChange(treeNodes);
            setParseError(null);
            setIsEditingText(false);

            // Expand all nodes
            const allNodeIds = getAllNodeIds(treeNodes);
            setExpandedNodes(new Set(allNodeIds));
        } catch (error) {
            setParseError("Failed to parse tree structure. Please check the format.");
            console.error(error);
        }
    };

    const addRootNode = () => {
        const newNode: TreeNode = {
            id: generateId(),
            name: "",
            children: [],
        };
        onChange([...tree, newNode]);
    };

    const addChildNode = (parentId: string) => {
        const newNode: TreeNode = {
            id: generateId(),
            name: "",
            children: [],
        };

        const addChild = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.map((node) => {
                if (node.id === parentId) {
                    return {
                        ...node,
                        children: [...(node.children || []), newNode],
                    };
                }
                if (node.children) {
                    return {
                        ...node,
                        children: addChild(node.children),
                    };
                }
                return node;
            });
        };

        onChange(addChild(tree));
        setExpandedNodes(new Set(expandedNodes).add(parentId));
    };

    const updateNode = (nodeId: string, updates: Partial<TreeNode>) => {
        const update = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, ...updates };
                }
                if (node.children) {
                    return {
                        ...node,
                        children: update(node.children),
                    };
                }
                return node;
            });
        };

        onChange(update(tree));
    };

    const deleteNode = (nodeId: string) => {
        const remove = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.filter((node) => {
                if (node.id === nodeId) {
                    return false;
                }
                if (node.children) {
                    node.children = remove(node.children);
                }
                return true;
            });
        };

        onChange(remove(tree));
    };

    const toggleExpand = (nodeId: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    const renderNode = (node: TreeNode, level: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isLeaf = !hasChildren;

        return (
            <div key={node.id} className="mb-2">
                <div
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50"
                    style={{ marginLeft: `${level * 24}px` }}
                >
                    {/* Expand/Collapse Button */}
                    {hasChildren && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleExpand(node.id)}
                            className="h-6 w-6"
                        >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                    )}
                    {!hasChildren && <div className="w-6" />}

                    {/* Node Name Input */}
                    <Input
                        value={node.name}
                        onChange={(e) => updateNode(node.id, { name: e.target.value })}
                        placeholder="Node name"
                        className="flex-1"
                    />

                    {/* Link Input (for leaf nodes) */}
                    {isLeaf && (
                        <Input
                            value={node.link || ""}
                            onChange={(e) => updateNode(node.id, { link: e.target.value })}
                            placeholder="Link/URL (optional)"
                            className="w-48"
                        />
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-1">
                        <Button
                            onClick={() => addChildNode(node.id)}
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Child
                        </Button>
                        <Button
                            onClick={() => deleteNode(node.id)}
                            size="sm"
                            variant="destructive"
                            className="h-8 text-xs"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Render Children */}
                {isExpanded && hasChildren && (
                    <div className="mt-1">
                        {node.children!.map((child) => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Text-Based Input Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tree Structure Editor</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Edit your tree structure in text format. Changes are automatically reflected in the tree below.
                </p>

                <Textarea
                    value={treeText}
                    onChange={(e) => {
                        setTreeText(e.target.value);
                        setIsEditingText(true);
                        setParseError(null);
                    }}
                    onBlur={() => setIsEditingText(false)}
                    placeholder="Enter your tree structure here (comma or space-indented format)..."
                    className="min-h-[200px] font-mono text-sm mb-2"
                />

                <div className="text-xs text-gray-600 mb-4 space-y-3">
                    <div>
                        <strong className="text-gray-700">Comma format:</strong>
                        <pre className="font-mono bg-gray-100 text-gray-700 p-3 rounded mt-1 border border-gray-300 whitespace-pre">{`Home
,Products
,,Category 1`}</pre>
                    </div>
                    <div>
                        <strong className="text-gray-700">Or space format:</strong>
                        <pre className="font-mono bg-gray-100 text-gray-700 p-3 rounded mt-1 border border-gray-300 whitespace-pre">{`Home
  Products
    Category 1`}</pre>
                    </div>
                </div>

                {parseError && (
                    <div className="text-sm text-red-600 mb-4 p-2 bg-red-50 rounded border border-red-200">
                        {parseError}
                    </div>
                )}

                <Button onClick={handleUpdateFromText} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Update Tree Structure
                </Button>
            </div>

            {/* Manual Node Editing Section */}
            <div ref={manualSectionRef} className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Option 2: Build Manually</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Add and organize nodes one at a time using the interface below.
                </p>

                {tree.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                        <p className="text-gray-500 mb-4">No nodes yet. Start by adding a root node.</p>
                        <Button onClick={addRootNode}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Root Node
                        </Button>
                    </div>
                ) : (
                    <div>
                        <div className="mb-4 flex justify-between items-center">
                            <h4 className="text-md font-medium text-gray-700">Tree Nodes</h4>
                            <Button onClick={addRootNode} variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Root Node
                            </Button>
                        </div>
                        <div className="border border-gray-200 rounded p-4 bg-white">
                            {tree.map((node) => renderNode(node))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
