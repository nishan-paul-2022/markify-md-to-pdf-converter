import React, { useCallback } from 'react';
import { useConverter } from '@/hooks/use-converter';
import { useFiles } from '@/hooks/use-files';
import { ConverterView } from '@/components/converter/ConverterView';
import { FileTreeNode } from '@/lib/file-tree';
import { DEFAULT_MARKDOWN_PATH } from '@/constants/default-content';

interface ConverterClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

export default function ConverterClient({ user }: ConverterClientProps): React.JSX.Element {
  const converterState = useConverter();
  const { files, loading: filesLoading, handleDelete, handleBulkDelete, handleRename, refreshFiles } = useFiles();

  // Initial selection of default file
  React.useEffect(() => {
    if (!filesLoading && files.length > 0 && !converterState.selectedFileId) {
      const defaultFile = files.find(f => f.url === DEFAULT_MARKDOWN_PATH);
      if (defaultFile) {
        converterState.setSelectedFileId(defaultFile.id);
      }
    }
  }, [files, filesLoading, converterState.selectedFileId, converterState]);

  const handleUnifiedDelete = useCallback((id: string | string[]) => {
    if (Array.isArray(id)) {
      handleBulkDelete(id);
    } else {
      handleDelete(id);
    }
  }, [handleDelete, handleBulkDelete]);

  const handleFileSelect = useCallback(async (node: FileTreeNode) => {
    if (node.type === 'file' && node.file) {
      // Check if it's an image
      const isImage = node.file.mimeType.startsWith('image/') || 
                      node.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
      
      if (isImage) {
        // Find all images in the same folder/batch
        const currentPath = node.path;
        const lastSlash = currentPath.lastIndexOf('/');
        const parentDir = lastSlash !== -1 ? currentPath.substring(0, lastSlash) : '';
        
        const gallery = files.filter(f => {
          const isImg = f.mimeType.startsWith('image/') || 
                        f.originalName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
          if (!isImg) {return false;}
          
          const fPath = f.relativePath || f.originalName;
          const fLastSlash = fPath.lastIndexOf('/');
          const fParentDir = fLastSlash !== -1 ? fPath.substring(0, fLastSlash) : '';
          
          // Same parent directory and same batch
          return fParentDir === parentDir && f.batchId === node.batchId;
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
        const fetchUrl = (fileUrl.startsWith('/uploads/') && !fileUrl.startsWith('/api/')) 
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
              const finalBasePath = directoryPath.startsWith('/api/') ? directoryPath : `/api${directoryPath}`;
              converterState.setBasePath(finalBasePath);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load file content:', error);
      }
    }
  }, [converterState, files]);

  const handleFileUploadWithRefresh = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    await converterState.handleFileUpload(e);
    refreshFiles();
  }, [converterState, refreshFiles]);

  const handleFolderUploadWithRefresh = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    await converterState.handleFolderUpload(e);
    refreshFiles();
  }, [converterState, refreshFiles]);

  return (
    <ConverterView 
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
