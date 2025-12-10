import { useEffect, useState } from "react";
import { ParticipantPreview } from "@/components/participant/ParticipantPreview";
import type { StudyConfig, Task } from "@/lib/types/study";
import { shuffleTasks } from "@/lib/utils/task-randomizer";

export function Preview() {
    const [study, setStudy] = useState<StudyConfig | null>(null);
    const [shuffledTasks, setShuffledTasks] = useState<Task[] | null>(null);

    useEffect(() => {
        // Load study from sessionStorage
        const studyData = sessionStorage.getItem("previewStudy");
        if (studyData) {
            try {
                const parsed = JSON.parse(studyData);
                setStudy(parsed);
            } catch (error) {
                console.error("Failed to parse preview study:", error);
            }
        }
    }, []);

    // Initialize shuffled tasks when study loads
    useEffect(() => {
        if (study) {
            if (study.settings.randomizeTasks === true && study.tasks.length > 1) {
                const shuffled = shuffleTasks(study.tasks);
                setShuffledTasks(shuffled);
            } else {
                setShuffledTasks(null);
            }
        }
    }, [study]);

    if (!study) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">No preview data found.</p>
                    <p className="text-sm text-gray-500">
                        Please go back to the Creator and click "Open Preview in New Tab" again.
                    </p>
                </div>
            </div>
        );
    }

    return <ParticipantPreview study={study} shuffledTasks={shuffledTasks} isPreview={true} />;
}

