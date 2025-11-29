import { useState } from "react";
import type { UploadedData } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, PieChart as PieChartIcon, Network, Users, FileText, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { OverviewTab } from "./OverviewTab";
import { TasksTab } from "./TasksTab";
import { ParticipantsTab } from "./ParticipantsTab";
import { PietreeTab } from "./PietreeTab";
import { ExportTab } from "./ExportTab";

interface DashboardLayoutProps {
    data: UploadedData;
    onDataChange: (data: UploadedData) => void;
    onDelete?: () => void;
}

export function DashboardLayout({ data, onDataChange, onDelete: _onDelete }: DashboardLayoutProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [editingName, setEditingName] = useState(false);
    const [editingCreator, setEditingCreator] = useState(false);

    return (
        <div className="h-full">
            <div className="border-b bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex flex-col gap-2">
                        {/* Editable Name */}
                        <div className="flex items-center gap-2">
                            {editingName ? (
                                <Input
                                    value={data.name || ""}
                                    onChange={(e) => onDataChange({ ...data, name: e.target.value })}
                                    onBlur={() => setEditingName(false)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === "Escape") {
                                            setEditingName(false);
                                        }
                                    }}
                                    className="text-lg font-semibold h-8 px-2 py-1 max-w-md"
                                    placeholder="Untitled Analysis"
                                    autoFocus
                                />
                            ) : (
                                <h2
                                    className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-purple-600 transition-colors flex items-center gap-2 group"
                                    onClick={() => setEditingName(true)}
                                    title="Click to edit study name"
                                >
                                    {data.name || "Untitled Analysis"}
                                    <Edit2 className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                                </h2>
                            )}
                        </div>

                        {/* Editable Creator and Stats */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {editingCreator ? (
                                    <Input
                                        value={data.creator || ""}
                                        onChange={(e) => onDataChange({ ...data, creator: e.target.value })}
                                        onBlur={() => setEditingCreator(false)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === "Escape") {
                                                setEditingCreator(false);
                                            }
                                        }}
                                        placeholder="Enter creator name..."
                                        className="text-sm text-gray-500 h-7 px-2 py-1 max-w-xs"
                                        autoFocus
                                    />
                                ) : (
                                    <p
                                        className="text-sm text-gray-500 cursor-pointer hover:text-purple-600 transition-colors flex items-center gap-2 group w-fit"
                                        onClick={() => setEditingCreator(true)}
                                        title="Click to edit creator name"
                                    >
                                        {data.creator || "Study Creator"}
                                        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                    </p>
                                )}
                                <span className="text-sm text-gray-400">•</span>
                                <span className="text-sm text-gray-500">
                                    {data.participants.length} participants • {data.tasks.length} tasks
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Tabs className="space-y-6">
                    <TabsList className="flex w-full overflow-x-auto lg:justify-start">
                        <TabsTrigger value="overview" isActive={activeTab === "overview"} onClick={() => setActiveTab("overview")} className="flex-shrink-0">
                            <BarChart3 className="mr-1 sm:mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Overview</span>
                        </TabsTrigger>
                        <TabsTrigger value="tasks" isActive={activeTab === "tasks"} onClick={() => setActiveTab("tasks")} className="flex-shrink-0">
                            <PieChartIcon className="mr-1 sm:mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Tasks</span>
                        </TabsTrigger>
                        <TabsTrigger value="participants" isActive={activeTab === "participants"} onClick={() => setActiveTab("participants")} className="flex-shrink-0">
                            <Users className="mr-1 sm:mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Participants</span>
                        </TabsTrigger>
                        <TabsTrigger value="pietree" isActive={activeTab === "pietree"} onClick={() => setActiveTab("pietree")} className="flex-shrink-0">
                            <Network className="mr-1 sm:mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Pietree</span>
                        </TabsTrigger>
                        <TabsTrigger value="export" isActive={activeTab === "export"} onClick={() => setActiveTab("export")} className="flex-shrink-0">
                            <FileText className="mr-1 sm:mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Export</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" activeValue={activeTab}>
                        <OverviewTab data={data} />
                    </TabsContent>

                    <TabsContent value="tasks" activeValue={activeTab}>
                        <TasksTab data={data} />
                    </TabsContent>

                    <TabsContent value="participants" activeValue={activeTab}>
                        <ParticipantsTab data={data} />
                    </TabsContent>

                    <TabsContent value="pietree" activeValue={activeTab}>
                        <PietreeTab data={data} />
                    </TabsContent>

                    <TabsContent value="export" activeValue={activeTab}>
                        <ExportTab data={data} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
