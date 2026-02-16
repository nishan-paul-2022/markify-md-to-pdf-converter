import type { FileTreeNode } from '@/features/file-management/utils/file-tree';

export type SortBy = 'time' | 'size' | 'name';
export type SortDirection = 'asc' | 'desc';

export interface SortPreference {
  sortBy: SortBy;
  direction: SortDirection;
}

const STORAGE_KEY = 'markify-file-sort-preference';

export const DEFAULT_SORT: SortPreference = {
  sortBy: 'time',
  direction: 'desc', // Newest first by default
};

/**
 * Load sort preference from localStorage
 */
export function loadSortPreference(): SortPreference {
  if (typeof window === 'undefined') {
    return DEFAULT_SORT;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as SortPreference;
      // Validate the parsed data
      if (
        ['time', 'size', 'name'].includes(parsed.sortBy) &&
        ['asc', 'desc'].includes(parsed.direction)
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to load sort preference:', error);
  }

  return DEFAULT_SORT;
}

/**
 * Save sort preference to localStorage
 */
export function saveSortPreference(preference: SortPreference): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
  } catch (error) {
    console.warn('Failed to save sort preference:', error);
  }
}

/**
 * Sort file tree nodes based on preference
 */
export function sortFileTreeNodes(
  nodes: FileTreeNode[],
  preference: SortPreference,
): FileTreeNode[] {
  const sorted = [...nodes].sort((a, b) => {
    // Always keep default items (sample-file, sample-folder, v1-samples) at the top
    const isDefaultA =
      a.batchId === 'sample-file' || a.batchId === 'sample-folder' || a.batchId === 'v1-samples';
    const isDefaultB =
      b.batchId === 'sample-file' || b.batchId === 'sample-folder' || b.batchId === 'v1-samples';

    if (isDefaultA && !isDefaultB) return -1;
    if (!isDefaultA && isDefaultB) return 1;

    // If both are defaults, maintain consistent order: sample-file first
    if (isDefaultA && isDefaultB) {
      if (a.batchId === 'sample-file' && b.batchId !== 'sample-file') return -1;
      if (a.batchId !== 'sample-file' && b.batchId === 'sample-file') return 1;
      // Other defaults (sample-folder, v1-samples) are treated equally and sort by type/name below
    }

    // Always put folders before files (for non-default or same-batch items)
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }

    // Apply user's sort preference
    let comparison = 0;

    switch (preference.sortBy) {
      case 'time': {
        const timeA = a.file?.createdAt ? new Date(a.file.createdAt).getTime() : 0;
        const timeB = b.file?.createdAt ? new Date(b.file.createdAt).getTime() : 0;
        comparison = timeA - timeB;
        break;
      }
      case 'size': {
        const sizeA = a.file?.size || 0;
        const sizeB = b.file?.size || 0;
        comparison = sizeA - sizeB;
        break;
      }
      case 'name': {
        comparison = a.name.localeCompare(b.name, undefined, { numeric: true });
        break;
      }
    }

    // Apply direction
    return preference.direction === 'asc' ? comparison : -comparison;
  });

  // Recursively sort children
  sorted.forEach((node) => {
    if (node.children && node.children.length > 0) {
      node.children = sortFileTreeNodes(node.children, preference);
    }
  });

  return sorted;
}
