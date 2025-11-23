import { useState, useMemo } from "react";
import { Upload, FileText, AlertCircle, Plus, Trash2, ListPlus } from "lucide-react";
import { parseResponseData, parseTreeFromString } from "@/lib/data-parser";
import type { UploadedData, Item } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TreePathSelector } from "@/components/ui/tree-path-selector";

interface UploadViewProps {
    onDataLoaded: (data: UploadedData) => void;
}

export function UploadView({ onDataLoaded }: UploadViewProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [treeText, setTreeText] = useState("");
    const [taskInstructions, setTaskInstructions] = useState<string[]>(["", "", ""]);
    const [expectedPaths, setExpectedPaths] = useState<string[]>(["", "", ""]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

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
        if (expectedPaths.some(p => !p.trim())) {
            setError("Please ensure all tasks have an expected path selected.");
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
                    task.expectedAnswer = expectedPaths[index].trim();
                }
            });

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
                { description: "Find Laptops", expectedAnswer: "/Home/Products/Electronics/Laptops" },
                { description: "Find Career Opportunities", expectedAnswer: "/Home/About Us/Careers" },
                { description: "Contact Support", expectedAnswer: "/Home/Contact" }
            ];

            setTaskInstructions(sampleTasks.map(t => t.description));
            setExpectedPaths(sampleTasks.map(t => t.expectedAnswer));

            // Apply sample instructions and expected answers to data
            data.tasks.forEach((task, index) => {
                if (sampleTasks[index]) {
                    task.description = sampleTasks[index].description;
                    task.expectedAnswer = sampleTasks[index].expectedAnswer;
                }
            });

            setTreeText(treeContent); // Update UI to show loaded tree
            onDataLoaded(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load sample data. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
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
                                        <p className="text-xs text-gray-500">Excel files (.xlsx, .xls)</p>
                                    </div>
                                </>
                            )}
                            <input
                                type="file"
                                accept=".xlsx,.xls"
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
                                                    setExpectedPaths(new Array(lines.length).fill(""));
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

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">
                                            Expected Path {expectedPaths[index] && <span className="text-blue-600">({expectedPaths[index]})</span>}
                                        </label>
                                        {parsedTree.length > 0 ? (
                                            <TreePathSelector
                                                tree={parsedTree}
                                                selectedPath={expectedPaths[index] || ""}
                                                onPathSelect={(path) => {
                                                    const newPaths = [...expectedPaths];
                                                    newPaths[index] = path;
                                                    setExpectedPaths(newPaths);
                                                }}
                                            />
                                        ) : (
                                            <p className="text-xs text-gray-500 italic py-2">
                                                Upload tree structure above to select expected path
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
                                    setExpectedPaths([...expectedPaths, ""]);
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
