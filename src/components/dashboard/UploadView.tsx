import { useState, useMemo, useEffect } from "react";
import { Upload, FileText, AlertCircle, Plus, Trash2, ListPlus } from "lucide-react";
import { parseResponseData, parseTreeFromString } from "@/lib/data-parser";
import type { UploadedData, Item } from "@/lib/types";
import type { StudyConfig } from "@/lib/types/study";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TreePathSelector } from "@/components/ui/tree-path-selector";
import { validateStudyConfig, treeNodesToText } from "@/lib/study-exporter";

interface UploadViewProps {
    onDataLoaded: (data: Omit<UploadedData, "id" | "createdAt" | "updatedAt">) => void;
}

const STORAGE_KEY_UPLOAD_FORM = "tree-test-upload-form";

interface SavedFormData {
    treeText: string;
    taskInstructions: string[];
    expectedPaths: string[][];
}

// Load form data from localStorage
const loadFormFromStorage = (): SavedFormData | null => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_UPLOAD_FORM);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error("Failed to load form data from localStorage:", error);
    }
    return null;
};

export function UploadView({ onDataLoaded }: UploadViewProps) {
    const savedForm = loadFormFromStorage();

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [treeText, setTreeText] = useState(savedForm?.treeText || "");
    const [taskInstructions, setTaskInstructions] = useState<string[]>(
        savedForm?.taskInstructions || ["", "", ""]
    );
    const [expectedPaths, setExpectedPaths] = useState<string[][]>(
        savedForm?.expectedPaths || [[""], [""], [""]]
    );
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [configFile, setConfigFile] = useState<File | null>(null);
    const [configLoaded, setConfigLoaded] = useState(false);

    // Save form data to localStorage whenever it changes
    useEffect(() => {
        try {
            const formData: SavedFormData = {
                treeText,
                taskInstructions,
                expectedPaths,
            };
            localStorage.setItem(STORAGE_KEY_UPLOAD_FORM, JSON.stringify(formData));
        } catch (error) {
            console.error("Failed to save form data to localStorage:", error);
        }
    }, [treeText, taskInstructions, expectedPaths]);

    // Save form data to localStorage whenever it changes
    useEffect(() => {
        const formData: FormData = {
            treeText,
            taskInstructions,
            expectedPaths
        };
        saveFormDataToStorage(formData);
    }, [treeText, taskInstructions, expectedPaths]);

    const parsedTree = useMemo<Item[]>(() => {
        if (!treeText.trim()) return [];
        try {
            return parseTreeFromString(treeText);
        } catch {
            return [];
        }
    }, [treeText]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
            setError(null);
        }
    };

    const handleConfigFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setConfigFile(file);

        try {
            const text = await file.text();
            const config: StudyConfig = JSON.parse(text);

            // Validate the config
            const validation = validateStudyConfig(config);
            if (!validation.valid) {
                setError(validation.error || "Invalid study configuration file");
                setConfigFile(null);
                return;
            }

            // Convert tree to text format
            const treeTextValue = treeNodesToText(config.tree);
            setTreeText(treeTextValue);

            // Extract task instructions and expected paths
            const taskInstructionsValue = config.tasks.map(task => task.description);
            const expectedPathsValue = config.tasks.map(task => 
                task.correctPath && task.correctPath.length > 0 
                    ? task.correctPath 
                    : [""]
            );

            // Ensure we have at least one task
            if (taskInstructionsValue.length === 0) {
                taskInstructionsValue.push("");
                expectedPathsValue.push([""]);
            }

            setTaskInstructions(taskInstructionsValue);
            setExpectedPaths(expectedPathsValue);
            setConfigLoaded(true);
        } catch (err) {
            console.error("Failed to parse config file:", err);
            setError(err instanceof Error ? err.message : "Failed to parse configuration file");
            setConfigFile(null);
            setConfigLoaded(false);
        }
    };

    const handleStartAnalyzer = async () => {
        setError(null);

        // Validation
        if (!uploadedFile) {
            setError("Please upload a dataset file.");
            return;
        }
        if (!treeText.trim()) {
            setError("Please enter the tree structure.");
            return;
        }
        if (taskInstructions.some(t => !t.trim())) {
            setError("Please ensure all tasks have instructions.");
            return;
        }
        if (expectedPaths.some(paths => paths.some(p => !p.trim()))) {
            setError("Please ensure all tasks have at least one expected path selected.");
            return;
        }

        setIsProcessing(true);

        try {
            const data = await parseResponseData(uploadedFile);

            // Parse tree structure
            try {
                data.treeStructure = parseTreeFromString(treeText);
            } catch (treeError) {
                console.warn("Failed to parse tree structure", treeError);
                throw new Error("Failed to parse tree structure. Please check the format.");
            }

            // Merge task instructions and expected paths
            // We need to make sure the number of tasks matches or handle discrepancies
            // For now, we assume the user entered tasks match the data or we truncate/expand
            // Actually, usually the data file drives the number of tasks. 
            // But here we are letting user define tasks. 
            // Let's assume the user knows what they are doing and map by index.

            // If the uploaded file has more tasks than defined, we might have an issue.
            // But let's just map what we have.
            if (data.tasks.length !== taskInstructions.length) {
                // Optional: Warning or error? 
                // For now, let's just proceed and map what matches.
            }

            data.tasks.forEach((task, index) => {
                if (taskInstructions[index]) {
                    task.description = taskInstructions[index].trim();
                }
                if (expectedPaths[index]) {
                    // Join multiple paths with comma
                    task.expectedAnswer = expectedPaths[index].filter(p => p.trim()).join(", ");
                }
            });

            // Clear form storage after successful load
            localStorage.removeItem(STORAGE_KEY_UPLOAD_FORM);

            onDataLoaded(data);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to parse file");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLoadSampleData = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            // Fetch sample files from public directory
            const [treeResponse, resultsResponse] = await Promise.all([
                fetch("/sample_data/tree_structure.txt"),
                fetch("/sample_data/results.xlsx")
            ]);

            if (!treeResponse.ok || !resultsResponse.ok) {
                throw new Error("Failed to fetch sample data files");
            }

            const treeContent = await treeResponse.text();
            const resultsBlob = await resultsResponse.blob();
            const resultsFile = new File([resultsBlob], "results.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

            const data = await parseResponseData(resultsFile);
            data.treeStructure = parseTreeFromString(treeContent);

            // Set sample task instructions and expected answers
            const sampleTasks = [
                { description: "Find Laptops", expectedAnswer: "/Home/Products/Electronics/Laptops, /Home/Products/Electronics/Smartphones" },
                { description: "Find Career Opportunities", expectedAnswer: "/Home/About Us/Careers" },
                { description: "Contact Support", expectedAnswer: "/Home/Contact" }
            ];

            setTaskInstructions(sampleTasks.map(t => t.description));
            setExpectedPaths(sampleTasks.map(t => t.expectedAnswer.split(",").map(p => p.trim())));

            // Apply sample instructions and expected answers to data
            data.tasks.forEach((task, index) => {
                if (sampleTasks[index]) {
                    task.description = sampleTasks[index].description;
                    task.expectedAnswer = sampleTasks[index].expectedAnswer;
                }
            });

            // Modify some participants to use the alternative path for Task 1
            if (data.participants.length > 6 && data.tasks.length > 0) {
                const firstTaskIndex = data.tasks[0].index;
                const altPath = "/Home/Products/Electronics/Smartphones";
                const task1Expected = sampleTasks[0].expectedAnswer.split(",").map(p => p.trim());

                // 1. Inject Alternative Path (Direct Success)
                [2, 3].forEach(pIndex => {
                    if (data.participants[pIndex]) {
                        const r = data.participants[pIndex].taskResults.find(tr => tr.taskIndex === firstTaskIndex);
                        if (r) {
                            r.pathTaken = altPath;
                            r.successful = true;
                            r.directPathTaken = true;
                            r.skipped = false;
                        }
                    }
                });

                // 2. Fix "Indirect Success" for seemingly direct paths
                data.participants.forEach(p => {
                    const r = p.taskResults.find(tr => tr.taskIndex === firstTaskIndex);
                    if (r && r.successful) {
                        if (task1Expected.includes(r.pathTaken)) {
                            r.directPathTaken = true;
                        }
                    }
                });

                // 3. Simulate Indirect Success (Wandering)
                const p5 = data.participants[5];
                const r5 = p5?.taskResults.find(tr => tr.taskIndex === firstTaskIndex);
                if (r5) {
                    r5.pathTaken = "/Home/About Us/Home/Products/Electronics/Laptops";
                    r5.successful = true;
                    r5.directPathTaken = false;
                    r5.skipped = false;
                }

                // 4. Simulate Backtracking (Wrong branch)
                const p6 = data.participants[6];
                const r6 = p6?.taskResults.find(tr => tr.taskIndex === firstTaskIndex);
                if (r6) {
                    r6.pathTaken = "/Home/Services/Support/Home/Products/Electronics/Laptops";
                    r6.successful = true;
                    r6.directPathTaken = false;
                    r6.skipped = false;
                }
            }

            setTreeText(treeContent);
            onDataLoaded(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load sample data. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex h-full items-center justify-center p-4">
            <Card className="w-full max-w-xl relative">
                <div className="absolute top-4 right-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadSampleData}
                        disabled={isProcessing}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                        <FileText className="mr-1 h-3 w-3" />
                        Load Sample Data
                    </Button>
                </div>
                <CardHeader>
                    <CardTitle className="text-center text-2xl">Upload Tree Test Data</CardTitle>
                    <CardDescription className="text-center">
                        Configure your analysis settings and upload your dataset.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* JSON Config Upload Section */}
                    <div className="space-y-2 border-b pb-4">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Study Configuration (Optional)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Upload a study configuration JSON file exported from Creator to automatically fill in tree structure and tasks.
                        </p>
                        <div className="flex items-center gap-2">
                            <Input
                                type="file"
                                accept=".json"
                                onChange={handleConfigFileUpload}
                                className="text-sm"
                                disabled={isProcessing}
                            />
                            {configLoaded && (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Config loaded
                                </span>
                            )}
                        </div>
                        {configFile && (
                            <p className="text-xs text-gray-500">
                                {configFile.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Tree Structure <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Paste your tree structure here (comma or space-indented format)..."
                            value={treeText}
                            onChange={(e) => setTreeText(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                            Comma format: <br />
                            Home<br />
                            ,Products<br />
                            ,,Category 1<br />
                            <br />
                            Or space format:<br />
                            Home<br />
                            &nbsp;&nbsp;Products<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;Category 1
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Dataset File <span className="text-red-500">*</span>
                        </label>
                        <div className={`relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors ${uploadedFile ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                            {uploadedFile ? (
                                <div className="text-center">
                                    <FileText className="mx-auto h-10 w-10 text-green-600" />
                                    <p className="mt-2 text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                                    <p className="text-xs text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUploadedFile(null);
                                        }}
                                        className="mt-2 h-auto p-0 text-red-500 hover:text-red-700 hover:bg-transparent"
                                    >
                                        Remove file
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-full bg-blue-50 p-4">
                                        <Upload className="h-8 w-8 text-blue-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-900">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">Excel or CSV files (.xlsx, .xls, .csv)</p>
                                    </div>
                                </>
                            )}
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="absolute inset-0 cursor-pointer opacity-0"
                                onChange={handleFileUpload}
                                disabled={isProcessing}
                            />
                        </div>
                    </div>

                    {isProcessing && (
                        <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                            Processing data...
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Task Instructions & Expected Paths <span className="text-red-500">*</span>
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8">
                                        <ListPlus className="mr-2 h-4 w-4" />
                                        Bulk Add
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Bulk Add Tasks</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Enter one task instruction per line.
                                        </p>
                                        <Textarea
                                            className="h-48"
                                            placeholder="Task 1 instruction&#10;Task 2 instruction&#10;..."
                                            onChange={(e) => {
                                                const lines = e.target.value.split('\n').filter(l => l.trim());
                                                if (lines.length > 0) {
                                                    setTaskInstructions(lines);
                                                    setExpectedPaths(Array.from({ length: lines.length }, () => [""]));
                                                }
                                            }}
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-4">
                            {taskInstructions.map((instruction, index) => (
                                <div key={index} className="space-y-2 rounded-lg border p-4">
                                    <div className="flex gap-2">
                                        <div className="flex h-10 w-20 shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-medium text-muted-foreground">
                                            Task {index + 1}
                                        </div>
                                        <Input
                                            value={instruction}
                                            onChange={(e) => {
                                                const newInstructions = [...taskInstructions];
                                                newInstructions[index] = e.target.value;
                                                setTaskInstructions(newInstructions);
                                            }}
                                            placeholder={`Enter instruction for Task ${index + 1}...`}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                const newInstructions = taskInstructions.filter((_, i) => i !== index);
                                                const newPaths = expectedPaths.filter((_, i) => i !== index);
                                                setTaskInstructions(newInstructions);
                                                setExpectedPaths(newPaths);
                                            }}
                                            disabled={taskInstructions.length <= 1}
                                        >
                                            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-medium text-gray-700">
                                                Expected Paths <span className="text-blue-600">({expectedPaths[index]?.length || 0})</span>
                                            </label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs text-blue-600 hover:text-blue-800"
                                                onClick={() => {
                                                    const newPaths = [...expectedPaths];
                                                    newPaths[index] = [...(newPaths[index] || []), ""];
                                                    setExpectedPaths(newPaths);
                                                }}
                                            >
                                                <Plus className="mr-1 h-3 w-3" />
                                                Add Path
                                            </Button>
                                        </div>

                                        {parsedTree.length > 0 ? (
                                            <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                                                {expectedPaths[index]?.map((path, pathIndex) => (
                                                    <div key={pathIndex} className="flex items-center gap-2">
                                                        <div className="flex-1">
                                                            <TreePathSelector
                                                                tree={parsedTree}
                                                                selectedPath={path || ""}
                                                                onPathSelect={(newPath) => {
                                                                    const newPaths = [...expectedPaths];
                                                                    const taskPaths = [...(newPaths[index] || [])];
                                                                    taskPaths[pathIndex] = newPath;
                                                                    newPaths[index] = taskPaths;
                                                                    setExpectedPaths(newPaths);
                                                                }}
                                                            />
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                                                            disabled={expectedPaths[index].length <= 1}
                                                            onClick={() => {
                                                                const newPaths = [...expectedPaths];
                                                                newPaths[index] = newPaths[index].filter((_, i) => i !== pathIndex);
                                                                setExpectedPaths(newPaths);
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500 italic py-2">
                                                Upload tree structure above to select expected paths
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-dashed"
                                onClick={() => {
                                    setTaskInstructions([...taskInstructions, ""]);
                                    setExpectedPaths([...expectedPaths, [""]]);
                                }}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Task
                            </Button>
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleStartAnalyzer}
                        disabled={isProcessing}
                    >
                        {isProcessing ? "Processing..." : "Start Analyzer"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
