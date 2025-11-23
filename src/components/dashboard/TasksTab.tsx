import { useMemo, useState } from "react";
import type { UploadedData } from "@/lib/types";
import { calculateTaskStats } from "@/lib/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "@/components/ui/pie-chart";
import { BoxPlot } from "@/components/ui/box-plot";

import { HelpCircle } from "lucide-react";

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
                        <div className="space-y-2">
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200">
                                Task {selectedTask.index}
                            </div>
                            <CardTitle className="text-xl font-medium leading-relaxed text-gray-900">
                                {selectedTask.description}
                            </CardTitle>
                            {selectedTask.expectedAnswer && (
                                <div className="mt-1 text-sm text-gray-500">
                                    <span className="font-medium text-gray-700">Expected Path:</span> {selectedTask.expectedAnswer}
                                </div>
                            )}
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
                {/* Detailed Tables */}
                <div className="space-y-8">
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
                                                <th className="pb-2 font-medium text-gray-500">Clicked First</th>
                                                <th className="pb-2 font-medium text-gray-500">Clicked During Task</th>
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
                                                    <td className="py-2">
                                                        {click.firstClickCount} ({click.firstClickPercentage}%)
                                                    </td>
                                                    <td className="py-2">
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
                                                <th className="pb-2 font-medium text-gray-500">Count</th>
                                                <th className="pb-2 font-medium text-gray-500">%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedTask.stats.incorrectDestinations.map((dest, i) => (
                                                <tr key={i} className="border-b last:border-0">
                                                    <td className="py-2 font-mono text-xs">{dest.path}</td>
                                                    <td className="py-2">{dest.count}</td>
                                                    <td className="py-2">{dest.percentage}%</td>
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
                                                    <th className="pb-2 font-medium text-gray-500 w-24 text-right">Frequency</th>
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
                                                            <td className="py-3 text-right font-medium">{rating.count}</td>
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
