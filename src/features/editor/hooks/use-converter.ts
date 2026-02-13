import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_MARKDOWN_PATH,
  parseMetadataFromMarkdown,
  removeLandingPageSection,
} from '@/constants/default-content';
import { logger } from '@/lib/logger';
import { FilesService } from '@/services/api/files-service';
import { PdfApiService } from '@/services/api/pdf-service';
import { useEditorStore } from '@/store/use-editor-store';
import { generateStandardName } from '@/utils/naming';

const getBaseName = (name: string): string => {
  return generateStandardName(name);
};

export function useConverter() {
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
    getStats,
  } = useEditorStore();

  // Local UI State (Not in Global Store)
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
      setFilename('document.md');
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
    },
    [setRawContent],
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

  useEffect(() => {
    const fetchDefaultContent = async () => {
      setIsLoading(true);
      try {
        const text = await FilesService.getContent(DEFAULT_MARKDOWN_PATH);
        setRawContent(text);
        
        const parsedMetadata = parseMetadataFromMarkdown(text);
        const contentWithoutLandingPage = removeLandingPageSection(text);
        setMetadata(parsedMetadata);
        setContent(contentWithoutLandingPage);
        
        const now = new Date();
        lastModifiedTimeRef.current = now;

        const lastSlashIndex = DEFAULT_MARKDOWN_PATH.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
          setBasePath(DEFAULT_MARKDOWN_PATH.substring(0, lastSlashIndex));
        }
      } catch (err: unknown) {
        logger.error('Failed to load default content:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDefaultContent();
  }, [setRawContent, setMetadata, setContent, setIsGenerating, setIsLoading, setBasePath]);

  const onFileSelect = useCallback(
    async (_id: string) => {
      // Simplified for brevity, usually involves FilesService.getContent
    },
    [],
  );

  const generatePdfBlob = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await PdfApiService.generate({
        markdown: rawContent,
        metadata,
      });
      return blob;
    } catch (error) {
      logger.error('Failed to generate PDF:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [rawContent, metadata, setIsGenerating]);

  const handleDownloadPdf = useCallback(async () => {
    try {
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${getBaseName(filename)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setIsPdfDownloaded(true);
      setTimeout(() => setIsPdfDownloaded(false), 2000);
    } catch (error) {
      logger.error('Failed to download PDF:', error);
    }
  }, [generatePdfBlob, filename, setIsPdfDownloaded]);

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
          const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
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

  const toggleSelection = useCallback((id: string | string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const ids = Array.isArray(id) ? id : [id];
      const allInPrev = ids.every((i) => prev.has(i));

      if (allInPrev) {
        ids.forEach((i) => next.delete(i));
      } else {
        ids.forEach((i) => next.add(i));
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    // Logic to select all deletable files
  }, []);

  const handleBulkDeleteClick = useCallback(() => {
    // Alert then delete
  }, []);

  const getSelectedCount = () => selectedIds.size;
  const getAllDeletableFileIds = () => []; // placeholder

  const handleReset = useCallback(async (): Promise<void> => {
    try {
      const text = await FilesService.getContent(DEFAULT_MARKDOWN_PATH);

      handleContentChange(text);
      setFilename('document.md');
      setSelectedFileId(null);
      setIsReset(true);
      setTimeout(() => setIsReset(false), 2000);
    } catch (err: unknown) {
      logger.error('Failed to reset content:', err);
    }
  }, [handleContentChange, setFilename, setSelectedFileId, setIsReset]);

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
  };
}
