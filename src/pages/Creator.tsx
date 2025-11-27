import { useState, useEffect, useRef } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { Network, ClipboardList, Settings, Database, Share2, Eye, ExternalLink, Edit2 } from "lucide-react";
import type { StudyConfig } from "@/lib/types/study";
import { generateStudyId } from "@/lib/utils/id-generator";
import { TreeEditor } from "@/components/creator/TreeEditor";
import { TaskEditor } from "@/components/creator/TaskEditor";
import { SettingsEditor } from "@/components/creator/SettingsEditor";
import { StorageEditor } from "@/components/creator/StorageEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportStudyConfig } from "@/lib/study-exporter";
import { Download, Globe, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createStorageAdapter } from "@/lib/storage/factory";

type TabType = "tree" | "tasks" | "settings" | "preview" | "storage" | "export";

const STORAGE_KEY_STUDIES = "tree-test-studies";

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
    status: "draft",
    accessStatus: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});

// Migrate from old single-study format to new array format
const migrateOldStorage = (): StudyConfig[] => {
    try {
        const oldKey = "tree-test-study-config";
        const oldStudy = localStorage.getItem(oldKey);
        if (oldStudy) {
            const parsed = JSON.parse(oldStudy);
            // Convert to array format
            const studies = [parsed];
            saveStudiesToStorage(studies);
            // Remove old key
            localStorage.removeItem(oldKey);
            console.log("Migrated old study format to new array format");
            return studies;
        }
    } catch (error) {
        console.error("Failed to migrate old storage:", error);
    }
    return [];
};

// Load all studies from localStorage
const loadStudiesFromStorage = (): StudyConfig[] => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_STUDIES);
        if (saved) {
            return JSON.parse(saved);
        } else {
            // Try to migrate from old format
            return migrateOldStorage();
        }
    } catch (error) {
        console.error("Failed to load studies from localStorage:", error);
        // Try to migrate from old format
        return migrateOldStorage();
    }
};

// Save all studies to localStorage
const saveStudiesToStorage = (studies: StudyConfig[]) => {
    try {
        localStorage.setItem(STORAGE_KEY_STUDIES, JSON.stringify(studies));
    } catch (error) {
        console.error("Failed to save studies to localStorage:", error);
    }
};

// Load a specific study by ID
const loadStudyById = (studyId: string | undefined): StudyConfig | null => {
    if (!studyId) return null;
    const studies = loadStudiesFromStorage();
    return studies.find(s => s.id === studyId) || null;
};

