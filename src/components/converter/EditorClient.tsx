import React, { useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { EditorView } from '@/components/converter/EditorView';
import { DEFAULT_MARKDOWN_PATH } from '@/constants/default-content';
import { useConverter } from '@/hooks/use-converter';
import { useFiles } from '@/hooks/use-files';
import type { FileTreeNode } from '@/lib/file-tree';
import { logger } from '@/lib/logger';

interface EditorClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function EditorClient({ user }: EditorClientProps): React.JSX.Element {
  const converterState = useConverter();
  const {
    files,
    loading: filesLoading,
    handleDelete,
    handleBulkDelete,
    handleRename,
    refreshFiles,
  } = useFiles('editor');

  const router = useRouter();
  const searchParams = useSearchParams();
  const fileIdFromUrl = searchParams.get('fileId');

  // Helper to load file content
  const loadFileContent = useCallback(
    async (targetFile: (typeof files)[0]) => {
      try {
        const fileUrl = targetFile.url || '';
        const fetchUrl =
          fileUrl.startsWith('/uploads/') && !fileUrl.startsWith('/api/')
            ? `/api${fileUrl}`
            : fileUrl;

        const response = await fetch(fetchUrl);
        if (response.ok) {
          const text = await response.text();
          converterState.handleContentChange(text);
          converterState.setFilename(targetFile.originalName);
          converterState.setSelectedFileId(targetFile.id);

          if (fileUrl) {
            const lastSlashIndex = fileUrl.lastIndexOf('/');
            if (lastSlashIndex !== -1) {
              const directoryPath = fileUrl.substring(0, lastSlashIndex);
              const finalBasePath =
                directoryPath.startsWith('/api/') || !directoryPath.startsWith('/uploads')
                  ? directoryPath
                  : `/api${directoryPath}`;
              converterState.setBasePath(finalBasePath);
            }
          }
        }
      } catch (error) {
        logger.error('Failed to load file:', error);
      }
    },
    [converterState],
  );

  // Initial selection of file (URL -> LocalStorage -> Default)
  useEffect(() => {
    if (!filesLoading && files.length > 0 && !converterState.selectedFileId) {
      // 1. Check if we have a fileId in the URL
      if (fileIdFromUrl) {
        const targetFile = files.find((f) => f.id === fileIdFromUrl);
        if (targetFile) {
          void loadFileContent(targetFile);
          return;
        }
      }

      // 2. Check LocalStorage for last active file (if user is known)
      if (user.email) {
        const storageKey = `markify_last_file_${user.email}`;
        const lastFileId = localStorage.getItem(storageKey);
        if (lastFileId) {
          const targetFile = files.find((f) => f.id === lastFileId);
          if (targetFile) {
            void loadFileContent(targetFile);
            return;
          }
        }
      }

      // 3. Fallback to default file
      const defaultFile = files.find((f) => f.url === DEFAULT_MARKDOWN_PATH);
      if (defaultFile) {
        converterState.setSelectedFileId(defaultFile.id);
      }
    }
  }, [
    files,
    filesLoading,
    converterState.selectedFileId,
    converterState,
    fileIdFromUrl,
    user.email,
    loadFileContent,
  ]);

  // Sync state changes to URL and LocalStorage
  useEffect(() => {
    if (converterState.selectedFileId) {
      // URL Sync
      const params = new URLSearchParams(searchParams.toString());
      if (params.get('fileId') !== converterState.selectedFileId) {
        params.set('fileId', converterState.selectedFileId);
        router.replace(`?${params.toString()}`, { scroll: false });
      }

      // LocalStorage Sync
      if (user.email) {
        const storageKey = `markify_last_file_${user.email}`;
        localStorage.setItem(storageKey, converterState.selectedFileId);
      }
    } else {
      // Cleanup if deselected
      if (searchParams.has('fileId')) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('fileId');
        router.replace(`?${params.toString()}`, { scroll: false });
      }
      // Optional: Clear local storage? No, let's keep the last one unless explicitly handled.
    }
  }, [converterState.selectedFileId, searchParams, router, user.email]);

  const handleUnifiedDelete = useCallback(
    (id: string | string[]) => {
      if (Array.isArray(id)) {
        void handleBulkDelete(id);
      } else {
        void handleDelete(id);
      }
    },
    [handleDelete, handleBulkDelete],
  );

  const handleFileSelect = useCallback(
    async (node: FileTreeNode) => {
      if (node.type === 'file' && node.file) {
        // Check if it's an image
        const isImage =
          node.file.mimeType.startsWith('image/') ||
          node.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);

        if (isImage) {
          // Find all images in the same folder/batch
          const currentPath = node.path;
          const lastSlash = currentPath.lastIndexOf('/');
          const parentDir = lastSlash !== -1 ? currentPath.substring(0, lastSlash) : '';

          const targetBatchId = node.batchId || 'no-batch';
          const gallery = files.filter((f) => {
            const isImg =
              f.mimeType.startsWith('image/') ||
              f.originalName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
            if (!isImg) {
              return false;
            }

            const fPath = f.relativePath || f.originalName;
            const fLastSlash = fPath.lastIndexOf('/');
            const fParentDir = fLastSlash !== -1 ? fPath.substring(0, fLastSlash) : '';

            // Same parent directory and same normalized batch
            const fBatchId = f.batchId || 'no-batch';
            return fParentDir === parentDir && fBatchId === targetBatchId;
          });

          converterState.setActiveImage(node.file);
          converterState.setImageGallery(gallery);
          return;
        }

        if (!node.file.originalName.endsWith('.md')) {
          return;
        }

        try {
          const fileUrl = node.file.url || '';
          const fetchUrl =
            fileUrl.startsWith('/uploads/') && !fileUrl.startsWith('/api/')
              ? `/api${fileUrl}`
              : fileUrl;

          const response = await fetch(fetchUrl);
          if (response.ok) {
            const text = await response.text();
            converterState.handleContentChange(text);
            converterState.setFilename(node.file.originalName);
            converterState.setSelectedFileId(node.file.id);

            // Set base path for images if it's a batch/folder upload
            if (fileUrl) {
              const lastSlashIndex = fileUrl.lastIndexOf('/');
              if (lastSlashIndex !== -1) {
                const directoryPath = fileUrl.substring(0, lastSlashIndex);
                // Only prepend /api for uploaded files (in /uploads), not for default content (in /content-x)
                const finalBasePath =
                  directoryPath.startsWith('/api/') || !directoryPath.startsWith('/uploads')
                    ? directoryPath
                    : `/api${directoryPath}`;
                converterState.setBasePath(finalBasePath);
              }
            }
          }
        } catch (error) {
          logger.error('Failed to load file content:', error);
        }
      }
    },
    [converterState, files],
  );

  const handleFileUploadWithRefresh = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await converterState.handleFileUpload(e);
      void refreshFiles();
    },
    [converterState, refreshFiles],
  );

  const handleFolderUploadWithRefresh = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await converterState.handleFolderUpload(e);
      void refreshFiles();
    },
    [converterState, refreshFiles],
  );

  return (
    <EditorView
      user={user}
      files={files}
      filesLoading={filesLoading}
      handleFileDelete={handleUnifiedDelete}
      handleFileRename={handleRename}
      onFileSelect={handleFileSelect}
      refreshFiles={refreshFiles}
      {...converterState}
      handleFileUpload={handleFileUploadWithRefresh}
      handleFolderUpload={handleFolderUploadWithRefresh}
    />
  );
}
