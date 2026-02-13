import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getAlert } from '@/components/alert-provider';
import { logger } from '@/lib/logger';
import { extractImageReferences, validateUploadStructure } from '@/services/upload-validator';

const processFilesWithNaming = (filesToProcess: File[], uploadCase: number): File[] => {
  logger.info(`UseUpload: Processing ${filesToProcess.length} files for Case ${uploadCase}`);
  return filesToProcess;
};

export function useUpload() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const processUploadedFiles = useCallback(async (inputFiles: File[]) => {
    logger.info(`📦 Processing ${inputFiles.length} files...`);

    // First, identify all markdown files to extract references in parallel
    const markdownFiles = inputFiles.filter((f) => f.name.toLowerCase().endsWith('.md'));
    const referencedImages = new Set<string>();

    await Promise.all(
      markdownFiles.map(async (mdFile) => {
        try {
          const content = await mdFile.text();
          const refs = extractImageReferences(content);
          refs.forEach((ref) => referencedImages.add(ref));
        } catch (err) {
          logger.error(`Failed to read markdown ${mdFile.name}:`, err);
        }
      }),
    );

    logger.info(`🔍 Found ${referencedImages.size} unique image references in markdown.`);

    // Now validate and filter using the consolidated logic
    const validation = validateUploadStructure(inputFiles, referencedImages);

    if (!validation.valid) {
      const api = getAlert();
      if (api) {
        api.show({
          title: validation.case <= 2 ? 'Invalid File' : 'Invalid Folder',
          message: validation.error || 'Invalid selection.',
          variant: 'destructive',
        });
      } else {
        setError(validation.error || 'Invalid file structure.');
      }
      return;
    }

    setError(null);
    const processedFiles = processFilesWithNaming(validation.filteredFiles, validation.case);

    // For selective file uploads, we only allow one file at a time
    if (validation.case <= 2) {
      setFiles(processedFiles);
    } else {
      setFiles((prev) => [...prev, ...processedFiles]);
    }
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        await processUploadedFiles(selectedFiles);
        // Reset input value so same files can be selected again if needed
        e.target.value = '';
      }
    },
    [processUploadedFiles],
  );

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
      if (files.length <= 1) {
        setError(null);
      }
    },
    [files.length],
  );

  const uploadFiles = async (): Promise<void> => {
    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const batchId = crypto.randomUUID();
      const totalFiles = files.length;
      let uploadedCount = 0;

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('batchId', batchId);
        const webkitFile = file as File & { webkitRelativePath?: string };
        if (webkitFile.webkitRelativePath) {
          formData.append('relativePath', webkitFile.webkitRelativePath);
        }

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
          throw new Error(errorMsg);
        }

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      }

      setFiles([]);
      setUploadProgress(0);
      router.refresh();
    } catch (error: unknown) {
      logger.error('Upload error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to upload files';
      const api = getAlert();
      if (api) {
        api.show({ title: 'Invalid File', message: msg });
      } else {
        alert(msg);
      }
    } finally {
      setUploading(false);
    }
  };

  const triggerFolderUpload = useCallback(async (): Promise<void> => {
    const api = getAlert();
    if (api) {
      const confirmed = await api.confirm({
        title: 'Upload Project Folder',
        message:
          "You are about to upload a project folder. For the best experience, ensure your Markdown files are at the root level and any images are placed in a subfolder named 'images/'.",
        confirmText: 'Select Folder',
        cancelText: 'Cancel',
        variant: 'info',
      });
      if (!confirmed) {
        return;
      }
    }
    folderInputRef.current?.click();
  }, []);

  return {
    files,
    uploading,
    uploadProgress,
    error,
    setError,
    fileInputRef,
    folderInputRef,
    setFiles,
    handleFileSelect,
    removeFile,
    uploadFiles,
    triggerFolderUpload,
  };
}
