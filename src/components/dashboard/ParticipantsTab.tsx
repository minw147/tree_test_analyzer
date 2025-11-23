import { useState, useMemo } from "react";
import type { UploadedData } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Search } from "lucide-react";

interface ParticipantsTabProps {
    data: UploadedData;
}

export function ParticipantsTab({ data }: ParticipantsTabProps) {
    const [expandedParticipants, setExpandedParticipants] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    const toggleParticipant = (participantId: string) => {
        setExpandedParticipants(prev => {
            const newSet = new Set(prev);
            if (newSet.has(participantId)) {
                newSet.delete(participantId);
            } else {
                newSet.add(participantId);
            }
            return newSet;
        });
    };

    const participantStats = useMemo(() => {
        return data.participants.map((participant) => {
            const completedTasks = participant.taskResults.filter(r => !r.skipped);
            const successfulTasks = completedTasks.filter(r => r.successful);
            const directTasks = completedTasks.filter(r => r.directPathTaken);

            const successRate = completedTasks.length > 0
                ? Math.round((successfulTasks.length / completedTasks.length) * 100)
                : 0;
            const directnessRate = completedTasks.length > 0
                ? Math.round((directTasks.length / completedTasks.length) * 100)
                : 0;

            return {
                participant,
                successRate,
                directnessRate,
            };
        });
    }, [data]);

    const filteredParticipants = useMemo(() => {
        if (!searchQuery.trim()) return participantStats;
        const query = searchQuery.toLowerCase();
        return participantStats.filter(({ participant }) =>
            participant.id.toLowerCase().includes(query)
        );
    }, [participantStats, searchQuery]);

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "N/A";
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getResultBadge = (result: any) => {
        if (result.skipped) {
            return <span className="text-xs text-gray-500">Skipped</span>;
        }
        if (result.successful && result.directPathTaken) {
            return (
                <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Direct Success</span>
                </div>
            );
        }
        if (result.successful && !result.directPathTaken) {
            return (
                <div className="flex items-center gap-1 text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Indirect Success</span>
                </div>
            );
        }
        if (!result.successful && result.directPathTaken) {
            return (
                <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Direct Fail</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1 text-red-500">
                <XCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Indirect Fail</span>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                    placeholder="Search by Participant ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Participants Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Participant</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Started</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Duration</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Success Rate</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Directness</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredParticipants.map(({ participant, successRate, directnessRate }, index) => (
                                    <>
                                        <tr
                                            key={participant.id}
                                            onClick={() => toggleParticipant(participant.id)}
                                            className="cursor-pointer border-b transition-colors hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {expandedParticipants.has(participant.id) ? (
                                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                                    )}
                                                    <span className="font-medium text-sm">
                                                        Participant {index + 1}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    {participant.status === "Completed" ? (
                                                        <>
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                            <span className="text-sm text-green-600">Completed</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="h-4 w-4 text-gray-400" />
                                                            <span className="text-sm text-gray-500">Abandoned</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {formatDate(participant.startedAt)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {formatDuration(participant.durationSeconds)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium">{successRate}%</td>
                                            <td className="px-4 py-3 text-sm font-medium">{directnessRate}%</td>
                                        </tr>

                                        {/* Expanded Details */}
                                        {expandedParticipants.has(participant.id) && (
                                            <tr>
                                                <td colSpan={6} className="bg-gray-50 px-4 py-4">
                                                    <div className="space-y-4">
                                                        {/* Participant Info */}
                                                        <div className="grid grid-cols-3 gap-4 rounded-lg border bg-white p-4">
                                                            <div>
                                                                <div className="text-xs text-gray-500">Participant ID</div>
                                                                <div className="font-mono text-sm font-medium">{participant.id}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-gray-500">Duration</div>
                                                                <div className="text-sm font-medium">
                                                                    {formatDuration(participant.durationSeconds)}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-gray-500">Timeline</div>
                                                                <div className="text-xs">
                                                                    <div>Started {formatDate(participant.startedAt)}</div>
                                                                    {participant.completedAt && (
                                                                        <div className="text-green-600">
                                                                            Completed {formatDate(participant.completedAt)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Task Results Table */}
                                                        <div className="overflow-x-auto rounded-lg border bg-white">
                                                            <table className="w-full text-sm">
                                                                <thead className="border-b bg-gray-50">
                                                                    <tr>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Task</th>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Result</th>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Path Taken</th>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Confidence</th>
                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Time</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {participant.taskResults.map((result, taskIdx) => (
                                                                        <tr key={taskIdx} className="border-b last:border-0">
                                                                            <td className="px-4 py-3 font-medium">T{result.taskIndex}</td>
                                                                            <td className="px-4 py-3">{getResultBadge(result)}</td>
                                                                            <td className="px-4 py-3">
                                                                                <span className="font-mono text-xs text-gray-600">
                                                                                    {result.pathTaken || "N/A"}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-3">
                                                                                {result.confidenceRating ? (
                                                                                    <span className="text-xs">
                                                                                        {result.confidenceRating}/7{" "}
                                                                                        <span className="text-gray-500">
                                                                                            {result.confidenceRating >= 6 ? "High" : result.confidenceRating >= 4 ? "Med" : "Low"}
                                                                                        </span>
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-xs text-gray-400">N/A</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-4 py-3 text-xs text-gray-600">
                                                                                {result.completionTimeSeconds}s
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredParticipants.length === 0 && (
                        <div className="py-12 text-center text-sm text-gray-500">
                            No participants found matching your search.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
