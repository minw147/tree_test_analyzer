import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, File } from "lucide-react";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TreeViewerProps {
    tree: Item[];
}

interface TreeNodeProps {
    item: Item;
    level: number;
}

function TreeNode({ item, level }: TreeNodeProps) {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = item.children && item.children.length > 0;

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer",
                    level > 0 && "ml-4"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => hasChildren && setIsOpen(!isOpen)}
            >
                {hasChildren ? (
                    <span className="text-gray-400">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </span>
                ) : (
                    <span className="w-4" /> // Spacer
                )}

                {hasChildren ? (
                    <Folder className="h-4 w-4 text-blue-500" />
                ) : (
                    <File className="h-4 w-4 text-gray-400" />
                )}

                <span className="text-gray-700">{item.name}</span>
            </div>

            {isOpen && hasChildren && (
                <div>
                    {item.children!.map((child, index) => (
                        <TreeNode key={index} item={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function TreeViewer({ tree }: TreeViewerProps) {
    if (!tree || tree.length === 0) {
        return <div className="text-sm text-gray-500 italic">No tree structure available.</div>;
    }

    return (
        <div className="rounded-md border bg-white p-4">
            <div className="space-y-1">
                {tree.map((item, index) => (
                    <TreeNode key={index} item={item} level={0} />
                ))}
            </div>
        </div>
    );
}
