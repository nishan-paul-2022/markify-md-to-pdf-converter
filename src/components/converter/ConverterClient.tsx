'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import JSZip from 'jszip';

import { 
  Layers, 
  Upload, 
  FolderOpen, 
  Search,
  Download,
  Loader2,
  FileDown,
  Zap,
  CheckCircle2,
  FileCode,
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
  MousePointer2,
  X,
  SortAsc,
  Clock,
  HardDrive,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserNav from '@/components/auth/UserNav';
import { useFiles, File as AppFile } from '@/hooks/use-files';
import { cn } from '@/lib/utils';
import { generateStandardName, addTimestampToName } from '@/lib/utils/naming';
import { parseMetadataFromMarkdown, removeLandingPageSection } from '@/constants/default-content';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAlert } from "@/components/AlertProvider";
import { createTar } from '@/lib/utils/tar';
import { UploadRulesModal } from '@/components/converter/UploadRulesModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";



interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ConverterClientProps {
  user: User;
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toUpperCase();
};

const formatSize = (bytes: number) => {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function ConverterClient({ user }: ConverterClientProps): React.JSX.Element {
  const router = useRouter();
  const { files, loading, refreshFiles, handleDelete, handleBulkDelete, deleting } = useFiles('converter');
  const { show: showAlert, confirm: confirmAlert } = useAlert();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [uploadRulesModal, setUploadRulesModal] = React.useState<{ isOpen: boolean, type: 'file' | 'folder' | 'zip' }>({ isOpen: false, type: 'file' });
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);
  const zipInputRef = React.useRef<HTMLInputElement>(null);

  // Status and result management
  const [processingStates, setProcessingStates] = React.useState<Record<string, 'pending' | 'converting' | 'done' | 'error'>>({});
  const [convertedFiles, setConvertedFiles] = React.useState<Record<string, Blob>>({});
  const [selectedFileIds, setSelectedFileIds] = React.useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = React.useState(false);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<'name' | 'time' | 'size'>('time');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  // Persistence logic for selection
  const isInitialized = React.useRef(false);

  React.useEffect(() => {
    const savedSelectionIds = localStorage.getItem('converter_selected_ids');
    const savedSelectionMode = localStorage.getItem('converter_selection_mode');
    
    if (savedSelectionIds) {
      try {
        const ids = JSON.parse(savedSelectionIds);
        if (Array.isArray(ids)) {
          setSelectedFileIds(new Set(ids));
        }
      } catch (e) {
        console.error('Failed to parse saved selection IDs', e);
      }
    }
    
    if (savedSelectionMode === 'true') {
      setIsSelectionMode(true);
    }
    
    // Mark as initialized AFTER loading from localStorage
    isInitialized.current = true;
  }, []);

  React.useEffect(() => {
    if (!isInitialized.current) { return; }
    localStorage.setItem('converter_selected_ids', JSON.stringify(Array.from(selectedFileIds)));
  }, [selectedFileIds]);

  React.useEffect(() => {
    if (!isInitialized.current) { return; }
    localStorage.setItem('converter_selection_mode', String(isSelectionMode));
  }, [isSelectionMode]);

  // Grouping logic
  const filteredMdFiles = React.useMemo(() => {
    return files
      .filter(f => 
        !f.id.startsWith('default-') && 
        f.batchId !== 'sample-document' && 
        f.batchId !== 'sample-project' &&
        (f.originalName.toLowerCase().endsWith('.md') || f.mimeType === 'text/markdown')
      )
      .filter(f => 
        f.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.relativePath && f.relativePath.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = a.originalName.localeCompare(b.originalName);
        } else if (sortBy === 'size') {
          comparison = a.size - b.size;
        } else {
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return sortOrder === 'desc' ? -comparison : comparison;
      });
  }, [files, searchQuery, sortBy, sortOrder]);

  // Derived state for the "Converted" column (matching filtered set)
  const completedResults = React.useMemo(() => {
    return filteredMdFiles.filter(f => 
      processingStates[f.id] === 'done' || 
      convertedFiles[f.id] || 
      (f.metadata && f.metadata.generatedPdfUrl)
    );
  }, [filteredMdFiles, processingStates, convertedFiles]);

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedFileIds(new Set());
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFileIds.size === filteredMdFiles.length && filteredMdFiles.length > 0) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(filteredMdFiles.map(f => f.id)));
    }
  };

  const handleBatchConvert = async () => {
    if (selectedFileIds.size === 0) { return; }
    
    setIsBatchProcessing(true);
    const idsToConvert = Array.from(selectedFileIds);
    
    for (const id of idsToConvert) {
      const file = filteredMdFiles.find(f => f.id === id);
      if (file && processingStates[id] !== 'done' && processingStates[id] !== 'converting') {
        await handleConvertFile(file);
      }
    }
    
    setIsBatchProcessing(false);
    setSelectedFileIds(new Set());
    setIsSelectionMode(false);
  };

  const handleBatchDelete = async () => {
    if (selectedFileIds.size === 0) { return; }

    const confirmed = await confirmAlert({
      title: 'Delete Multiple Files',
      message: `Are you sure you want to delete ${selectedFileIds.size} selected files? This action cannot be undone.`,
      confirmText: 'Delete Files',
      variant: 'destructive'
    });

    if (!confirmed) { return; }

    await handleBulkDelete(Array.from(selectedFileIds));
    setSelectedFileIds(new Set());
    setIsSelectionMode(false);
  };

  const handleConvertFile = async (file: AppFile) => {
    setProcessingStates(prev => ({ ...prev, [file.id]: 'converting' }));
    
    try {
      // 1. Fetch original content
      const contentRes = await fetch(file.url);
      if (!contentRes.ok) { throw new Error('Failed to fetch file content'); }
      const markdown = await contentRes.text();

      // 2. Prepare metadata and base path
      const lastSlashIndex = file.url.lastIndexOf('/');
      const basePath = file.url.substring(0, lastSlashIndex);

      // 3. Parse Metadata and Content (Consistently with Editor)
      const parsedMetadata = parseMetadataFromMarkdown(markdown);
      const contentWithoutLandingPage = removeLandingPageSection(markdown);

      // 4. Call PDF generation API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: contentWithoutLandingPage,
          basePath: basePath.startsWith('/api') ? basePath : `/api${basePath}`,
          metadata: parsedMetadata, // Use parsed metadata directly to match Editor logic
          saveToServer: true,
          sourceFileId: file.id
        }),
      });

      if (!response.ok) { throw new Error('PDF generation failed'); }
      
      const blob = await response.blob();
      setConvertedFiles(prev => ({ ...prev, [file.id]: blob }));
      setProcessingStates(prev => ({ ...prev, [file.id]: 'done' }));
      
      // Refresh files to get the updated metadata (generatedPdfUrl) from the server
      await refreshFiles();
      
      return true;
    } catch (error) {
      console.error('Conversion error:', error);
      setProcessingStates(prev => ({ ...prev, [file.id]: 'error' }));
      return false;
    }
  };

  const handleDownloadFile = (file: AppFile, type: 'md' | 'pdf') => {
    if (type === 'md') {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = convertedFiles[file.id];
      const pdfUrl = file.metadata?.generatedPdfUrl;

      if (!blob && !pdfUrl) { return; }
      
      if (pdfUrl && !blob) {
         // Download from server URL
         const a = document.createElement('a');
         a.href = pdfUrl as string;
         a.download = `${generateStandardName(file.originalName)}.pdf`;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         return;
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = generateStandardName(file.originalName);
      const timestampedName = addTimestampToName(baseName);
      a.download = `${timestampedName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadAll = () => {
    completedResults.forEach(f => handleDownloadFile(f, 'pdf'));
  };

  const handleDownloadArchive = async (format: 'zip' | 'tar') => {
    if (completedResults.length === 0) {return;}
    
    // Prepare files for archiving
    const filesToArchive = await Promise.all(completedResults.map(async file => {
      let blob = convertedFiles[file.id];
      
      // If no local blob but we have a server URL, we need to fetch it to zip it
      if (!blob && file.metadata?.generatedPdfUrl) {
        try {
          const pdfUrl = file.metadata.generatedPdfUrl;
          if (typeof pdfUrl === 'string') {
              const res = await fetch(pdfUrl);
              if (res.ok) {
                blob = await res.blob();
              }
          }
        } catch (e) {
          console.error(`Failed to fetch PDF for archive: ${file.originalName}`, e);
        }
      }

      if (!blob) {return null;}
      return {
        name: `${generateStandardName(file.originalName)}.pdf`,
        blob: blob
      };
    }));
    
    // Filter out nulls
    const validFiles = filesToArchive.filter(Boolean) as { name: string, blob: Blob }[]; 

    if (validFiles.length === 0) {return;}

    try {
      let content: Blob;
      let filename = `markify_export_${addTimestampToName('archive')}`;

      if (format === 'zip') {
        const zip = new JSZip();
        const folder = zip.folder("converted_pdfs");
        if (folder) {
          validFiles.forEach(f => folder.file(f.name, f.blob));
        }
        content = await zip.generateAsync({ type: "blob" });
        filename += '.zip';
      } else {
        // TAR format
        content = await createTar(validFiles);
        filename += '.tar';
      }

      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Failed to generate ${format} archive`, error);
      showAlert({ title: "Archive Failed", message: `Could not create ${format} archive.`, variant: "destructive" });
    }
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {return;}

    const batchId = self.crypto.randomUUID();
    const uploadPromises = Array.from(selectedFiles).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('batchId', batchId);
      formData.append('relativePath', file.name);
      formData.append('source', 'converter');
      
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = "Upload failed";
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        return { error: errorMsg, file: file.name };
      }
      
      return response.ok;
    });

    const results = await Promise.all(uploadPromises);
    const failedResults = results.filter(r => r && typeof r === 'object' && 'error' in r);
    
    if (failedResults.length > 0) {
      const msg = (failedResults[0] as { error: string }).error;
      showAlert({ title: 'Upload Failed', message: msg, variant: 'destructive' });
    }
    
    await refreshFiles();
    if (fileInputRef.current) {fileInputRef.current.value = '';}
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {return;}

    const batchId = self.crypto.randomUUID();
    const uploadPromises = Array.from(selectedFiles).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('batchId', batchId);
      // Explicitly cast to include webkitRelativePath which exists on files from folder upload
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      formData.append('relativePath', relativePath);
      formData.append('source', 'converter');
      
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = "Upload failed";
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.error || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        return { error: errorMsg, file: file.name };
      }
      
      return response.ok;
    });

    const results = await Promise.all(uploadPromises);
    const failedResults = results.filter(r => r && typeof r === 'object' && 'error' in r);
    
    if (failedResults.length > 0) {
      const msg = (failedResults[0] as { error: string }).error;
      showAlert({ title: 'Invalid Folder', message: msg, variant: 'destructive' });
    }
    
    await refreshFiles();
    if (folderInputRef.current) {folderInputRef.current.value = '';}
  };
  const triggerFileUpload = () => fileInputRef.current?.click();
  const triggerFolderUpload = () => folderInputRef.current?.click();
  const triggerZipUpload = () => zipInputRef.current?.click();

  const handleUploadModalConfirm = () => {
    const type = uploadRulesModal.type;
    setUploadRulesModal(prev => ({ ...prev, isOpen: false }));
    if (type === 'file') {
      triggerFileUpload();
    } else if (type === 'folder') {
      triggerFolderUpload();
    } else if (type === 'zip') {
      triggerZipUpload();
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {return;}

    const archiveFiles = Array.from(selectedFiles);
    
    // Support ZIP, 7Z, RAR, and TAR formats
    const unsupportedFiles = archiveFiles.filter(f => !f.name.match(/\.(zip|7z|rar|tar|tar\.gz|tgz)$/i));
    if (unsupportedFiles.length > 0) {
      const msg = `Upload failed — only ZIP, 7Z, RAR, or TAR archives are allowed. Unsupported: ${unsupportedFiles.map(f => f.name).join(', ')}`;
      showAlert({ title: 'Invalid File', message: msg, variant: 'destructive' });
      if (zipInputRef.current) {zipInputRef.current.value = '';}
      return;
    }

    try {
      const uploadPromises = archiveFiles.map(async (archiveFile) => {
        const formData = new FormData();
        formData.append('file', archiveFile);
        formData.append('source', 'converter');
        
        const response = await fetch('/api/files/archive', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || `Archive processing failed for ${archiveFile.name}`);
        }
        return result;
      });

      await Promise.all(uploadPromises);
      
      // Successfully uploaded and extracted all
      await refreshFiles();
    } catch (error) {
      console.error('Error processing archive files:', error);
      const msg = error instanceof Error ? error.message : 'Failed to process the archives.';
      showAlert({ title: 'Processing Failed', message: msg, variant: 'destructive' });
    } finally {
      if (zipInputRef.current) {zipInputRef.current.value = '';}
    }
  };

  return (
    <TooltipProvider>
    <main className="h-dvh w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative selection:bg-blue-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      </div>

      {/* Header */}
      <header className="relative z-10 h-16 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
        <div 
          className="flex items-center gap-4 w-[280px] cursor-pointer group/logo"
          onClick={() => router.push('/')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover/logo:scale-110">
              <Image src="/brand-logo.svg" alt="Markify" width={32} height={32} priority className="drop-shadow-xl" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold tracking-tight text-white tracking-[0.05em] group-hover/logo:text-blue-400 transition-colors">Markify</h1>
            </div>
          </div>
        </div>

        <input 
          type="file" 
          multiple 
          accept=".md" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
        />
        <input 
          type="file" 
          ref={folderInputRef} 
          onChange={handleFolderUpload} 
          className="hidden" 
          {...( { webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement> )}
        />
        <input 
          type="file" 
          multiple
          accept=".zip,.7z,.rar,.tar,.tar.gz,.tgz" 
          ref={zipInputRef} 
          onChange={handleZipUpload} 
          className="hidden" 
        />

        <div className="flex items-center justify-end gap-4">
          <div className="relative group hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-56 bg-white/5 border border-white/5 rounded-full pl-9 pr-4 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30 focus:bg-blue-500/5 focus:text-blue-100 transition-all"
            />
          </div>
          

          
          <Button
            variant="ghost"
            onClick={() => router.push('/editor')}
            className="h-9 px-4 bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-all group flex items-center gap-2"
          >
            <FileCode className="w-3.5 h-3.5 group-hover:text-blue-400 transition-colors" />
            <span>Editor</span>
          </Button>

          <UserNav user={user} />
        </div>
      </header>

      {/* Pipeline Content Area */}
      <div className="relative z-10 flex-grow overflow-hidden flex flex-row p-6 gap-6">
        
        {/* SEGMENT 1: SOURCE (Upload Hub) */}
        <section className="w-[260px] h-full flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between px-2 text-xs font-black uppercase tracking-[0.2em] text-amber-400/80 h-11 flex-none">
            <div className="flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              <span>Source</span>
            </div>
          </div>
          
          <div className="flex-grow bg-amber-400/[0.03] border border-amber-400/10 rounded-[1.5rem] p-6 backdrop-blur-xl flex flex-col justify-center gap-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/[0.05] to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
            


            <div className="space-y-4 w-full relative z-10">
              <Button 
                onClick={(e) => { e.stopPropagation(); setUploadRulesModal({ isOpen: true, type: 'file' }); }}
                className="w-full h-16 bg-slate-900/40 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 rounded-2xl flex items-center justify-start px-6 gap-4 transition-all duration-300 group/btn shadow-lg backdrop-blur-sm"
              >
                <div className="w-11 h-11 bg-amber-500/5 rounded-xl flex items-center justify-center text-amber-500/60 group-hover/btn:bg-amber-500/20 group-hover/btn:text-amber-400 group-hover/btn:scale-110 transition-all">
                  <FileCode className="w-6 h-6" />
                </div>
                <div className="text-left flex-grow">
                  <p className="text-[12px] font-black uppercase tracking-wider leading-none text-slate-400 group-hover/btn:text-amber-300 transition-colors">Upload Files</p>
                </div>
              </Button>

              <Button 
                onClick={(e) => { e.stopPropagation(); setUploadRulesModal({ isOpen: true, type: 'folder' }); }}
                className="w-full h-16 bg-slate-900/40 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 rounded-2xl flex items-center justify-start px-6 gap-4 transition-all duration-300 group/btn shadow-lg backdrop-blur-sm"
              >
                <div className="w-11 h-11 bg-indigo-500/5 rounded-xl flex items-center justify-center text-indigo-400/60 group-hover/btn:bg-indigo-500/20 group-hover/btn:text-indigo-400 group-hover/btn:scale-110 transition-all">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div className="text-left flex-grow">
                  <p className="text-[12px] font-black uppercase tracking-wider leading-none text-slate-400 group-hover/btn:text-indigo-300 transition-colors">Upload Project</p>
                </div>
              </Button>

              <Button 
                onClick={(e) => { e.stopPropagation(); setUploadRulesModal({ isOpen: true, type: 'zip' }); }}
                className="w-full h-16 bg-slate-900/40 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 rounded-2xl flex items-center justify-start px-6 gap-4 transition-all duration-300 group/btn shadow-lg backdrop-blur-sm"
              >
                <div className="w-11 h-11 bg-cyan-500/5 rounded-xl flex items-center justify-center text-cyan-400/60 group-hover/btn:bg-cyan-500/20 group-hover/btn:text-cyan-400 group-hover/btn:scale-110 transition-all">
                  <FileDown className="w-6 h-6" />
                </div>
                <div className="text-left flex-grow">
                  <p className="text-[12px] font-black uppercase tracking-wider leading-none text-slate-400 group-hover/btn:text-cyan-300 transition-colors">Upload Zip</p>
                </div>
              </Button>


            </div>
          </div>
        </section>

        {/* INTEGRATED PIPELINE: PROCESSING (Cause) & RESULTS (Effect) */}
        <section className="flex-grow h-full flex flex-col gap-4 overflow-hidden">
          {/* Unified Header */}
          <div className="flex items-center justify-between px-4 text-xs font-black uppercase tracking-[0.2em] h-11 flex-none">
            <div className="flex items-center gap-10 flex-nowrap">
              <div className="flex items-center gap-2 text-indigo-400/80 whitespace-nowrap">
                <Layers className="w-3.5 h-3.5" />
                <div className="flex items-baseline gap-2">
                  <span>FILES</span>
                  {filteredMdFiles.length > 0 && (
                    <span className="text-[10px] text-indigo-400/60 font-medium">({filteredMdFiles.length})</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-emerald-400/80 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>OUTPUT</span>
                {completedResults.length > 0 && (
                  <span className="text-[10px] text-emerald-400/60 font-medium">({completedResults.length})</span>
                )}
              </div>
            </div>
            
              <div className="flex items-center gap-4">

                {!loading && filteredMdFiles.length > 0 && (
                  <div className="flex items-center gap-3">
                    
                    {/* 1. Selection Actions */}
                    <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 p-1 rounded-lg">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            onClick={toggleSelectionMode}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all group cursor-pointer h-8 whitespace-nowrap",
                              isSelectionMode 
                                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold" 
                                : "text-slate-300 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            {isSelectionMode ? (
                              <X className="w-3.5 h-3.5" />
                            ) : (
                              <MousePointer2 className="w-3.5 h-3.5" />
                            )}
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              {isSelectionMode ? 'CANCEL' : 'SELECT'}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">
                          {isSelectionMode ? 'Cancel Selection Mode' : 'Enable Selection Mode'}
                        </TooltipContent>
                      </Tooltip>

                      {isSelectionMode && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={toggleSelectAll}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 transition-all group animate-in fade-in slide-in-from-left-2 cursor-pointer h-8 whitespace-nowrap font-bold"
                            >
                              {selectedFileIds.size === filteredMdFiles.length ? (
                                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                              ) : selectedFileIds.size > 0 ? (
                                <MinusSquare className="w-3.5 h-3.5 text-indigo-400" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span className="text-[10px] font-black uppercase tracking-wider">
                                {selectedFileIds.size === filteredMdFiles.length ? 'NONE' : 'SELECT ALL'}
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">
                            {selectedFileIds.size === filteredMdFiles.length ? 'Deselect All' : 'Select All Files'}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* 2. Sorting Actions */}
                    <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 p-1 rounded-lg">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer h-8 group">
                            {sortBy === 'name' ? (
                              <SortAsc className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                            ) : sortBy === 'size' ? (
                              <HardDrive className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                            )}
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              {sortBy === 'name' ? 'NAME' : sortBy === 'size' ? 'SIZE' : 'DATE'}
                            </span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-slate-900/95 border-white/10 backdrop-blur-xl">
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-2">Sort Files</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem 
                            onClick={() => setSortBy('time')}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
                              sortBy === 'time' ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                          >
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Most Recent</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setSortBy('name')}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
                              sortBy === 'name' ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                          >
                            <SortAsc className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Alphabetical</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setSortBy('size')}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
                              sortBy === 'size' ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                          >
                            <HardDrive className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">File Size</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer group"
                          >
                            {sortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">
                          {sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* 3. Download Actions (If available) */}
                    {completedResults.length > 0 && (
                      <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 p-1 rounded-lg animate-in fade-in slide-in-from-right-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer h-8 group active:scale-95">
                              <Download className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-black uppercase tracking-wider">Download</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 bg-slate-900/95 border-white/10 backdrop-blur-xl">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-2">Archive Format</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            
                            <DropdownMenuItem 
                              onClick={() => handleDownloadArchive('zip')}
                              className="flex items-center gap-3 px-3 py-2 cursor-pointer text-slate-300 hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white"
                            >
                              <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center text-[10px] font-black uppercase text-emerald-400 border border-emerald-500/20">ZIP</div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold uppercase tracking-wider">Standard Zip</span>
                                <span className="text-[10px] text-slate-500 font-medium">Recommended for all devices</span>
                              </div>
                            </DropdownMenuItem>
    
                            <DropdownMenuItem 
                              onClick={() => handleDownloadArchive('tar')}
                              className="flex items-center gap-3 px-3 py-2 cursor-pointer text-slate-300 hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white"
                            >
                              <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-[10px] font-black uppercase text-blue-400 border border-blue-500/20">TAR</div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold uppercase tracking-wider">Tape Archive</span>
                                <span className="text-[10px] text-slate-500 font-medium">Uncompressed, good for linux</span>
                              </div>
                            </DropdownMenuItem>
    
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem 
                              onClick={handleDownloadAll}
                              className="flex items-center gap-3 px-3 py-2 cursor-pointer text-slate-300 hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white"
                            >
                              <Layers className="w-4 h-4 text-indigo-400 ml-2 mr-2" />
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold uppercase tracking-wider">Individual Files</span>
                                <span className="text-[10px] text-slate-500 font-medium">Download PDFs separately</span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                )}

              {isSelectionMode && selectedFileIds.size > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={handleBatchDelete}
                        disabled={isBatchProcessing || deleting}
                        className="h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 gap-2 transition-all"
                      >
                        {deleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Delete ({selectedFileIds.size})</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">Permanently delete selected files</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="sm"
                        onClick={handleBatchConvert}
                        disabled={isBatchProcessing || deleting}
                        className="h-8 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 gap-2 transition-all"
                      >
                        {isBatchProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>Convert ({selectedFileIds.size})</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">Bulk convert selected files to PDF</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>

          <div className="flex-grow bg-slate-900/20 border border-white/5 rounded-[2rem] p-4 flex flex-col overflow-hidden relative backdrop-blur-3xl shadow-3xl">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-500/[0.03] to-transparent pointer-events-none" />
              <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-2 relative z-10">
              {!loading && filteredMdFiles.length > 0 ? (
                <>
                  {filteredMdFiles.map((file, index) => {
                    const hasOutput = convertedFiles[file.id] || processingStates[file.id] === 'done' || (file.metadata && file.metadata.generatedPdfUrl);
                    const isProcessing = processingStates[file.id] === 'converting';

                    return (
                      <div 
                        key={file.id} 
                        style={{ animationDelay: `${index * 0.05}s` }}
                        className={cn(
                          "group/row flex items-stretch gap-4 animate-card-in",
                          selectedFileIds.has(file.id) && "z-20"
                        )}
                      >
                        {/* THE CAUSE: Input File Card */}
                        <div className={cn(
                          "flex-grow flex items-center justify-between bg-slate-900/40 border border-white/5 rounded-3xl p-5 hover:border-indigo-500/30 transition-all shadow-xl relative overflow-hidden",
                          selectedFileIds.has(file.id) && "border-indigo-500/50 bg-indigo-500/[0.05]"
                        )}>
                          <div className="flex items-center gap-4 min-w-0 flex-1 relative z-10">
                            {/* Selection Checkbox */}
                            {isSelectionMode && (
                              <button 
                                onClick={() => toggleSelection(file.id)}
                                className="flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-all shrink-0 animate-in fade-in zoom-in-50 pr-2 cursor-pointer"
                              >
                                {selectedFileIds.has(file.id) ? (
                                  <CheckSquare className="w-5 h-5 text-indigo-400" />
                                ) : (
                                  <Square className="w-5 h-5 opacity-40 group-hover/row:opacity-100" />
                                )}
                              </button>
                            )}

                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5 text-indigo-400/80 transition-all group-hover/row:scale-105 group-hover/row:border-indigo-500/30 shrink-0 shadow-inner">
                              <FileCode className="w-7 h-7" />
                            </div>
                            <div className="min-w-0 flex-grow py-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <h3 className="text-[15px] font-black text-white group-hover/row:text-indigo-300 transition-colors truncate leading-tight">
                                    {file.originalName}
                                  </h3>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-slate-900 border-slate-800 text-xs max-w-xs break-all">{file.originalName}</TooltipContent>
                              </Tooltip>
                              <div className="flex items-center gap-2 mt-2">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] shrink-0">
                                  {formatDate(file.createdAt)}
                                </p>
                                <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] shrink-0">
                                  {formatSize(file.size)}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0 relative z-10 w-[140px] justify-end">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDelete(file.id)}
                                  className="h-11 w-11 rounded-2xl border border-white/5 bg-white/5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/20 transition-all shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">Delete source file</TooltipContent>
                            </Tooltip>

                            {hasOutput ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="sm"
                                    disabled
                                    className={cn(
                                      "h-11 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] px-5 gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default opacity-100 w-[105px] shrink-0"
                                    )}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Done</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">
                                  File has been converted to PDF
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="sm"
                                    onClick={() => handleConvertFile(file)}
                                    disabled={isProcessing}
                                    className={cn(
                                      "h-11 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] px-5 gap-2 active:scale-95 transition-all outline-none border-none w-[105px] shrink-0 justify-center",
                                      isProcessing
                                        ? "bg-indigo-600 text-white cursor-wait"
                                        : "bg-white text-slate-950 hover:bg-indigo-500 hover:text-white shadow-lg"
                                    )}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Zap className="w-3.5 h-3.5 fill-current" />
                                    )}
                                    <span>
                                      {isProcessing ? 'Wait...' : 'Convert'}
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">
                                  Start PDF conversion
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>

                          {/* Individual Progress Bar */}
                          {isProcessing && (
                            <div className="absolute bottom-0 left-0 h-1 w-full bg-indigo-500/10 rounded-b-3xl overflow-hidden">
                              <div className="h-full bg-indigo-500 animate-pulse-width" />
                            </div>
                          )}
                        </div>

                        {/* Spacing */}
                        <div className="w-4 shrink-0" />


                        {/* THE EFFECT: Output Result Card */}
                        <div className={cn(
                          "w-[440px] flex items-center justify-between border rounded-3xl p-5 transition-all duration-700 relative overflow-hidden group/result shadow-xl shrink-0 h-[88px]",
                          hasOutput 
                            ? "bg-emerald-400/[0.04] border-emerald-400/20 hover:border-emerald-400/40 opacity-100" 
                            : "bg-slate-950/20 border-white/5 opacity-40 group-hover/row:opacity-60 grayscale"
                        )}>
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0",
                              hasOutput 
                                ? "bg-emerald-500/10 text-emerald-400 group-hover/result:scale-110" 
                                : "bg-white/5 text-slate-700"
                            )}>
                              <FileDown className="w-6 h-6" />
                            </div>
                            <div className="min-w-0 flex-col gap-0.5 flex">
                                <div className="h-[22px] flex items-center">
                                  {hasOutput ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <p className="text-[13px] font-bold text-slate-200 truncate group-hover/result:text-emerald-300 transition-colors w-full">
                                          {generateStandardName(file.originalName)}.pdf
                                        </p>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="bg-slate-900 border-slate-800 text-xs max-w-xs break-all">
                                        {generateStandardName(file.originalName)}.pdf
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-700">Pending</p>
                                  )}
                                </div>
                              <div className={cn(
                                "text-[10px] font-bold uppercase tracking-[0.1em] transition-colors flex items-center gap-2",
                                hasOutput ? "text-slate-400" : "text-slate-800"
                              )}>
                                {hasOutput ? (
                                  <>
                                    <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 text-[9px]">
                                      {formatSize((file.metadata?.generatedPdfSize as number) || 0)}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span>
                                      {(file.metadata?.generatedPdfPageCount as number) || 1} {((file.metadata?.generatedPdfPageCount as number) || 1) === 1 ? 'Page' : 'Pages'}
                                    </span>
                                  </>
                                ) : (
                                  <span>Awaiting Input</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="w-[44px] flex justify-end">
                            {hasOutput && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="icon"
                                    onClick={() => handleDownloadFile(file, 'pdf')}
                                    className="h-11 w-11 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-950/40 active:scale-95 shrink-0 animate-in zoom-in spin-in-12 duration-300"
                                  >
                                    <Download className="w-5 h-5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">Download PDF</TooltipContent>
                              </Tooltip>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                  

                </>
              ) : (
                <div className="flex-grow border border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center opacity-40 bg-white/[0.01]">
                   <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center mb-6">
                      <Layers className="w-8 h-8 text-slate-600" />
                   </div>
                   <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">No source files detected</p>
                </div>
              )}
            </div>
          </div>
        </section>

      </div>
      

    </main>

    <UploadRulesModal 
      isOpen={uploadRulesModal.isOpen}
      type={uploadRulesModal.type}
      onClose={() => setUploadRulesModal(prev => ({ ...prev, isOpen: false }))}
      onConfirm={handleUploadModalConfirm}
    />
    </TooltipProvider>
  );
}
