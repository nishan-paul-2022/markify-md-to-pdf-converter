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
 * Helper to get aggregated stats for a node (file or folder)
 */
function getNodeStats(node: FileTreeNode) {
  if (node.type === 'file') {
    return {
      time: node.file?.createdAt ? new Date(node.file.createdAt).getTime() : 0,
      size: node.file?.size || 0,
    };
  }

  // For folders, aggregate stats from all nested files
  let latestTime = 0;
  let totalSize = 0;

  const aggregate = (children?: FileTreeNode[]) => {
    if (!children) return;
    for (const child of children) {
      if (child.type === 'file') {
        const time = child.file?.createdAt ? new Date(child.file.createdAt).getTime() : 0;
        if (time > latestTime) latestTime = time;
        totalSize += child.file?.size || 0;
      } else {
        aggregate(child.children);
      }
    }
  };

  aggregate(node.children);
  return { time: latestTime, size: totalSize };
}

/**
 * Sort file tree nodes based on preference
 */
export function sortFileTreeNodes(
  nodes: FileTreeNode[],
  preference: SortPreference,
  isRoot = true,
): FileTreeNode[] {
  const currentPreference = isRoot ? preference : { sortBy: 'name', direction: 'asc' };

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
    }

    // Always put folders before files
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }

    // Apply sorting preference
    let comparison = 0;
    const statsA = getNodeStats(a);
    const statsB = getNodeStats(b);

    switch (currentPreference.sortBy) {
      case 'time':
        comparison = statsA.time - statsB.time;
        break;
      case 'size':
        comparison = statsA.size - statsB.size;
        break;
      case 'name':
      default:
        comparison = a.name.localeCompare(b.name, undefined, { numeric: true });
        break;
    }

    // Apply direction
    return currentPreference.direction === 'asc' ? comparison : -comparison;
  });

  // Recursively sort children - always alphabetical inside folders
  sorted.forEach((node) => {
    if (node.children && node.children.length > 0) {
      node.children = sortFileTreeNodes(node.children, preference, false);
    }
  });

  return sorted;
}
