import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { validateUploadStructure } from "@/lib/services/upload-validator";

const processFilesWithNaming = (filesToProcess: File[], uploadCase: number): File[] => {
  console.log(`UseUpload: Processing ${filesToProcess.length} files for Case ${uploadCase}`);
  
  // No renaming needed - return files as is
  return filesToProcess;
};

export function useUpload() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = Array.from(e.dataTransfer.items);
    const newFiles: File[] = [];

    const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

    const traverseFileTree = async (item: FileSystemEntry, path = "", depth = 0) => {
      if (item.isFile) {
        return new Promise<void>((resolve) => {
          ;(item as FileSystemFileEntry).file((file) => {
            const fileName = file.name.toLowerCase();
            const fullPath = path + file.name;
            const pathParts = fullPath.split('/');

            // Skip hidden files
            if (file.name.startsWith('.')) {
              resolve();
              return;
            }

            // Determine if this is a folder upload (has path) or file upload
            const isFolderUpload = pathParts.length > 1;

            console.log(`📁 Processing file: ${fullPath}, isFolderUpload: ${isFolderUpload}, pathParts:`, pathParts);

            if (!isFolderUpload) {
              // Direct file upload - only accept .md files
              if (fileName.endsWith('.md')) {
                console.log(`✅ Accepted (direct .md file): ${file.name}`);
                Object.defineProperty(file, 'webkitRelativePath', {
                  value: fullPath,
                  writable: false
                });
                newFiles.push(file);
              } else {
                console.log(`❌ Rejected (direct non-.md file): ${file.name}`);
              }
            } else {
              // Folder upload - apply strict filtering
              const subPath = pathParts.slice(1); // Remove root folder name
              
              if (subPath.length === 1) {
                // File at root level - only accept .md files
                if (fileName.endsWith('.md')) {
                  console.log(`✅ Accepted (root .md file): ${fullPath}`);
                  Object.defineProperty(file, 'webkitRelativePath', {
                    value: fullPath,
                    writable: false
                  });
                  newFiles.push(file);
                } else {
                  console.log(`❌ Rejected (root non-.md file): ${fullPath}`);
                }
              } else if (subPath.length === 2 && subPath[0] === 'images') {
                // File inside images/ folder - only accept image files
                const isImage = ALLOWED_IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext));
                if (isImage) {
                  console.log(`✅ Accepted (image in images/): ${fullPath}`);
                  Object.defineProperty(file, 'webkitRelativePath', {
                    value: fullPath,
                    writable: false
                  });
                  newFiles.push(file);
                } else {
                  console.log(`❌ Rejected (non-image in images/): ${fullPath}`);
                }
              } else {
                console.log(`❌ Rejected (invalid path structure): ${fullPath}, subPath:`, subPath);
              }
              // All other files/paths are ignored
            }

            resolve();
          });
        });
      } else if (item.isDirectory) {
        const dirName = item.name.toLowerCase();
        const fullPath = path + item.name;
        const pathParts = fullPath.split('/');
        
        // For folder uploads, only traverse root level and images/ subdirectory
        if (pathParts.length === 1) {
          // Root folder - traverse it
          const dirReader = (item as FileSystemDirectoryEntry).createReader();
          const entries = await new Promise<FileSystemEntry[]>((resolve) => {
            dirReader.readEntries((entries) => resolve(Array.from(entries)));
          });
          for (const entry of entries) {
            await traverseFileTree(entry, path + item.name + "/", depth + 1);
          }
        } else if (pathParts.length === 2 && dirName === 'images') {
          // images/ folder at root level - traverse it
          const dirReader = (item as FileSystemDirectoryEntry).createReader();
          const entries = await new Promise<FileSystemEntry[]>((resolve) => {
            dirReader.readEntries((entries) => resolve(Array.from(entries)));
          });
          for (const entry of entries) {
            await traverseFileTree(entry, path + item.name + "/", depth + 1);
          }
        }
        // All other directories are ignored (not traversed)
      }
    };

    const itemPromises = items.map(item => {
      const entry = item.webkitGetAsEntry();
      if (entry) {return traverseFileTree(entry);}
      return Promise.resolve();
    });

    await Promise.all(itemPromises);

    const validation = validateUploadStructure(newFiles);
    if (!validation.valid) {
      setError(validation.error || "Invalid file structure.");
      return;
    }

    setError(null);
    const processedFiles = processFilesWithNaming(validation.filteredFiles, validation.case);
    setFiles((prev) => [...prev, ...processedFiles]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validation = validateUploadStructure(selectedFiles);
      
      if (!validation.valid) {
        setError(validation.error || "Invalid file structure.");
        return;
      }

      setError(null);
      const processedFiles = processFilesWithNaming(validation.filteredFiles, validation.case);
      setFiles((prev) => [...prev, ...processedFiles]);
    }
  }, []);

          

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFiles = async (): Promise<void> => {
    if (files.length === 0) {return;}

    setUploading(true);
    setUploadProgress(0);

    try {
      const batchId = crypto.randomUUID();
      const totalFiles = files.length;
      let uploadedCount = 0;

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("batchId", batchId);
        const webkitFile = file as File & { webkitRelativePath?: string };
        if (webkitFile.webkitRelativePath) {
          formData.append("relativePath", webkitFile.webkitRelativePath);
        }

        const response = await fetch("/api/files", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        uploadedCount++;
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
      }

      setFiles([]);
      setUploadProgress(0);
      router.refresh();
    } catch (error: unknown) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  return {
    isDragging,
    files,
    uploading,
    uploadProgress,
    error,
    setError,
    fileInputRef,
    folderInputRef,
    setFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    removeFile,
    uploadFiles
  };
}
