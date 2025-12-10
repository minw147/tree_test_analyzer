/**
 * Password hashing and verification utilities
 * Uses Web Crypto API (built into browsers, no external dependencies)
 */

/**
 * Hash a password using SHA-256
 * @param password - Plain text password
 * @returns Promise resolving to hash string in format "sha256:base64hash"
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  try {
    // Convert password to ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    // Hash using SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert to base64 string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));

    // Return with prefix for future extensibility
    return `sha256:${hashBase64}`;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against a stored hash
 * @param password - Plain text password to verify
 * @param hash - Stored hash string (format: "sha256:base64hash")
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }

  try {
    // Hash the provided password
    const passwordHash = await hashPassword(password);

    // Compare hashes (constant-time comparison)
    return passwordHash === hash;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

