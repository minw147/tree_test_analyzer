import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, Target, Activity, Plus, BarChart3, Network, ClipboardList, Settings, Eye, Database, Share2, AlertCircle } from "lucide-react";

export function Help() {
    const [activeTab, setActiveTab] = useState("analyze");
    const location = useLocation();

    // Handle hash navigation to scroll to specific sections
    useEffect(() => {
        if (location.hash) {
            // Switch to create tab if hash is present (custom-api-tools is in create tab)
            setActiveTab("create");
            
            // Small delay to ensure tab content is rendered
            setTimeout(() => {
                const element = document.getElementById(location.hash.substring(1));
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, [location.hash]);

    return (
        <div className="container mx-auto p-4 py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Documentation</h1>
                <p className="text-gray-600 text-lg">
                    Learn how to create tree tests and analyze your results effectively.
                </p>
            </div>

            <Tabs className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger
                        value="create"
                        isActive={activeTab === "create"}
                        onClick={() => setActiveTab("create")}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Create
                    </TabsTrigger>
                    <TabsTrigger
                        value="analyze"
                        isActive={activeTab === "analyze"}
                        onClick={() => setActiveTab("analyze")}
                        className="flex items-center gap-2"
                    >
                        <BarChart3 className="h-4 w-4" />
                        Analyze
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="create" activeValue={activeTab}>
                    <div className="space-y-8">
                        <section className="rounded-lg border bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                    <Plus className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Creating a Tree Test</h2>
                                    <p className="text-gray-600">Step-by-step guide to building your study</p>
                                </div>
                            </div>

                            <div className="mb-6 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-800">
                                        <p className="font-semibold mb-1">💾 Local Storage Notice</p>
                                        <p>Your study setup is automatically saved in your browser's local storage. This means:</p>
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            <li>Your work persists if you refresh the page or close the tab</li>
                                            <li>Data is stored locally on this device/browser only</li>
                                            <li>You may lose your setup if you clear browser data or use a different device</li>
                                        </ul>
                                        <p className="mt-2 font-semibold">✓ Participant responses are stored in your configured external storage (Google Sheets, webhooks, etc.) and persist independently.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-lg border bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <Network className="h-6 w-6 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-900">Step 1: Define Tree Structure</h2>
                            </div>
                            <p className="mb-4 text-gray-600">
                                Start by creating the hierarchical structure that participants will navigate. You have two options:
                            </p>

                            <div className="space-y-4">
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <h3 className="font-semibold text-blue-900 mb-2">Option 1: Paste Tree Structure</h3>
                                    <p className="text-sm text-blue-800 mb-3">
                                        Quickly create your entire tree by pasting it in one of two formats:
                                    </p>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-medium text-blue-900 mb-1">Comma format:</p>
                                            <pre className="text-xs bg-white border border-blue-200 rounded p-2 font-mono whitespace-pre">{`Home
,Products
,,Electronics
,,,Laptops
,,,Smartphones
,About Us
,Contact`}</pre>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-blue-900 mb-1">Space-indented format:</p>
                                            <pre className="text-xs bg-white border border-blue-200 rounded p-2 font-mono whitespace-pre">{`Home
  Products
    Electronics
      Laptops
      Smartphones
  About Us
  Contact`}</pre>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">Option 2: Build Manually</h3>
                                    <p className="text-sm text-gray-700 mb-3">
                                        Add nodes one at a time using the interface:
                                    </p>
                                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                                        <li>Click "Add Root Node" to create top-level items</li>
                                        <li>Use the "Child" button to add sub-items to any node</li>
                                        <li>Edit node names by clicking on them</li>
                                        <li>For leaf nodes (end points), you can optionally add a link/URL</li>
                                        <li>Delete nodes using the trash icon</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-lg border bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <ClipboardList className="h-6 w-6 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-900">Step 2: Create Tasks</h2>
                            </div>
                            <p className="mb-4 text-gray-600">
                                Define the tasks that participants will complete. Each task should describe what the participant needs to find.
                            </p>

                            <div className="space-y-4">
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">Adding Tasks</h3>
                                    <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
                                        <li><strong>Individual Add:</strong> Click "Add Task" to create tasks one at a time</li>
                                        <li><strong>Bulk Add:</strong> Use the "Bulk Add" button to paste multiple task instructions (one per line)</li>
                                        <li>Edit task descriptions by clicking on the input field</li>
                                        <li>Reorder tasks using the up/down arrow buttons</li>
                                        <li>Delete tasks using the trash icon</li>
                                    </ul>
                                </div>

                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <h3 className="font-semibold text-blue-900 mb-2">Setting Expected Paths</h3>
                                    <p className="text-sm text-blue-800 mb-2">
                                        For each task, you can define one or more correct answer paths:
                                    </p>
                                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                        <li>Click "Add Path" for the task</li>
                                        <li>Navigate through the tree structure by clicking on nodes</li>
                                        <li>The last node you click will show an "I'd find it here" button</li>
                                        <li>Click the button to confirm that path as a correct answer</li>
                                        <li>You can add multiple correct paths if there are multiple valid answers</li>
                                    </ol>
                                    <p className="text-xs text-blue-700 mt-3 italic">
                                        Note: You must create the tree structure first before you can select expected paths.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-lg border bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <Settings className="h-6 w-6 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-900">Step 3: Configure Settings</h2>
                            </div>
                            <p className="mb-4 text-gray-600">
                                Customize the messages that participants will see during the test. All fields support basic Markdown formatting.
                            </p>

                            <div className="space-y-3">
                                <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                                    <h3 className="font-semibold text-blue-900 mb-1">Welcome Message</h3>
                                    <p className="text-sm text-blue-800">
                                        Shown when participants first start the test. Use this to introduce your study and set expectations.
                                    </p>
                                </div>
                                <div className="rounded-lg border-l-4 border-green-500 bg-green-50 p-4">
                                    <h3 className="font-semibold text-green-900 mb-1">Instructions</h3>
                                    <p className="text-sm text-green-800">
                                        Explains how the tree test works. Shown after the welcome message, before participants begin tasks.
                                    </p>
                                </div>
                                <div className="rounded-lg border-l-4 border-purple-500 bg-purple-50 p-4">
                                    <h3 className="font-semibold text-purple-900 mb-1">Completion Message</h3>
                                    <p className="text-sm text-purple-800">
                                        Thank you message shown after participants complete all tasks and submit their responses.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-lg border bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <Eye className="h-6 w-6 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-900">Step 4: Preview Your Study</h2>
                            </div>
                            <p className="mb-4 text-gray-600">
                                Before sharing your study, preview it to see exactly what participants will experience.
                            </p>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                                    <li>Click the "Preview" tab</li>
                                    <li>Click "Open Preview in New Tab"</li>
                                    <li>Go through the full participant experience:
                                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                            <li>Review the welcome message</li>
                                            <li>Read the instructions</li>
                                            <li>Complete each task by navigating the tree</li>
                                            <li>Verify the completion message</li>
                                        </ul>
                                    </li>
                                </ol>
                                <p className="text-xs text-gray-600 mt-3 italic">
                                    The preview shows a banner indicating it's in preview mode and not collecting responses.
                                </p>
                            </div>
                        </section>

                        <section className="rounded-lg border bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <Database className="h-6 w-6 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-900">Step 5: Configure Data Storage</h2>
                            </div>
                            <p className="mb-4 text-gray-600">
                                Choose where participant responses will be stored. You have four options:
                            </p>
                            <div className="space-y-3">
                                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                    <h3 className="font-semibold text-green-900 mb-1">Hosted Backend</h3>
                                    <p className="text-sm text-green-800">
                                        Secure, managed storage with dashboard and analytics. Recommended for production use.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <h3 className="font-semibold text-blue-900 mb-1">Google Sheets</h3>
                                    <p className="text-sm text-blue-800">
                                        Store results directly in Google Sheets. Easy setup, free to use. Two methods available: Apps Script (recommended) or OAuth API (advanced).
                                    </p>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                    <h3 className="font-semibold text-gray-900 mb-1">Custom API</h3>
                                    <p className="text-sm text-gray-700">
                                        Connect to your own server or database. Free and flexible - bring your own backend infrastructure.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                    <h3 className="font-semibold text-yellow-900 mb-1">Local Download</h3>
                                    <p className="text-sm text-yellow-800">
                                        Participants download their responses as an Excel file. Useful for testing or when you don't have external storage set up.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section id="google-sheets-setup" className="rounded-lg border bg-white p-8 shadow-sm scroll-mt-8">
                            <div className="mb-6 flex items-center gap-3">
                                <Database className="h-6 w-6 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-900">Google Sheets Setup Guide</h2>
                            </div>
                            <p className="mb-4 text-gray-600">
                                Google Sheets integration offers two setup methods. Choose the one that works best for you.
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Method 1: Apps Script (Recommended)</h3>
                                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                        <p className="text-sm text-green-800 mb-3">
                                            <strong>Best for:</strong> Most users. No coding required, easy one-click setup.
                                        </p>
                                        <ol className="text-sm text-green-800 space-y-2 list-decimal list-inside">
                                            <li><strong>Create a Google Sheet:</strong> Create a new Google Sheet or use an existing one for your results.</li>
                                            <li><strong>Open Apps Script Editor:</strong> 
                                                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                    <li>In your Google Sheet, go to <strong>Extensions → Apps Script</strong></li>
                                                    <li>This opens the Apps Script editor in a new tab</li>
                                                </ul>
                                            </li>
                                            <li><strong>Install the Script:</strong>
                                                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                    <li>Delete any existing code in the editor</li>
                                                    <li>In the Tree Test Creator, go to Storage tab → Google Sheets → click "Show Script"</li>
                                                    <li>Click "Copy Script" to copy the entire script</li>
                                                    <li>Paste the script into the Apps Script editor</li>
                                                    <li>Click <strong>Save</strong> (or press Ctrl+S / Cmd+S)</li>
                                                </ul>
                                            </li>
                                            <li><strong>Deploy as Web App:</strong>
                                                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                    <li>Click <strong>Deploy → New deployment</strong></li>
                                                    <li>Click the <strong>gear icon (⚙️)</strong> next to "Select type"</li>
                                                    <li>Choose <strong>"Web app"</strong> from the dropdown</li>
                                                    <li>In the Configuration tab, set the following:
                                                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                                                            <li><strong>Description:</strong> Enter a description (e.g., "Tree Test Results Webhook")</li>
                                                            <li><strong>Execute as:</strong> Keep "Me (your-email@gmail.com)" - this is correct</li>
                                                            <li><strong>Who has access:</strong> <strong className="text-red-600">IMPORTANT:</strong> Change this to <strong>"Anyone"</strong> (not "Only myself")</li>
                                                        </ul>
                                                    </li>
                                                    <li>Click <strong>Deploy</strong></li>
                                                    <li>Google will show a dialog with your Web app URL - <strong>copy this URL</strong></li>
                                                    <li>The URL looks like: <code className="text-xs bg-white px-1 py-0.5 rounded">https://script.google.com/macros/s/ABC123.../exec</code></li>
                                                </ul>
                                            </li>
                                            <li><strong>Configure in Creator:</strong> 
                                                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                    <li>Go back to the Tree Test Creator Storage configuration</li>
                                                    <li>Paste the webhook URL into the "Webhook URL" field</li>
                                                </ul>
                                            </li>
                                            <li><strong>Test Connection:</strong> Click "Test Connection" to verify it works</li>
                                        </ol>
                                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                            <p className="text-xs text-yellow-800 font-semibold mb-1">⚠️ Important Note:</p>
                                            <p className="text-xs text-yellow-700">
                                                You <strong>must</strong> set "Who has access" to <strong>"Anyone"</strong> for the webhook to work. 
                                                If you set it to "Only myself", the Tree Test app won't be able to send data to your sheet.
                                            </p>
                                        </div>
                                        <p className="text-xs text-green-700 mt-3 italic">
                                            The Apps Script automatically creates the correct column headers and appends participant results as new rows.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Method 2: OAuth API (Advanced)</h3>
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <p className="text-sm text-blue-800 mb-3">
                                            <strong>Best for:</strong> Advanced users who want direct API access and more control.
                                        </p>
                                        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                                            <li><strong>Create Google Cloud Project:</strong>
                                                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                    <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                                                    <li>Create a new project or select existing one</li>
                                                    <li>Enable Google Sheets API</li>
                                                </ul>
                                            </li>
                                            <li><strong>Configure OAuth:</strong>
                                                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                    <li>Create OAuth 2.0 credentials</li>
                                                    <li>Add authorized redirect URIs</li>
                                                    <li>Copy Client ID and Client Secret</li>
                                                </ul>
                                            </li>
                                            <li><strong>Connect in Creator:</strong>
                                                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                    <li>Click "Connect to Google"</li>
                                                    <li>Authorize the app to access your Google Sheets</li>
                                                    <li>Enter your Google Sheet ID (from the sheet URL)</li>
                                                    <li>Optionally specify sheet tab name</li>
                                                </ul>
                                            </li>
                                        </ol>
                                        <p className="text-xs text-blue-700 mt-3 italic">
                                            OAuth API provides direct access to Google Sheets API with full read/write capabilities.
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                                    <h4 className="font-semibold text-blue-900 mb-2">Getting Your Sheet ID</h4>
                                    <p className="text-sm text-blue-800 mb-2">
                                        Your Google Sheet ID is found in the sheet URL:
                                    </p>
                                    <p className="text-xs text-blue-700 font-mono bg-white p-2 rounded border border-blue-200">
                                        https://docs.google.com/spreadsheets/d/<strong className="text-blue-900">[SHEET_ID]</strong>/edit
                                    </p>
                                    <p className="text-xs text-blue-600 mt-2">
                                        Copy the long string between <code>/d/</code> and <code>/edit</code>.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section id="custom-api-tools" className="rounded-lg border bg-white p-8 shadow-sm scroll-mt-8">
                            <div className="mb-6 flex items-center gap-3">
                                <Network className="h-6 w-6 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-900">Custom API: Tools & Platforms</h2>
                            </div>
                            <p className="mb-4 text-gray-600">
                                If you're using the Custom API option, you'll need a backend that implements the required REST API endpoints. Here are recommended tools and platforms you can use:
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">No-Code / Low-Code Platforms</h3>
                                    <div className="space-y-3">
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">Supabase</h4>
                                            <p className="text-sm text-blue-800 mb-2">
                                                PostgreSQL database with auto-generated REST API. PostgREST automatically creates REST endpoints from your database schema.
                                            </p>
                                            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                                                <li>Free tier available</li>
                                                <li>Auto-generates REST endpoints</li>
                                                <li>Built-in authentication (JWT)</li>
                                                <li>Setup: Create tables, endpoints are auto-generated</li>
                                            </ul>
                                        </div>
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">Airtable</h4>
                                            <p className="text-sm text-blue-800 mb-2">
                                                Spreadsheet-like interface with built-in REST API. Perfect if you prefer a visual database.
                                            </p>
                                            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                                                <li>Free tier available</li>
                                                <li>Built-in REST API</li>
                                                <li>API key authentication</li>
                                                <li>Setup: Create base with tables, use Airtable's REST API</li>
                                            </ul>
                                        </div>
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">n8n (Self-hosted or Cloud)</h4>
                                            <p className="text-sm text-blue-800 mb-2">
                                                Workflow automation platform that can create HTTP endpoints. Visual workflow builder for API logic.
                                            </p>
                                            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                                                <li>Free self-hosted option</li>
                                                <li>Create webhooks/HTTP endpoints</li>
                                                <li>Visual workflow builder</li>
                                                <li>Setup: Create workflows that respond to HTTP requests</li>
                                            </ul>
                                        </div>
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                            <h4 className="font-semibold text-blue-900 mb-2">Firebase (Google)</h4>
                                            <p className="text-sm text-blue-800 mb-2">
                                                Firestore database with REST API and Cloud Functions for custom endpoints.
                                            </p>
                                            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                                                <li>Free tier available</li>
                                                <li>Firestore REST API + Cloud Functions</li>
                                                <li>Built-in authentication</li>
                                                <li>Setup: Use Firestore REST API + Cloud Functions</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Serverless Platforms</h3>
                                    <div className="space-y-3">
                                        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                                            <h4 className="font-semibold text-purple-900 mb-2">Vercel Serverless Functions</h4>
                                            <p className="text-sm text-purple-800 mb-2">
                                                Deploy Node.js/Python functions as API endpoints. Great for quick deployment.
                                            </p>
                                            <ul className="text-xs text-purple-700 space-y-1 list-disc list-inside">
                                                <li>Free tier available</li>
                                                <li>Easy deployment</li>
                                                <li>Setup: Create API route files, deploy</li>
                                            </ul>
                                        </div>
                                        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                                            <h4 className="font-semibold text-purple-900 mb-2">Netlify Functions</h4>
                                            <p className="text-sm text-purple-800 mb-2">
                                                Similar to Vercel, deploy serverless functions as API endpoints.
                                            </p>
                                            <ul className="text-xs text-purple-700 space-y-1 list-disc list-inside">
                                                <li>Free tier available</li>
                                                <li>Easy deployment</li>
                                                <li>Setup: Create functions, deploy</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Code-Based Solutions</h3>
                                    <div className="space-y-3">
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <h4 className="font-semibold text-gray-900 mb-2">Express.js (Node.js)</h4>
                                            <p className="text-sm text-gray-700 mb-2">
                                                Quick REST API setup. Can deploy to Railway, Render, Fly.io, or any Node.js host.
                                            </p>
                                            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                                <li>Full control over API logic</li>
                                                <li>Use test-server.js as a starting point</li>
                                                <li>Deploy to any Node.js hosting service</li>
                                            </ul>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <h4 className="font-semibold text-gray-900 mb-2">FastAPI (Python)</h4>
                                            <p className="text-sm text-gray-700 mb-2">
                                                Fast REST API framework with auto-generated API documentation.
                                            </p>
                                            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                                <li>Auto-generates API docs</li>
                                                <li>Fast and modern</li>
                                                <li>Deploy to any Python host</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                                    <h4 className="font-semibold text-blue-900 mb-2">Required API Endpoints</h4>
                                    <p className="text-sm text-blue-800 mb-2">
                                        Your Custom API must implement these REST endpoints:
                                    </p>
                                    <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside font-mono">
                                        <li>GET /health - Health check (for connection testing)</li>
                                        <li>POST /studies - Create new study</li>
                                        <li>PUT /studies/:id - Update study configuration</li>
                                        <li>GET /studies/:id - Fetch study configuration</li>
                                        <li>GET /studies/:id/status - Check study status</li>
                                        <li>PUT /studies/:id/status - Update study status (active/closed)</li>
                                        <li>POST /studies/:id/results - Submit participant results</li>
                                    </ul>
                                    <p className="text-xs text-blue-600 mt-3 italic">
                                        See the test-server.js file in the project for a complete reference implementation.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-lg border bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <Share2 className="h-6 w-6 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-900">Step 6: Export & Share</h2>
                            </div>
                            <p className="mb-4 text-gray-600">
                                Once your study is ready, export it to share with participants.
                            </p>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <p className="text-sm text-gray-700 mb-2">
                                    Export options (coming soon):
                                </p>
                                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                                    <li><strong>Shareable Link:</strong> Generate a URL with embedded study configuration</li>
                                    <li><strong>Download JSON:</strong> Save your study configuration as a file</li>
                                    <li><strong>QR Code:</strong> Generate a QR code for easy mobile testing</li>
                                </ul>
                            </div>
                        </section>

                        <section className="rounded-lg border bg-white p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Tips & Best Practices</h2>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Tree Structure</h3>
                                        <p className="text-sm text-gray-600">
                                            Keep your tree structure clear and logical. Use consistent naming conventions and avoid overly deep hierarchies (3-4 levels is ideal).
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Task Writing</h3>
                                        <p className="text-sm text-gray-600">
                                            Write tasks in plain language that participants would naturally use. Avoid using the exact labels from your tree structure.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Expected Paths</h3>
                                        <p className="text-sm text-gray-600">
                                            Define expected paths for accurate analysis. If multiple paths are valid, add them all to get comprehensive insights.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Preview Before Sharing</h3>
                                        <p className="text-sm text-gray-600">
                                            Always preview your study to catch any issues before participants take the test. Check that all tasks work correctly and messages are clear.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </TabsContent>

                <TabsContent value="analyze" activeValue={activeTab}>
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
                            <h2 className="mb-6 text-xl font-bold text-gray-900">Metric Benchmarks</h2>
                            <p className="mb-4 text-gray-600">
                                The following benchmarks are used to color-code <strong>Success Rate</strong>, <strong>Directness</strong>, and <strong>Overall Score</strong> to help you quickly identify performance levels:
                            </p>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-lg border bg-white p-4 text-center">
                                    <div className="mb-2 text-2xl font-bold text-green-600">≥ 80%</div>
                                    <div className="font-medium text-gray-900">Excellent</div>
                                    <p className="text-xs text-gray-500">High performance</p>
                                </div>
                                <div className="rounded-lg border bg-white p-4 text-center">
                                    <div className="mb-2 text-2xl font-bold text-orange-500">60% - 79%</div>
                                    <div className="font-medium text-gray-900">Average</div>
                                    <p className="text-xs text-gray-500">Needs improvement</p>
                                </div>
                                <div className="rounded-lg border bg-white p-4 text-center">
                                    <div className="mb-2 text-2xl font-bold text-red-600">&lt; 60%</div>
                                    <div className="font-medium text-gray-900">Poor</div>
                                    <p className="text-xs text-gray-500">Critical issues</p>
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
                </TabsContent>
            </Tabs>
        </div>
    );
}
