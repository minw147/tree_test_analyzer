import type { StudySettings } from "@/lib/types/study";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SettingsEditorProps {
    settings: StudySettings;
    onChange: (settings: StudySettings) => void;
}

export function SettingsEditor({ settings, onChange }: SettingsEditorProps) {
    const updateSetting = <K extends keyof StudySettings>(key: K, value: StudySettings[K]) => {
        onChange({ ...settings, [key]: value });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Study Settings</h2>
                <p className="text-gray-600 mb-6">
                    Customize the messages that participants will see during the test.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="welcome-message">
                        Welcome Message <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="welcome-message"
                        value={settings.welcomeMessage}
                        onChange={(e) => updateSetting("welcomeMessage", e.target.value)}
                        placeholder="Enter welcome message (supports Markdown)..."
                        className="min-h-[120px] font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                        This message will be shown to participants when they first start the test.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="instructions">
                        Instructions <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="instructions"
                        value={settings.instructions}
                        onChange={(e) => updateSetting("instructions", e.target.value)}
                        placeholder="Enter instructions (supports Markdown)..."
                        className="min-h-[120px] font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                        Instructions explaining how the tree test works. This will be shown after the welcome message.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="completed-message">
                        Completion Message <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id="completed-message"
                        value={settings.completedMessage}
                        onChange={(e) => updateSetting("completedMessage", e.target.value)}
                        placeholder="Enter completion message (supports Markdown)..."
                        className="min-h-[120px] font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                        This message will be shown after participants complete all tasks and submit their responses.
                    </p>
                </div>
            </div>
        </div>
    );
}

