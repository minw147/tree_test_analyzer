import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, BarChart3, FileEdit, Trash2, Clock, ArrowRight, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StudyConfig } from "@/lib/types/study";
import type { UploadedData } from "@/lib/types";

const STORAGE_KEY_STUDIES = "tree-test-studies";
const STORAGE_KEY_ANALYZER_STUDIES = "tree-test-analyzer-studies";

export function Landing() {
    const navigate = useNavigate();
    const location = useLocation();
    const [savedStudies, setSavedStudies] = useState<StudyConfig[]>([]);
    const [savedAnalyses, setSavedAnalyses] = useState<UploadedData[]>([]);
    const [showStorageTooltip, setShowStorageTooltip] = useState(false);

    const loadStudies = () => {
        try {
            const studiesJson = localStorage.getItem(STORAGE_KEY_STUDIES);
            if (studiesJson) {
                setSavedStudies(JSON.parse(studiesJson));
            } else {
                setSavedStudies([]);
            }
        } catch (e) {
            console.error("Failed to load saved studies", e);
            setSavedStudies([]);
        }
    };

    const loadAnalyses = () => {
        try {
            const analysesJson = localStorage.getItem(STORAGE_KEY_ANALYZER_STUDIES);
            if (analysesJson) {
                setSavedAnalyses(JSON.parse(analysesJson));
            }
        } catch (e) {
            console.error("Failed to load saved analyses", e);
        }
    };

    useEffect(() => {
        loadStudies();
        loadAnalyses();

        // Listen for storage changes to update when study status changes
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY_STUDIES) {
                loadStudies();
            }
            if (e.key === STORAGE_KEY_ANALYZER_STUDIES) {
                loadAnalyses();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Also check on focus in case changes were made in another tab
        const handleFocus = () => {
            loadStudies();
            loadAnalyses();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // Refresh when navigating back to this page
    useEffect(() => {
        loadStudies();
        loadAnalyses();
    }, [location.pathname]);

    const handleDeleteStudy = (e: React.MouseEvent, studyId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this study? This cannot be undone.")) {
            const updated = savedStudies.filter(s => s.id !== studyId);
            setSavedStudies(updated);
            localStorage.setItem(STORAGE_KEY_STUDIES, JSON.stringify(updated));
        }
    };

    const handleDeleteAnalysis = (e: React.MouseEvent, analysisId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Are you sure you want to clear this analysis data?")) {
            const updated = savedAnalyses.filter(a => a.id !== analysisId);
            setSavedAnalyses(updated);
            localStorage.setItem(STORAGE_KEY_ANALYZER_STUDIES, JSON.stringify(updated));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-1">Manage your tree tests and analysis</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            className="gap-2 whitespace-nowrap min-w-[140px]"
                            onClick={() => navigate("/analyze")}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Import Data
                        </Button>
                        <Button
                            className="gap-2 whitespace-nowrap min-w-[140px]"
                            onClick={() => navigate("/create?new=true")}
                        >
                            <Plus className="w-4 h-4" />
                            New Study
                        </Button>
                    </div>
                </div>

                {/* Library Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold text-gray-900">Your Studies</h2>
                        <div className="relative">
                            <button
                                onClick={() => setShowStorageTooltip(!showStorageTooltip)}
                                className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <HelpCircle className="h-3.5 w-3.5 text-gray-500" />
                                <span className="hidden sm:inline">Storage info</span>
                            </button>
                            {showStorageTooltip && (
                                <div className="absolute left-full top-0 ml-2 z-50 w-72 rounded-lg border bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5">
                                    <h4 className="mb-2 font-semibold text-gray-900">Local Storage Notice</h4>
                                    <ul className="mb-4 space-y-2 text-xs text-gray-600">
                                        <li>Your studies and analysis data are saved locally in this browser. They will be lost if you clear browser data or use a different device.</li>
                                        <li><strong>Tip:</strong> Export your data to preserve it permanently.</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {savedStudies.length === 0 && savedAnalyses.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <FileEdit className="w-6 h-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No studies yet</h3>
                            <p className="text-gray-500 mt-1 mb-6">Get started by creating a new study or importing data.</p>
                            <Button onClick={() => navigate("/create?new=true")}>
                                Create First Study
                            </Button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Saved Studies */}
                            {savedStudies.map((savedStudy) => {
                                // Determine display status - show Closed if closed, otherwise Published or Draft
                                const displayStatus = savedStudy.accessStatus === 'closed' 
                                    ? 'closed' 
                                    : savedStudy.status === 'published' 
                                        ? 'published' 
                                        : 'draft';
                                
                                const statusConfig = {
                                    draft: { 
                                        label: 'Draft', 
                                        bg: 'bg-gray-100', 
                                        text: 'text-gray-800',
                                        border: 'bg-gray-500'
                                    },
                                    published: { 
                                        label: 'Published', 
                                        bg: 'bg-green-100', 
                                        text: 'text-green-800',
                                        border: 'bg-green-500'
                                    },
                                    closed: { 
                                        label: 'Closed', 
                                        bg: 'bg-red-100', 
                                        text: 'text-red-800',
                                        border: 'bg-red-500'
                                    }
                                };
                                
                                const config = statusConfig[displayStatus];
                                
                                return (
                                    <Card key={savedStudy.id} className="group hover:shadow-md transition-shadow relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${config.border}`} />
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
                                                        {config.label}
                                                    </span>
                                                    <CardTitle className="text-lg font-bold text-gray-900">
                                                        {savedStudy.name || "Untitled Study"}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs space-y-0.5">
                                                        <div>Created {new Date(savedStudy.createdAt).toLocaleDateString()}</div>
                                                        {savedStudy.publishedAt && (
                                                            <div>Published {new Date(savedStudy.publishedAt).toLocaleDateString()}</div>
                                                        )}
                                                        {savedStudy.closedAt && (
                                                            <div>Closed {new Date(savedStudy.closedAt).toLocaleDateString()}</div>
                                                        )}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>Last updated {new Date(savedStudy.updatedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 pt-2">
                                                    <Button
                                                        variant="default"
                                                        className="flex-1"
                                                        onClick={() => navigate(`/create/${savedStudy.id}`)}
                                                    >
                                                        <FileEdit className="w-4 h-4 mr-2" />
                                                        {displayStatus === 'draft' ? 'Continue Editing' : 'Edit Study'}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-400 hover:text-red-600"
                                                        onClick={(e) => handleDeleteStudy(e, savedStudy.id)}
                                                        title="Delete Study"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            {/* Saved Analyses */}
                            {savedAnalyses.map((analysis) => (
                                <Card key={analysis.id} className="group hover:shadow-md transition-shadow relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                    Analysis
                                                </span>
                                                <CardTitle className="text-lg font-bold text-gray-900">
                                                    {analysis.name || "Imported Data"}
                                                </CardTitle>
                                                <CardDescription>
                                                    {analysis.participants.length} Participants
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <BarChart3 className="w-4 h-4" />
                                                    <span>Ready to view</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2">
                                                <Button
                                                    variant="default"
                                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                                    onClick={() => navigate(`/analyze/${analysis.id}`)}
                                                >
                                                    <ArrowRight className="w-4 h-4 mr-2" />
                                                    View Results
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-gray-400 hover:text-red-600"
                                                    onClick={(e) => handleDeleteAnalysis(e, analysis.id)}
                                                    title="Clear Analysis"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
