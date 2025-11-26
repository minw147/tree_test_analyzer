import { useState, useEffect } from "react";
import { Network, ClipboardList, Settings, Database, Share2, Eye, ExternalLink, Edit2 } from "lucide-react";
import type { StudyConfig } from "@/lib/types/study";
import { generateStudyId } from "@/lib/utils/id-generator";
import { TreeEditor } from "@/components/creator/TreeEditor";
import { TaskEditor } from "@/components/creator/TaskEditor";
import { SettingsEditor } from "@/components/creator/SettingsEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TabType = "tree" | "tasks" | "settings" | "preview" | "storage" | "export";

const STORAGE_KEY_STUDY = "tree-test-study-config";

// Helper function to get default study
const getDefaultStudy = (): StudyConfig => ({
    id: generateStudyId(),
    name: "Untitled Study",
    creator: "",
    tree: [],
    tasks: [],
    storage: {
        type: "local-download",
    },
    settings: {
        welcomeMessage: "# Welcome to this Tree Test\n\nThank you for participating!",
        instructions: "# Instructions\n\nRead each task carefully and navigate through the tree to find where you think the answer would be located.",
        completedMessage: "# Thank you!\n\nYour responses have been recorded.",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});

// Load from localStorage on mount
const loadStudyFromStorage = (): StudyConfig => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_STUDY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...getDefaultStudy(),
                ...parsed,
                createdAt: parsed.createdAt || new Date().toISOString(),
                updatedAt: parsed.updatedAt || new Date().toISOString(),
            };
        }
    } catch (error) {
        console.error("Failed to load study from localStorage:", error);
    }
    return getDefaultStudy();
};

export function Creator() {
    const [activeTab, setActiveTab] = useState<TabType>("tree");
    const [editingName, setEditingName] = useState(false);
    const [editingCreator, setEditingCreator] = useState(false);
    const [study, setStudy] = useState<StudyConfig>(loadStudyFromStorage());

    // Save to localStorage whenever study changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_STUDY, JSON.stringify(study));
        } catch (error) {
            console.error("Failed to save study to localStorage:", error);
        }
    }, [study]);

    const tabs = [
        { id: "tree" as TabType, name: "Tree Structure", icon: Network },
        { id: "tasks" as TabType, name: "Tasks", icon: ClipboardList },
        { id: "settings" as TabType, name: "Settings", icon: Settings },
        { id: "preview" as TabType, name: "Preview", icon: Eye },
        { id: "storage" as TabType, name: "Storage", icon: Database },
        { id: "export" as TabType, name: "Export", icon: Share2 },
    ];

    const handleOpenPreview = () => {
        // Store study config in sessionStorage for preview
        sessionStorage.setItem("previewStudy", JSON.stringify(study));
        // Open preview in new tab
        const previewWindow = window.open("/preview", "_blank");
        if (!previewWindow) {
            alert("Please allow pop-ups to open the preview in a new tab.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    {editingName ? (
                                        <Input
                                            value={study.name}
                                            onChange={(e) => setStudy({ ...study, name: e.target.value, updatedAt: new Date().toISOString() })}
                                            onBlur={() => setEditingName(false)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    setEditingName(false);
                                                } else if (e.key === "Escape") {
                                                    setEditingName(false);
                                                }
                                            }}
                                            className="text-xl font-semibold h-8 px-2 py-1"
                                            autoFocus
                                        />
                                    ) : (
                                        <h1
                                            className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-2 group"
                                            onClick={() => setEditingName(true)}
                                            title="Click to edit study name"
                                        >
                                            {study.name || "Untitled Study"}
                                            <Edit2 className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                                        </h1>
                                    )}
                                </div>
                                {editingCreator ? (
                                    <Input
                                        value={study.creator || ""}
                                        onChange={(e) => setStudy({ ...study, creator: e.target.value, updatedAt: new Date().toISOString() })}
                                        onBlur={() => setEditingCreator(false)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                setEditingCreator(false);
                                            } else if (e.key === "Escape") {
                                                setEditingCreator(false);
                                            }
                                        }}
                                        placeholder="Enter creator name..."
                                        className="text-sm text-gray-500 h-7 px-2 py-1"
                                        autoFocus
                                    />
                                ) : (
                                    <p
                                        className="text-sm text-gray-500 cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-2 group w-fit"
                                        onClick={() => setEditingCreator(true)}
                                        title="Click to edit creator name"
                                    >
                                        {study.creator || "Study Creator"}
                                        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors inline-flex items-center gap-2 ${activeTab === tab.id
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.name}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card>
                    <CardContent className="pt-6">
                        {activeTab === "tree" && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tree Structure</h2>
                                <p className="text-gray-600 mb-6">
                                    Define the hierarchical structure that participants will navigate.
                                </p>
                                <TreeEditor
                                    tree={study.tree}
                                    onChange={(tree) => setStudy({ ...study, tree, updatedAt: new Date().toISOString() })}
                                />
                            </div>
                        )}

                        {activeTab === "tasks" && (
                            <div>
                                <TaskEditor
                                    tasks={study.tasks}
                                    tree={study.tree}
                                    onChange={(tasks) => setStudy({ ...study, tasks, updatedAt: new Date().toISOString() })}
                                />
                            </div>
                        )}

                        {activeTab === "settings" && (
                            <div>
                                <SettingsEditor
                                    settings={study.settings}
                                    onChange={(settings) => setStudy({ ...study, settings, updatedAt: new Date().toISOString() })}
                                />
                            </div>
                        )}

                        {activeTab === "preview" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview Study</h2>
                                    <p className="text-gray-600 mb-6">
                                        Open the preview in a new tab to see exactly what participants will experience.
                                    </p>
                                </div>
                                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <p className="text-gray-600 mb-6">
                                        Click the button below to open the participant experience in a new tab.
                                    </p>
                                    <Button
                                        onClick={handleOpenPreview}
                                        size="lg"
                                        className="gap-2"
                                    >
                                        <ExternalLink className="h-5 w-5" />
                                        Open Preview in New Tab
                                    </Button>
                                    <p className="text-sm text-gray-500 mt-4">
                                        The preview will show the welcome message, instructions, and all tasks exactly as participants will see them.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === "storage" && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Storage</h2>
                                <p className="text-gray-600 mb-6">
                                    Configure where participant responses will be stored.
                                </p>
                                <div className="text-center py-12 text-gray-500">
                                    Storage configuration coming soon...
                                </div>
                            </div>
                        )}

                        {activeTab === "export" && (
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Export Study</h2>
                                <p className="text-gray-600 mb-6">
                                    Generate a shareable link or download your study configuration.
                                </p>
                                <div className="text-center py-12 text-gray-500">
                                    Export functionality coming soon...
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
