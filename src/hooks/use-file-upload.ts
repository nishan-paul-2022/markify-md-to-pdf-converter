import { useCallback, useRef } from 'react';

import { useAlert } from '@/components/alert-provider';
import { logger } from '@/lib/logger';
import { FilesService } from '@/services/api/files-service';
import { validateUploadStructure } from '@/services/upload-validator';

interface UseFileUploadOptions {
  onUploadSuccess?: () => Promise<void>;
  setIsLoading?: (loading: boolean) => void;
  // If provided, we'll auto-select/display the first markdown file
  onMarkdownFound?: (file: { id: string; originalName: string; url: string }) => Promise<void>;
  source: 'editor' | 'converter';
}

export function useFileUpload({
  onUploadSuccess,
  setIsLoading,
  onMarkdownFound,
  source,
}: UseFileUploadOptions) {
  const { show: showAlert } = useAlert();

  // Refs for input elements so they can be triggered programmatically
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    if (setIsLoading) setIsLoading(loading);
  }, [setIsLoading]);

  /**
   * Universal File Uploader
   */
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setLoading(true);
      const batchId = self.crypto.randomUUID();

      try {
        const filesArray = Array.from(files);

        // 1. Run validation
        const validation = await validateUploadStructure(filesArray, 'single');
        if (!validation.valid) {
          showAlert({
            title: 'Invalid File',
            message: validation.error || 'Invalid selection.',
            variant: 'destructive',
          });
          return;
        }

        const uploadPromises = validation.filteredFiles.map((file) =>
          FilesService.upload(file, batchId, file.name, source),
        );

        const results = await Promise.all(uploadPromises);

        // Notify parent of success
        if (onUploadSuccess) await onUploadSuccess();

        // Check for markdown file to open (editor only mostly)
        if (onMarkdownFound) {
          const mdResult = [...results].reverse().find((r) => r.originalName.endsWith('.md'));
          if (mdResult) {
            await onMarkdownFound(mdResult);
          }
        }
      } catch (error: unknown) {
        logger.error('Upload failed:', error);
        showAlert({
          title: 'Upload Failed',
          message: error instanceof Error ? error.message : 'Failed to upload files',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        event.target.value = '';
      }
    },
    [onUploadSuccess, onMarkdownFound, showAlert, source, setLoading],
  );

  /**
   * Universal Folder Uploader
   */
  const handleFolderUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) return;

      setLoading(true);
      const batchId = self.crypto.randomUUID();

      try {
        const filesArray = Array.from(fileList);

        // 1. Run high-precision validation (async)
        const validation = await validateUploadStructure(filesArray, 'folder');
        if (!validation.valid) {
          showAlert({
            title: 'Invalid Folder',
            message: validation.error || 'Invalid selection.',
            variant: 'destructive',
          });
          return;
        }

        // 3. Proceed with upload
        const uploadPromises = validation.filteredFiles.map((file) => {
          const relativePath =
            (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
          return FilesService.upload(file, batchId, relativePath, source);
        });

        const results = await Promise.all(uploadPromises);

        if (onUploadSuccess) await onUploadSuccess();

        if (onMarkdownFound) {
          const mdResult = [...results].reverse().find((r) => r.originalName.endsWith('.md'));
          if (mdResult) {
            await onMarkdownFound(mdResult);
          }
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Folder upload failed';
        logger.error('Folder validation error:', message);
        showAlert({
          title: 'Upload Failed',
          message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        event.target.value = '';
      }
    },
    [onUploadSuccess, onMarkdownFound, showAlert, source, setLoading],
  );

  /**
   * Universal ZIP Uploader
   */
  const handleZipUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const zipFile = files[0];
      if (!zipFile.name.endsWith('.zip')) {
        showAlert({
          title: 'Invalid File',
          message: 'Only .zip files are allowed.',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);
      const batchId = self.crypto.randomUUID();

      try {
        // Dynamically import JSZip
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(zipFile);

        // 1. Convert zip contents to Virtual Files for validation
        const virtualFiles: File[] = [];
        const fileDataPromises: Promise<void>[] = [];

        zipContent.forEach((relativePath, file) => {
          if (!file.dir) {
            fileDataPromises.push(
              (async () => {
                const blob = await file.async('blob');
                const virtualFile = new File([blob], relativePath, { type: blob.type });
                // We fake webkitRelativePath for the validator to treat it as a folder structure
                Object.defineProperty(virtualFile, 'webkitRelativePath', {
                  value: relativePath,
                });
                virtualFiles.push(virtualFile);
              })(),
            );
          }
        });

        await Promise.all(fileDataPromises);

        // 2. Run high-precision validation (async)
        const validation = await validateUploadStructure(virtualFiles, 'zip');
        if (!validation.valid) {
          showAlert({
            title: 'Invalid Archive',
            message: validation.error || 'The zip file does not meet the requirements.',
            variant: 'destructive',
          });
          return;
        }

        const uploadPromises: Promise<{ id: string; url: string; originalName: string }>[] = [];

        // 4. Proceed with upload
        validation.filteredFiles.forEach((file) => {
          const relativePath =
            (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
          uploadPromises.push(
            (async () => {
              return FilesService.upload(file, batchId, relativePath, source);
            })(),
          );
        });

        const results = await Promise.all(uploadPromises);

        if (onUploadSuccess) await onUploadSuccess();

        if (onMarkdownFound) {
          const mdResult = [...results].reverse().find((r) => r.originalName.endsWith('.md'));
          if (mdResult) {
            await onMarkdownFound(mdResult);
          }
        }
      } catch (error: unknown) {
        logger.error('Zip upload failed:', error);
        showAlert({
          title: 'Upload Failed',
          message: error instanceof Error ? error.message : 'Failed to process zip archive',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
        event.target.value = '';
      }
    },
    [onUploadSuccess, onMarkdownFound, showAlert, source, setLoading],
  );

  return {
    fileInputRef,
    folderInputRef,
    zipInputRef,
    handleFileUpload,
    handleFolderUpload,
    handleZipUpload,
    triggerFileUpload: () => fileInputRef.current?.click(),
    triggerFolderUpload: () => folderInputRef.current?.click(),
    triggerZipUpload: () => zipInputRef.current?.click(),
  };
}
