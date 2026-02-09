import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { validateUploadStructure } from "@/lib/services/upload-validator";
import { generateStandardName, addTimestampToName } from "@/lib/utils/naming";

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

    const traverseFileTree = async (item: FileSystemEntry, path = "") => {
      if (item.isFile) {
        return new Promise<void>((resolve) => {
          ;(item as FileSystemFileEntry).file((file) => {
            Object.defineProperty(file, 'webkitRelativePath', {
              value: path + file.name,
              writable: false
            });
            newFiles.push(file);
            resolve();
          });
        });
      } else if (item.isDirectory) {
        const dirReader = (item as FileSystemDirectoryEntry).createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
          dirReader.readEntries((entries) => resolve(Array.from(entries)));
        });
        for (const entry of entries) {
          await traverseFileTree(entry, path + item.name + "/");
        }
      }
    };

    const itemPromises = items.map(item => {
      const entry = item.webkitGetAsEntry();
      if (entry) return traverseFileTree(entry);
      return Promise.resolve();
    });

    await Promise.all(itemPromises);

    await Promise.all(itemPromises);

    const validation = validateUploadStructure(newFiles);
    if (!validation.valid) {
      setError(validation.error || "Invalid file structure.");
      return;
    }

    setError(null);
    const processedFiles = processFilesWithNaming(newFiles, validation.case);
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
      const processedFiles = processFilesWithNaming(selectedFiles, validation.case);
      setFiles((prev) => [...prev, ...processedFiles]);
    }
  }, []);

  const processFilesWithNaming = (filesToProcess: File[], uploadCase: number): File[] => {
    if (uploadCase === 1 || uploadCase === 2) {
      // For Case 1/2: Rename each .md file: standardized-name-timestamp.md
      return filesToProcess.map(file => {
        if (file.name.toLowerCase().endsWith('.md')) {
          const extension = '.md';
          const base = generateStandardName(file.name);
          const newName = addTimestampToName(base) + extension;
          return new File([file], newName, { type: file.type });
        }
        return file;
      });
    } else if (uploadCase === 3 || uploadCase === 4) {
      // For Case 3/4: All files share a standardized and timestamped root folder name
      const pathParts = filesToProcess[0].webkitRelativePath.split('/');
      const originalRoot = pathParts[0];
      const standardizedRoot = generateStandardName(originalRoot);
      const timestampedRoot = addTimestampToName(standardizedRoot);

      return filesToProcess.map(file => {
        const relativePath = file.webkitRelativePath;
        const newRelativePath = relativePath.replace(originalRoot, timestampedRoot);
        
        // We create a new file object to avoid any issues, though we mostly care about the path
        const newFile = new File([file], file.name, { type: file.type });
        Object.defineProperty(newFile, 'webkitRelativePath', {
          value: newRelativePath,
          writable: false,
          configurable: true
        });
        return newFile;
      });
    }
    return filesToProcess;
  };

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const uploadFiles = async (): Promise<void> => {
    if (files.length === 0) return;

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
