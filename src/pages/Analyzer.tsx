import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { UploadedData } from "@/lib/types";
import { UploadView } from "@/components/dashboard/UploadView";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { generateId } from "@/lib/utils/id-generator";

const STORAGE_KEY_ANALYZER_STUDIES = "tree-test-analyzer-studies";

// Load all studies from localStorage
const loadStudiesFromStorage = (): UploadedData[] => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_ANALYZER_STUDIES);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error("Failed to load analyzer studies from localStorage:", error);
    }
    return [];
};

// Save all studies to localStorage
const saveStudiesToStorage = (studies: UploadedData[]) => {
    try {
        localStorage.setItem(STORAGE_KEY_ANALYZER_STUDIES, JSON.stringify(studies));
    } catch (error) {
        console.error("Failed to save analyzer studies to localStorage:", error);
    }
};

export function Analyzer() {
    const { studyId } = useParams<{ studyId?: string }>();
    const navigate = useNavigate();
    const [studies, setStudies] = useState<UploadedData[]>(loadStudiesFromStorage());
    const [currentStudy, setCurrentStudy] = useState<UploadedData | null>(null);

    // Load the current study based on studyId from URL
    useEffect(() => {
        if (studyId) {
            const study = studies.find(s => s.id === studyId);
            if (study) {
                setCurrentStudy(study);
            } else {
                // Study not found, redirect to upload view
                navigate("/analyze");
            }
        } else {
            setCurrentStudy(null);
        }
    }, [studyId, studies, navigate]);

    // Save studies to localStorage whenever they change
    useEffect(() => {
        saveStudiesToStorage(studies);
    }, [studies]);

    const handleDataLoaded = (data: Omit<UploadedData, "id" | "createdAt" | "updatedAt">) => {
        const newStudy: UploadedData = {
            ...data,
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setStudies(prev => [...prev, newStudy]);
        // Navigate to the new study
        navigate(`/analyze/${newStudy.id}`);
    };

    const handleDataChange = (updatedData: UploadedData) => {
        const updatedStudy = {
            ...updatedData,
            updatedAt: new Date().toISOString(),
        };

        setStudies(prev => prev.map(s => s.id === updatedStudy.id ? updatedStudy : s));
        setCurrentStudy(updatedStudy);
    };

    const handleDeleteStudy = (studyIdToDelete: string) => {
        setStudies(prev => prev.filter(s => s.id !== studyIdToDelete));
        navigate("/analyze");
    };

    // Show upload view if no studyId in URL
    if (!studyId) {
        return <UploadView onDataLoaded={handleDataLoaded} />;
    }

    // Show loading or not found if study doesn't exist
    if (!currentStudy) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Study not found</p>
            </div>
        );
    }

    return (
        <DashboardLayout
            data={currentStudy}
            onDataChange={handleDataChange}
            onDelete={() => handleDeleteStudy(currentStudy.id)}
        />
    );
}
