import { useMemo, useState, useEffect } from "react";
import type { UploadedData, Participant } from "@/lib/types";
import { calculateTaskStats } from "@/lib/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "@/components/ui/pie-chart";
import { BoxPlot } from "@/components/ui/box-plot";
import { HelpCircle, Users, ChevronLeft, ChevronRight } from "lucide-react";

interface TasksTabProps {
    data: UploadedData;
    onOpenHelp?: () => void;
}

export function TasksTab({ data, onOpenHelp }: TasksTabProps) {
    // We need the tree structure for full stats, but if it's missing we pass an empty array
    // The stats calculator handles missing tree gracefully for most parts, 
    // but parent click analysis might be limited.
    const tree = data.treeStructure || [];
    const taskStats = useMemo(() => calculateTaskStats(data, tree), [data, tree]);
    const [selectedTaskId, setSelectedTaskId] = useState<string>(taskStats[0]?.id || "");

    const [showHelpTooltip, setShowHelpTooltip] = useState(false);

    const selectedTask = taskStats.find((t) => t.id === selectedTaskId);

    if (!selectedTask) {
        return <div className="p-4 text-center text-gray-500">No tasks found.</div>;
    }

    const totalParticipants = selectedTask.stats.breakdown.total;

    const pieData = [
        { name: "Direct Success", value: selectedTask.stats.breakdown.directSuccess, color: "bg-green-500" },
        { name: "Indirect Success", value: selectedTask.stats.breakdown.indirectSuccess, color: "bg-green-300" },
        { name: "Direct Fail", value: selectedTask.stats.breakdown.directFail, color: "bg-red-500" },
        { name: "Indirect Fail", value: selectedTask.stats.breakdown.indirectFail, color: "bg-red-300" },
        { name: "Skip", value: selectedTask.stats.breakdown.directSkip + selectedTask.stats.breakdown.indirectSkip, color: "bg-gray-500" },
    ].filter((d) => d.value > 0);

    return (
        <div className="flex flex-col gap-6 lg:flex-row">
            {/* Task List Sidebar */}
            <div className="w-full lg:w-64 flex-shrink-0">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="text-lg">Tasks</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            {taskStats.map((task) => (
                                <button
                                    key={task.id}
                                    onClick={() => setSelectedTaskId(task.id)}
                                    className={`border-b px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50 ${selectedTaskId === task.id ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700"
                                        }`}
                                >
                                    <div className="truncate font-medium">Task {task.index}</div>
                                    <div className="truncate text-xs text-gray-500">{task.description}</div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Task Details */}
            <div className="flex-1 space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div className="space-y-4 flex-1">
                            <div className="space-y-2">
                                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200">
                                    Task {selectedTask.index}
                                </div>
                                <CardTitle className="text-xl font-medium leading-relaxed text-gray-900">
                                    {selectedTask.description}
                                </CardTitle>
                            </div>

                            <div className="flex items-end justify-between">
                                {selectedTask.expectedAnswer && (
                                    <div className="text-sm text-gray-500 max-w-[80%]">
                                        <span className="font-medium text-gray-700">Expected Path:</span> {selectedTask.expectedAnswer}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Users className="h-5 w-5" />
                                    <span className="text-lg font-semibold">{totalParticipants}</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative ml-4 flex-shrink-0">
                            <button
                                onClick={() => setShowHelpTooltip(!showHelpTooltip)}
                                className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <HelpCircle className="h-4 w-4 text-gray-500" />
                                <span className="hidden sm:inline">Task analysis help</span>
                            </button>
                            {showHelpTooltip && (
                                <div className="absolute right-0 top-10 z-50 w-72 rounded-lg border bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5">
                                    <h4 className="mb-2 font-semibold text-gray-900">Metric Definitions</h4>
                                    <ul className="mb-4 space-y-2 text-xs text-gray-600">
                                        <li><strong>Success Rate:</strong> % who found the correct answer.</li>
                                        <li><strong>Directness:</strong> % who went straight to the answer.</li>
                                        <li><strong>Overall Score:</strong> Weighted score (70% Success + 30% Directness).</li>
                                    </ul>
                                    <button
                                        onClick={() => {
                                            setShowHelpTooltip(false);
                                            onOpenHelp?.();
                                        }}
                                        className="text-xs font-medium text-blue-600 hover:underline"
                                    >
                                        Read full guide →
                                    </button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-900">Task results</h3>
                            <p className="text-sm text-gray-500">Success and failure metrics from this task.</p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Pie Chart */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="h-48 w-48">
                                    <PieChart data={pieData} />
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                    {pieData.map((item) => (
                                        <div key={item.name} className="flex items-center gap-2">
                                            <div className={`h-3 w-3 rounded-full ${item.color.replace("bg-", "bg-")}`} style={{ backgroundColor: item.color.replace("bg-", "") }} />
                                            <span className={item.color.replace("bg-", "text-")}>
                                                {item.name}: {item.value} ({Math.round((item.value / totalParticipants) * 100)}%)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{selectedTask.stats.success.rate}%</div>
                                    <div className="text-xs text-gray-500">Success Rate</div>
                                    <div className="text-[10px] text-gray-400">
                                        {selectedTask.stats.breakdown.directSuccess + selectedTask.stats.breakdown.indirectSuccess} / {totalParticipants} participants
                                    </div>
                                    <div className="text-[10px] text-gray-400">±{selectedTask.stats.success.margin}%</div>
                                </div>
                                <div className="rounded-lg border p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{selectedTask.stats.directness.rate}%</div>
                                    <div className="text-xs text-gray-500">Directness</div>
                                    <div className="text-[10px] text-gray-400">
                                        {selectedTask.stats.breakdown.directSuccess + selectedTask.stats.breakdown.directFail} / {totalParticipants} participants
                                    </div>
                                    <div className="text-[10px] text-gray-400">±{selectedTask.stats.directness.margin}%</div>
                                </div>
                                <div className="rounded-lg border p-4 text-center">
                                    <div className="text-2xl font-bold text-gray-700">{selectedTask.stats.time.median}s</div>
                                    <div className="text-xs text-gray-500">Median Time</div>
                                </div>
                                <div className="rounded-lg border p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-600">{selectedTask.stats.score}</div>
                                    <div className="text-xs text-gray-500">Overall Score</div>
                                </div>
                            </div>
                        </div>

                        {/* Box Plot */}
                        <div className="mt-8">
                            <h4 className="mb-4 text-sm font-medium text-gray-900">Time Distribution</h4>
                            <BoxPlot
                                data={{
                                    min: selectedTask.stats.time.min,
                                    q1: selectedTask.stats.time.q1,
                                    median: selectedTask.stats.time.median,
                                    q3: selectedTask.stats.time.q3,
                                    max: selectedTask.stats.time.max,
                                    displayMax: Math.max(selectedTask.stats.time.max, 60), // Ensure at least 60s scale
                                }}
                                formatLabel={(v) => `${v}s`}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Tables */}
                <div className="space-y-8">
                    {/* Participant Paths */}
                    <ParticipantPathsCard
                        participants={data.participants}
                        taskId={selectedTaskId}
                        totalParticipants={totalParticipants}
                    />

                    {/* First-Clicked Parent Labels */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">First-Clicked Parent Labels</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedTask.stats.parentClicks.length === 0 ? (
                                <p className="text-center text-sm text-gray-500">No first-click data recorded.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left">
                                                <th className="pb-2 font-medium text-gray-500">Path</th>
                                                <th className="pb-2 font-medium text-gray-500">Correct First Click</th>
                                                <th className="pb-2 font-medium text-gray-500 text-center">Clicked First</th>
                                                <th className="pb-2 font-medium text-gray-500 text-center">Clicked During Task</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedTask.stats.parentClicks.map((click, i) => (
                                                <tr key={i} className="border-b last:border-0">
                                                    <td className="py-2 font-mono text-xs">{click.path}</td>
                                                    <td className="py-2">
                                                        <span className={click.isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                                            {click.isCorrect ? "Yes" : "No"}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 text-center">
                                                        {click.firstClickCount} ({click.firstClickPercentage}%)
                                                    </td>
                                                    <td className="py-2 text-center">
                                                        {click.totalClickCount} ({click.totalClickPercentage}%)
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Incorrect Destinations */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Incorrect Destinations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedTask.stats.incorrectDestinations.length === 0 ? (
                                <p className="text-center text-sm text-gray-500">No incorrect destinations recorded.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left">
                                                <th className="pb-2 font-medium text-gray-500">Path</th>
                                                <th className="pb-2 font-medium text-gray-500 text-center">Count</th>
                                                <th className="pb-2 font-medium text-gray-500 text-center">%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedTask.stats.incorrectDestinations.map((dest, i) => (
                                                <tr key={i} className="border-b last:border-0">
                                                    <td className="py-2 font-mono text-xs">{dest.path}</td>
                                                    <td className="py-2 text-center">{dest.count}</td>
                                                    <td className="py-2 text-center">{dest.percentage}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Confidence Ratings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Confidence Ratings</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedTask.stats.confidenceRatings.length === 0 ? (
                                <p className="text-center text-sm text-gray-500">No confidence ratings recorded.</p>
                            ) : (
                                <div className="space-y-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left">
                                                    <th className="pb-2 font-medium text-gray-500 w-32">Answer</th>
                                                    <th className="pb-2 font-medium text-gray-500">Outcome Breakdown</th>
                                                    <th className="pb-2 font-medium text-gray-500 w-24 text-center">Frequency</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedTask.stats.confidenceRatings.sort((a, b) => b.value - a.value).map((rating, i) => {
                                                    const total = rating.count;
                                                    const hasData = total > 0;

                                                    return (
                                                        <tr key={i} className="border-b last:border-0">
                                                            <td className="py-3">
                                                                <div className="font-medium">
                                                                    {rating.value === 7 ? "Strongly Agree" :
                                                                        rating.value === 6 ? "Moderately Agree" :
                                                                            rating.value === 5 ? "Slightly Agree" :
                                                                                rating.value === 4 ? "Neutral" :
                                                                                    rating.value === 3 ? "Slightly Disagree" :
                                                                                        rating.value === 2 ? "Moderately Disagree" :
                                                                                            "Strongly Disagree"}
                                                                </div>
                                                            </td>
                                                            <td className="py-3">
                                                                {hasData ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1 flex h-8 overflow-hidden rounded">
                                                                            {rating.breakdown.directSuccess > 0 && (
                                                                                <div
                                                                                    className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                                                                                    style={{ width: `${rating.breakdown.directSuccessPercentage}%` }}
                                                                                >
                                                                                    {rating.breakdown.directSuccess > 0 && rating.breakdown.directSuccessPercentage >= 15 && (
                                                                                        <span>{rating.breakdown.directSuccess} ({rating.breakdown.directSuccessPercentage}%)</span>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                            {rating.breakdown.indirectSuccess > 0 && (
                                                                                <div
                                                                                    className="bg-green-300 flex items-center justify-center text-xs text-gray-700 font-medium"
                                                                                    style={{ width: `${rating.breakdown.indirectSuccessPercentage}%` }}
                                                                                >
                                                                                    {rating.breakdown.indirectSuccess > 0 && rating.breakdown.indirectSuccessPercentage >= 15 && (
                                                                                        <span>{rating.breakdown.indirectSuccess}</span>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                            {rating.breakdown.directFail > 0 && (
                                                                                <div
                                                                                    className="bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                                                                                    style={{ width: `${rating.breakdown.directFailPercentage}%` }}
                                                                                >
                                                                                    {rating.breakdown.directFail > 0 && rating.breakdown.directFailPercentage >= 15 && (
                                                                                        <span>{rating.breakdown.directFail}</span>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                            {rating.breakdown.indirectFail > 0 && (
                                                                                <div
                                                                                    className="bg-red-300 flex items-center justify-center text-xs text-gray-700 font-medium"
                                                                                    style={{ width: `${rating.breakdown.indirectFailPercentage}%` }}
                                                                                >
                                                                                    {rating.breakdown.indirectFail > 0 && rating.breakdown.indirectFailPercentage >= 15 && (
                                                                                        <span>{rating.breakdown.indirectFail}</span>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400 text-xs">No data</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 text-center font-medium">{rating.count}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Legend */}
                                    <div className="flex items-center justify-center gap-4 text-xs">
                                        <div className="flex items-center gap-1">
                                            <div className="h-3 w-3 rounded bg-green-500"></div>
                                            <span>Direct Success</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="h-3 w-3 rounded bg-green-300"></div>
                                            <span>Indirect Success</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="h-3 w-3 rounded bg-red-500"></div>
                                            <span>Direct Fail</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="h-3 w-3 rounded bg-red-300"></div>
                                            <span>Indirect Fail</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function ParticipantPathsCard({ participants, taskId, totalParticipants }: { participants: Participant[], taskId: string, totalParticipants: number }) {
    const [pathFilter, setPathFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const pathsData = useMemo(() => {
        const pathMap = new Map<string, {
            path: string;
            count: number;
            resultType: string;
            resultColor: string;
        }>();

        participants.forEach(p => {
            const result = p.taskResults.find(r => r.taskId === taskId);
            if (!result) return;

            const path = result.pathTaken || "";

            // Determine Result Type
            let resultType = "";
            let resultColor = "";

            if (result.skipped) {
                const parts = path.split('/').filter(Boolean);
                if (parts.length <= 1) {
                    resultType = "Direct Skip";
                    resultColor = "bg-gray-400";
                } else {
                    resultType = "Indirect Skip";
                    resultColor = "bg-gray-500";
                }
            } else if (result.successful) {
                if (result.directPathTaken) {
                    resultType = "Direct Success";
                    resultColor = "bg-green-600";
                } else {
                    resultType = "Indirect Success";
                    resultColor = "bg-green-300";
                }
            } else {
                if (result.directPathTaken) {
                    resultType = "Direct Fail";
                    resultColor = "bg-red-600";
                } else {
                    resultType = "Indirect Fail";
                    resultColor = "bg-red-300";
                }
            }

            const key = path + "||" + resultType;

            if (!pathMap.has(key)) {
                pathMap.set(key, {
                    path,
                    count: 0,
                    resultType,
                    resultColor
                });
            }
            pathMap.get(key)!.count++;
        });

        return Array.from(pathMap.values()).sort((a, b) => b.count - a.count);
    }, [participants, taskId]);

    const filteredPaths = useMemo(() => {
        if (pathFilter === "all") return pathsData;
        // Handle "Skip" group if needed, or just exact match
        if (pathFilter === "Skip") return pathsData.filter(p => p.resultType.includes("Skip"));
        return pathsData.filter(p => p.resultType === pathFilter);
    }, [pathsData, pathFilter]);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [pathFilter]);

    const totalPages = Math.ceil(filteredPaths.length / ITEMS_PER_PAGE);
    const paginatedPaths = filteredPaths.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredPaths.length);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Participant Paths</CardTitle>
                <div className="relative">
                    <select
                        className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={pathFilter}
                        onChange={(e) => setPathFilter(e.target.value)}
                    >
                        <option value="all">All Results</option>
                        <option value="Direct Success">Direct Success</option>
                        <option value="Indirect Success">Indirect Success</option>
                        <option value="Direct Fail">Direct Fail</option>
                        <option value="Indirect Fail">Indirect Fail</option>
                        <option value="Direct Skip">Direct Skip</option>
                        <option value="Indirect Skip">Indirect Skip</option>
                    </select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="pb-2 font-medium text-gray-500 w-40">Result</th>
                                <th className="pb-2 font-medium text-gray-500 w-32 text-center"># of Participants</th>
                                <th className="pb-2 font-medium text-gray-500">Path</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedPaths.map((item, i) => (
                                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2.5 w-2.5 rounded-full ${item.resultColor}`}></div>
                                            <span className="font-medium text-gray-700">{item.resultType}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className="font-medium">{item.count}</span>
                                        <span className="text-gray-500 ml-1">({Math.round((item.count / totalParticipants) * 100)}%)</span>
                                    </td>
                                    <td className="py-3">
                                        <div className="font-mono text-xs text-gray-600 break-all">
                                            {item.path.split('/').filter(Boolean).join(' > ') || "(No path taken)"}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedPaths.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="py-4 text-center text-gray-500">
                                        No paths found matching filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredPaths.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between border-t pt-4 mt-4">
                        <div className="text-sm text-gray-500">
                            Showing {startItem}-{endItem} of {filteredPaths.length} paths
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-sm font-medium">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
