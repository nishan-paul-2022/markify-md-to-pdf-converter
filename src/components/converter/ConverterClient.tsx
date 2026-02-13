'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
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
  ExternalLink,
  CheckSquare,
  Square,
  MinusSquare,
  MousePointer2,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserNav from '@/components/auth/UserNav';
import { useFiles, File as AppFile } from '@/hooks/use-files';
import { cn } from '@/lib/utils';
import { generateStandardName, addTimestampToName } from '@/lib/utils/naming';
import { parseMetadataFromMarkdown, removeLandingPageSection } from '@/constants/default-content';
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAlert } from "@/components/AlertProvider";
import { UploadRulesModal } from '@/components/converter/UploadRulesModal';



interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ConverterClientProps {
  user: User;
}

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
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [files, searchQuery]);

  // Derived state for the "Converted" column
  const completedResults = React.useMemo(() => {
    return files.filter(f => processingStates[f.id] === 'done' || convertedFiles[f.id]);
  }, [files, processingStates, convertedFiles]);

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
          metadata: parsedMetadata // Use parsed metadata directly to match Editor logic
        }),
      });

      if (!response.ok) { throw new Error('PDF generation failed'); }
      
      const blob = await response.blob();
      setConvertedFiles(prev => ({ ...prev, [file.id]: blob }));
      setProcessingStates(prev => ({ ...prev, [file.id]: 'done' }));
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
      if (!blob) { return; }
      
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
        <div className="flex items-center gap-4 w-[280px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shadow-inner">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold tracking-tight text-white uppercase tracking-[0.1em]">Converter</h1>
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
        <section className="w-[300px] h-full flex flex-col gap-4 shrink-0">
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

        {/* SEGMENT 2: PROCESSING (Management / Batches) */}
        <section className="flex-grow h-full flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between px-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-400/80 h-11 flex-none">
            <div className="flex items-center gap-4 flex-nowrap">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Layers className="w-3.5 h-3.5" />
                <span>Processing Engine</span>
                {filteredMdFiles.length > 0 && (
                  <span className="ml-2 text-[9px] bg-indigo-400/10 border border-indigo-400/20 px-2 py-0.5 rounded-full text-indigo-300/80 leading-none">{filteredMdFiles.length}</span>
                )}
              </div>
              
              {!loading && filteredMdFiles.length > 0 && (
                <div className="flex items-center gap-2 flex-nowrap">
                  <button 
                    onClick={toggleSelectionMode}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all group cursor-pointer h-8 whitespace-nowrap",
                      isSelectionMode 
                        ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" 
                        : "bg-white/5 border-white/5 text-slate-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:text-slate-300"
                    )}
                  >
                    {isSelectionMode ? (
                      <X className="w-3.5 h-3.5" />
                    ) : (
                      <MousePointer2 className="w-3.5 h-3.5" />
                    )}
                    <span className="text-[9px] font-black uppercase tracking-wider">
                      {isSelectionMode ? 'CANCEL' : 'SELECT'}
                    </span>
                  </button>

                  {isSelectionMode && (
                    <button 
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 hover:bg-indigo-500/20 transition-all group animate-in fade-in slide-in-from-left-2 cursor-pointer h-8 whitespace-nowrap"
                    >
                      {selectedFileIds.size === filteredMdFiles.length ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                      ) : selectedFileIds.size > 0 ? (
                        <MinusSquare className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[9px] font-black uppercase tracking-wider">
                        {selectedFileIds.size === filteredMdFiles.length ? 'DESELECT ALL' : 'SELECT ALL'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {isSelectionMode && selectedFileIds.size > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
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
                  <span>Deploy ({selectedFileIds.size})</span>
                </Button>
              </div>
            )}
          </div>

          <div className="flex-grow bg-indigo-400/[0.03] border border-indigo-400/10 rounded-[1.5rem] pl-4 py-4 pr-0 flex flex-col overflow-hidden relative group/engine backdrop-blur-xl">
             <div className="absolute inset-0 bg-gradient-to-b from-indigo-400/[0.05] to-transparent pointer-events-none" />
             <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-0 relative z-10">
              {!loading && filteredMdFiles.length > 0 ? (
                filteredMdFiles.map((file, index) => (
                <div 
                  key={file.id} 
                  style={{ animationDelay: `${index * 0.05}s` }}
                  className={cn(
                    "bg-slate-900/40 border border-white/5 rounded-2xl p-4 hover:border-blue-500/30 transition-all group/card shadow-2xl relative overflow-hidden animate-card-in shrink-0 mr-4",
                    selectedFileIds.has(file.id) && "border-blue-500/50 bg-blue-500/[0.03]"
                  )}
                >
                  <div className="flex items-center justify-between relative z-10 gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <button 
                          onClick={() => toggleSelection(file.id)}
                          className="flex items-center justify-center text-slate-500 hover:text-blue-400 transition-all shrink-0 animate-in fade-in zoom-in-50 pr-2 cursor-pointer"
                        >
                          {selectedFileIds.has(file.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Square className="w-5 h-5 opacity-40 group-hover/card:opacity-100" />
                          )}
                        </button>
                      )}

                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5 text-blue-400/80 transition-all group-hover/card:scale-105 group-hover/card:border-blue-500/30 shrink-0 shadow-inner">
                        <FileCode className="w-7 h-7" />
                      </div>
                      <div className="min-w-0 flex-grow py-1">
                        <h3 className="text-[15px] font-black text-white group-hover/card:text-blue-400 transition-colors truncate leading-tight">
                          {file.originalName}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mt-1.5 truncate leading-relaxed">
                          {file.relativePath || 'Root Directory'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0 animate-in fade-in zoom-in-95 duration-300">
                      {/* Delete Button */}
                      <Button 
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(file.id)}
                        className="h-11 w-11 rounded-2xl border border-white/5 bg-white/5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/20 transition-all shrink-0"
                        title="Delete source file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                      {/* Open in Editor */}
                      <Button 
                        size="icon"
                        variant="ghost"
                        onClick={() => router.push(`/editor?fileId=${file.id}`)}
                        className="h-11 w-11 rounded-2xl border border-white/5 bg-white/5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 hover:border-blue-400/20 transition-all shrink-0 shadow-sm"
                        title="Open in editor"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>

                      {/* Convert Button */}
                      <Button 
                        size="sm"
                        onClick={() => handleConvertFile(file)}
                        disabled={processingStates[file.id] === 'converting'}
                        className={cn(
                          "h-11 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] px-4 gap-2 active:scale-95 transition-all outline-none border-none shrink-0",
                          processingStates[file.id] === 'done' 
                            ? "bg-emerald-500 text-white" 
                            : processingStates[file.id] === 'converting'
                              ? "bg-blue-600 text-white cursor-wait"
                              : "bg-white text-slate-950 hover:bg-blue-500 hover:text-white"
                        )}
                      >
                        {processingStates[file.id] === 'converting' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Zap className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span className="relative top-[0.5px]">
                          {processingStates[file.id] === 'converting' ? 'Syncing...' : processingStates[file.id] === 'done' ? 'Converted' : 'Deploy'}
                        </span>
                      </Button>
                    </div>
                  </div>

                  {/* Individual Progress Bar (Subtle) */}
                  {processingStates[file.id] === 'converting' && (
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-blue-500/10">
                      <div className="h-full bg-blue-500 animate-pulse-width" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex-grow border border-dashed border-white/5 rounded-[1.5rem] flex flex-col items-center justify-center opacity-40 mr-4" />
            )}
            </div>
          </div>
        </section>



        {/* SEGMENT 3: RESULTS (Converted PDFs) */}
        <section className="w-[380px] h-full flex flex-col gap-4 shrink-0 overflow-hidden">
          <div className="flex items-center justify-between px-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-400/80 h-11 flex-none">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.3)]" />
              <span>Output</span>
            </div>
            {completedResults.length > 0 && (
              <button 
                onClick={() => setConvertedFiles({})}
                className="text-[9px] hover:text-red-400 transition-colors uppercase font-black"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="flex-grow bg-emerald-400/[0.03] border border-emerald-400/10 rounded-[1.5rem] backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col pl-4 py-4 pr-0 relative group/results">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/[0.05] to-transparent pointer-events-none" />
            <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-0 relative z-10">
              {completedResults.length > 0 ? (
                completedResults.map((file, idx) => (
                  <div 
                    key={file.id} 
                    style={{ animationDelay: `${idx * 0.05}s` }}
                    className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between group/result hover:border-emerald-500/20 transition-all animate-card-in mr-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-500/80 group-hover/result:scale-110 transition-transform">
                        <FileDown className="w-5 h-5" />
                      </div>
                      <div className="max-w-[160px]">
                        <p className="text-[11px] font-bold text-slate-200 truncate group-hover/result:text-white transition-colors">
                          {generateStandardName(file.originalName)}.pdf
                        </p>
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight mt-0.5">Ready for Transfer</p>
                      </div>
                    </div>
                    
                    <Button 
                      size="icon"
                      onClick={() => handleDownloadFile(file, 'pdf')}
                      className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-950/20"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center opacity-30 gap-4" />
              )}
            </div>

            {completedResults.length > 1 && (
              <div className="mt-4 pt-4 border-t border-white/5 mr-4">
                <Button 
                  onClick={() => completedResults.forEach(f => handleDownloadFile(f, 'pdf'))}
                  className="w-full h-12 bg-white text-slate-950 hover:bg-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl"
                >
                  Download Library
                </Button>
              </div>
            )}
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
