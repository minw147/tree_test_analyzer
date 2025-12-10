import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Copy, Check, Trash2, Share2, Download } from "lucide-react";
import { createShareLink, getShareLinksForStudy, deleteShareLink, getShareableUrl } from "@/lib/sharing/share-manager";
import { downloadHtmlReport } from "@/lib/report-generator";
import type { ShareLink } from "@/lib/sharing/types";
import type { UploadedData } from "@/lib/types";

interface ShareDialogProps {
  studyId: string;
  studyName: string;
  studyData: UploadedData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({
  studyId,
  studyName,
  studyData,
  open,
  onOpenChange,
}: ShareDialogProps) {
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [existingLinks, setExistingLinks] = useState<ShareLink[]>([]);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Load existing share links when dialog opens
  useEffect(() => {
    if (open) {
      setExistingLinks(getShareLinksForStudy(studyId));
    }
  }, [open, studyId]);

  if (!open) return null;

  const handleCreateLink = async () => {
    setIsCreating(true);
    try {
      const newLink = await createShareLink(studyId, {
        password: usePassword ? password : undefined,
      });
      
      // Refresh list
      setExistingLinks(getShareLinksForStudy(studyId));
      
      // Reset form
      setPassword("");
      setUsePassword(false);
      
      // Copy the new link automatically (with study data embedded)
      const url = getShareableUrl(newLink, studyData);
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(newLink.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      console.error("Failed to create share link:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async (link: ShareLink) => {
    const url = getShareableUrl(link, studyData);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(link.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleDeleteLink = (linkId: string) => {
    if (confirm("Are you sure you want to delete this share link?")) {
      deleteShareLink(linkId);
      setExistingLinks(getShareLinksForStudy(studyId));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl rounded-lg border bg-white shadow-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Share Analysis</h2>
            <p className="text-sm text-gray-500 mt-1">{studyName}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Download HTML Report Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Create HTML Report</h3>
            <Button
              variant="default"
              onClick={() => {
                downloadHtmlReport(studyData);
              }}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download HTML Report
            </Button>
          </div>

          {/* Create New Link Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Create Share Link</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="use-password"
                  checked={usePassword}
                  onChange={(e) => setUsePassword(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <Label htmlFor="use-password" className="text-sm text-gray-700 cursor-pointer">
                  Protect with password
                </Label>
              </div>

              {usePassword && (
                <div>
                  <Label htmlFor="password-input" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </Label>
                  <Input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full"
                  />
                </div>
              )}

              <Button
                onClick={handleCreateLink}
                disabled={isCreating || (usePassword && !password.trim())}
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {isCreating ? "Creating..." : "Generate Share Link"}
              </Button>
            </div>
          </div>

          {/* Existing Links Section */}
          {existingLinks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Existing Share Links ({existingLinks.length})
              </h3>
              
              <div className="space-y-3">
                {existingLinks.map((link) => {
                  // For existing links, try to get study data from localStorage
                  // If not available, generate URL without embedded data (won't work cross-browser)
                  const url = getShareableUrl(link, studyData);
                  const isCopied = copiedLinkId === link.id;
                  
                  return (
                    <div
                      key={link.id}
                      className="rounded-lg border p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500">
                              {link.passwordHash ? "🔒 Password Protected" : "🔓 Public"}
                            </span>
                            {link.expiresAt && (
                              <span className="text-xs text-gray-400">
                                • Expires {new Date(link.expiresAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={url}
                              readOnly
                              className="flex-1 text-sm font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-700"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyLink(link)}
                              className="flex-shrink-0"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteLink(link.id)}
                              className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Created {new Date(link.createdAt).toLocaleDateString()} • 
                            Accessed {link.accessCount} time{link.accessCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

