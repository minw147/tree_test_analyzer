import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface TaskRandomizationSettingsProps {
    randomizeTasks: boolean;
    taskCount: number;
    onChange: (randomizeTasks: boolean) => void;
}

/**
 * Task Randomization Settings Component
 * 
 * Displays a toggle for enabling task randomization.
 * Only shown when there are 2+ tasks (no point randomizing 1 task).
 */
export function TaskRandomizationSettings({
    randomizeTasks,
    taskCount,
    onChange,
}: TaskRandomizationSettingsProps) {
    // Only show if there are 2+ tasks
    if (taskCount < 2) {
        return null;
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                    <Label htmlFor="randomize-tasks" className="text-base font-medium text-gray-900">
                        Randomize task order for each participant
                    </Label>
                    <p className="text-sm text-gray-600">
                        Each participant will see tasks in a random order. Results will still be analyzed by the original task.
                    </p>
                </div>
                <Switch
                    id="randomize-tasks"
                    checked={randomizeTasks}
                    onCheckedChange={onChange}
                    className="ml-4"
                />
            </div>
        </div>
    );
}

