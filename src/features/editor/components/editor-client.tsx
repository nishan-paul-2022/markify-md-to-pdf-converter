import React, { useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  DEFAULT_MARKDOWN_PATH,
  parseMetadataFromMarkdown,
  removeLandingPageSection,
} from '@/constants/default-content';
import EditorView from '@/features/editor/components/editor-view';
import { useConverter } from '@/features/editor/hooks/use-converter';
import { useFiles } from '@/features/file-management/hooks/use-files';
import type { FileTreeNode } from '@/features/file-management/utils/file-tree';
import { logger } from '@/lib/logger';
import { fetchDraft } from '@/services/draft-service';

interface EditorClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function EditorClient({ user }: EditorClientProps): React.JSX.Element {
  const {
    files,
    loading: filesLoading,
    handleDelete,
    handleBulkDelete,
    handleRename,
    refreshFiles,
  } = useFiles('editor');

  // Navigation history to handle redirection after deletion
  const [navigationHistory, setNavigationHistory] = React.useState<string[]>([]);

  const handleUnifiedDelete = useCallback(
    async (id: string | string[]) => {
      if (Array.isArray(id)) {
        await handleBulkDelete(id);
      } else {
        await handleDelete(id);
      }
    },
    [handleDelete, handleBulkDelete]
  );

  const converterState = useConverter(files, handleUnifiedDelete, refreshFiles);

  const {
    setIsLoading,
    handleContentChange,
    setMetadata,
    setContent,
    setFilename,
    setSelectedFileId,
    setBasePath,
    setActiveImage,
    setImageGallery,
    isLoading: isEditorLoading,
    selectedFileId,
    flushDraft,
  } = converterState;

  const router = useRouter();
  const searchParams = useSearchParams();
  const fileIdFromUrl = searchParams.get('fileId');

