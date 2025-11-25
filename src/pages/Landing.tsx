import { Link } from "react-router-dom";
import { Plus, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function Landing() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        TreePath
                    </h1>
                    <p className="text-lg text-gray-600">
                        Create, collect, and analyze tree testing studies
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Create Study Card */}
                    <Link to="/create" className="block group">
                        <Card className="h-full transition-all duration-200 hover:shadow-lg border-2 hover:border-blue-500">
                            <CardContent className="p-8">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                                        <Plus className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                        Create New Study
                                    </h2>
                                    <p className="text-gray-600">
                                        Design a new tree test, define tasks, and configure how to collect participant responses
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Analyze Data Card */}
                    <Link to="/analyze" className="block group">
                        <Card className="h-full transition-all duration-200 hover:shadow-lg border-2 hover:border-blue-500">
                            <CardContent className="p-8">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                                        <BarChart3 className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                        Analyze Existing Data
                                    </h2>
                                    <p className="text-gray-600">
                                        Upload your tree test results and explore detailed analytics and visualizations
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                <div className="mt-12 text-center text-sm text-gray-500">
                    <p>Open Source Tree Testing Tool • Community Edition</p>
                </div>
            </div>
        </div>
    );
}
