import type { ShareLink, ShareLinkConfig, ShareLinkValidation } from './types';
import type { UploadedData } from '../types';
import { hashPassword, verifyPassword } from './password-utils';
import LZString from 'lz-string';

const STORAGE_KEY_SHARE_LINKS = 'tree-test-share-links';

/**
 * Load all share links from localStorage
 */
function loadShareLinks(): Record<string, ShareLink> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SHARE_LINKS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load share links from localStorage:', error);
  }
  return {};
}

/**
 * Save all share links to localStorage
 */
function saveShareLinks(shareLinks: Record<string, ShareLink>): void {
  try {
    localStorage.setItem(STORAGE_KEY_SHARE_LINKS, JSON.stringify(shareLinks));
  } catch (error) {
    console.error('Failed to save share links to localStorage:', error);
  }
}

/**
 * Generate a unique share ID
 */
function generateShareId(): string {
  return `share-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new share link for a study
 * @param studyId - ID of the study to share
 * @param config - Optional configuration (password, expiration)
 * @returns Created share link
 */
export async function createShareLink(
  studyId: string,
  config?: ShareLinkConfig
): Promise<ShareLink> {
  const shareLinks = loadShareLinks();
  
  // Generate unique ID
  const shareId = generateShareId();
  
  // Hash password if provided
  let passwordHash: string | undefined;
  if (config?.password) {
    passwordHash = await hashPassword(config.password);
  }
  
  // Calculate expiration if provided
  let expiresAt: string | undefined;
  if (config?.expiresInDays) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + config.expiresInDays);
    expiresAt = expirationDate.toISOString();
  }
  
  // Create share link
  const shareLink: ShareLink = {
    id: shareId,
    studyId,
    passwordHash,
    createdAt: new Date().toISOString(),
    expiresAt,
    accessCount: 0,
  };
  
  // Save to localStorage
  shareLinks[shareId] = shareLink;
  saveShareLinks(shareLinks);
  
  return shareLink;
}

/**
 * Get a share link by ID
 * First tries localStorage, then falls back to URL hash metadata
 * @param shareId - Share link ID
 * @param urlHash - Optional URL hash containing encoded metadata
 * @returns Share link or null if not found
 */
export function getShareLink(shareId: string, urlHash?: string): ShareLink | null {
  // First, try localStorage (works for same browser)
  const shareLinks = loadShareLinks();
  let shareLink = shareLinks[shareId];
  
  // If not found in localStorage, try to decode from URL hash (cross-browser)
  if (!shareLink && urlHash) {
    try {
      // Decompress using lz-string (try new format first)
      let decompressed = LZString.decompressFromEncodedURIComponent(urlHash);
      let decoded;
      
      if (decompressed) {
        // New format: lz-string compressed
        decoded = JSON.parse(decompressed);
      } else {
        // Fallback: try old base64 format for backward compatibility
        try {
          decoded = JSON.parse(atob(urlHash));
        } catch {
          throw new Error('Failed to decode URL hash');
        }
      }
      
      // Extract share link metadata from decoded data
      if (decoded.shareLink && decoded.shareLink.id === shareId) {
        // New format: full data with shareLink metadata
        shareLink = {
          id: decoded.shareLink.id,
          studyId: decoded.id,
          passwordHash: decoded.shareLink.passwordHash,
          createdAt: decoded.shareLink.createdAt,
          expiresAt: decoded.shareLink.expiresAt,
          accessCount: 0, // Can't track across browsers
        };
      } else if (decoded.id === shareId) {
        // Old format: just metadata
        shareLink = {
          id: decoded.id,
          studyId: decoded.studyId,
          passwordHash: decoded.hasPassword ? 'REQUIRED' : undefined,
          createdAt: decoded.createdAt,
          expiresAt: decoded.expiresAt,
          accessCount: 0,
        };
      }
    } catch (error) {
      console.error('Failed to decode share link from URL:', error);
    }
  }
  
  if (!shareLink) {
    return null;
  }
  
  // Check expiration
  if (shareLink.expiresAt) {
    const expirationDate = new Date(shareLink.expiresAt);
    if (new Date() > expirationDate) {
      // Expired
      if (shareLinks[shareId]) {
        deleteShareLink(shareId);
      }
      return null;
    }
  }
  
  // Only increment access count if from localStorage (can't track across browsers)
  if (shareLinks[shareId]) {
    shareLink.accessCount += 1;
    shareLink.lastAccessedAt = new Date().toISOString();
    saveShareLinks(shareLinks);
  }
  
  return shareLink;
}

/**
 * Validate a share link and password (if required)
 * @param shareId - Share link ID
 * @param password - Optional password to verify
 * @returns Validation result
 */
export async function validateShareLink(
  shareId: string,
  password?: string
): Promise<ShareLinkValidation> {
  const shareLink = getShareLink(shareId);
  
  if (!shareLink) {
    return {
      valid: false,
      error: 'Share link not found or expired',
    };
  }
  
  // If password is required, verify it
  if (shareLink.passwordHash) {
    if (!password) {
      return {
        valid: false,
        error: 'Password required',
      };
    }
    
    const isValid = await verifyPassword(password, shareLink.passwordHash);
    if (!isValid) {
      return {
        valid: false,
        error: 'Invalid password',
      };
    }
  }
  
  return {
    valid: true,
    shareLink,
  };
}

/**
 * Delete a share link
 * @param shareId - Share link ID to delete
 */
export function deleteShareLink(shareId: string): void {
  const shareLinks = loadShareLinks();
  delete shareLinks[shareId];
  saveShareLinks(shareLinks);
}

/**
 * Get all share links for a specific study
 * @param studyId - Study ID
 * @returns Array of share links for the study
 */
export function getShareLinksForStudy(studyId: string): ShareLink[] {
  const shareLinks = loadShareLinks();
  return Object.values(shareLinks).filter(link => link.studyId === studyId);
}

/**
 * Check if study data has been updated since last view
 * @param studyId - Study ID
 * @param lastUpdatedAt - Timestamp of last known update
 * @returns Object indicating if updates are available and the updated data
 */
export function checkForUpdates(
  studyId: string,
  lastUpdatedAt: string
): { hasUpdates: boolean; updatedData?: UploadedData } {
  // Load studies from analyzer storage (same as Analyzer.tsx)
  const STORAGE_KEY_ANALYZER_STUDIES = 'tree-test-analyzer-studies';
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ANALYZER_STUDIES);
    if (!saved) {
      return { hasUpdates: false };
    }
    
    const studies: UploadedData[] = JSON.parse(saved);
    const currentStudy = studies.find(s => s.id === studyId);
    
    if (!currentStudy) {
      return { hasUpdates: false };
    }
    
    const hasUpdates = currentStudy.updatedAt !== lastUpdatedAt;
    
    return {
      hasUpdates,
      updatedData: hasUpdates ? currentStudy : undefined,
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return { hasUpdates: false };
  }
}

/**
 * Optimize study data for URL embedding by:
 * - Using shorter field names
 * - Removing unnecessary fields
 * - Converting dates to timestamps
 * - Removing redundant data
 */
function optimizeStudyDataForSharing(studyData: UploadedData, shareLink: ShareLink): any {
  // Convert participants to optimized format
  const optimizedParticipants = studyData.participants.map(p => ({
    i: p.id, // id
    s: p.status === 'Completed' ? 1 : 0, // status (1=completed, 0=abandoned)
    st: p.startedAt instanceof Date ? p.startedAt.getTime() : new Date(p.startedAt).getTime(), // startedAt (timestamp)
    ct: p.completedAt ? (p.completedAt instanceof Date ? p.completedAt.getTime() : new Date(p.completedAt).getTime()) : null, // completedAt (timestamp)
    d: p.durationSeconds, // durationSeconds
    tr: p.taskResults.map(tr => ({
      ti: tr.taskIndex, // taskIndex (taskId and description can be inferred from tasks array)
      sc: tr.successful ? 1 : 0, // successful
      dp: tr.directPathTaken ? 1 : 0, // directPathTaken
      t: tr.completionTimeSeconds, // completionTimeSeconds
      p: tr.pathTaken, // pathTaken
      sk: tr.skipped ? 1 : 0, // skipped
      cf: tr.confidenceRating, // confidenceRating
    })),
  }));

  // Optimize tasks (keep minimal data)
  const optimizedTasks = studyData.tasks.map(t => ({
    i: t.id, // id
    idx: t.index, // index
    d: t.description, // description
    e: t.expectedAnswer, // expectedAnswer
  }));

  // Optimize tree structure (only include if present, can be large)
  // We'll include it but it's optional for viewing
  const optimizedTree = studyData.treeStructure;

  return {
    i: studyData.id, // id
    n: studyData.name, // name
    c: studyData.creator, // creator
    p: optimizedParticipants, // participants
    t: optimizedTasks, // tasks
    ts: optimizedTree, // treeStructure (optional)
    ca: typeof studyData.createdAt === 'string' ? new Date(studyData.createdAt).getTime() : studyData.createdAt, // createdAt (timestamp)
    ua: typeof studyData.updatedAt === 'string' ? new Date(studyData.updatedAt).getTime() : studyData.updatedAt, // updatedAt (timestamp)
    // sourceStudyId removed - not needed for viewing
    sl: { // shareLink
      i: shareLink.id, // id
      ph: shareLink.passwordHash || undefined, // passwordHash (only if exists)
      ca: shareLink.createdAt ? (typeof shareLink.createdAt === 'string' ? new Date(shareLink.createdAt).getTime() : shareLink.createdAt) : undefined, // createdAt (timestamp)
      ea: shareLink.expiresAt ? (typeof shareLink.expiresAt === 'string' ? new Date(shareLink.expiresAt).getTime() : shareLink.expiresAt) : undefined, // expiresAt (timestamp)
    },
  };
}

/**
 * Reconstruct UploadedData from optimized format
 * Exported for use in SharedAnalyzer
 */
export function reconstructStudyData(optimized: any): UploadedData {
  // First reconstruct tasks to use for taskResults reconstruction
  const tasks = optimized.t.map((t: any) => ({
    id: t.i,
    index: t.idx,
    description: t.d,
    expectedAnswer: t.e,
  }));
  
  // Create a map for quick lookup
  type TaskType = { id: string; index: number; description: string; expectedAnswer: string };
  const taskIndexToTask = new Map<number, TaskType>(tasks.map((t: TaskType) => [t.index, t]));
  
  return {
    id: optimized.i,
    name: optimized.n,
    creator: optimized.c,
    participants: optimized.p.map((p: any) => ({
      id: p.i,
      status: p.s === 1 ? 'Completed' : 'Abandoned',
      startedAt: new Date(p.st),
      completedAt: p.ct ? new Date(p.ct) : null,
      durationSeconds: p.d,
      taskResults: p.tr.map((tr: any) => {
        const task = taskIndexToTask.get(tr.ti);
        return {
          taskId: task ? task.id : '',
          taskIndex: tr.ti,
          description: task ? task.description : '',
          successful: tr.sc === 1,
          directPathTaken: tr.dp === 1,
          completionTimeSeconds: tr.t,
          pathTaken: tr.p,
          skipped: tr.sk === 1,
          confidenceRating: tr.cf,
        };
      }),
    })),
    tasks,
    treeStructure: optimized.ts,
    createdAt: new Date(optimized.ca).toISOString(),
    updatedAt: new Date(optimized.ua).toISOString(),
  };
}

/**
 * Reconstruct ShareLink from optimized format
 * Exported for use in SharedAnalyzer
 */
export function reconstructShareLink(optimized: any, shareId: string): ShareLink {
  return {
    id: optimized.sl?.i || shareId,
    studyId: optimized.i,
    passwordHash: optimized.sl?.ph,
    createdAt: optimized.sl?.ca ? new Date(optimized.sl.ca).toISOString() : new Date().toISOString(),
    expiresAt: optimized.sl?.ea ? new Date(optimized.sl.ea).toISOString() : undefined,
    accessCount: 0,
  };
}

/**
 * Get the full shareable URL for a share link
 * Includes study data in URL hash for cross-browser compatibility
 * @param shareLink - Share link object
 * @param studyData - The study data to embed in the URL
 * @returns Full URL with encoded study data
 */
export function getShareableUrl(shareLink: ShareLink, studyData?: UploadedData): string {
  const baseUrl = window.location.origin;
  
  // If study data is provided, embed it in the URL hash for cross-browser access
  // This allows the link to work even if localStorage isn't shared
  if (studyData) {
    try {
      // Optimize data structure (shorter keys, remove unnecessary fields, convert dates)
      const optimized = optimizeStudyDataForSharing(studyData, shareLink);
      
      // Compress and encode using lz-string (URI-safe encoding for URLs)
      const jsonString = JSON.stringify(optimized);
      const encoded = LZString.compressToEncodedURIComponent(jsonString);
      
      return `${baseUrl}/share/${shareLink.id}#${encoded}`;
    } catch (error) {
      console.error('Failed to encode study data in URL:', error);
      // Fallback to simple URL if encoding fails
      return `${baseUrl}/share/${shareLink.id}`;
    }
  }
  
  // Fallback: just the share ID (won't work cross-browser)
  return `${baseUrl}/share/${shareLink.id}`;
}

