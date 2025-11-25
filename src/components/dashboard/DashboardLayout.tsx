import { useState } from "react";
import type { UploadedData } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, PieChart as PieChartIcon, Network, LogOut, Users, FileText, HelpCircle } from "lucide-react";
import { OverviewTab } from "./OverviewTab";
import { TasksTab } from "./TasksTab";
import { ParticipantsTab } from "./ParticipantsTab";
import { PietreeTab } from "./PietreeTab";
import { ExportTab } from "./ExportTab";

interface DashboardLayoutProps {
    data: UploadedData;
    onReset: () => void;
}

export function DashboardLayout({ data, onReset }: DashboardLayoutProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [showStorageTooltip, setShowStorageTooltip] = useState(false);

    return (
        <div className="h-full">
            <div className="border-b bg-white shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        {/* Page specific title or empty */}
                        <h2 className="text-lg font-medium text-gray-700">Analysis Dashboard</h2>
                        <div className="relative">
                            <button
                                onClick={() => setShowStorageTooltip(!showStorageTooltip)}
                                className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <HelpCircle className="h-4 w-4 text-gray-500" />
                                <span className="hidden sm:inline">Storage info</span>
                            </button>
                            {showStorageTooltip && (
                                <div className="absolute left-full top-0 ml-2 z-50 w-72 rounded-lg border bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5">
                                    <h4 className="mb-2 font-semibold text-gray-900">Local Storage Notice</h4>
                                    <ul className="mb-4 space-y-2 text-xs text-gray-600">
                                        <li>Your analysis data is saved locally in this browser. It will be lost if you clear browser data or use a different device.</li>
                                        <li><strong>Tip:</strong> Export your data to preserve it permanently.</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                            {data.participants.length} participants • {data.tasks.length} tasks
                        </span>
                        <Button variant="outline" size="sm" onClick={onReset}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            <main className="container mx-auto p-4 py-8">
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
