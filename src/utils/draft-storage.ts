/**
 * Centralized Draft Storage Manager
 * 
 * This utility provides a single source of truth for managing localStorage drafts
 * with proper cache invalidation and version tracking.
 */

interface DraftData {
  content: string;
  updatedAt: string;
  fileVersion: string; // Hash or timestamp from server
}

const DRAFT_PREFIX = 'markify_draft_';
const VERSION_PREFIX = 'markify_version_';

/**
 * Save a draft to localStorage with version tracking
 */
export function saveDraft(fileId: string, content: string, serverVersion: string): void {
  const draft: DraftData = {
    content,
    updatedAt: new Date().toISOString(),
    fileVersion: serverVersion,
  };
  
  try {
    localStorage.setItem(`${DRAFT_PREFIX}${fileId}`, JSON.stringify(draft));
    localStorage.setItem(`${VERSION_PREFIX}${fileId}`, serverVersion);
  } catch (error) {
    console.warn('Failed to save draft to localStorage:', error);
  }
}

/**
 * Load a draft from localStorage with version validation
 * Returns null if:
 * - No draft exists
 * - Draft is for an older version of the file
 * - Draft is corrupted
 */
export function loadDraft(fileId: string, currentServerVersion: string): string | null {
  try {
    const draftStr = localStorage.getItem(`${DRAFT_PREFIX}${fileId}`);
    if (!draftStr) return null;

    const draft: DraftData = JSON.parse(draftStr);
    
    // Version mismatch - server file has changed
    if (draft.fileVersion !== currentServerVersion) {
      console.info(`🔄 Server version changed for file ${fileId}. Discarding stale draft.`);
      clearDraft(fileId);
      return null;
    }

    console.info(`📝 Loaded draft for file ${fileId}`);
    return draft.content;
  } catch (error) {
    console.warn('Failed to load draft from localStorage:', error);
    clearDraft(fileId);
    return null;
  }
}

/**
 * Clear a specific draft
 */
export function clearDraft(fileId: string): void {
  localStorage.removeItem(`${DRAFT_PREFIX}${fileId}`);
  localStorage.removeItem(`${VERSION_PREFIX}${fileId}`);
}

/**
 * Clear all drafts (useful after logout or database reset)
 */
export function clearAllDrafts(): void {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(DRAFT_PREFIX) || key.startsWith(VERSION_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  console.info('🧹 Cleared all drafts from localStorage');
}

/**
 * Check if a draft exists for a file
 */
export function hasDraft(fileId: string): boolean {
  return localStorage.getItem(`${DRAFT_PREFIX}${fileId}`) !== null;
}

/**
 * Get the version hash for a file (combination of createdAt + updatedAt)
 * This ensures drafts are invalidated when the file changes on the server
 */
export function getFileVersion(file: { createdAt: string; updatedAt?: string }): string {
  return `${file.createdAt}_${file.updatedAt || file.createdAt}`;
}