export function Creator() {
    const { studyId: urlStudyId } = useParams<{ studyId?: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const isNewStudy = searchParams.get('new') === 'true';
    
    const [activeTab, setActiveTab] = useState<TabType>("tree");
    const [editingName, setEditingName] = useState(false);
    const [editingCreator, setEditingCreator] = useState(false);
    const [study, setStudy] = useState<StudyConfig | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Track if this is the initial mount to prevent immediate save on new study creation
    const isInitialMount = useRef(true);
    // Track the study ID we just created to prevent double-creation
    const justCreatedStudyId = useRef<string | null>(null);

    // Load study on mount or when studyId changes
    useEffect(() => {
        if (isNewStudy) {
            // Creating a new study
            const newStudy = getDefaultStudy();
            justCreatedStudyId.current = newStudy.id;
            setStudy(newStudy);
            // Remove the query parameter from URL
            setSearchParams({}, { replace: true });
            // Update URL to include the new study ID
            navigate(`/create/${newStudy.id}`, { replace: true });
            return; // Exit early - don't process urlStudyId change that will happen next
        }

        // If we just created this study, don't try to load it again (it's already set)
        if (justCreatedStudyId.current === urlStudyId) {
            return;
        }

        if (urlStudyId) {
            // Loading existing study by ID
            const loadedStudy = loadStudyById(urlStudyId);
            if (loadedStudy) {
                setStudy(loadedStudy);
                justCreatedStudyId.current = null; // Clear the flag since we loaded an existing study
            } else {
                // Study not found - only create new if we didn't just create it
                if (justCreatedStudyId.current !== urlStudyId) {
                    console.warn(`Study ${urlStudyId} not found, creating new study`);
                    const newStudy = getDefaultStudy();
                    justCreatedStudyId.current = newStudy.id;
                    setStudy(newStudy);
                    navigate(`/create/${newStudy.id}`, { replace: true });
                }
            }
        } else {
            // No study ID and not creating new - load first study or create new
            const studies = loadStudiesFromStorage();
            if (studies.length > 0) {
                // Load the most recently updated study
                const latestStudy = studies.sort((a, b) => 
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                )[0];
                setStudy(latestStudy);
                justCreatedStudyId.current = null; // Clear the flag
                navigate(`/create/${latestStudy.id}`, { replace: true });
            } else {
                // No studies exist, create a new one
                const newStudy = getDefaultStudy();
                justCreatedStudyId.current = newStudy.id;
                setStudy(newStudy);
                navigate(`/create/${newStudy.id}`, { replace: true });
            }
        }
    }, [urlStudyId, isNewStudy, navigate, setSearchParams]);

    // Save to localStorage whenever study changes (but skip initial mount for new studies)
    useEffect(() => {
        if (!study) return;

        // Skip save on initial mount if creating a new study (to prevent overwriting)
        if (isInitialMount.current && isNewStudy) {
            isInitialMount.current = false;
            return;
        }
        isInitialMount.current = false;

        // Update study in array
        const studies = loadStudiesFromStorage();
        const existingIndex = studies.findIndex(s => s.id === study.id);
        
        if (existingIndex >= 0) {
            // Update existing study
            studies[existingIndex] = { ...study, updatedAt: new Date().toISOString() };
        } else {
            // Add new study
            studies.push({ ...study, updatedAt: new Date().toISOString() });
        }
        
        saveStudiesToStorage(studies);
        // Clear the just-created flag after saving, so future loads work normally
        if (justCreatedStudyId.current === study.id) {
            justCreatedStudyId.current = null;
        }
    }, [study, isNewStudy]);

    const tabs = [
        { id: "tree" as TabType, name: "Tree Structure", icon: Network },
        { id: "tasks" as TabType, name: "Tasks", icon: ClipboardList },
        { id: "settings" as TabType, name: "Settings", icon: Settings },
        { id: "preview" as TabType, name: "Preview", icon: Eye },
        { id: "storage" as TabType, name: "Storage", icon: Database },
        { id: "export" as TabType, name: "Launch Study", icon: Share2 },
    ];

    const handleOpenPreview = () => {
        if (!study) return;
        // Store study config in sessionStorage for preview
        sessionStorage.setItem("previewStudy", JSON.stringify(study));
        // Open preview in new tab
        const previewWindow = window.open("/preview", "_blank");
        if (!previewWindow) {
            alert("Please allow pop-ups to open the preview in a new tab.");
        }
    };

    // Show loading state while study is being loaded
    if (!study) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading study...</p>
                </div>
            </div>
        );
    }

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
                                <div className="flex items-center gap-3">
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
                                            className="text-sm text-gray-600 h-6 px-2 py-1"
                                            placeholder="Study Creator"
                                        autoFocus
                                    />
                                ) : (
                                    <p
                                            className="text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                                        onClick={() => setEditingCreator(true)}
                                        title="Click to edit creator name"
                                    >
                                        {study.creator || "Study Creator"}
                                    </p>
                                )}
                                    {/* Status badge - single badge following landing page logic */}
                                    {(() => {
                                        // Determine display status - show Closed if closed, otherwise Published or Draft
                                        const displayStatus = study.accessStatus === 'closed' 
                                            ? 'closed' 
                                            : study.status === 'published' 
                                                ? 'published' 
                                                : 'draft';
                                        
                                        const statusConfig = {
                                            draft: { 
                                                label: 'Draft', 
                                                bg: 'bg-gray-100', 
                                                text: 'text-gray-800',
                                                icon: AlertCircle
                                            },
                                            published: { 
                                                label: 'Published', 
                                                bg: 'bg-green-100', 
                                                text: 'text-green-800',
                                                icon: CheckCircle2
                                            },
                                            closed: { 
                                                label: 'Closed', 
                                                bg: 'bg-red-100', 
                                                text: 'text-red-800',
                                                icon: XCircle
                                            }
                                        };
                                        
                                        const config = statusConfig[displayStatus];
                                        const Icon = config.icon;
                                        
                                        return (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium ${config.bg} ${config.text}`}>
                                                <Icon className="h-3.5 w-3.5" />
                                                {config.label}
                                            </span>
                                        );
                                    })()}
                                </div>
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
                                <StorageEditor
                                    config={study.storage}
                                    onChange={(storage) => setStudy({ ...study, storage, updatedAt: new Date().toISOString() })}
                                />
                            </div>
                        )}

                        {activeTab === "export" && (
                            <div className="space-y-6">
                            <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Launch Study</h2>
                                <p className="text-gray-600 mb-6">
                                        Publish your study and generate a shareable link, or export your study configuration.
                                    </p>
                                </div>

                                {/* Study Status Section */}
                                <Card>
                                    <CardContent className="pt-6">
                                        {saveError && (
                                            <Alert variant="destructive" className="mb-4">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Error</AlertTitle>
                                                <AlertDescription>{saveError}</AlertDescription>
                                            </Alert>
                                        )}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                        Study Status
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                                            study.status === 'published' 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {study.status === 'published' ? (
                                                                <>
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    Published
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <AlertCircle className="h-4 w-4" />
                                                                    Draft
                                                                </>
                                                            )}
                                                        </span>
                                                        {study.status === 'published' && (
                                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                                                study.accessStatus === 'active'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {study.accessStatus === 'active' ? (
                                                                    <>
                                                                        <Globe className="h-4 w-4" />
                                                                        Active
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="h-4 w-4" />
                                                                        Closed
                                                                    </>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {study.status === 'published' && (
                                                        <div className="text-xs text-gray-500 mt-2">
                                                            {study.publishedAt && (
                                                                <span>Published: {new Date(study.publishedAt).toLocaleDateString()}</span>
                                                            )}
                                                            {study.publishedAt && study.closedAt && (
                                                                <span className="mx-2">•</span>
                                                            )}
                                                            {study.closedAt && (
                                                                <span>Closed: {new Date(study.closedAt).toLocaleDateString()}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 items-start">
                                                    {study.status === 'draft' ? (
                                                        <Button
                                                            onClick={async () => {
                                                                // Validation before publishing
                                                                if (study.tree.length === 0) {
                                                                    alert("Please add a tree structure before publishing.");
                                                                    return;
                                                                }
                                                                if (study.tasks.length === 0) {
                                                                    alert("Please add at least one task before publishing.");
                                                                    return;
                                                                }
                                                                if (study.storage.type === 'custom-api' && !study.storage.endpointUrl) {
                                                                    alert("Please configure your Custom API endpoint URL in the Storage tab.");
                                                                    return;
                                                                }

                                                                setIsSaving(true);
                                                                setSaveError(null);

                                                                try {
                                                                    // Prepare updated study config
                                                                    const updatedConfig = {
                                                                        ...study,
                                                                        status: 'published' as const,
                                                                        accessStatus: 'active' as const, // Newly published studies should be active
                                                                        publishedAt: new Date().toISOString(),
                                                                        updatedAt: new Date().toISOString(),
                                                                    };

                                                                    // Save to storage if not local-download
                                                                    if (study.storage.type !== 'local-download') {
                                                                        const adapter = createStorageAdapter(study.storage);
                                                                        const result = await adapter.saveConfig(updatedConfig);

                                                                        if (!result.success) {
                                                                            setSaveError(result.error || "Failed to publish study. Please check your storage configuration.");
                                                                            setIsSaving(false);
                                                                            return;
                                                                        }
                                                                    }

                                                                    // Update local state
                                                                    setStudy(updatedConfig);
                                                                } catch (error) {
                                                                    setSaveError(error instanceof Error ? error.message : "Failed to publish study");
                                                                } finally {
                                                                    setIsSaving(false);
                                                                }
                                                            }}
                                                            className="gap-2 whitespace-nowrap"
                                                            disabled={isSaving}
                                                        >
                                                            {isSaving ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                    Publishing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    Publish Study
                                                                </>
                                                            )}
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                onClick={async () => {
                                                                    setIsSaving(true);
                                                                    setSaveError(null);

                                                                    try {
                                                                        // Save to storage if not local-download
                                                                        if (study.storage.type !== 'local-download') {
                                                                            const adapter = createStorageAdapter(study.storage);
                                                                            const result = await adapter.saveConfig({
                                                                                ...study,
                                                                                status: 'draft' as const,
                                                                                publishedAt: undefined,
                                                                                closedAt: undefined,
                                                                                updatedAt: new Date().toISOString(),
                                                                            });

                                                                            if (!result.success) {
                                                                                setSaveError(result.error || "Failed to unpublish study.");
                                                                                setIsSaving(false);
                                                                                return;
                                                                            }
                                                                        }

                                                                        const updated = {
                                                                            ...study,
                                                                            status: 'draft' as const,
                                                                            publishedAt: undefined, // Clear publish date when unpublished
                                                                            closedAt: undefined, // Clear closed date when unpublished
                                                                            updatedAt: new Date().toISOString(),
                                                                        };
                                                                        setStudy(updated);
                                                                    } catch (error) {
                                                                        setSaveError(error instanceof Error ? error.message : "Failed to unpublish study");
                                                                    } finally {
                                                                        setIsSaving(false);
                                                                    }
                                                                }}
                                                                className="whitespace-nowrap"
                                                                disabled={isSaving}
                                                            >
                                                                {isSaving ? (
                                                                    <>
                                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                        Saving...
                                                                    </>
                                                                ) : (
                                                                    'Unpublish'
                                                                )}
                                                            </Button>
                                                            <div className="w-[140px]">
                                                                {study.accessStatus === 'active' ? (
                                                                    <Button
                                                                        variant="destructive"
                                                                        onClick={async () => {
                                                                            setIsSaving(true);
                                                                            setSaveError(null);

                                                                            try {
                                                                                // Update status in storage if not local-download
                                                                                if (study.storage.type !== 'local-download') {
                                                                                    const adapter = createStorageAdapter(study.storage);
                                                                                    const result = await adapter.updateStatus(study.id, 'closed');
                                                                                    if (!result.success) {
                                                                                        setSaveError(result.error || "Failed to close study.");
                                                                                        setIsSaving(false);
                                                                                        return;
                                                                                    }
                                                                                }

                                                                                const updated = {
                                                                                    ...study,
                                                                                    accessStatus: 'closed' as const,
                                                                                    closedAt: new Date().toISOString(),
                                                                                    updatedAt: new Date().toISOString(),
                                                                                };
                                                                                setStudy(updated);
                                                                            } catch (error) {
                                                                                setSaveError(error instanceof Error ? error.message : "Failed to close study");
                                                                            } finally {
                                                                                setIsSaving(false);
                                                                            }
                                                                        }}
                                                                        className="gap-2 w-full whitespace-nowrap"
                                                                        disabled={isSaving}
                                                                    >
                                                                        {isSaving ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <>
                                                                                <XCircle className="h-4 w-4" />
                                                                                Close Study
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        onClick={async () => {
                                                                            setIsSaving(true);
                                                                            setSaveError(null);

                                                                            try {
                                                                                // Update status in storage if not local-download
                                                                                if (study.storage.type !== 'local-download') {
                                                                                    const adapter = createStorageAdapter(study.storage);
                                                                                    const result = await adapter.updateStatus(study.id, 'active');
                                                                                    if (!result.success) {
                                                                                        setSaveError(result.error || "Failed to reopen study.");
                                                                                        setIsSaving(false);
                                                                                        return;
                                                                                    }
                                                                                }

                                                                                const updated = {
                                                                                    ...study,
                                                                                    accessStatus: 'active' as const,
                                                                                    closedAt: undefined, // Clear closed date when reopened
                                                                                    updatedAt: new Date().toISOString(),
                                                                                };
                                                                                setStudy(updated);
                                                                            } catch (error) {
                                                                                setSaveError(error instanceof Error ? error.message : "Failed to reopen study");
                                                                            } finally {
                                                                                setIsSaving(false);
                                                                            }
                                                                        }}
                                                                        className="gap-2 w-full whitespace-nowrap"
                                                                        disabled={isSaving}
                                                                    >
                                                                        {isSaving ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <>
                                                                                <Globe className="h-4 w-4" />
                                                                                Reopen Study
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Shareable Link Section - Only shown when published */}
                                {study.status === 'published' && (
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                        Shareable Participant Link
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mb-4">
                                                        Share this link with participants to take your tree test.
                                                    </p>
                                                    <div className="space-y-2">
                                                        {/* For Google Sheets: Show cross-device link (more reliable) */}
                                                        {study.storage?.type === 'google-sheets' && study.storage?.webhookUrl ? (
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    readOnly
                                                                    value={`${window.location.origin}/test/${study.id}?webhook=${encodeURIComponent(study.storage.webhookUrl || '')}`}
                                                                    className="font-mono text-sm"
                                                                    title="Cross-device link (works from any device, includes webhook URL for Google Sheets)"
                                                                />
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(`${window.location.origin}/test/${study.id}?webhook=${encodeURIComponent(study.storage.webhookUrl || '')}`);
                                                                    }}
                                                                >
                                                                    Copy Link
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            /* For other storage types: Show standard link */
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    readOnly
                                                                    value={`${window.location.origin}/test/${study.id}`}
                                                                    className="font-mono text-sm"
                                                                />
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(`${window.location.origin}/test/${study.id}`);
                                                                    }}
                                                                >
                                                                    Copy Link
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {study.accessStatus === 'closed' && (
                                                        <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                                                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                                                            <AlertTitle className="text-yellow-800">Study Closed</AlertTitle>
                                                            <AlertDescription className="text-yellow-700">
                                                                This study is closed and not accepting new participants. Reopen it to allow new participants.
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Export Study Configuration */}
                                <Card>
                                    <CardContent className="pt-6">
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    Export Study Configuration
                                                </h3>
                                                <p className="text-sm text-gray-600 mb-4">
                                                    Download your study configuration as a JSON file. This includes your tree structure, tasks, settings, and storage configuration. You can use this file to import the study into the Analyzer later.
                                                </p>
                                                <Button
                                                    onClick={() => exportStudyConfig(study)}
                                                    className="gap-2"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Download Study Config JSON
                                                </Button>
                                </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
