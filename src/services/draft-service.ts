/**
 * Server-Side Draft Service
 * 
 * This service provides a clean API for managing drafts stored on the server.
 * Benefits over localStorage:
 * - Works across devices and browsers
 * - Automatically cleaned up when files are deleted (CASCADE)
 * - No version conflicts or stale data
 * - Survives browser cache clears
 */


/**
 * Fetch a draft from the server
 */
export async function fetchDraft(fileId: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/drafts/${fileId}`);
    if (!response.ok) {
      // Treat 404 (not found) and 401 (unauthorized) as "no draft available"
      if (response.status === 404 || response.status === 401) return null;
      throw new Error('Failed to fetch draft');
    }

    const data = await response.json();
    return data.draft?.content || null;
  } catch (error) {
    console.error('Error fetching draft:', error);
    return null;
  }
}

/**
 * Save a draft to the server (debounced on the caller side)
 */
export async function saveDraftToServer(fileId: string, content: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/drafts/${fileId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error saving draft:', error);
    return false;
  }
}

/**
 * Delete a draft from the server
 */
export async function deleteDraft(fileId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/drafts/${fileId}`, {
      method: 'DELETE',
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting draft:', error);
    return false;
  }
}

/**
 * Create a debounced save function
 * Usage: const debouncedSave = createDebouncedDraftSave(fileId, 1000);
 */
export function createDebouncedDraftSave(
  fileId: string,
  delayMs = 1000,
): (content: string) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (content: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      void saveDraftToServer(fileId, content);
    }, delayMs);
  };
}
