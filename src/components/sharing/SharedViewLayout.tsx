import { useState } from "react";
import type { UploadedData } from "@/lib/types";
import type { ShareLink } from "@/lib/sharing/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, PieChart as PieChartIcon, Network, Users, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OverviewTab } from "../dashboard/OverviewTab";
import { TasksTab } from "../dashboard/TasksTab";
import { ParticipantsTab } from "../dashboard/ParticipantsTab";
import { PietreeTab } from "../dashboard/PietreeTab";
import { ExportTab } from "../dashboard/ExportTab";

interface SharedViewLayoutProps {
  data: UploadedData;
  shareLink: ShareLink;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function SharedViewLayout({
  data,
  shareLink: _shareLink,
  onRefresh,
  isRefreshing = false,
}: SharedViewLayoutProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="h-full">
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-2">
            {/* Study Name (Read-only) */}
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {data.name || "Untitled Analysis"}
              </h2>
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 border-blue-200">
                Shared View
              </span>
            </div>

            {/* Creator and Stats (Read-only) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">
                  {data.creator || "Study Creator"}
                </p>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-500">
                  {data.participants.length} participants • {data.tasks.length} tasks
                </span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-500">
                  Last updated: {formatDate(data.updatedAt)}
                </span>
              </div>
              
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto lg:justify-start">
            <TabsTrigger
              value="overview"
              isActive={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              className="flex-shrink-0"
            >
              <BarChart3 className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              isActive={activeTab === "tasks"}
              onClick={() => setActiveTab("tasks")}
              className="flex-shrink-0"
            >
              <PieChartIcon className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger
              value="participants"
              isActive={activeTab === "participants"}
              onClick={() => setActiveTab("participants")}
              className="flex-shrink-0"
            >
              <Users className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Participants</span>
            </TabsTrigger>
            <TabsTrigger
              value="pietree"
              isActive={activeTab === "pietree"}
              onClick={() => setActiveTab("pietree")}
              className="flex-shrink-0"
            >
              <Network className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Pietree</span>
            </TabsTrigger>
            <TabsTrigger
              value="export"
              isActive={activeTab === "export"}
              onClick={() => setActiveTab("export")}
              className="flex-shrink-0"
            >
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

