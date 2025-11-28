import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, Target, Activity, Plus, BarChart3, Network, ClipboardList, Settings, Eye, Database, Share2, AlertCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function Help() {
    const [activeTab, setActiveTab] = useState("analyze");
    const location = useLocation();
    const [showSupabaseGuide, setShowSupabaseGuide] = useState(false);
    const [showSupabaseScript, setShowSupabaseScript] = useState(false);
    const [supabaseScriptCopied, setSupabaseScriptCopied] = useState(false);
    const supabaseGuideRef = useRef<HTMLDivElement>(null);
    const [showAppsScriptGuide, setShowAppsScriptGuide] = useState(false);
    const [showOAuthGuide, setShowOAuthGuide] = useState(false);

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

    // Get Supabase SQL script content
    const getSupabaseScriptContent = (): string => {
        return `-- Supabase Database Functions for Tree Test Suite
-- Copy and paste this entire script into Supabase SQL Editor

-- Function to get study status
CREATE OR REPLACE FUNCTION get_study_status(study_id_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  study_config JSONB;
  access_status TEXT;
BEGIN
  SELECT config INTO study_config
  FROM studies
  WHERE id = study_id_param;
  
  IF study_config IS NULL THEN
    RETURN json_build_object('status', 'not-found');
  END IF;
  
  access_status := study_config->>'accessStatus';
  
  IF access_status IS NULL THEN
    access_status := 'active';
  END IF;
  
  RETURN json_build_object('status', access_status);
END;
$$;

-- Function to update study status
CREATE OR REPLACE FUNCTION update_study_status(study_id_param TEXT, new_status TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  study_config JSONB;
  updated_config JSONB;
BEGIN
  SELECT config INTO study_config
  FROM studies
  WHERE id = study_id_param;
  
  IF study_config IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Study not found');
  END IF;
  
  -- Update accessStatus in config
  updated_config := jsonb_set(
    study_config,
    '{accessStatus}',
    to_jsonb(new_status)
  );
  
  -- Update closedAt if closing
  IF new_status = 'closed' THEN
    updated_config := jsonb_set(
      updated_config,
      '{closedAt}',
      to_jsonb(now()::text)
    );
  ELSIF new_status = 'active' THEN
    updated_config := updated_config - 'closedAt';
  END IF;
  
  -- Save updated config
  UPDATE studies
  SET config = updated_config,
      updated_at = now()
  WHERE id = study_id_param;
  
  RETURN json_build_object('success', true);
END;
$$;`;
    };

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
                                {/* Method 1: Apps Script Card */}
                                <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6">
                                    <div className="flex items-start gap-3 mb-4">
                                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-semibold text-green-900">Method 1: Apps Script (Recommended)</h3>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowAppsScriptGuide(!showAppsScriptGuide)}
                                                    className="text-xs"
                                                >
                                                    {showAppsScriptGuide ? 'Hide' : 'Show'} Setup Guide
                                                </Button>
                                            </div>
                                            <p className="text-sm text-green-800 mb-3">
                                                <strong>Best for:</strong> Most users. No coding required, easy one-click setup.
                                            </p>
                                            <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
                                                <li>Free and easy to set up</li>
                                                <li>No Google Cloud Console configuration needed</li>
                                                <li>Automatic column header creation</li>
                                                <li>Supports multiple studies with same or different sheets</li>
                                            </ul>
                                            
                                            {showAppsScriptGuide && (
                                                <div className="bg-white rounded-lg p-6 mt-4 border border-green-200 space-y-4">
                                                    <h4 className="font-semibold text-green-900 mb-4 text-base">Complete Step-by-Step Setup:</h4>
                                                    <ol className="text-sm text-green-800 space-y-4 list-decimal list-inside">
                                                        <li>
                                                            <strong>Create a Google Sheet:</strong>
                                                            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                <li>Create a new Google Sheet or use an existing one for your results</li>
                                                                <li>Name it something memorable (e.g., "Tree Test Results")</li>
                                                            </ul>
                                                        </li>
                                                        <li>
                                                            <strong>Open Apps Script Editor:</strong>
                                                            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                <li>In your Google Sheet, go to <strong>Extensions → Apps Script</strong></li>
                                                                <li>This opens the Apps Script editor in a new tab</li>
                                                            </ul>
                                                        </li>
                                                        <li>
                                                            <strong>Install the Script:</strong>
                                                            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                <li>Delete any existing code in the editor</li>
                                                                <li>In the Tree Test Creator, go to Storage tab → Google Sheets → click "Show Script"</li>
                                                                <li>Click "Copy Script" to copy the entire script</li>
                                                                <li>Paste the script into the Apps Script editor</li>
                                                                <li>Click <strong>Save</strong> (or press Ctrl+S / Cmd+S)</li>
                                                                <li><strong>IMPORTANT:</strong> Wait for "Saved" confirmation before proceeding</li>
                                                            </ul>
                                                        </li>
                                                        <li>
                                                            <strong>Deploy as Web App:</strong>
                                                            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                <li>Click <strong>Deploy → New deployment</strong></li>
                                                                <li>Click the <strong>gear icon (⚙️)</strong> next to "Select type"</li>
                                                                <li>Choose <strong>"Web app"</strong> from the dropdown</li>
                                                                <li>In the Configuration tab, set the following:
                                                                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                                        <li><strong>Description:</strong> Enter a description (e.g., "Tree Test Results Webhook")</li>
                                                                        <li><strong>Execute as:</strong> Keep "Me (your-email@gmail.com)" - this is correct</li>
                                                                        <li><strong>Who has access:</strong> <strong className="text-red-600">IMPORTANT:</strong> Change this to <strong>"Anyone"</strong> (not "Only myself")</li>
                                                                    </ul>
                                                                </li>
                                                                <li>Click <strong>Deploy</strong></li>
                                                                <li>Google will show a dialog with your Web app URL - <strong>copy this URL</strong></li>
                                                                <li>The URL looks like: <code className="text-xs bg-green-100 px-1 py-0.5 rounded">https://script.google.com/macros/s/ABC123.../exec</code></li>
                                                            </ul>
                                                        </li>
                                                        <li>
                                                            <strong>Configure in Creator:</strong>
                                                            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                <li>Go back to the Tree Test Creator Storage configuration</li>
                                                                <li>Select "Google Sheets" → "Apps Script (Recommended)"</li>
                                                                <li>Paste the webhook URL into the "Webhook URL" field</li>
                                                            </ul>
                                                        </li>
                                                        <li>
                                                            <strong>Test Connection:</strong> Click "Test Connection" to verify it works
                                                        </li>
                                                    </ol>
                                                    
                                                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                                        <p className="text-xs text-yellow-800 font-semibold mb-1">⚠️ Important Note:</p>
                                                        <p className="text-xs text-yellow-700">
                                                            You <strong>must</strong> set "Who has access" to <strong>"Anyone"</strong> for the webhook to work. 
                                                            If you set it to "Only myself", the Tree Test app won't be able to send data to your sheet.
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="mt-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                                                        <h5 className="font-semibold text-blue-900 mb-2 text-sm">Using Multiple Studies with Google Sheets</h5>
                                                        <p className="text-sm text-blue-800 mb-3">
                                                            You can use the same Google Sheet and webhook URL for multiple studies, or use separate sheets for each study.
                                                        </p>
                                                        
                                                        <div className="space-y-3">
                                                            <div className="bg-white rounded p-3 border border-blue-200">
                                                                <h6 className="font-semibold text-blue-900 mb-1 text-xs">Option 1: Same Sheet, Same Webhook URL</h6>
                                                                <p className="text-xs text-blue-800 mb-2">
                                                                    <strong>Use this when:</strong> You want all studies to write to the same Google Sheet.
                                                                </p>
                                                                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                                                                    <li>Install the Apps Script once in your Google Sheet</li>
                                                                    <li>Deploy it and get the webhook URL</li>
                                                                    <li>Use the <strong>same webhook URL</strong> for all studies that should use this sheet</li>
                                                                    <li>All results will append to the same <code className="bg-blue-100 px-1 rounded">Results</code> tab</li>
                                                                    <li>Each study's configuration is stored separately in the <code className="bg-blue-100 px-1 rounded">StudyConfigs</code> tab</li>
                                                                </ul>
                                                            </div>
                                                            
                                                            <div className="bg-white rounded p-3 border border-blue-200">
                                                                <h6 className="font-semibold text-blue-900 mb-1 text-xs">Option 2: Different Sheets, Different Webhook URLs</h6>
                                                                <p className="text-xs text-blue-800 mb-2">
                                                                    <strong>Use this when:</strong> You want each study to write to its own separate Google Sheet.
                                                                </p>
                                                                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                                                                    <li>Create a separate Google Sheet for each study (or group of studies)</li>
                                                                    <li>Install the Apps Script in each sheet separately</li>
                                                                    <li>Deploy each script and get its unique webhook URL</li>
                                                                    <li>Configure each study with its corresponding webhook URL</li>
                                                                    <li>Results will be isolated in their respective sheets</li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-4 rounded-lg border-l-4 border-purple-500 bg-purple-50 p-4">
                                                        <h5 className="font-semibold text-purple-900 mb-2 text-sm">Managing Study Status in Google Sheets</h5>
                                                        <p className="text-sm text-purple-800 mb-3">
                                                            If you need to close or reopen a study but don't have access to the Tree Test Creator, you can manually edit the study configuration directly in Google Sheets.
                                                        </p>
                                                        
                                                        <div className="bg-white rounded p-3 border border-purple-200">
                                                            <h6 className="font-semibold text-purple-900 mb-2 text-xs">How to Close/Reopen a Study Manually:</h6>
                                                            <ol className="text-xs text-purple-800 space-y-2 list-decimal list-inside">
                                                                <li><strong>Open your Google Sheet</strong> (the one with the Apps Script installed)</li>
                                                                <li><strong>Go to the <code className="bg-purple-100 px-1 rounded">StudyConfigs</code> tab</strong></li>
                                                                <li><strong>Find your study:</strong> Column A contains Study ID, Column B contains JSON config</li>
                                                                <li><strong>Edit the JSON in Column B:</strong> Find <code className="bg-purple-100 px-1 rounded">"accessStatus"</code> and change to <code className="bg-purple-100 px-1 rounded">"closed"</code> or <code className="bg-purple-100 px-1 rounded">"active"</code></li>
                                                                <li><strong>Save the changes</strong> in Google Sheets</li>
                                                            </ol>
                                                        </div>
                                                    </div>
                                                    
                                                    <p className="text-xs text-green-700 mt-4 italic">
                                                        The Apps Script automatically creates the correct column headers and appends participant results as new rows.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Method 2: OAuth API Card */}
                                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                                    <div className="flex items-start gap-3 mb-4">
                                        <Database className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-semibold text-blue-900">Method 2: OAuth API (Advanced)</h3>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowOAuthGuide(!showOAuthGuide)}
                                                    className="text-xs"
                                                >
                                                    {showOAuthGuide ? 'Hide' : 'Show'} Setup Guide
                                                </Button>
                                            </div>
                                            <p className="text-sm text-blue-800 mb-3">
                                                <strong>Best for:</strong> Advanced users who want direct API access and more control.
                                            </p>
                                            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                                                <li>Direct access to Google Sheets API</li>
                                                <li>More control over data structure</li>
                                                <li>Requires Google Cloud Console setup</li>
                                                <li>OAuth 2.0 authentication required</li>
                                            </ul>
                                            
                                            {showOAuthGuide && (
                                                <div className="bg-white rounded-lg p-6 mt-4 border border-blue-200 space-y-4">
                                                    <h4 className="font-semibold text-blue-900 mb-4 text-base">Complete Step-by-Step Setup:</h4>
                                                    <ol className="text-sm text-blue-800 space-y-4 list-decimal list-inside">
                                                        <li>
                                                            <strong>Create Google Cloud Project:</strong>
                                                            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-700">Google Cloud Console</a></li>
                                                                <li>Create a new project or select existing one</li>
                                                                <li>Enable Google Sheets API</li>
                                                            </ul>
                                                        </li>
                                                        <li>
                                                            <strong>Configure OAuth:</strong>
                                                            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                <li>Create OAuth 2.0 credentials</li>
                                                                <li>Add authorized redirect URIs</li>
                                                                <li>Copy Client ID and Client Secret</li>
                                                            </ul>
                                                        </li>
                                                        <li>
                                                            <strong>Connect in Creator:</strong>
                                                            <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                <li>Click "Connect to Google"</li>
                                                                <li>Authorize the app to access your Google Sheets</li>
                                                                <li>Enter your Google Sheet ID (from the sheet URL)</li>
                                                                <li>Optionally specify sheet tab name</li>
                                                            </ul>
                                                        </li>
                                                    </ol>
                                                    
                                                    <div className="mt-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                                                        <h5 className="font-semibold text-blue-900 mb-2 text-sm">Getting Your Sheet ID</h5>
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
                                                    
                                                    <p className="text-xs text-blue-700 mt-4 italic">
                                                        OAuth API provides direct access to Google Sheets API with full read/write capabilities.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
                                {/* Supabase - Ready to Use */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">✅ Ready to Use (No Middleware Required)</h3>
                                    <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6">
                                        <div className="flex items-start gap-3 mb-4">
                                            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-green-900 text-lg">Supabase</h4>
                                                    <div className="relative" ref={supabaseGuideRef}>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setShowSupabaseGuide(!showSupabaseGuide)}
                                                            className="text-xs"
                                                        >
                                                            {showSupabaseGuide ? 'Hide' : 'Show'} Setup Guide
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-green-800 mb-4">
                                                    PostgreSQL database with auto-generated REST API. PostgREST automatically creates REST endpoints from your database schema. <strong>No middleware required!</strong>
                                                </p>
                                                
                                                {showSupabaseGuide && (
                                                    <div className="bg-white rounded-lg p-6 mb-4 border border-green-200 space-y-4">
                                                        <h5 className="font-semibold text-green-900 mb-4 text-base">Complete Step-by-Step Setup:</h5>
                                                        <ol className="text-sm text-green-800 space-y-4 list-decimal list-inside">
                                                            <li>
                                                                <strong>Create a Supabase Project:</strong>
                                                                <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                    <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-700">supabase.com</a> and sign up</li>
                                                                    <li>Click "New Project"</li>
                                                                    <li>Fill in project name, database password, and region</li>
                                                                    <li>Click "Create new project" and wait 2-3 minutes for provisioning</li>
                                                                </ul>
                                                            </li>
                                                            <li>
                                                                <strong>Create the Studies Table:</strong>
                                                                <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                    <li>In Supabase dashboard, go to "Table Editor" (left sidebar)</li>
                                                                    <li>Click "New Table"</li>
                                                                    <li>Name: <code className="bg-green-100 px-1 rounded">studies</code></li>
                                                                    <li>Click "Save"</li>
                                                                    <li>Add these columns:
                                                                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                                            <li><code className="bg-green-100 px-1 rounded">id</code> - Type: Text, Primary Key: ✓, Required: ✓</li>
                                                                            <li><code className="bg-green-100 px-1 rounded">config</code> - Type: JSONB, Required: ✓</li>
                                                                            <li><code className="bg-green-100 px-1 rounded">created_at</code> - Type: Timestamp, Default: <code className="bg-green-100 px-1 rounded">now()</code></li>
                                                                            <li><code className="bg-green-100 px-1 rounded">updated_at</code> - Type: Timestamp, Default: <code className="bg-green-100 px-1 rounded">now()</code></li>
                                                                        </ul>
                                                                    </li>
                                                                    <li>Click "Save"</li>
                                                                </ul>
                                                            </li>
                                                            <li>
                                                                <strong>Create the Results Table:</strong>
                                                                <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                    <li>Click "New Table" again</li>
                                                                    <li>Name: <code className="bg-green-100 px-1 rounded">results</code></li>
                                                                    <li>Click "Save"</li>
                                                                    <li>Add these columns:
                                                                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                                            <li><code className="bg-green-100 px-1 rounded">id</code> - Type: UUID, Primary Key: ✓, Default: <code className="bg-green-100 px-1 rounded">gen_random_uuid()</code></li>
                                                                            <li><code className="bg-green-100 px-1 rounded">study_id</code> - Type: Text, Required: ✓</li>
                                                                            <li><code className="bg-green-100 px-1 rounded">result_data</code> - Type: JSONB, Required: ✓</li>
                                                                            <li><code className="bg-green-100 px-1 rounded">created_at</code> - Type: Timestamp, Default: <code className="bg-green-100 px-1 rounded">now()</code></li>
                                                                        </ul>
                                                                    </li>
                                                                    <li>Click "Save"</li>
                                                                </ul>
                                                            </li>
                                                            <li>
                                                                <strong>Configure Row Level Security (RLS):</strong>
                                                                <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                    <li>Go to "Authentication" → "Policies" (left sidebar)</li>
                                                                    <li><strong>For <code className="bg-green-100 px-1 rounded">studies</code> table:</strong>
                                                                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                                            <li>Enable RLS: Toggle "Enable Row Level Security"</li>
                                                                            <li>Click "New Policy"</li>
                                                                            <li>Name: "Allow public read and write"</li>
                                                                            <li>Allowed operation: SELECT, INSERT, UPDATE</li>
                                                                            <li>Policy definition: <code className="bg-green-100 px-1 rounded">true</code></li>
                                                                            <li>Click "Review" → "Save policy"</li>
                                                                        </ul>
                                                                    </li>
                                                                    <li><strong>For <code className="bg-green-100 px-1 rounded">results</code> table:</strong>
                                                                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                                            <li>Enable RLS: Toggle "Enable Row Level Security"</li>
                                                                            <li>Click "New Policy"</li>
                                                                            <li>Name: "Allow public insert and read"</li>
                                                                            <li>Allowed operation: SELECT, INSERT</li>
                                                                            <li>Policy definition: <code className="bg-green-100 px-1 rounded">true</code></li>
                                                                            <li>Click "Review" → "Save policy"</li>
                                                                        </ul>
                                                                    </li>
                                                                </ul>
                                                            </li>
                                                            <li>
                                                                <strong>Create Database Functions (Required for Status Endpoints):</strong>
                                                                <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                    <li>Go to "SQL Editor" (left sidebar)</li>
                                                                    <li>Click "New Query"</li>
                                                                    <li>Click "Show Script" below to view the SQL code</li>
                                                                    <li>Copy the entire script and paste it into the SQL Editor</li>
                                                                    <li>Click "Run" (or press Ctrl+Enter)</li>
                                                                    <li>You should see "Success. No rows returned" - this means the functions were created successfully</li>
                                                                </ul>
                                                                <div className="mt-3 ml-6">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => setShowSupabaseScript(!showSupabaseScript)}
                                                                            className="text-xs"
                                                                        >
                                                                            {showSupabaseScript ? 'Hide' : 'Show'} Script
                                                                        </Button>
                                                                        {showSupabaseScript && (
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={async () => {
                                                                                    const scriptContent = getSupabaseScriptContent();
                                                                                    await navigator.clipboard.writeText(scriptContent);
                                                                                    setSupabaseScriptCopied(true);
                                                                                    setTimeout(() => setSupabaseScriptCopied(false), 2000);
                                                                                }}
                                                                                className="gap-2 text-xs"
                                                                            >
                                                                                {supabaseScriptCopied ? (
                                                                                    <>
                                                                                        <Check className="h-4 w-4" />
                                                                                        Copied!
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Copy className="h-4 w-4" />
                                                                                        Copy Script
                                                                                    </>
                                                                                )}
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                    {showSupabaseScript && (
                                                                        <div className="relative">
                                                                            <Textarea
                                                                                readOnly
                                                                                value={getSupabaseScriptContent()}
                                                                                className="font-mono text-xs min-h-[300px] max-h-[500px] overflow-auto"
                                                                                onClick={(e) => {
                                                                                    (e.target as HTMLTextAreaElement).select();
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </li>
                                                            <li>
                                                                <strong>Get Your API URL and Key:</strong>
                                                                <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                    <li>Go to "Settings" → "API" (left sidebar)</li>
                                                                    <li>Copy your "Project URL" (e.g., <code className="bg-green-100 px-1 rounded">https://xxxxx.supabase.co</code>)</li>
                                                                    <li>Copy your "anon" public key (the long string starting with <code className="bg-green-100 px-1 rounded">eyJ...</code>)</li>
                                                                </ul>
                                                            </li>
                                                            <li>
                                                                <strong>Configure in Tree Test Suite:</strong>
                                                                <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-xs">
                                                                    <li>In your deployed app, go to Settings (gear icon) or open a study → Storage tab</li>
                                                                    <li>Select "Custom API"</li>
                                                                    <li>Enter API Endpoint URL: <code className="bg-green-100 px-1 rounded">https://xxxxx.supabase.co/rest/v1</code> (add <code className="bg-green-100 px-1 rounded">/rest/v1</code> to your Project URL)</li>
                                                                    <li>Select authentication: "API Key Header"</li>
                                                                    <li>Enter API Key: Paste your "anon" public key</li>
                                                                    <li>Click "Test Connection" to verify</li>
                                                                </ul>
                                                            </li>
                                                        </ol>
                                                        
                                                        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded">
                                                            <h6 className="font-semibold text-blue-900 mb-2 text-sm">Important Notes:</h6>
                                                            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                                                                <li>Make sure to add <code className="bg-blue-100 px-1 rounded">/rest/v1</code> to your Supabase Project URL when configuring</li>
                                                                <li>The SQL functions are required for status endpoints to work correctly</li>
                                                                <li>For production use, consider using "service_role" key instead of "anon" key for better security</li>
                                                                <li>Free tier includes 500MB database and 2GB bandwidth</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                )}

                                                <ul className="text-xs text-green-700 space-y-1 list-disc list-inside mt-4">
                                                    <li>Free tier available (500MB database, 2GB bandwidth)</li>
                                                    <li>Auto-generates REST endpoints via PostgREST</li>
                                                    <li>Built-in authentication (JWT)</li>
                                                    <li>Real-time subscriptions available</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Platforms Requiring Middleware */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">⚠️ Requires Middleware/Configuration</h3>
                                    <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 mb-4">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-amber-900 mb-2">Why Middleware is Needed</h4>
                                                <p className="text-sm text-amber-800 mb-2">
                                                    These platforms have their own API structure that doesn't match our required endpoints. You'll need to create a middleware layer (a small API server) that:
                                                </p>
                                                <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside ml-4">
                                                    <li>Receives requests in our format (e.g., <code className="bg-amber-100 px-1 rounded">GET /studies/:id</code>)</li>
                                                    <li>Translates them to the platform's API format</li>
                                                    <li>Returns responses in our expected format</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                            <h4 className="font-semibold text-amber-900 mb-2">Airtable</h4>
                                            <p className="text-sm text-amber-800 mb-2">
                                                Spreadsheet-like interface with built-in REST API. <strong>Requires middleware</strong> because Airtable uses base/table/record structure instead of REST endpoints.
                                            </p>
                                            <div className="bg-white rounded-lg p-3 mt-3 border border-amber-200">
                                                <p className="text-xs text-amber-800 mb-2"><strong>Why middleware:</strong> Airtable's API uses <code className="bg-amber-100 px-1 rounded">/v0/{'{'}baseId{'}'}/{'{'}tableName{'}'}</code> format, not <code className="bg-amber-100 px-1 rounded">/studies/:id</code>.</p>
                                                <p className="text-xs text-amber-800 mb-2"><strong>Solution:</strong> Deploy a middleware server (see "Creating Middleware" section below) that translates between our API format and Airtable's format.</p>
                                            </div>
                                            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside mt-3">
                                                <li>Free tier available (1,200 records/base)</li>
                                                <li>Built-in REST API with different structure</li>
                                                <li>API key authentication</li>
                                            </ul>
                                        </div>

                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                            <h4 className="font-semibold text-amber-900 mb-2">n8n (Self-hosted or Cloud)</h4>
                                            <p className="text-sm text-amber-800 mb-2">
                                                Workflow automation platform that can create HTTP endpoints. <strong>Requires workflow configuration</strong> to match our API endpoints.
                                            </p>
                                            <div className="bg-white rounded-lg p-3 mt-3 border border-amber-200">
                                                <p className="text-xs text-amber-800 mb-2"><strong>Why configuration:</strong> You need to create separate workflows for each endpoint (GET /studies/:id, POST /studies, etc.) and configure them to match our API structure.</p>
                                                <p className="text-xs text-amber-800 mb-2"><strong>Solution:</strong> Create workflows in n8n for each required endpoint, or deploy a middleware server that n8n can call.</p>
                                            </div>
                                            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside mt-3">
                                                <li>Free self-hosted option</li>
                                                <li>Create webhooks/HTTP endpoints via workflows</li>
                                                <li>Visual workflow builder</li>
                                            </ul>
                                        </div>

                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                            <h4 className="font-semibold text-amber-900 mb-2">Vercel Serverless Functions / Netlify Functions</h4>
                                            <p className="text-sm text-amber-800 mb-2">
                                                Deploy serverless functions as API endpoints. <strong>Requires writing code</strong> to implement each endpoint.
                                            </p>
                                            <div className="bg-white rounded-lg p-3 mt-3 border border-amber-200">
                                                <p className="text-xs text-amber-800 mb-2"><strong>Why code:</strong> You need to write serverless functions for each endpoint (health, studies, status, results).</p>
                                                <p className="text-xs text-amber-800 mb-2"><strong>Solution:</strong> Use <code className="bg-amber-100 px-1 rounded">test-server.js</code> as a reference to create your serverless functions. Deploy them to Vercel/Netlify.</p>
                                            </div>
                                            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside mt-3">
                                                <li>Free tier available</li>
                                                <li>Easy deployment</li>
                                                <li>Requires writing endpoint code</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Creating Middleware Section */}
                                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Creating Middleware for Custom Platforms</h3>
                                    <p className="text-sm text-blue-800 mb-4">
                                        If you want to use Airtable, n8n, or another platform that doesn't match our API structure, you'll need to create a middleware server. Here's how:
                                    </p>
                                    
                                    <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
                                        <h4 className="font-semibold text-blue-900 mb-3">Option 1: Use test-server.js as a Starting Point</h4>
                                        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                                            <li>
                                                <strong>Get the reference implementation:</strong>
                                                <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-xs">
                                                    <li>Find <code className="bg-blue-100 px-1 rounded">test-server.js</code> in this project</li>
                                                    <li>It implements all required endpoints in the correct format</li>
                                                </ul>
                                            </li>
                                            <li>
                                                <strong>Modify for your platform:</strong>
                                                <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-xs">
                                                    <li>Replace the in-memory storage with calls to your platform's API</li>
                                                    <li>For Airtable: Use Airtable's JavaScript SDK to read/write records</li>
                                                    <li>For n8n: Make HTTP requests to your n8n workflows</li>
                                                    <li>Keep the endpoint structure the same (don't change the routes)</li>
                                                </ul>
                                            </li>
                                            <li>
                                                <strong>Deploy your middleware:</strong>
                                                <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-xs">
                                                    <li>Deploy to Railway, Render, Fly.io, or any Node.js hosting service</li>
                                                    <li>Get your deployment URL</li>
                                                    <li>Use that URL in Tree Test Suite's Custom API configuration</li>
                                                </ul>
                                            </li>
                                        </ol>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                                        <h4 className="font-semibold text-blue-900 mb-3">Example: Airtable Middleware</h4>
                                        <p className="text-xs text-blue-800 mb-2">
                                            Your middleware would translate requests like this:
                                        </p>
                                        <div className="bg-blue-100 rounded p-2 mb-2 font-mono text-xs">
                                            <div className="mb-1"><strong>Tree Test Suite sends:</strong> GET /studies/study-123</div>
                                            <div><strong>Middleware translates to:</strong> GET https://api.airtable.com/v0/{'{'}baseId{'}'}/Studies?filterByFormula={'{'}{'{'}id{'}'}{'}'}='study-123'</div>
                                        </div>
                                        <p className="text-xs text-blue-600 italic">
                                            The middleware receives our format, calls Airtable's API, then returns the response in our expected format.
                                        </p>
                                    </div>
                                </div>

                                {/* Code-Based Solutions */}
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

                                {/* Required Endpoints */}
                                <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
                                    <h4 className="font-semibold text-blue-900 mb-2">Required API Endpoints</h4>
                                    <p className="text-sm text-blue-800 mb-2">
                                        Your Custom API (or middleware) must implement these REST endpoints:
                                    </p>
                                    <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside font-mono">
                                        <li>GET /health - Health check (for connection testing)</li>
                                        <li>GET /studies - List all studies (for sync functionality)</li>
                                        <li>POST /studies - Create new study</li>
                                        <li>PUT /studies/:id - Update study configuration</li>
                                        <li>GET /studies/:id - Fetch study configuration</li>
                                        <li>GET /studies/:id/status - Check study status</li>
                                        <li>PUT /studies/:id/status - Update study status (active/closed)</li>
                                        <li>POST /studies/:id/results - Submit participant results</li>
                                    </ul>
                                    <p className="text-xs text-blue-600 mt-3 italic">
                                        See the <code className="bg-blue-100 px-1 rounded">test-server.js</code> file in the project for a complete reference implementation.
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
