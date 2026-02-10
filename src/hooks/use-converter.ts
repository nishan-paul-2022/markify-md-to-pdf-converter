import { useState, useRef, useCallback, useEffect } from 'react';
import { DEFAULT_MARKDOWN_PATH, DEFAULT_METADATA, parseMetadataFromMarkdown, removeLandingPageSection, Metadata } from '@/constants/default-content';
import { addTimestampToName, generateStandardName } from '@/lib/utils/naming';
import { validateUploadStructure, extractImageReferences } from '@/lib/services/upload-validator';
import { getAlert } from '@/components/AlertProvider';

const MAX_FILENAME_LENGTH = 30;

const getBaseName = (name: string): string => {
  return generateStandardName(name);
};

const getTimestampedFilename = (name: string, ext: string): string => {
  const baseName = generateStandardName(name);
  const timestampedName = addTimestampToName(baseName);
  return `${timestampedName}.${ext}`;
};

export function useConverter() {
  const [rawContent, setRawContent] = useState('');
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState<Metadata>(DEFAULT_METADATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filename, setFilename] = useState('document.md');
  const [isEditing, setIsEditing] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [tempFilename, setTempFilename] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [uploadTime, setUploadTime] = useState<Date | null>(null);
  const [lastModifiedTime, setLastModifiedTime] = useState<Date | null>(null);
  const [isEditorAtTop, setIsEditorAtTop] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [basePath, setBasePath] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isPdfDownloaded, setIsPdfDownloaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {return;}

    const handleScroll = () => {
      setIsEditorAtTop(textarea.scrollTop < 20);
    };

    textarea.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => textarea.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

  const stats = (() => {
    const chars = rawContent.length;
    const words = rawContent.trim() ? rawContent.trim().split(/\s+/).length : 0;
    return { chars, words };
  })();

  const handleStartEdit = useCallback(() => {
    setTempFilename(getBaseName(filename));
    setIsEditing(true);
  }, [filename]);

  const handleSave = useCallback(() => {
    if (tempFilename.trim()) {
      setFilename(`${tempFilename.trim()}.md`);
    } else {
      setFilename('document.md');
    }
    setIsEditing(false);
  }, [tempFilename]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleContentChange = useCallback((newRawContent: string) => {
    setRawContent(newRawContent);
    setLastModifiedTime(new Date());
  }, []);

  useEffect(() => {
    if (isLoading) {return;}

    const timer = setTimeout(() => {
      const parsedMetadata = parseMetadataFromMarkdown(rawContent);
      const contentWithoutLandingPage = removeLandingPageSection(rawContent);
      
      setMetadata(parsedMetadata);
      setContent(contentWithoutLandingPage);
    }, 500);

    return () => clearTimeout(timer);
  }, [rawContent, isLoading]);

  useEffect(() => {
    setIsLoading(true);
    fetch(DEFAULT_MARKDOWN_PATH)
      .then(res => res.text())
      .then(text => {
        setRawContent(text);
        const parsedMetadata = parseMetadataFromMarkdown(text);
        const contentWithoutLandingPage = removeLandingPageSection(text);
        setMetadata(parsedMetadata);
        setContent(contentWithoutLandingPage);
        const now = new Date();
        setLastModifiedTime(now);
        
        const lastSlashIndex = DEFAULT_MARKDOWN_PATH.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
          setBasePath(DEFAULT_MARKDOWN_PATH.substring(0, lastSlashIndex));
        }
        
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        console.error('Failed to load default content:', err);
        setIsLoading(false);
      });
  }, []);

  const generatePdfBlob = useCallback(async (): Promise<Blob> => {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        markdown: content,
        metadata: metadata,
        basePath: basePath
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
      a.download = getTimestampedFilename(filename, 'pdf');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setIsPdfDownloaded(true);
      setTimeout(() => setIsPdfDownloaded(false), 2000);
    } catch (error: unknown) {
      console.error('Error downloading PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [generatePdfBlob, filename]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('📤 File upload triggered, count:', files.length);

      // Process files for renaming (Case 1/2 logic)
      // Modification: User requested NO renaming. Keep original names.
      const fileList = Array.from(files);

      const mdFile = fileList.find(f => f.name.endsWith('.md'));
      
      // 1. Immediate local preview for the first .md file if found
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

      // 2. Upload files to server
      setIsLoading(true);
      const batchId = self.crypto.randomUUID();
      
      try {
        const uploadPromises = fileList.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('batchId', batchId);
          formData.append('relativePath', file.name);
          
          const response = await fetch('/api/files', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            console.error(`❌ Upload failed for ${file.name}`);
            return null;
          }
          
          return await response.json();
        });

        const results = await Promise.all(uploadPromises);
        const successfulResults = results.filter(r => r !== null);
        console.log('✅ Upload complete. Successful results:', successfulResults.length);

        // Set selectedFileId if an MD file was uploaded
        const mdResult = successfulResults.find(r => r.file && r.file.originalName.endsWith('.md'));
        if (mdResult && mdResult.file) {
          setSelectedFileId(mdResult.file.id);
        }

        // If we found an MD file, set the base path if possible
        if (mdResult && mdResult.file && mdResult.file.url) {
          const fileUrl = mdResult.file.url;
          const lastSlashIndex = fileUrl.lastIndexOf('/');
          if (lastSlashIndex !== -1) {
            const dirPath = fileUrl.substring(0, lastSlashIndex);
            setBasePath(dirPath.startsWith('/api') ? dirPath : '/api' + dirPath);
          }
        }

        const now = new Date();
        setUploadTime(now);
        setLastModifiedTime(now);
        setIsUploaded(true);
        setTimeout(() => setIsUploaded(false), 2000);
      } catch (error) {
        console.error("Error uploading files:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [handleContentChange]);

  const handleFolderUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    console.log('📂 Folder upload triggered, files:', files?.length);
    
    if (files && files.length > 0) {
      const inputFiles = Array.from(files);

      // Validate folder structure: root must have .md; only subfolder allowed is images/
      const markdownFiles = inputFiles.filter(f => f.name.toLowerCase().endsWith('.md'));
      const referencedImages = new Set<string>();
      await Promise.all(markdownFiles.map(async (mdFile) => {
        try {
          const text = await mdFile.text();
          extractImageReferences(text).forEach(ref => referencedImages.add(ref));
        } catch (err) {
          console.error(`Failed to read markdown ${mdFile.name}:`, err);
        }
      }));
      const validation = validateUploadStructure(inputFiles, referencedImages);
      if (!validation.valid) {
        const msg = validation.error ?? 'Invalid folder structure. Upload blocked.';
        const api = getAlert();
      if (api) {
        api.show({ title: 'Invalid folder', message: msg });
      } else {
        alert(msg);
      }
        event.target.value = '';
        return;
      }

      const processedFiles = validation.filteredFiles;
      console.log(`UseConverter: Uploading folder (validated).`);

      const mdFile = processedFiles.find(f => f.name.endsWith('.md'));
      
      console.log(mdFile ? `📄 Found markdown file: ${mdFile.name}` : 'ℹ️ No markdown file found, uploading other assets.');
      console.log('📦 Total files to upload:', processedFiles.length);

      // 1. Immediate local preview (if MD exists)
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

      // 2. Upload files to server
      setIsLoading(true);
      const batchId = self.crypto.randomUUID();
      
      console.log('🆔 Generated batchId:', batchId);
      
      try {
        // Upload files in parallel
        const uploadPromises = processedFiles.map(async (file, index) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('batchId', batchId);
          // Use webkitRelativePath for folder structure, fallback to name
          formData.append('relativePath', file.webkitRelativePath || file.name);
          
          console.log(`📤 Uploading file ${index + 1}/${processedFiles.length}:`, file.name);
          
          try {
            const response = await fetch('/api/files', {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`❌ Upload failed for ${file.name}:`, response.status, errorText);
              return null;
            }
            
            const result = await response.json();
            console.log(`✅ Uploaded ${file.name}:`, result);
            return result;
          } catch (err) {
            console.error(`❌ Error uploading ${file.name}:`, err);
            return null;
          }
        });

        const results = await Promise.all(uploadPromises);
        const successfulResults = results.filter(r => r !== null);
        
        console.log('📊 Upload complete. Successful uploads:', successfulResults.length);

        // Find and select the main MD file
        const folderMdResult = successfulResults.find(r => 
          r && r.file && mdFile && (
            r.file.originalName === mdFile.name || 
            (r.file.relativePath && r.file.relativePath.endsWith(mdFile.name))
          )
        );
        
        if (folderMdResult && folderMdResult.file) {
          setSelectedFileId(folderMdResult.file.id);
        }
        

        if (mdFile) {
          console.log('🔍 Searching for MD result for:', mdFile.name);
        }
        
        if (folderMdResult && folderMdResult.file && folderMdResult.file.url) {
            const fileUrl = folderMdResult.file.url;
            console.log('📄 Found Markdown file URL:', fileUrl);
            
            // Extract the directory path (remove the filename)
            const lastSlashIndex = fileUrl.lastIndexOf('/');
            if (lastSlashIndex !== -1) {
              const directoryPath = fileUrl.substring(0, lastSlashIndex);
              
              // Ensure we use the /api/uploads prefix for proper routing
              let finalBasePath = directoryPath;
              if (!finalBasePath.startsWith('/api/')) {
                if (finalBasePath.startsWith('/')) {
                  finalBasePath = '/api' + finalBasePath;
                } else {
                  finalBasePath = '/api/' + finalBasePath;
                }
              }
              
              console.log('🗂️ Setting basePath to:', finalBasePath);
              setBasePath(finalBasePath);
            }
        } else {
          console.warn('⚠️ Could not find MD file result to set basePath. Images might not load.');
          // Fallback: try to find any result with .md extension
          const anyMdResult = results.find(r => r && r.file && r.file.originalName?.endsWith('.md'));
          if (anyMdResult && anyMdResult.file?.url) {
            const fileUrl = anyMdResult.file.url;
            const lastSlashIndex = fileUrl.lastIndexOf('/');
            if (lastSlashIndex !== -1) {
              const finalBasePath = '/api' + fileUrl.substring(0, lastSlashIndex);
              console.log('🔄 Fallback: Setting basePath to:', finalBasePath);
              setBasePath(finalBasePath);
            }
          }
        }

        const now = new Date();
        setUploadTime(now);
        setLastModifiedTime(now);
        setIsUploaded(true);
        setTimeout(() => setIsUploaded(false), 2000);
    } catch (error) {
      console.error("Error uploading folder batch:", error);
      // We don't alert here because the local preview might still work for text
    } finally {
        setIsLoading(false);
      }
    }
  }, [handleContentChange]);

  const triggerFileUpload = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const triggerFolderUpload = useCallback(async (): Promise<void> => {
    const api = getAlert();
    if (api) {
      const confirmed = await api.confirm({
        title: "Upload Project Folder",
        message: "You are about to upload a project folder. For the best experience, ensure your Markdown files are at the root level and any images are placed in a subfolder named 'images/'.",
        confirmText: "Select Folder",
        cancelText: "Cancel",
        variant: "info"
      });
      if (!confirmed) {
        return;
      }
    }
    folderInputRef.current?.click();
  }, []);

  const handleReset = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(DEFAULT_MARKDOWN_PATH);
      const text = await res.text();
      
      handleContentChange(text);
      setFilename('document.md');
      setSelectedFileId(null);
      setUploadTime(null);
      setLastModifiedTime(new Date());
      setIsReset(true);
      setTimeout(() => setIsReset(false), 2000);
    } catch (err: unknown) {
      console.error('Failed to reset content:', err);
    }
  }, [handleContentChange]);

  const handleCopy = useCallback(async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(rawContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err: unknown) {
      console.error('Failed to copy content:', err);
    }
  }, [rawContent]);

  const handleDownloadMd = useCallback((): void => {
    const blob = new Blob([rawContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getTimestampedFilename(filename, 'md');
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2000);
  }, [rawContent, filename]);

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
    uploadTime,
    lastModifiedTime,
    isEditorAtTop,
    isLoading,
    basePath,
    isCopied,
    isDownloaded,
    isPdfDownloaded,
    selectedFileId,
    fileInputRef,
    folderInputRef,
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
    triggerFileUpload,
    triggerFolderUpload,
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
    MAX_FILENAME_LENGTH,
    getBaseName
  };
}
