import { useMemo } from 'react';

import type { File as AppFile } from '@/hooks/use-files';
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
      .filter(f =>
        !f.id.startsWith('default-') &&
        f.batchId !== 'sample-document' &&
        f.batchId !== 'sample-project' &&
        (f.originalName.toLowerCase().endsWith('.md') || f.mimeType === 'text/markdown')
      )
      .filter(f =>
        f.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.relativePath && f.relativePath.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
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
    setSortOrder
  };
}
