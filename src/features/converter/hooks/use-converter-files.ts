import { useMemo } from 'react';

import type { AppFile } from '@/features/file-management/hooks/use-files';
import { useQueryState, useSearchQuery } from '@/hooks/use-query-state';

/**
 * Hook to manage filtering and sorting of files in the converter.
 * Follows Guideline 6 (Logic Extraction) and Guideline 4 (Navigational State).
 */
export function useConverterFiles(files: AppFile[]) {
  const { query: searchQuery, setQuery: setSearchQuery } = useSearchQuery();
  const [sortBy, setSortBy] = useQueryState<'name' | 'time' | 'size'>('sort', 'time');
  const [sortOrder, setSortOrder] = useQueryState<'asc' | 'desc'>('order', 'desc');

  const filteredMdFiles = useMemo(() => {
    return files
      .filter(
        (f) =>
          f.originalName.toLowerCase().endsWith('.md') || f.mimeType === 'text/markdown',
      )
      .filter(
        (f) =>
          f.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (f.relativePath && f.relativePath.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      .sort((a, b) => {
        // Priority: Always keep default items at the top
        const isDefaultA =
          a.id.startsWith('default-') ||
          a.batchId === 'sample-file' ||
          a.batchId === 'sample-folder' ||
          a.batchId === 'v1-samples';
        const isDefaultB =
          b.id.startsWith('default-') ||
          b.batchId === 'sample-file' ||
          b.batchId === 'sample-folder' ||
          b.batchId === 'v1-samples';

        if (isDefaultA && !isDefaultB) return -1;
        if (!isDefaultA && isDefaultB) return 1;

        // If both are defaults, maintain consistent order: sample-file first
        if (isDefaultA && isDefaultB) {
          if (a.batchId === 'sample-file' && b.batchId !== 'sample-file') return -1;
          if (a.batchId !== 'sample-file' && b.batchId === 'sample-file') return 1;
        }

        let comparison = 0;
        if (sortBy === 'name') {
          comparison = a.originalName.localeCompare(b.originalName);
        } else if (sortBy === 'size') {
          comparison = a.size - b.size;
        } else {
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return sortOrder === 'desc' ? -comparison : comparison;
      });
  }, [files, searchQuery, sortBy, sortOrder]);

  return {
    filteredMdFiles,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  };
}
