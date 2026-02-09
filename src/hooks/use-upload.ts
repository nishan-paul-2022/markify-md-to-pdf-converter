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
    const allFiles: File[] = [];

    const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

    // Helper function to extract image references from markdown content
    const extractImageReferences = (markdownContent: string): Set<string> => {
      const imageRefs = new Set<string>();
      
      // Match markdown image syntax: ![alt](path) and ![alt](path "title")
      const mdImageRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
      
      // Match HTML img tags: <img src="path" />
      const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      
      let match;
      
      // Extract markdown-style images
      while ((match = mdImageRegex.exec(markdownContent)) !== null) {
        imageRefs.add(match[2]);
      }
      
      // Extract HTML-style images
      while ((match = htmlImageRegex.exec(markdownContent)) !== null) {
        imageRefs.add(match[1]);
      }
      
      return imageRefs;
    };

    // Step 1: Collect ALL files from the dropped folder(s)
    const traverseFileTree = async (item: FileSystemEntry, path = "") => {
      if (item.isFile) {
        return new Promise<void>((resolve) => {
          ;(item as FileSystemFileEntry).file((file) => {
            // Skip hidden files
            if (!file.name.startsWith('.')) {
              Object.defineProperty(file, 'webkitRelativePath', {
                value: path + file.name,
                writable: false
              });
              allFiles.push(file);
            }
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
      if (entry) {return traverseFileTree(entry);}
      return Promise.resolve();
    });

    await Promise.all(itemPromises);

    console.log(`📦 Total files collected: ${allFiles.length}`);

    // Step 2: Separate markdown files and potential image files
    const markdownFiles: File[] = [];
    const potentialImageFiles: File[] = [];

    for (const file of allFiles) {
      const fileName = file.name.toLowerCase();
      const webkitFile = file as File & { webkitRelativePath?: string };
      const fullPath = webkitFile.webkitRelativePath || file.name;
      const pathParts = fullPath.split('/');
      const isFolderUpload = pathParts.length > 1;
      
      if (!isFolderUpload) {
        // Direct file upload - only accept .md files
        if (fileName.endsWith('.md')) {
          markdownFiles.push(file);
          console.log(`📝 Found markdown (direct): ${file.name}`);
        }
      } else {
        const subPath = pathParts.slice(1); // Remove root folder name
        
        // Rule 1: Root level files MUST be .md
        if (subPath.length === 1) {
          if (fileName.endsWith('.md')) {
            markdownFiles.push(file);
            console.log(`📝 Found markdown (root): ${fullPath}`);
          } else {
            console.log(`❌ Ignored non-md file at root: ${fullPath}`);
          }
        } 
        // Rule 2: Subfolder MUST be 'images' and contain image files
        else if (subPath.length === 2 && subPath[0].toLowerCase() === 'images') {
          const isImage = ALLOWED_IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext));
          if (isImage) {
            potentialImageFiles.push(file);
            console.log(`🖼️  Found potential image in images/: ${fullPath}`);
          } else {
            console.log(`❌ Ignored non-image in images/: ${fullPath}`);
          }
        } else {
          console.log(`❌ Ignored file in invalid location (not root or images/): ${fullPath}`);
        }
      }
    }

    console.log(`📝 Markdown files: ${markdownFiles.length}`);
    console.log(`🖼️  Potential images: ${potentialImageFiles.length}`);

    // Step 3: Parse markdown files to find referenced images
    const referencedImagePaths = new Set<string>();
    
    for (const mdFile of markdownFiles) {
      try {
        const content = await mdFile.text();
        const imageRefs = extractImageReferences(content);
        
        console.log(`📖 Parsing ${mdFile.name}, found ${imageRefs.size} image references`);
        
        for (const ref of imageRefs) {
          // Normalize the path (remove leading ./ and ../)
          const normalizedRef = ref.replace(/^\.\//, '').replace(/\.\.\//g, '');
          referencedImagePaths.add(normalizedRef);
          console.log(`   🔗 Referenced: ${normalizedRef}`);
        }
      } catch (error) {
        console.error(`❌ Error reading markdown file ${mdFile.name}:`, error);
      }
    }

    // Step 4: Filter images - only include those referenced in markdown
    const filteredImages: File[] = [];
    
    for (const imageFile of potentialImageFiles) {
      const webkitFile = imageFile as File & { webkitRelativePath?: string };
      const fullPath = webkitFile.webkitRelativePath || imageFile.name;
      const pathParts = fullPath.split('/');
      const subPath = pathParts.slice(1).join('/'); // Path relative to root folder
      
      // Check if this image is referenced in any markdown file
      let isReferenced = false;
      for (const refPath of referencedImagePaths) {
        // Match exact path or filename
        if (subPath === refPath || subPath.endsWith('/' + refPath) || imageFile.name === refPath) {
          isReferenced = true;
          break;
        }
      }
      
      if (isReferenced) {
        filteredImages.push(imageFile);
        console.log(`✅ Image INCLUDED (referenced): ${fullPath}`);
      } else {
        console.log(`❌ Image EXCLUDED (not referenced): ${fullPath}`);
      }
    }

    // Step 5: Combine markdown files and filtered images
    const finalFiles = [...markdownFiles, ...filteredImages];
    
    console.log(`\n📊 Final Summary:`);
    console.log(`   Markdown files: ${markdownFiles.length}`);
    console.log(`   Referenced images: ${filteredImages.length}`);
    console.log(`   Total files to upload: ${finalFiles.length}`);

    if (finalFiles.length === 0) {
      setError("No valid files found. Please upload at least one .md file.");
      return;
    }

    const validation = validateUploadStructure(finalFiles);
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
