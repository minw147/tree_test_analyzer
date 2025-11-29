import { useMemo, useRef } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, ListPlus } from "lucide-react";
import type { Task, TreeNode } from "@/lib/types/study";
import type { Item } from "@/lib/types";
import { generateId } from "@/lib/utils/id-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TreePathSelector } from "@/components/ui/tree-path-selector";

interface TaskEditorProps {
    tasks: Task[];
    tree: TreeNode[]; // Tree structure for path selection
    onChange: (tasks: Task[]) => void;
}

// Convert TreeNode[] to Item[] for TreePathSelector
const convertTreeNodesToItems = (nodes: TreeNode[]): Item[] => {
    return nodes.map(node => ({
        name: node.name,
        link: node.link,
        children: node.children ? convertTreeNodesToItems(node.children) : []
    }));
};

export function TaskEditor({ tasks, tree, onChange }: TaskEditorProps) {
    const bulkAddTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Convert tree structure for path selector
    const parsedTree = useMemo<Item[]>(() => {
        return convertTreeNodesToItems(tree);
    }, [tree]);

    const addTask = () => {
        const newTask: Task = {
            id: generateId(),
            description: "",
            correctPath: [],
        };
        onChange([...tasks, newTask]);
    };

    const updateTask = (taskId: string, updates: Partial<Task>) => {
        const updatedTasks = tasks.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
        );
        onChange(updatedTasks);
    };

    const deleteTask = (taskId: string) => {
        const updatedTasks = tasks.filter((task) => task.id !== taskId);
        onChange(updatedTasks);
    };

    const moveTask = (taskId: string, direction: "up" | "down") => {
        const index = tasks.findIndex((t) => t.id === taskId);
        if (index === -1) return;

        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= tasks.length) return;

        const newTasks = [...tasks];
        [newTasks[index], newTasks[newIndex]] = [newTasks[newIndex], newTasks[index]];
        onChange(newTasks);
    };

    const addPath = (taskId: string) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const currentPaths = task.correctPath || [];
        updateTask(taskId, { correctPath: [...currentPaths, ""] });
    };

    const updatePath = (taskId: string, pathIndex: number, newPath: string) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const currentPaths = [...(task.correctPath || [])];
        currentPaths[pathIndex] = newPath;
        updateTask(taskId, { correctPath: currentPaths });
    };

    const removePath = (taskId: string, pathIndex: number) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const currentPaths = [...(task.correctPath || [])];
        currentPaths.splice(pathIndex, 1);
        updateTask(taskId, { correctPath: currentPaths });
    };

    const handleBulkAdd = (text: string) => {
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length === 0) return;

        const newTasks: Task[] = lines.map((line) => ({
            id: generateId(),
            description: line.trim(),
            correctPath: [],
        }));

        onChange([...tasks, ...newTasks]);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Task Instructions & Expected Paths</h2>
                    <p className="text-gray-600">
                        Define the tasks that participants will complete. Each task should describe what the participant needs to find.
                    </p>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                            <ListPlus className="mr-2 h-4 w-4" />
                            Bulk Add
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="space-y-3">
                            <h4 className="font-medium leading-none">Bulk Add Tasks</h4>
                            <p className="text-xs text-muted-foreground">
                                Enter one task instruction per line.
                            </p>
                            <Textarea
                                ref={bulkAddTextareaRef}
                                className="h-48"
                                placeholder="Task 1 instruction&#10;Task 2 instruction&#10;..."
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        if (bulkAddTextareaRef.current && bulkAddTextareaRef.current.value.trim()) {
                                            handleBulkAdd(bulkAddTextareaRef.current.value);
                                            bulkAddTextareaRef.current.value = "";
                                        }
                                    }}
                                >
                                    Add Tasks
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {tasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 mb-4">No tasks yet. Add your first task to get started.</p>
                    <Button onClick={addTask}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map((task, index) => {
                        const paths = task.correctPath || [];
                        return (
                            <div
                                key={task.id}
                                className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
                            >
                                <div className="flex items-start gap-2">
                                    <div className="flex h-10 w-20 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-medium text-muted-foreground">
                                        Task {index + 1}
                                    </div>
                                    <Input
                                        value={task.description}
                                        onChange={(e) =>
                                            updateTask(task.id, { description: e.target.value })
                                        }
                                        placeholder={`Enter instruction for Task ${index + 1}...`}
                                        className="flex-1"
                                    />
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => moveTask(task.id, "up")}
                                            disabled={index === 0}
                                            title="Move up"
                                        >
                                            <ArrowUp className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => moveTask(task.id, "down")}
                                            disabled={index === tasks.length - 1}
                                            title="Move down"
                                        >
                                            <ArrowDown className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                                            onClick={() => deleteTask(task.id)}
                                            title="Delete task"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-gray-700">
                                            Expected Paths <span className="text-blue-600">({paths.length})</span>
                                        </label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs text-blue-600 hover:text-blue-800"
                                            onClick={() => addPath(task.id)}
                                        >
                                            <Plus className="mr-1 h-3 w-3" />
                                            Add Path
                                        </Button>
                                    </div>

                                    {parsedTree.length > 0 ? (
                                        paths.length > 0 ? (
                                            <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                                                {paths.map((path, pathIndex) => (
                                                    <div key={pathIndex} className="flex items-center gap-2">
                                                        <div className="flex-1">
                                                            <TreePathSelector
                                                                tree={parsedTree}
                                                                selectedPath={path || ""}
                                                                onPathSelect={(newPath) => {
                                                                    updatePath(task.id, pathIndex, newPath);
                                                                }}
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                                                            disabled={paths.length <= 1}
                                                            onClick={() => removePath(task.id, pathIndex)}
                                                            title="Remove path"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500 italic py-2">
                                                Click "Add Path" to select an expected path from the tree structure above.
                                            </p>
                                        )
                                    ) : (
                                        <p className="text-xs text-gray-500 italic py-2">
                                            Upload tree structure above to select expected paths
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed"
                        onClick={addTask}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Task
                    </Button>
                </div>
            )}
        </div>
    );
}
