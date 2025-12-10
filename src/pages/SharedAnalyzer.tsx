import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getShareLink, validateShareLink, checkForUpdates, reconstructStudyData, reconstructShareLink } from "@/lib/sharing/share-manager";
import { verifyPassword } from "@/lib/sharing/password-utils";
import type { ShareLink } from "@/lib/sharing/types";
import type { UploadedData } from "@/lib/types";
import { PasswordPrompt } from "@/components/sharing/PasswordPrompt";
import { SharedViewLayout } from "@/components/sharing/SharedViewLayout";
import LZString from "lz-string";

const STORAGE_KEY_ANALYZER_STUDIES = "tree-test-analyzer-studies";

// Load study data from localStorage
function loadStudyData(studyId: string): UploadedData | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ANALYZER_STUDIES);
    if (saved) {
      const studies: UploadedData[] = JSON.parse(saved);
      return studies.find(s => s.id === studyId) || null;
    }
  } catch (error) {
    console.error("Failed to load study data:", error);
  }
  return null;
}

// Load study data from URL hash (for cross-browser sharing)
function loadStudyDataFromUrl(urlHash: string, shareId: string): { studyData: UploadedData; shareLink: ShareLink } | null {
  try {
    if (!urlHash) return null;
    
    // Try lz-string decompression first (new format)
    let decompressed = LZString.decompressFromEncodedURIComponent(urlHash);
    let decoded;
    
    if (decompressed) {
      // New format: lz-string compressed
      decoded = JSON.parse(decompressed);
    } else {
      // Fallback: try old base64 format for backward compatibility
      try {
        decoded = JSON.parse(atob(urlHash));
      } catch (error) {
        console.error("Failed to decode URL hash (both lz-string and base64 failed):", error);
        return null;
      }
    }
    
    // Check if this is the new optimized format (has short keys like 'i', 'n', 'p')
    const isOptimizedFormat = decoded.i !== undefined && decoded.p !== undefined;
    
    if (isOptimizedFormat) {
      // New optimized format: reconstruct using helper functions
      const studyData = reconstructStudyData(decoded);
      const shareLink = reconstructShareLink(decoded, shareId);
      
      return { studyData, shareLink };
    } else {
      // Old format: reconstruct manually
      const shareLink: ShareLink = {
        id: decoded.shareLink?.id || shareId,
        studyId: decoded.id,
        passwordHash: decoded.shareLink?.passwordHash,
        createdAt: decoded.shareLink?.createdAt || new Date().toISOString(),
        expiresAt: decoded.shareLink?.expiresAt,
        accessCount: 0,
      };
      
      const studyData: UploadedData = {
        id: decoded.id,
        name: decoded.name,
        creator: decoded.creator,
        participants: decoded.participants,
        tasks: decoded.tasks,
        treeStructure: decoded.treeStructure,
        createdAt: decoded.createdAt,
        updatedAt: decoded.updatedAt,
        sourceStudyId: decoded.sourceStudyId,
      };
      
      return { studyData, shareLink };
    }
  } catch (error) {
    console.error("Failed to decode study data from URL:", error);
    return null;
  }
}

export function SharedAnalyzer() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [studyData, setStudyData] = useState<UploadedData | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load share link and check password requirement
  useEffect(() => {
    if (!shareId) {
      navigate("/");
      return;
    }

    // Get URL hash if present (for cross-browser sharing)
    const urlHash = window.location.hash.substring(1); // Remove the '#'
    
    // Try to load from URL hash first (cross-browser)
    if (urlHash) {
      const urlData = loadStudyDataFromUrl(urlHash, shareId);
      if (urlData && urlData.shareLink.id === shareId) {
        setShareLink(urlData.shareLink);
        setPasswordRequired(!!urlData.shareLink.passwordHash);
        
        // If no password required, load study data immediately
        if (!urlData.shareLink.passwordHash) {
          setStudyData(urlData.studyData);
        } else {
          // Store the study data temporarily for password validation
          // We'll set it after password is validated
          (window as any).__tempStudyData = urlData.studyData;
        }
        
        setLoading(false);
        return;
      }
    }
    
    // Fallback to localStorage (same browser)
    const link = getShareLink(shareId);
    if (!link) {
      // Share link not found or expired
      setLoading(false);
      return;
    }

    setShareLink(link);
    setPasswordRequired(!!link.passwordHash);

    // If no password required, load study data immediately
    if (!link.passwordHash) {
      const data = loadStudyData(link.studyId);
      if (data) {
        setStudyData(data);
      } else {
        // Study not found
        setLoading(false);
      }
    }

    setLoading(false);
  }, [shareId, navigate]);

  // Handle password submission
  const handlePasswordSubmit = async (password: string) => {
    if (!shareId) return;

    setPasswordError(null);
    
    // Check if we have temp study data from URL hash (cross-browser)
    const tempData = (window as any).__tempStudyData;
    if (tempData && shareLink) {
      // Validate password using hash from URL
      if (shareLink.passwordHash && shareLink.passwordHash !== 'REQUIRED') {
        const isValid = await verifyPassword(password, shareLink.passwordHash);
        
        if (isValid) {
          setPasswordRequired(false);
          setStudyData(tempData);
          delete (window as any).__tempStudyData;
          return;
        } else {
          setPasswordError("Invalid password");
          return;
        }
      }
    }
    
    // Fallback to localStorage validation (same browser)
    const validation = await validateShareLink(shareId, password);

    if (validation.valid && validation.shareLink) {
      setShareLink(validation.shareLink);
      setPasswordRequired(false);
      
      // Load study data
      const data = loadStudyData(validation.shareLink.studyId);
      if (data) {
        setStudyData(data);
      } else {
        setPasswordError("Study data not found");
      }
    } else {
      setPasswordError(validation.error || "Invalid password");
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    if (!studyData || !shareLink) return;

    setIsRefreshing(true);

    // Check for updates
    const updateCheck = checkForUpdates(studyData.id, studyData.updatedAt);

    if (updateCheck.hasUpdates && updateCheck.updatedData) {
      setStudyData(updateCheck.updatedData);
      // Could show a notification here: "Data updated"
    }

    setIsRefreshing(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Share link not found
  if (!shareLink) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Share Link Not Found</h1>
          <p className="text-gray-500 mb-4">
            This share link may have expired or been deleted.
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:underline"
          >
            Return to home
          </button>
        </div>
      </div>
    );
  }

  // Password prompt
  if (passwordRequired) {
    return (
      <PasswordPrompt
        open={true}
        onPasswordSubmit={handlePasswordSubmit}
        onCancel={() => navigate("/")}
        error={passwordError || undefined}
      />
    );
  }

  // Study data not found
  if (!studyData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Study Not Found</h1>
          <p className="text-gray-500 mb-4">
            The study associated with this share link could not be found.
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 hover:underline"
          >
            Return to home
          </button>
        </div>
      </div>
    );
  }

  // Shared view
  return (
    <SharedViewLayout
      data={studyData}
      shareLink={shareLink}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    />
  );
}

