import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, CheckCircle, Clock, Target, Activity } from "lucide-react";

interface HelpViewProps {
    onBack: () => void;
}

export function HelpView({ onBack }: HelpViewProps) {
    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900">Tree Test Analysis Guide</h1>
                    </div>
                    <Button variant="outline" size="sm" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
            </header>

            <main className="container mx-auto max-w-4xl p-4 py-8">
                <div className="space-y-8">
                    <section className="rounded-lg border bg-white p-8 shadow-sm">
                        <h2 className="mb-6 text-2xl font-bold text-gray-900">Understanding the Metrics</h2>
                        <p className="mb-8 text-gray-600">
                            This guide explains the key metrics used in the Tree Test Analyzer to help you interpret your study results effectively.
                        </p>

                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <h3 className="font-semibold text-gray-900">Success Rate</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                    The percentage of participants who eventually selected the correct destination for the task.
                                </p>
                                <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">
                                    <strong>Formula:</strong> (Successes / Total Participants) × 100
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-blue-600" />
                                    <h3 className="font-semibold text-gray-900">Directness</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                    The percentage of participants who went directly to the correct destination without backtracking or exploring incorrect paths.
                                </p>
                                <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">
                                    <strong>Formula:</strong> (Direct Paths / Total Participants) × 100
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-gray-700" />
                                    <h3 className="font-semibold text-gray-900">Median Time</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                    The middle value of time taken to complete the task. Unlike the average, it is not skewed by outliers (participants who took a very long time).
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-purple-600" />
                                    <h3 className="font-semibold text-gray-900">Overall Score</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                    A composite score from 0-100 that combines effectiveness (success) and efficiency (directness).
                                </p>
                                <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">
                                    <strong>Formula:</strong> (Success Rate × 0.7) + (Directness Rate × 0.3)
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-lg border bg-white p-8 shadow-sm">
                        <h2 className="mb-6 text-xl font-bold text-gray-900">Task Outcomes Breakdown</h2>
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
                                    <h4 className="font-medium text-green-900">Direct Success</h4>
                                    <p className="text-sm text-green-700">Participant went straight to the correct answer.</p>
                                </div>
                                <div className="rounded-lg border-l-4 border-green-300 bg-green-50 p-4">
                                    <h4 className="font-medium text-green-800">Indirect Success</h4>
                                    <p className="text-sm text-green-700">Participant found the correct answer but backtracked or explored other paths first.</p>
                                </div>
                                <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
                                    <h4 className="font-medium text-red-900">Direct Failure</h4>
                                    <p className="text-sm text-red-700">Participant went straight to an incorrect answer.</p>
                                </div>
                                <div className="rounded-lg border-l-4 border-red-300 bg-red-50 p-4">
                                    <h4 className="font-medium text-red-800">Indirect Failure</h4>
                                    <p className="text-sm text-red-700">Participant explored and backtracked but ultimately selected an incorrect answer.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
