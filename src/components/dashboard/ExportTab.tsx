import { useState, useEffect } from "react";
import type { UploadedData } from "@/lib/types";
import { generateMarkdownReport } from "@/lib/markdown-generator";
import { downloadFile, exportToExcel } from "@/lib/data-exporter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Download, FileSpreadsheet, Check } from "lucide-react";
import { calculateTaskStats, calculateOverviewStats } from "@/lib/stats";

interface ExportTabProps {
    data: UploadedData;
}

export function ExportTab({ data }: ExportTabProps) {
    const [markdownContent, setMarkdownContent] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Calculate stats on the fly or memoize in parent. 
        // Since this tab might be mounted only when active, calculating here ensures fresh data.
        // For larger datasets, passing props from DashboardLayout is better, but this is robust.
        if (!data) return;

        const tree = data.treeStructure || [];
        const taskStats = calculateTaskStats(data, tree);
        const overviewStats = calculateOverviewStats(data);
        
        const report = generateMarkdownReport(data, taskStats, overviewStats);
        setMarkdownContent(report);
    }, [data]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(markdownContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    const handleDownloadMd = () => {
        const filename = `tree-test-report-${new Date().toISOString().split('T')[0]}.md`;
        downloadFile(markdownContent, filename, "text/markdown");
    };

    const handleExportExcel = () => {
        exportToExcel(data);
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Export & Report</h2>
                    <p className="text-sm sm:text-base text-gray-500">Generate reports for AI analysis or archival.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleCopy} size="sm" className="gap-2 w-full sm:w-auto">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span className="hidden sm:inline">{copied ? "Copied!" : "Copy to Clipboard"}</span>
                        <span className="sm:hidden">{copied ? "Copied!" : "Copy"}</span>
                    </Button>
                    <Button variant="outline" onClick={handleDownloadMd} size="sm" className="gap-2 w-full sm:w-auto">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download .md</span>
                        <span className="sm:hidden">Download</span>
                    </Button>
                    <Button variant="outline" onClick={handleExportExcel} size="sm" className="gap-2 w-full sm:w-auto">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span className="hidden sm:inline">Export Raw Data</span>
                        <span className="sm:hidden">Export Data</span>
                    </Button>
                </div>
            </div>

            <Card className="h-[calc(100vh-16rem)] sm:h-[calc(100vh-12rem)] flex flex-col">
                <CardHeader className="py-2 sm:py-3 px-4 sm:px-6 border-b bg-gray-50/50">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
                        Report Preview
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <div className="h-full w-full overflow-auto p-3 sm:p-6 bg-white">
                        <pre className="font-mono text-xs sm:text-sm whitespace-pre-wrap text-gray-800">
                            {markdownContent || "Generating report..."}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
