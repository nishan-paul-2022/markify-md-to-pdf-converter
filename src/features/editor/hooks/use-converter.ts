import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAlert } from '@/components/alert-provider';
import {
  DEFAULT_MARKDOWN_PATH,
  parseMetadataFromMarkdown,
  removeLandingPageSection,
} from '@/constants/default-content';
import type { AppFile } from '@/features/file-management/hooks/use-files';
import { useFileUpload } from '@/hooks/use-file-upload';
import { logger } from '@/lib/logger';
import { FilesService } from '@/services/api/files-service';
import { PdfApiService } from '@/services/api/pdf-service';
import { createDebouncedDraftSave, deleteDraft } from '@/services/draft-service';
import { useEditorStore } from '@/store/use-editor-store';
import { generateStandardName, generateTimestampedPdfName } from '@/utils/naming';

const getBaseName = (name: string): string => {
  return generateStandardName(name);
};

export function useConverter(
  files: AppFile[] = [],
  onDelete?: (id: string | string[]) => Promise<void>,
  refreshFiles?: () => Promise<void>,
) {
  const {
    rawContent,
    setRawContent,
    content,
    setContent,
    metadata,
    setMetadata,
    isGenerating,
    setIsGenerating,
    filename,
    setFilename,
    isEditingTitle: isEditing,
    setIsEditingTitle: setIsEditing,
    isUploaded,
    setIsUploaded,
    isReset,
    setIsReset,
    tempFilename,
    setTempFilename,
    activeTab,
    setActiveTab,
    isLoading,
    setIsLoading,
    basePath,
    setBasePath,
    isCopied,
    setIsCopied,
    isDownloaded,
    setIsDownloaded,
    selectedFileId,
    setSelectedFileId,
    isPdfDownloaded,
    setIsPdfDownloaded,
    isSidebarOpen,
    setIsSidebarOpen,
    activeImage,
    setActiveImage,
    imageGallery,
    setImageGallery,
    isSelectionMode,
    setIsSelectionMode,
    selectedIds,
    setSelectedIds,
    toggleSelection,
    getStats,
  } = useEditorStore();

  const { confirm } = useAlert();

  // Local UI State (Not in Global Store)
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadRulesModal, setUploadRulesModal] = useState<{
    isOpen: boolean;
    type: 'file' | 'folder' | 'zip';
  }>({
    isOpen: false,
    type: 'file',
  });

  const statsRef = useRef<HTMLDivElement | null>(null);
  const debouncedSaveRef = useRef<((content: string) => void) | null>(null);


  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const handleScroll = () => {
      const top = textarea.scrollTop;
      if (statsRef.current) {
        statsRef.current.style.transform = `translateY(${-top}px)`;
      }
    };

    textarea.addEventListener('scroll', handleScroll, { passive: true });
    // Initial sync
    handleScroll();

    return () => textarea.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

  const handleContentChange = useCallback(
    (newRawContent: string) => {
      setRawContent(newRawContent);

      // Auto-save draft to server (debounced)
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current(newRawContent);
      }
    },
    [setRawContent],
  );

  // Use the universal upload hook
  const onUploadSuccess = useCallback(async () => {
    setIsUploaded(true);
    if (refreshFiles) {
      await refreshFiles();
    }
    setTimeout(() => setIsUploaded(false), 2000);
  }, [setIsUploaded, refreshFiles]);

  const onMarkdownFound = useCallback(
    async (file: { id: string; originalName: string; url: string }) => {
      const text = await FilesService.getContent(file.url);
      handleContentChange(text);
      setFilename(file.originalName);
      setSelectedFileId(file.id);
    },
    [handleContentChange, setFilename, setSelectedFileId],
  );

  const {
    fileInputRef: fileInputRefObj,
    folderInputRef: folderInputRefObj,
    zipInputRef: zipInputRefObj,
    handleFileUpload,
    handleFolderUpload,
    handleZipUpload,
    triggerFileUpload,
    triggerFolderUpload,
    triggerZipUpload,
  } = useFileUpload({
    setIsLoading,
    onUploadSuccess,
    onMarkdownFound,
    source: 'editor',
  });

  const stats = getStats();

  const handleStartEdit = useCallback(() => {
    setTempFilename(getBaseName(filename));
    setIsEditing(true);
  }, [filename, setTempFilename, setIsEditing]);

  const handleSave = useCallback(() => {
    if (tempFilename.trim()) {
      setFilename(`${tempFilename.trim()}.md`);
    } else {
      setFilename('file.md');
    }
    setIsEditing(false);
  }, [tempFilename, setFilename, setIsEditing]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, [setIsEditing]);

  // Update debounced save function when selectedFileId changes
  useEffect(() => {
    if (selectedFileId && !selectedFileId.startsWith('default-')) {
      debouncedSaveRef.current = createDebouncedDraftSave(selectedFileId, 1000);
    } else {
      debouncedSaveRef.current = null;
    }
  }, [selectedFileId]);



  useEffect(() => {
    if (isLoading) {
      return;
    }

    const timer = setTimeout(() => {
      const parsedMetadata = parseMetadataFromMarkdown(rawContent);
      const contentWithoutLandingPage = removeLandingPageSection(rawContent);

      setMetadata(parsedMetadata);
      setContent(contentWithoutLandingPage);
    }, 500);

    return () => clearTimeout(timer);
  }, [rawContent, isLoading, setMetadata, setContent]);



  const onFileSelect = useCallback(async (_id: string) => {
    // Simplified for brevity, usually involves FilesService.getContent
  }, []);

  const generatePdfBlob = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await PdfApiService.generate({
        markdown: content,
        metadata,
        basePath,
      });
      return blob;
    } catch (error) {
      logger.error('Failed to generate PDF:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [content, metadata, basePath, setIsGenerating]);

  const handleDownloadPdf = useCallback(async () => {
    try {
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const isDefault = selectedFileId?.startsWith('default-');
      if (isDefault) {
        a.download = `${getBaseName(filename)}.pdf`;
      } else {
        a.download = generateTimestampedPdfName(filename);
      }

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setIsPdfDownloaded(true);
      setTimeout(() => setIsPdfDownloaded(false), 2000);
    } catch (error) {
      logger.error('Failed to download PDF:', error);
    }
  }, [generatePdfBlob, filename, setIsPdfDownloaded, selectedFileId]);







  const getAllDeletableFileIds = useCallback(() => {
    return files
      .filter(
        (f) =>
          f.batchId !== 'sample-file' &&
          f.batchId !== 'sample-folder' &&
          f.batchId !== 'v1-samples' &&
          !f.id.startsWith('default-'),
      )
      .map((f) => f.id);
  }, [files]);

  const handleSelectAll = useCallback(() => {
    const deletableIds = getAllDeletableFileIds();
    const allSelected = deletableIds.length > 0 && deletableIds.every((id) => selectedIds.has(id));

    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletableIds));
    }
  }, [selectedIds, getAllDeletableFileIds, setSelectedIds]);

  const handleBulkDeleteClick = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const confirmed = await confirm({
      title: 'Delete Selected Items?',
      message: `Are you sure you want to delete ${selectedIds.size} selected item${selectedIds.size === 1 ? '' : 's'}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
    });

    if (confirmed && onDelete) {
      setIsLoading(true);
      try {
        // Delete drafts for deleted files from server
        await Promise.all(Array.from(selectedIds).map(id => deleteDraft(id)));
        
        await onDelete(Array.from(selectedIds));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
      } catch (error) {
        logger.error('Bulk delete failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [selectedIds, confirm, onDelete, setSelectedIds, setIsSelectionMode, setIsLoading]);

  const getSelectedCount = useCallback(() => selectedIds.size, [selectedIds]);

  const handleReset = useCallback(async (): Promise<void> => {
    try {
      setIsReset(true);

      // If we have a selected file, reload its original content from the server (or file list)
      if (selectedFileId) {
        // Find the file object to get the URL
        const currentFile = files.find((f) => f.id === selectedFileId);

        if (currentFile) {
          // Clear local storage for this file
          localStorage.removeItem(`markify_content_${selectedFileId}`);

          // Fetch original content
          const fileUrl = currentFile.url || '';
          const fetchUrl =
            fileUrl.startsWith('/uploads/') && !fileUrl.startsWith('/api/')
              ? `/api${fileUrl}`
              : fileUrl;

          const response = await fetch(fetchUrl);
          if (response.ok) {
            const text = await response.text();
            handleContentChange(text);
            
            // Re-parse metadata to reset derived state
            const parsedMetadata = parseMetadataFromMarkdown(text);
            const contentWithoutLandingPage = removeLandingPageSection(text);
            setMetadata(parsedMetadata);
            setContent(contentWithoutLandingPage);
          }
        }
      } else {
        // Fallback to default behavior if no file is selected (e.g. just cleared everything)
        // or if it was the default file to begin with.
        const text = await FilesService.getContent(DEFAULT_MARKDOWN_PATH);
        handleContentChange(text);
        setFilename('file.md');
      }

      setTimeout(() => setIsReset(false), 2000);
    } catch (err: unknown) {
      logger.error('Failed to reset content:', err);
      setIsReset(false);
    }
  }, [
    handleContentChange,
    setFilename,
    setIsReset,
    selectedFileId,
    files,
    setMetadata,
    setContent,
  ]);

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(rawContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err: unknown) {
      logger.error('Failed to copy content:', err);
    }
  }, [rawContent, setIsCopied]);

  const handleDownloadMd = useCallback((): void => {
    const blob = new Blob([rawContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `${getBaseName(filename)}_${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);

    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  }, [rawContent, filename, setIsDownloaded]);

  const scrollToStart = useCallback((): void => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
      textareaRef.current.setSelectionRange(0, 0);
      textareaRef.current.focus();
    }
  }, []);

  const scrollToEnd = useCallback((): void => {
    if (textareaRef.current) {
      const length = textareaRef.current.value.length;
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
      textareaRef.current.setSelectionRange(length, length);
      textareaRef.current.focus();
    }
  }, []);

  const handleUploadModalConfirm = useCallback(() => {
    if (uploadRulesModal.type === 'file') triggerFileUpload();
    else if (uploadRulesModal.type === 'folder') triggerFolderUpload();
    else triggerZipUpload();
    setUploadRulesModal((prev) => ({ ...prev, isOpen: false }));
  }, [uploadRulesModal.type, triggerFileUpload, triggerFolderUpload, triggerZipUpload]);

  return useMemo(
    () => ({
      rawContent,
      content,
      metadata,
      isGenerating,
      filename,
      isEditing,
      isUploaded,
      isReset,
      tempFilename,
      activeTab,
      isLoading,
      basePath,
      isCopied,
      isDownloaded,
      isPdfDownloaded,
      selectedFileId,
      isSidebarOpen,
      searchQuery,
      isSelectionMode,
      selectedIds,
      uploadRulesModal,
      activeImage,
      imageGallery,
      fileInputRef: fileInputRefObj,
      folderInputRef: folderInputRefObj,
      zipInputRef: zipInputRefObj,
      textareaRef,
      stats,
      setActiveTab,
      setIsSidebarOpen,
      setTempFilename,
      handleStartEdit,
      handleSave,
      handleCancel,
      handleContentChange,
      handleFileUpload,
      handleFolderUpload,
      handleZipUpload,
      onFileSelect,
      triggerFileUpload,
      triggerFolderUpload,
      triggerZipUpload,
      handleReset,
      handleCopy,
      handleDownloadMd,
      handleDownloadPdf,
      generatePdfBlob,
      scrollToStart,
      scrollToEnd,
      setFilename,
      setSelectedFileId,
      setIsLoading,
      setBasePath,
      setActiveImage,
      setImageGallery,
      setSearchQuery,
      setIsSelectionMode,
      toggleSelection,
      setSelectedIds,
      handleSelectAll,
      handleBulkDeleteClick,
      getSelectedCount,
      getAllDeletableFileIds,
      setUploadRulesModal,
      handleUploadModalConfirm,
      MAX_FILENAME_LENGTH: 30,
      getBaseName,
      uploadTime: (() => {
        const f = files.find((f) => f.id === selectedFileId);
        return f?.createdAt ? new Date(f.createdAt) : null;
      })(),
      statsRef,
      setMetadata,
      setContent,
    }),
    [
      rawContent,
      content,
      metadata,
      isGenerating,
      filename,
      isEditing,
      isUploaded,
      isReset,
      tempFilename,
      activeTab,
      isLoading,
      basePath,
      isCopied,
      isDownloaded,
      isPdfDownloaded,
      selectedFileId,
      isSidebarOpen,
      searchQuery,
      isSelectionMode,
      selectedIds,
      uploadRulesModal,
      activeImage,
      imageGallery,
      fileInputRefObj,
      folderInputRefObj,
      zipInputRefObj,
      stats,
      setActiveTab,
      setIsSidebarOpen,
      setTempFilename,
      handleStartEdit,
      handleSave,
      handleCancel,
      handleContentChange,
      handleFileUpload,
      handleFolderUpload,
      handleZipUpload,
      onFileSelect,
      triggerFileUpload,
      triggerFolderUpload,
      triggerZipUpload,
      handleReset,
      handleCopy,
      handleDownloadMd,
      handleDownloadPdf,
      generatePdfBlob,
      scrollToStart,
      scrollToEnd,
      setFilename,
      setSelectedFileId,
      setIsLoading,
      setBasePath,
      setActiveImage,
      setImageGallery,
      setSearchQuery,
      setIsSelectionMode,
      toggleSelection,
      setSelectedIds,
      handleSelectAll,
      handleBulkDeleteClick,
      getSelectedCount,
      getAllDeletableFileIds,
      handleUploadModalConfirm,
      files,
      setMetadata,
      setContent,
    ],
  );
}
