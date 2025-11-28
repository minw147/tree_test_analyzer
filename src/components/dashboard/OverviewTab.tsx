import { useMemo, useState } from "react";
import { getMetricColor } from "@/lib/utils";
import type { UploadedData } from "@/lib/types";
import { calculateOverviewStats } from "@/lib/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TreeViewer } from "./TreeViewer";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverviewTabProps {
    data: UploadedData;
}

export function OverviewTab({ data }: OverviewTabProps) {
    const stats = useMemo(() => calculateOverviewStats(data), [data]);
    const [isTreeVisible, setIsTreeVisible] = useState(false);

    const taskResultsData = useMemo(() => {
        // Calculate results by task
        return data.tasks.map((task) => {
            const taskResults = {
                directSuccess: 0,
                indirectSuccess: 0,
                directFail: 0,
                indirectFail: 0,
                directSkip: 0,
                indirectSkip: 0,
            };

            data.participants.forEach((p) => {
                const result = p.taskResults.find(r => r.taskIndex === task.index);
                if (result) {
                    if (result.skipped) {
                        if (result.directPathTaken) taskResults.directSkip++;
                        else taskResults.indirectSkip++;
                    } else if (result.successful) {
                        if (result.directPathTaken) taskResults.directSuccess++;
                        else taskResults.indirectSuccess++;
                    } else {
                        if (result.directPathTaken) taskResults.directFail++;
                        else taskResults.indirectFail++;
                    }
                }
            });

            const total = taskResults.directSuccess + taskResults.indirectSuccess +
                taskResults.directFail + taskResults.indirectFail +
                taskResults.directSkip + taskResults.indirectSkip;

            const getPct = (val: number) => total > 0 ? (val / total) * 100 : 0;

            return {
                name: `Task ${task.index}`,
                index: task.index,
                "Direct Success": getPct(taskResults.directSuccess),
                "Direct Success_count": taskResults.directSuccess,
                "Indirect Success": getPct(taskResults.indirectSuccess),
                "Indirect Success_count": taskResults.indirectSuccess,
                "Direct Fail": getPct(taskResults.directFail),
                "Direct Fail_count": taskResults.directFail,
                "Indirect Fail": getPct(taskResults.indirectFail),
                "Indirect Fail_count": taskResults.indirectFail,
                "Direct Skip": getPct(taskResults.directSkip),
                "Direct Skip_count": taskResults.directSkip,
                "Indirect Skip": getPct(taskResults.indirectSkip),
                "Indirect Skip_count": taskResults.indirectSkip,
                total,
            };
        });
    }, [data]);

    const formatTooltip = (value: number, name: string, props: any) => {
        const count = props.payload[`${name}_count`];
        return [`${count} (${Number(value).toFixed(1)}%)`, name];
    };

    const renderLegend = () => {
        const items = [
            { value: 'Direct Success', color: '#22c55e' },
            { value: 'Indirect Success', color: '#86efac' },
            { value: 'Direct Fail', color: '#ef4444' },
            { value: 'Indirect Fail', color: '#fca5a5' },
            { value: 'Direct Skip', color: '#64748b' },
            { value: 'Indirect Skip', color: '#cbd5e1' }
        ];

        return (
            <div className="flex flex-wrap justify-center gap-4 text-sm mt-2">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.value}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Tree Structure Section */}
            <Card>
                <CardHeader
                    className="flex flex-row items-center justify-between cursor-pointer py-4"
                    onClick={() => setIsTreeVisible(!isTreeVisible)}
                >
                    <CardTitle className="text-lg font-medium">Tree Structure</CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                    >
                        {isTreeVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </CardHeader>
                {isTreeVisible && (
                    <CardContent>
                        <TreeViewer tree={data.treeStructure || []} />
                    </CardContent>
                )}
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getMetricColor(stats.completionRate)}`}>{stats.completionRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.completedParticipants} completed / {stats.totalParticipants} total
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getMetricColor(stats.successRate)}`}>{stats.successRate}%</div>
                        <p className="text-xs text-muted-foreground">Average across all tasks</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Directness</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getMetricColor(stats.directnessRate)}`}>{stats.directnessRate}%</div>
                        <p className="text-xs text-muted-foreground">Average across all tasks</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Median Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(() => {
                                const totalSeconds = Math.round(stats.medianCompletionTime);
                                const minutes = Math.floor(totalSeconds / 60);
                                const seconds = totalSeconds % 60;
                                return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                            })()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Range: {Math.round(stats.shortestCompletionTime)}s - {Math.round(stats.longestCompletionTime)}s
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getMetricColor(stats.overallScore)}`}>{stats.overallScore}</div>
                        <p className="text-xs text-muted-foreground">Weighted average (70% success, 30% directness)</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Task Results Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={taskResultsData} layout="vertical" margin={{ left: 0, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                                <YAxis dataKey="index" type="category" width={30} tickLine={false} />
                                <Tooltip formatter={formatTooltip} />
                                <Legend content={renderLegend} />
                                <Bar dataKey="Direct Success" stackId="a" fill="#22c55e" />
                                <Bar dataKey="Indirect Success" stackId="a" fill="#86efac" />
                                <Bar dataKey="Direct Fail" stackId="a" fill="#ef4444" />
                                <Bar dataKey="Indirect Fail" stackId="a" fill="#fca5a5" />
                                <Bar dataKey="Direct Skip" stackId="a" fill="#64748b" />
                                <Bar dataKey="Indirect Skip" stackId="a" fill="#cbd5e1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
