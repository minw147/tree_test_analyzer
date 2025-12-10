/**
 * Share link configuration for creating a new share link
 */
export interface ShareLinkConfig {
  password?: string;              // Plain password (will be hashed)
  expiresInDays?: number;          // Optional expiration (default: never)
}

/**
 * Share link stored in localStorage
 */
export interface ShareLink {
  id: string;                    // Unique share ID (e.g., "share-abc123")
  studyId: string;               // Links to original UploadedData.id
  passwordHash?: string;         // Optional Web Crypto hash
  createdAt: string;             // ISO timestamp
  expiresAt?: string;             // Optional expiration (ISO timestamp)
  accessCount: number;            // Track how many times accessed
  lastAccessedAt?: string;       // Last access timestamp
}

/**
 * Validation result for share link access
 */
export interface ShareLinkValidation {
  valid: boolean;
  shareLink?: ShareLink;
  error?: string;
}

