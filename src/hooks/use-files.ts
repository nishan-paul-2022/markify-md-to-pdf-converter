import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getAlert } from '@/components/AlertProvider';
import { logger } from '@/lib/logger';

export interface AppFile {
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

import { FilesService } from '@/lib/api/files.service';

export function useFiles(source?: string) {
  const router = useRouter();
  const [files, setFiles] = useState<AppFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFiles = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await FilesService.list(source);
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
        await FilesService.delete(id);
        setFiles((prev) => prev.filter((file) => file.id !== id));
        router.refresh();
      } catch (error: unknown) {
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
        await FilesService.bulkDelete(ids);
        setFiles((prev) => prev.filter((file) => !ids.includes(file.id)));
        router.refresh();
      } catch (error: unknown) {
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
        await FilesService.rename({ id, type, newName, batchId, oldPath });
        await fetchFiles();
        router.refresh();
      } catch (error: unknown) {
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
