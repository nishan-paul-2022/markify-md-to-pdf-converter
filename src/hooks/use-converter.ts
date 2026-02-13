import { useCallback, useEffect, useRef } from 'react';

import { getAlert } from '@/components/AlertProvider';
import {
  DEFAULT_MARKDOWN_PATH,
  parseMetadataFromMarkdown,
  removeLandingPageSection,
} from '@/constants/default-content';
import { logger } from '@/lib/logger';
import { extractImageReferences, validateUploadStructure } from '@/lib/services/upload-validator';
import { generateStandardName } from '@/lib/utils/naming';
import { useEditorStore } from '@/store/use-editor-store';

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
    activeImage,
    setActiveImage,
    imageGallery,
    setImageGallery,
    getStats,
  } = useEditorStore();

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
      // Logic for isEditorAtTop can also go to store if needed
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
    setIsLoading(true);
    fetch(DEFAULT_MARKDOWN_PATH)
      .then((res) => res.text())
      .then((text) => {
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

        setIsLoading(false);
      })
      .catch((err: unknown) => {
        logger.error('Failed to load default content:', err);
        setIsLoading(false);
      });
  }, [setRawContent, setMetadata, setContent, setBasePath, setIsLoading]);

  const generatePdfBlob = useCallback(async (): Promise<Blob> => {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        markdown: content,
        metadata: metadata,
        basePath: basePath,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    return await response.blob();
  }, [content, metadata, basePath]);

  const handleDownloadPdf = useCallback(async (): Promise<void> => {
    setIsGenerating(true);
    try {
      const blob = await generatePdfBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // We'll keep the timestamp utility local or move to lib later
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `${getBaseName(filename)}_${timestamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      setIsPdfDownloaded(true);
      setTimeout(() => setIsPdfDownloaded(false), 2000);
    } catch (error: unknown) {
      logger.error('Error downloading PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [generatePdfBlob, filename, setIsGenerating, setIsPdfDownloaded]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = event.target.files;
      if (files && files.length > 0) {
        logger.info('📤 File upload triggered, count:', files.length);

        const fileList = Array.from(files);
        const mdFile = fileList.find((f) => f.name.endsWith('.md'));

        if (mdFile) {
          setFilename(mdFile.name);
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
              handleContentChange(text);
            }
          };
          reader.readAsText(mdFile);
        }

        setIsLoading(true);
        const batchId = self.crypto.randomUUID();

        try {
          const uploadPromises = fileList.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('batchId', batchId);
            formData.append('relativePath', file.name);
            formData.append('source', 'editor');

            const response = await fetch('/api/files', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const errorText = await response.text();
              let errorMsg = 'Upload failed';
              try {
                const errorJson = JSON.parse(errorText);
                errorMsg = errorJson.error || errorMsg;
              } catch {
                errorMsg = errorText || errorMsg;
              }
              logger.error(`❌ Upload failed for ${file.name}:`, {
                status: response.status,
                message: errorMsg,
              });
              return { error: errorMsg, file: file.name };
            }

            return await response.json();
          });

          const results = await Promise.all(uploadPromises);
          const successfulResults = results.filter((r) => r && !('error' in r));
          const failedResults = results.filter((r) => r && 'error' in r);

          if (failedResults.length > 0) {
            const api = getAlert();
            const msg = (failedResults[0] as { error: string }).error;
            if (api) {
              api.show({ title: 'Upload Failed', message: msg, variant: 'destructive' });
            } else {
              alert(msg);
            }
          }

          const mdResult = successfulResults.find(
            (r) => r.file && r.file.originalName.endsWith('.md'),
          );
          if (mdResult && mdResult.file) {
            setSelectedFileId(mdResult.file.id);
          }

          if (mdResult && mdResult.file && mdResult.file.url) {
            const fileUrl = mdResult.file.url;
            const lastSlashIndex = fileUrl.lastIndexOf('/');
            if (lastSlashIndex !== -1) {
              const dirPath = fileUrl.substring(0, lastSlashIndex);
              setBasePath(dirPath.startsWith('/api') ? dirPath : '/api' + dirPath);
            }
          }

          const now = new Date();
          uploadTimeRef.current = now;
          lastModifiedTimeRef.current = now;
          setIsUploaded(true);
          setTimeout(() => setIsUploaded(false), 2000);
        } catch (error) {
          logger.error('Error uploading files:', error);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [handleContentChange, setFilename, setIsLoading, setSelectedFileId, setBasePath, setIsUploaded],
  );

  const handleFolderUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const inputFiles = Array.from(files);

        const markdownFiles = inputFiles.filter((f) => f.name.toLowerCase().endsWith('.md'));
        const referencedImages = new Set<string>();
        await Promise.all(
          markdownFiles.map(async (mdFile) => {
            try {
              const text = await mdFile.text();
              extractImageReferences(text).forEach((ref: string) => referencedImages.add(ref));
            } catch (err) {
              logger.error(`Failed to read markdown ${mdFile.name}:`, err);
            }
          }),
        );
        const validation = validateUploadStructure(inputFiles, referencedImages);
        if (!validation.valid) {
          const msg = validation.error ?? 'Invalid folder structure. Upload blocked.';
          const api = getAlert();
          if (api) {
            api.show({ title: 'Invalid Folder', message: msg, variant: 'destructive' });
          } else {
            alert(msg);
          }
          event.target.value = '';
          return;
        }

        const processedFiles = validation.filteredFiles;
        const mdFile = processedFiles.find((f) => f.name.endsWith('.md'));

        if (mdFile) {
          setFilename(mdFile.name);
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
              handleContentChange(text);
            }
          };
          reader.readAsText(mdFile);
        }

        setIsLoading(true);
        const batchId = self.crypto.randomUUID();

        try {
          const uploadPromises = processedFiles.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('batchId', batchId);
            formData.append('relativePath', file.webkitRelativePath || file.name);
            formData.append('source', 'editor');

            const response = await fetch('/api/files', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              return { error: 'Upload failed', file: file.name };
            }

            return await response.json();
          });

          const results = await Promise.all(uploadPromises);
          const successfulResults = results.filter((r) => r && !('error' in r));
          const failedResults = results.filter((r) => r && 'error' in r);

          if (failedResults.length > 0) {
            const api = getAlert();
            const firstError = (failedResults[0] as { error: string }).error;
            if (api) {
              api.show({ title: 'Invalid Folder', message: firstError, variant: 'destructive' });
            } else {
              alert(firstError);
            }
          }

          const folderMdResult = successfulResults.find(
            (r) =>
              r &&
              r.file &&
              mdFile &&
              (r.file.originalName === mdFile.name ||
                (r.file.relativePath && r.file.relativePath.endsWith(mdFile.name))),
          );

          if (folderMdResult && folderMdResult.file) {
            setSelectedFileId(folderMdResult.file.id);
            if (folderMdResult.file.url) {
              const fileUrl = folderMdResult.file.url;
              const lastSlashIndex = fileUrl.lastIndexOf('/');
              if (lastSlashIndex !== -1) {
                const dirPath = fileUrl.substring(0, lastSlashIndex);
                setBasePath(dirPath.startsWith('/api') ? dirPath : '/api' + dirPath);
              }
            }
          }

          const now = new Date();
          uploadTimeRef.current = now;
          setIsUploaded(true);
          setTimeout(() => setIsUploaded(false), 2000);
        } catch (error) {
          logger.error('Error uploading folder:', error);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [handleContentChange, setFilename, setIsLoading, setSelectedFileId, setBasePath, setIsUploaded],
  );

  const handleZipUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = event.target.files;
      if (!files || files.length === 0) {
        return;
      }

      const archiveFiles = Array.from(files);
      const unsupportedFiles = archiveFiles.filter(
        (f) => !f.name.match(/\.(zip|7z|rar|tar|tar\.gz|tgz)$/i),
      );

      if (unsupportedFiles.length > 0) {
        const api = getAlert();
        const msg = `Upload failed — archives only. Unsupported: ${unsupportedFiles.map((f) => f.name).join(', ')}`;
        if (api) {
          api.show({ title: 'Invalid File', message: msg, variant: 'destructive' });
        } else {
          alert(msg);
        }
        event.target.value = '';
        return;
      }

      setIsLoading(true);
      try {
        const uploadPromises = archiveFiles.map(async (archiveFile) => {
          const formData = new FormData();
          formData.append('file', archiveFile);
          formData.append('source', 'editor');

          const response = await fetch('/api/files/archive', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || `Archive processing failed`);
          }
          return result;
        });

        const results = await Promise.all(uploadPromises);
        let allExtractedFiles: { originalName: string; url: string; id: string }[] = [];
        results.forEach((res) => {
          if (res.files) {
            allExtractedFiles = [...allExtractedFiles, ...res.files];
          }
        });

        const mdFileResult = allExtractedFiles.find((f) => f.originalName.endsWith('.md'));

        if (mdFileResult) {
          const contentRes = await fetch(mdFileResult.url);
          if (contentRes.ok) {
            const text = await contentRes.text();
            handleContentChange(text);
          }
          setFilename(mdFileResult.originalName);
          setSelectedFileId(mdFileResult.id);

          if (mdFileResult.url) {
            const fileUrl = mdFileResult.url;
            const lastSlashIndex = fileUrl.lastIndexOf('/');
            if (lastSlashIndex !== -1) {
              const dirPath = fileUrl.substring(0, lastSlashIndex);
              setBasePath(dirPath.startsWith('/api') ? dirPath : `/api${dirPath}`);
            }
          }
        }

        setIsUploaded(true);
        setTimeout(() => setIsUploaded(false), 2000);
      } catch (error) {
        logger.error('Error processing archive:', error);
      } finally {
        setIsLoading(false);
        event.target.value = '';
      }
    },
    [handleContentChange, setFilename, setIsLoading, setSelectedFileId, setBasePath, setIsUploaded],
  );

  const handleReset = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(DEFAULT_MARKDOWN_PATH);
      const text = await res.text();

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
    fileInputRef,
    folderInputRef,
    zipInputRef,
    textareaRef,
    stats,
    setActiveTab,
    setTempFilename,
    handleStartEdit,
    handleSave,
    handleCancel,
    handleContentChange,
    handleFileUpload,
    handleFolderUpload,
    handleZipUpload,
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
    activeImage,
    setActiveImage,
    imageGallery,
    setImageGallery,
    MAX_FILENAME_LENGTH: 30,
    getBaseName,
    uploadTime: uploadTimeRef.current,
    lastModifiedTime: lastModifiedTimeRef.current,
    isEditorAtTop: true, // simplified for now
  };
}