  // Helper to load file content
  const loadFileContent = useCallback(
    async (targetFile: (typeof files)[0]) => {
      setIsLoading(true);

      // CRITICAL: Flush pending drafts of the OLD file before changing rawContent
      await flushDraft();

      try {
        const fileUrl = targetFile.url || '';
        const fetchUrl =
          fileUrl.startsWith('/uploads/') && !fileUrl.startsWith('/api/')
            ? `/api${fileUrl}`
            : fileUrl;

        const response = await fetch(fetchUrl);
        if (response.ok) {
          let text = await response.text();
          
          // Check for draft from server
          if (targetFile.id && !targetFile.id.startsWith('default-')) {
            const draft = await fetchDraft(targetFile.id);
            if (draft) {
              text = draft;
              logger.info(`📝 Loaded draft from server for ${targetFile.originalName}`);
            }
          }

          // Update derived content immediately to avoid flash/delay
          const parsedMetadata = parseMetadataFromMarkdown(text);
          const contentWithoutLandingPage = removeLandingPageSection(text);
          setMetadata(parsedMetadata);
          setContent(contentWithoutLandingPage);

          // CRITICAL: Use setRawContent instead of handleContentChange for initial load.
          // This prevents the "auto-save" from triggering for the new content 
          // before the selectedFileId has updated in the store/hook.
          converterState.setRawContent(text);

          setFilename(targetFile.originalName);
          setSelectedFileId(targetFile.id);

          if (fileUrl) {
            const lastSlashIndex = fileUrl.lastIndexOf('/');
            if (lastSlashIndex !== -1) {
              const directoryPath = fileUrl.substring(0, lastSlashIndex);
              const finalBasePath =
                directoryPath.startsWith('/api/') || !directoryPath.startsWith('/uploads')
                  ? directoryPath
                  : `/api${directoryPath}`;
              setBasePath(finalBasePath);
            }
          }
        }
      } catch (error) {
        logger.error('Failed to load file:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [
      setIsLoading,
      setMetadata,
      setContent,
      setFilename,
      setSelectedFileId,
      setBasePath,
      flushDraft,
      converterState,
    ],
  );

  // Initial selection of file (URL -> LocalStorage -> Default)
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (filesLoading) return;

    if (files.length === 0) {
      if (!initialLoadDone.current) {
        setIsLoading(false);
        initialLoadDone.current = true;
      }
      return;
    }

    if (initialLoadDone.current) return;

    if (!selectedFileId) {
      initialLoadDone.current = true;

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
        void loadFileContent(defaultFile);
      } else {
        setIsLoading(false);
      }
    }
  }, [
    files,
    filesLoading,
    selectedFileId,
    fileIdFromUrl,
    user.email,
    loadFileContent,
    setIsLoading,
  ]);

  // Track navigation history
  useEffect(() => {
    if (selectedFileId) {
      setNavigationHistory((prev) => {
        // Don't add if it's already the last one
        if (prev[prev.length - 1] === selectedFileId) return prev;
        
        // Keep unique entries, move new one to the end
        const newHistory = [...prev.filter((id) => id !== selectedFileId), selectedFileId];
        
        // Limit history size to 20
        return newHistory.slice(-20);
      });
    }
  }, [selectedFileId]);

  // Handle redirection when current file is deleted
  useEffect(() => {
    if (
      filesLoading ||
      isEditorLoading ||
      files.length === 0 ||
      !selectedFileId ||
      !initialLoadDone.current
    )
      return;

    const currentFileExists = files.some((f) => f.id === selectedFileId);

    if (!currentFileExists) {
      logger.info(`🔍 Current file ${selectedFileId} no longer exists. Redirecting...`);

      // 1. Try to find the last valid file from history
      const validHistory = navigationHistory.filter((id) => files.some((f) => f.id === id));
      const fallbackId = validHistory[validHistory.length - 1];

      if (fallbackId) {
        const fallbackFile = files.find((f) => f.id === fallbackId);
        if (fallbackFile) {
          void loadFileContent(fallbackFile);
          return;
        }
      }

      // 2. Fallback to first available markdown file
      const anyMdFile = files.find((f) => f.originalName.endsWith('.md'));
      if (anyMdFile) {
        void loadFileContent(anyMdFile);
        return;
      }

      // 3. Fallback to default file
      const defaultFile = files.find((f) => f.url === DEFAULT_MARKDOWN_PATH);
      if (defaultFile) {
        void loadFileContent(defaultFile);
        return;
      }

      // 4. Last resort: clear state
      setSelectedFileId(null);
      handleContentChange('');
      setFilename('document.md');
    }
  }, [
    files,
    filesLoading,
    isEditorLoading,
    selectedFileId,
    navigationHistory,
    loadFileContent,
    setSelectedFileId,
    handleContentChange,
    setFilename,
  ]);

  // Sync state changes to URL and LocalStorage
  useEffect(() => {
    if (selectedFileId) {
      // URL Sync
      const params = new URLSearchParams(searchParams.toString());
      if (params.get('fileId') !== selectedFileId) {
        params.set('fileId', selectedFileId);
        router.replace(`?${params.toString()}`, { scroll: false });
      }

      // LocalStorage Sync
      if (user.email) {
        const storageKey = `markify_last_file_${user.email}`;
        localStorage.setItem(storageKey, selectedFileId);
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
  }, [selectedFileId, searchParams, router, user.email]);

  const handleFileSelect = useCallback(
    async (node: FileTreeNode) => {
      // First, flush any pending drafts from the current file
      await flushDraft();

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

          setActiveImage(node.file);
          setImageGallery(gallery);
          return;
        }

        // If it's a markdown file, load it using the shared logic
        if (node.file.originalName.endsWith('.md')) {
          await loadFileContent(node.file);
        }
      }
    },
    [
      files,
      setActiveImage,
      setImageGallery,
      loadFileContent,
      flushDraft,
    ],
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
      converter={converterState}
    />
  );
}
