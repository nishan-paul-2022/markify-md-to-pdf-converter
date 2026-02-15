import { useCallback, useEffect, useRef, useState } from 'react';

import { useAlert } from '@/components/alert-provider';
import {
  DEFAULT_MARKDOWN_PATH,
  parseMetadataFromMarkdown,
  removeLandingPageSection,
} from '@/constants/default-content';
import type { AppFile } from '@/features/file-management/hooks/use-files';
import { logger } from '@/lib/logger';
import { FilesService } from '@/services/api/files-service';
import { PdfApiService } from '@/services/api/pdf-service';
import { useEditorStore } from '@/store/use-editor-store';
import { generateStandardName, generateTimestampedPdfName } from '@/utils/naming';

const getBaseName = (name: string): string => {
  return generateStandardName(name);
};

export function useConverter(
  files: AppFile[] = [],
  onDelete?: (id: string | string[]) => Promise<void>,
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

  // Local UI State (Not in Global Store)
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadRulesModal, setUploadRulesModal] = useState<{
    isOpen: boolean;
    type: 'file' | 'folder' | 'zip';
  }>({
    isOpen: false,
    type: 'file',
  });

  const uploadTimeRef = useRef<Date | null>(null);
  const lastModifiedTimeRef = useRef<Date | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const handleScroll = () => {
      // Logic for isEditorAtTop
    };

    textarea.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => textarea.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

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

  const handleContentChange = useCallback(
    (newRawContent: string) => {
      setRawContent(newRawContent);
      lastModifiedTimeRef.current = new Date();
      // Auto-save to local storage (debounced in effect or direct)
      if (selectedFileId) {
        localStorage.setItem(`markify_content_${selectedFileId}`, newRawContent);
      }
    },
    [setRawContent, selectedFileId],
  );

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

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsLoading(true);
      const batchId = self.crypto.randomUUID();

      try {
        const uploadPromises = Array.from(files).map((file) =>
          FilesService.upload(file, batchId, file.name, 'editor'),
        );

        const results = await Promise.all(uploadPromises);

        const mdResult = results.find((r) => r.originalName.endsWith('.md'));
        if (mdResult) {
          const text = await FilesService.getContent(mdResult.url);
          handleContentChange(text);
          setFilename(mdResult.originalName);
          setSelectedFileId(mdResult.id);
        }

        setIsUploaded(true);
        setTimeout(() => setIsUploaded(false), 2000);
      } catch (error: unknown) {
        logger.error('Upload failed:', error);
      } finally {
        setIsLoading(false);
        event.target.value = '';
      }
    },
    [handleContentChange, setFilename, setIsLoading, setSelectedFileId, setIsUploaded],
  );

  const handleFolderUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsLoading(true);
      const batchId = self.crypto.randomUUID();

      try {
        const uploadPromises = Array.from(files).map((file) => {
          // Preserve folder structure in the file path
          const relativePath =
            (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
          return FilesService.upload(file, batchId, relativePath, 'editor');
        });

        const results = await Promise.all(uploadPromises);

        // Find the first markdown file to display
        const mdResult = results.find((r) => r.originalName.endsWith('.md'));
        if (mdResult) {
          const text = await FilesService.getContent(mdResult.url);
          handleContentChange(text);
          setFilename(mdResult.originalName);
          setSelectedFileId(mdResult.id);
        }

        setIsUploaded(true);
        setTimeout(() => setIsUploaded(false), 2000);
      } catch (error: unknown) {
        logger.error('Folder upload failed:', error);
      } finally {
        setIsLoading(false);
        event.target.value = '';
      }
    },
    [handleContentChange, setFilename, setIsLoading, setSelectedFileId, setIsUploaded],
  );

  const handleZipUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const zipFile = files[0];
      if (!zipFile.name.endsWith('.zip')) {
        logger.error('Invalid file type. Only .zip files are allowed.');
        return;
      }

      setIsLoading(true);
      const batchId = self.crypto.randomUUID();

      try {
        // Dynamically import JSZip
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipFile);

        const uploadPromises: Promise<{ id: string; url: string; originalName: string }>[] = [];

        // Extract and upload each file from the zip
        zipContent.forEach((relativePath, file) => {
          if (!file.dir) {
            uploadPromises.push(
              (async () => {
                const blob = await file.async('blob');
                const extractedFile = new File([blob], relativePath, { type: blob.type });
                return FilesService.upload(extractedFile, batchId, relativePath, 'editor');
              })(),
            );
          }
        });

        const results = await Promise.all(uploadPromises);

        // Find the first markdown file to display
        const mdResult = results.find((r) => r.originalName.endsWith('.md'));
        if (mdResult) {
          const text = await FilesService.getContent(mdResult.url);
          handleContentChange(text);
          setFilename(mdResult.originalName);
          setSelectedFileId(mdResult.id);
        }

        setIsUploaded(true);
        setTimeout(() => setIsUploaded(false), 2000);
      } catch (error: unknown) {
        logger.error('Zip upload failed:', error);
      } finally {
        setIsLoading(false);
        event.target.value = '';
      }
    },
    [handleContentChange, setFilename, setIsLoading, setSelectedFileId, setIsUploaded],
  );

  const getAllDeletableFileIds = useCallback(() => {
    return files
      .filter(
        (f) =>
          f.batchId !== 'sample-file' &&
          f.batchId !== 'sample-folder' &&
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

  const { confirm } = useAlert();

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
    if (uploadRulesModal.type === 'file') fileInputRef.current?.click();
    else if (uploadRulesModal.type === 'folder') folderInputRef.current?.click();
    else zipInputRef.current?.click();
    setUploadRulesModal((prev) => ({ ...prev, isOpen: false }));
  }, [uploadRulesModal.type]);

  return {
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
    fileInputRef,
    folderInputRef,
    zipInputRef,
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
    triggerFileUpload: () => fileInputRef.current?.click(),
    triggerFolderUpload: () => folderInputRef.current?.click(),
    triggerZipUpload: () => zipInputRef.current?.click(),
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
    uploadTime: uploadTimeRef.current,
    lastModifiedTime: lastModifiedTimeRef.current,
    isEditorAtTop: true, // simplified for now
    setMetadata,
    setContent,
  };
}
