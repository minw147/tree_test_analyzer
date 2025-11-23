import { useState } from "react";
import type { UploadedData } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, PieChart as PieChartIcon, Network, GitGraph, Activity, LogOut, HelpCircle, Users } from "lucide-react";
import { OverviewTab } from "./OverviewTab";
import { TasksTab } from "./TasksTab";
import { ParticipantsTab } from "./ParticipantsTab";
import { HelpView } from "../HelpView";

interface DashboardLayoutProps {
    data: UploadedData;
    onReset: () => void;
}

export function DashboardLayout({ data, onReset }: DashboardLayoutProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [showHelp, setShowHelp] = useState(false);

    if (showHelp) {
        return <HelpView onBack={() => setShowHelp(false)} />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Activity className="h-6 w-6 text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900">Tree Test Analyzer</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                            {data.participants.length} participants • {data.tasks.length} tasks
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => setShowHelp(true)} title="Help & Definitions">
                            <HelpCircle className="h-5 w-5 text-gray-500" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={onReset}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Reset
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 py-8">
                <Tabs className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[750px] lg:grid-cols-5">
                        <TabsTrigger value="overview" isActive={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="tasks" isActive={activeTab === "tasks"} onClick={() => setActiveTab("tasks")}>
                            <PieChartIcon className="mr-2 h-4 w-4" />
                            Tasks
                        </TabsTrigger>
                        <TabsTrigger value="participants" isActive={activeTab === "participants"} onClick={() => setActiveTab("participants")}>
                            <Users className="mr-2 h-4 w-4" />
                            Participants
                        </TabsTrigger>
                        <TabsTrigger value="pietree" isActive={activeTab === "pietree"} onClick={() => setActiveTab("pietree")}>
                            <Network className="mr-2 h-4 w-4" />
                            Pietree
                        </TabsTrigger>
                        <TabsTrigger value="sankey" isActive={activeTab === "sankey"} onClick={() => setActiveTab("sankey")}>
                            <GitGraph className="mr-2 h-4 w-4" />
                            Sankey
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" activeValue={activeTab}>
                        <OverviewTab data={data} />
                    </TabsContent>

                    <TabsContent value="tasks" activeValue={activeTab}>
                        <TasksTab data={data} onOpenHelp={() => setShowHelp(true)} />
                    </TabsContent>

                    <TabsContent value="participants" activeValue={activeTab}>
                        <ParticipantsTab data={data} />
                    </TabsContent>

                    <TabsContent value="pietree" activeValue={activeTab}>
                        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-white">
                            <p className="text-gray-500">Pietree visualization coming soon</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="sankey" activeValue={activeTab}>
                        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-white">
                            <p className="text-gray-500">Sankey visualization coming soon</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
