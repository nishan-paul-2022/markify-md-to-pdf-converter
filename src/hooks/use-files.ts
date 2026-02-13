import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getAlert } from '@/components/AlertProvider';
import { logger } from '@/lib/logger';

export interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  relativePath?: string;
  batchId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface FileListResponse {
  files: File[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useFiles(source?: string) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFiles = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({ limit: '100' });
      if (source) {
        queryParams.append('source', source);
      }
      const response = await fetch(`/api/files?${queryParams.toString()}`);
      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.details || errorData.error || '';
        } catch {
          // Fallback if not JSON
        }
        throw new Error(errorDetail || `Failed to fetch files (Status: ${response.status})`);
      }

      const data: FileListResponse = await response.json();
      logger.info(`📂 Fetched ${data.files.length} files from API (source: ${source || 'all'})`);

      setFiles(data.files);
    } catch (error: unknown) {
      logger.error('Error fetching files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    void fetchFiles();
  }, [fetchFiles]);

  const handleDelete = useCallback(
    async (id: string): Promise<void> => {
      setDeleting(true);
      try {
        const response = await fetch(`/api/files/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete file');
        }

        setFiles((prev) => prev.filter((file) => file.id !== id));
        router.refresh();
      } catch (error: unknown) {
        logger.error('Delete error:', error);
        const msg = error instanceof Error ? error.message : 'Failed to delete file';
        const api = getAlert();
        if (api) {
          api.show({ title: 'Delete failed', message: msg, variant: 'destructive' });
        } else {
          alert(msg);
        }
      } finally {
        setDeleting(false);
        setDeleteId(null);
      }
    },
    [router],
  );

  const handleBulkDelete = useCallback(
    async (ids: string[]): Promise<void> => {
      setDeleting(true);
      try {
        const response = await fetch('/api/files', {
          method: 'DELETE',
          body: JSON.stringify({ ids }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete files');
        }

        setFiles((prev) => prev.filter((file) => !ids.includes(file.id)));
        router.refresh();
      } catch (error: unknown) {
        logger.error('Bulk delete error:', error);
        const msg = error instanceof Error ? error.message : 'Failed to delete files';
        const api = getAlert();
        if (api) {
          api.show({ title: 'Delete failed', message: msg, variant: 'destructive' });
        } else {
          alert(msg);
        }
      } finally {
        setDeleting(false);
        setDeleteId(null);
      }
    },
    [router],
  );

  const handleRename = useCallback(
    async (
      id: string,
      newName: string,
      type: 'file' | 'folder',
      batchId?: string,
      oldPath?: string,
    ): Promise<void> => {
      try {
        const response = await fetch('/api/files', {
          method: 'PATCH',
          body: JSON.stringify({ id, type, newName, batchId, oldPath }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to rename');
        }

        await fetchFiles();
        router.refresh();
      } catch (error: unknown) {
        logger.error('Rename error:', error);
        const msg = error instanceof Error ? error.message : 'Failed to rename';
        const api = getAlert();
        if (api) {
          api.show({ title: 'Rename failed', message: msg, variant: 'destructive' });
        } else {
          alert(msg);
        }
        throw error;
      }
    },
    [fetchFiles, router],
  );

  return {
    files,
    loading,
    deleteId,
    deleting,
    setDeleteId,
    handleDelete,
    handleBulkDelete,
    handleRename,
    refreshFiles: fetchFiles,
  };
}
