'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import MdPreview from '@/components/converter/MdPreview';
import Editor from '@/components/converter/Editor';
import { FileCode, Upload, RotateCcw, ChevronsUp, ChevronsDown, Check, Copy, Download, Eye, MoreVertical, FolderOpen, Trash2, ListChecks, FileArchive, X, Layers } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserNav from '@/components/auth/UserNav';
import { Metadata } from '@/constants/default-content';
import { formatDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';

import { useRouter } from 'next/navigation';
import { File as AppFile } from '@/hooks/use-files';
import { useAlert } from "@/components/AlertProvider";
import { FileTree } from '@/components/file-manager/FileTree';
import { FileTreeNode, buildFileTree } from '@/lib/file-tree';
import { PanelLeftClose, PanelLeftOpen, RefreshCw, Search } from 'lucide-react';
import { ImageModal } from '@/components/file-manager/ImageModal';
import { UploadRulesModal } from '@/components/converter/UploadRulesModal';

interface EditorViewProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  files: AppFile[];
  filesLoading: boolean;
  handleFileDelete: (id: string | string[]) => void;
  handleFileRename: (id: string, newName: string, type: "file" | "folder", batchId?: string, oldPath?: string) => Promise<void>;
  onFileSelect: (node: FileTreeNode) => void;
  refreshFiles: () => Promise<void>;
  rawContent: string;
  content: string;
  metadata: Metadata;
  isGenerating: boolean;
  isUploaded: boolean;
  isReset: boolean;
  activeTab: 'editor' | 'preview';
  uploadTime: Date | null;
  lastModifiedTime: Date | null;
  isEditorAtTop: boolean;
  isLoading: boolean;
  basePath: string;
  isCopied: boolean;
  isDownloaded: boolean;
  isPdfDownloaded: boolean;
  selectedFileId: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  folderInputRef: React.RefObject<HTMLInputElement | null>;
  zipInputRef: React.RefObject<HTMLInputElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  stats: {
    chars: number;
    words: number;
  };
  setActiveTab: (tab: 'editor' | 'preview') => void;

  handleContentChange: (content: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  handleFolderUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  handleZipUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  triggerFileUpload: () => void;
  triggerFolderUpload: () => void;
  triggerZipUpload: () => void;
  handleReset: () => void;
  handleCopy: () => void;
  handleDownloadMd: () => void;
  handleDownloadPdf: () => void;
  generatePdfBlob: () => Promise<Blob>;
  scrollToStart: () => void;
  scrollToEnd: () => void;
  setFilename: (name: string) => void;
  setIsLoading: (loading: boolean) => void;
  MAX_FILENAME_LENGTH: number;
  getBaseName: (name: string) => string;
  activeImage: AppFile | null;
  setActiveImage: (image: AppFile | null) => void;
  imageGallery: AppFile[];
  setImageGallery: (images: AppFile[]) => void;
}

export function EditorView({
  user,
  files,
  filesLoading,
  handleFileDelete,
  handleFileRename,
  onFileSelect,
  refreshFiles,
  rawContent,
  content,
  metadata,
  isGenerating,
  isUploaded,
  isReset,
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
  zipInputRef,
  textareaRef,
  stats,
  setActiveTab,

  handleContentChange,
  handleFileUpload,
  handleFolderUpload,
  handleZipUpload,
  triggerFileUpload,
  triggerFolderUpload,
  triggerZipUpload,
  handleReset,
  handleCopy,
  handleDownloadMd,
  handleDownloadPdf,
  generatePdfBlob,
  scrollToStart,
  scrollToEnd,
  setFilename,
  setIsLoading,
  activeImage,
  setActiveImage,
  imageGallery,
}: EditorViewProps) {
  const router = useRouter();
  const { confirm } = useAlert();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDragging, setIsDragging] = React.useState(false);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [uploadRulesModal, setUploadRulesModal] = React.useState<{ isOpen: boolean, type: 'file' | 'folder' | 'zip' }>({ isOpen: false, type: 'file' });

  const toggleSelection = React.useCallback((id: string | string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const ids = Array.isArray(id) ? id : [id];
      
      const allSelected = ids.every(i => next.has(i));
      if (allSelected) {
        ids.forEach(i => next.delete(i));
      } else {
        ids.forEach(i => next.add(i));
      }
      return next;
    });
  }, []);

  const handleBulkDeleteClick = async () => {
    if (selectedIds.size === 0) {return;}
    
    const confirmed = await confirm({
      title: "Delete multiple items?",
      message: `Are you sure you want to delete ${selectedIds.size} selected items? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    });

    if (confirmed) {
      handleFileDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  const getAllDeletableFileIds = React.useCallback(() => {
    return files
      .filter(f => !f.id.startsWith("default-") && f.batchId !== 'sample-document' && f.batchId !== 'sample-project')
      .map(f => f.id);
  }, [files]);

  const handleSelectAll = React.useCallback(() => {
    const allIds = getAllDeletableFileIds();
    const allSelected = allIds.every(id => selectedIds.has(id));
    
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }, [getAllDeletableFileIds, selectedIds]);

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = React.useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = Array.from(e.dataTransfer.items || []);
    if (items.length === 0) {return;}

    const newFiles: { file: File; path: string }[] = [];

    const traverseFileTree = async (item: FileSystemEntry, path = "") => {
      if (item.isFile) {
        return new Promise<void>((resolve) => {
          (item as FileSystemFileEntry).file((file: File) => {
            newFiles.push({ file, path: path + file.name });
            resolve();
          });
        });
      } else if (item.isDirectory) {
        const dirReader = (item as FileSystemDirectoryEntry).createReader();
        const entries: FileSystemEntry[] = await new Promise((resolve) => {
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

    if (newFiles.length > 0) {
      setIsLoading(true);
      const batchId = self.crypto.randomUUID();
      
      try {
        const uploadPromises = newFiles.map(async ({ file, path }) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('batchId', batchId);
          formData.append('relativePath', path);
          formData.append('source', 'editor');
          
          const response = await fetch('/api/files', {
            method: 'POST',
            body: formData,
          });
          
          return response.ok ? await response.json() : null;
        });

        await Promise.all(uploadPromises);
        
        // Find first MD file and load it
        const mdFile = newFiles.find(nf => nf.file.name.endsWith('.md'));
        if (mdFile) {
          // Read local content for immediate response
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (typeof ev.target?.result === 'string') {
              handleContentChange(ev.target.result);
              setFilename(mdFile.file.name);
            }
          };
          reader.readAsText(mdFile.file);
        }

        await refreshFiles();
      } catch (err) {
        console.error("Drop upload error:", err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [refreshFiles, handleContentChange, setFilename, setIsLoading]);

  React.useEffect(() => {
    console.log('Sidebar state changed to:', isSidebarOpen);
  }, [isSidebarOpen]);

  const fileTree = React.useMemo(() => {
    const filteredFiles = files.filter(f => 
      f.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.relativePath && f.relativePath.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return buildFileTree(filteredFiles);
  }, [files, searchQuery]);

  const getSelectedCount = React.useCallback(() => {
    let count = 0;
    fileTree.forEach(node => {
      if (node.id.startsWith("default-") || node.batchId === 'sample-document' || node.batchId === 'sample-project') {
        return;
      }
      
      if (node.type === 'folder') {
        const batchFiles = files.filter(f => f.batchId === node.batchId);
        if (batchFiles.length > 0 && batchFiles.every(f => selectedIds.has(f.id))) {
          count++;
        }
      } else if (node.type === 'file') {
        if (selectedIds.has(node.id)) {
          count++;
        }
      }
    });
    return count;
  }, [fileTree, files, selectedIds]);

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



  return (
    <TooltipProvider>
      <main 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="h-dvh w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative"
      >
        {isDragging && (
          <div className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm border-2 border-dashed border-primary/50 flex flex-col items-center justify-center animate-in fade-in duration-200">
            <div className="p-6 bg-slate-800 rounded-2xl shadow-2xl border border-white/10 flex flex-col items-center gap-4 transform scale-110 transition-transform">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary animate-bounce" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">Drop to Upload</h3>
                <p className="text-sm text-slate-400 mt-1">Files will be added to your library</p>
              </div>
            </div>
          </div>
        )}
        <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-[60] flex items-center gap-3">
             <Button
               variant="default"
               onClick={() => router.push('/converter')}
               className="h-10 px-5 bg-slate-900 border border-white/10 hover:border-blue-500/50 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-all shadow-2xl group flex items-center gap-2.5 hover:bg-slate-800"
             >
               <Layers className="w-3.5 h-3.5 group-hover:text-blue-400 transition-all duration-300" />
               <span>Converter</span>
             </Button>
             <UserNav user={user} />
        </div>

        <div className="lg:hidden p-3 bg-slate-950/50 backdrop-blur-xl border-b border-white/5 flex justify-center">
          <div className="flex items-center p-1 bg-slate-900/50 border border-white/5 rounded-xl w-full max-w-sm shadow-inner relative overflow-hidden">
            <button
              onClick={() => setActiveTab('editor')}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-[0.15em] rounded-lg transition-all duration-300 ${
                activeTab === 'editor' ? 'text-white' : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              <FileCode className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === 'editor' ? 'scale-110' : ''}`} /> 
              <span>Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-[0.15em] rounded-lg transition-all duration-300 ${
                activeTab === 'preview' ? 'text-white' : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              <Eye className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === 'preview' ? 'scale-110' : ''}`} /> 
              <span>Preview</span>
            </button>
            
            <div 
              className="absolute top-1 bottom-1 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-white/10 rounded-lg shadow-sm"
              style={{
                width: 'calc(50% - 4px)',
                left: activeTab === 'editor' ? '4px' : 'calc(50% + 0px)',
              }}
            />
          </div>
        </div>

        <div className="flex-grow flex flex-row overflow-hidden relative">
          {/* Sidebar */}
          <aside 
            className={cn(
              "hidden lg:flex flex-col bg-slate-900/30 border-r border-white/5 transition-all duration-300 ease-in-out overflow-hidden z-30 shrink-0",
              isSidebarOpen ? "w-72 opacity-100" : "w-0 border-r-0 opacity-0 pointer-events-none"
            )}
          >
            <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-slate-900/50 sticky top-0 z-20">
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Explorer</span>
               <div className="flex items-center gap-1">
                 {!isSelectionMode && (
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsSelectionMode(true)}
                          className="h-7 w-7 rounded-sm text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
                       >
                         <ListChecks className="h-3.5 w-3.5" />
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">Bulk Select</TooltipContent>
                   </Tooltip>
                 )}

                 <Tooltip>
                   <TooltipTrigger asChild>
                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => refreshFiles()}
                        className="h-7 w-7 rounded-sm text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
                        disabled={filesLoading}
                     >
                       <RefreshCw className={cn("h-3.5 w-3.5", filesLoading && "animate-spin")} />
                     </Button>
                   </TooltipTrigger>
                   <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">Refresh Explorer</TooltipContent>
                 </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSidebarOpen(false);
                        }}
                        className="h-7 w-7 rounded-sm text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
                      >
                        <PanelLeftClose className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">Collapse Sidebar</TooltipContent>
                  </Tooltip>
               </div>
            </div>

            <div className="p-3">
              <div className="relative group">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-slate-200 transition-colors" />
                <input
                  type="text"
                  placeholder="Search files"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-md py-1.5 pl-8 pr-10 text-xs focus:outline-none focus:border-white/10 focus:bg-slate-950 transition-all placeholder:text-slate-600"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 p-2 rounded-full hover:bg-white/10 transition-all cursor-pointer group"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                  </button>
                )}
              </div>
            </div>

            {/* Selection Toolbar - Replacing Default Items Area */}
            {isSelectionMode && (
              <div className="z-30 bg-slate-950/40 flex flex-col border border-white/10 rounded-xl mx-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl mb-4 overflow-hidden">
                <div className="flex items-center justify-between px-3 h-12 bg-white/[0.02] border-b border-white/5">
                  <div className="flex items-center gap-2">
                     <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 tabular-nums">
                       {getSelectedCount()} Selected
                     </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className={cn(
                        "h-7 px-3 text-[9px] font-bold uppercase tracking-widest transition-all rounded-md border border-white/20 shadow-sm",
                        selectedIds.size === getAllDeletableFileIds().length && selectedIds.size > 0 
                          ? "text-primary hover:text-slate-100 hover:bg-white/10 border-primary/40" 
                          : "text-slate-500 hover:text-slate-100 hover:bg-white/10"
                      )}
                    >
                      {selectedIds.size === getAllDeletableFileIds().length && selectedIds.size > 0 ? "Reset" : "Select All"}
                    </Button>

                    <button
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedIds(new Set());
                      }}
                      className="h-9 w-9 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all flex items-center justify-center cursor-pointer group"
                      aria-label="Exit selection mode"
                    >
                      <X className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
                
                <div className="p-2.5">
                  <button
                    disabled={selectedIds.size === 0}
                    onClick={handleBulkDeleteClick}
                    className={cn(
                      "w-full h-11 text-[11px] font-black uppercase tracking-[0.25em] gap-3 transition-all duration-300 rounded-lg border flex items-center justify-center cursor-pointer",
                      selectedIds.size > 0 
                        ? "text-red-500/80 bg-transparent border-red-500/20 hover:text-white hover:border-red-500 hover:bg-red-500 shadow-sm"
                        : "text-slate-600 bg-transparent border-white/5 opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            <div className="flex-grow overflow-y-auto custom-scrollbar px-2 pb-4">
              {fileTree.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-2">
                  <FolderOpen className="w-5 h-5 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Empty Explorer</span>
                </div>
              ) : (
                <FileTree 
                  nodes={isSelectionMode ? fileTree.filter(node => node.batchId !== 'sample-document' && node.batchId !== 'sample-project') : fileTree} 
                  onFileSelect={onFileSelect} 
                  onDelete={handleFileDelete}
                  onRename={handleFileRename}
                  selectedFileId={selectedFileId || undefined}
                  isSelectionMode={isSelectionMode}
                  selectedIds={selectedIds}
                  onToggleSelection={toggleSelection}
                  searchQuery={searchQuery}
                />
              )}
            </div>
          </aside>

          <div className="flex-grow flex flex-col lg:flex-row gap-0 overflow-hidden relative">
          <div className={`flex-1 flex flex-col border-r border-slate-800/50 overflow-hidden transition-all duration-300 ${
            activeTab === 'editor' ? 'flex tab-enter' : 'hidden lg:flex'
          }`}>
            <div
              className="h-12 bg-slate-900/80 px-4 border-b border-slate-800 flex items-center justify-center transition-colors shrink-0 select-none backdrop-blur-sm relative"
            >
              {/* Sidebar Toggle Button (when collapsed) */}
              {!isSidebarOpen && (
                <div className="absolute left-4 flex items-center h-full">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(true)}
                    className="hidden lg:flex h-7 w-7 rounded-sm text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
                    title="Open Sidebar"
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </Button>
                </div>
              )}
                
              <div className="flex items-center gap-4 sm:gap-8 lg:gap-10">
                {/* Group 1: Uploads */}
                <div className="flex items-center gap-0.5 bg-slate-800/40 rounded-full h-8 px-1 border border-white/5 shadow-inner">
                  <input
                    type="file"
                    accept=".md,image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    multiple
                    ref={fileInputRef}
                    onChange={async (e) => {
                      await handleFileUpload(e);
                      await refreshFiles();
                    }}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={folderInputRef}
                    className="hidden"
                    {...({ webkitdirectory: "", directory: "" } as unknown as React.InputHTMLAttributes<HTMLInputElement>)}
                    onChange={async (e) => {
                      await handleFolderUpload(e);
                      await refreshFiles();
                    }}
                  />
                  <input
                    type="file"
                    accept=".zip,.7z,.rar,.tar,.tar.gz,.tgz"
                    ref={zipInputRef}
                    onChange={async (e) => {
                      await handleZipUpload(e);
                      await refreshFiles();
                    }}
                    className="hidden"
                  />
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setUploadRulesModal({ isOpen: true, type: 'file' }); }}
                        className="h-6 px-3 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-200 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        {isUploaded ? <Check className="w-3 h-3 mr-1.5 text-green-400" /> : <Upload className="w-3 h-3 mr-1.5" />}
                        File
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload File</TooltipContent>
                  </Tooltip>

                  <div className="w-[1px] h-3 bg-white/10" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setUploadRulesModal({ isOpen: true, type: 'folder' }); }}
                        className="h-6 px-3 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-200 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-amber-500/70" />
                        Folder
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload Folder</TooltipContent>
                  </Tooltip>

                  <div className="w-[1px] h-3 bg-white/10" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setUploadRulesModal({ isOpen: true, type: 'zip' }); }}
                        className="h-6 px-3 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-200 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        <FileArchive className="w-3.5 h-3.5 mr-1.5 text-blue-400/70" />
                        Zip
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload Zip Archive</TooltipContent>
                  </Tooltip>
                </div>

                {/* Group 2: Navigation */}
                <div className="flex items-center gap-0.5 bg-slate-800/40 rounded-full h-8 px-1 border border-white/5 shadow-inner">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Scroll to top"
                        onClick={scrollToStart}
                        className="h-6 w-8 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 hover:border-white/10 border border-transparent active:scale-90 transition-all duration-200"
                      >
                        <ChevronsUp className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Scroll to Top</TooltipContent>
                  </Tooltip>
                  
                  <div className="w-[1px] h-3 bg-white/10" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Scroll to bottom"
                        onClick={scrollToEnd}
                        className="h-6 w-8 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 hover:border-white/10 border border-transparent active:scale-90 transition-all duration-200"
                      >
                        <ChevronsDown className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Scroll to Bottom</TooltipContent>
                  </Tooltip>
                </div>

                {/* Group 3: Actions */}
                <div className="flex items-center gap-0.5 bg-slate-800/40 rounded-full h-8 px-1 border border-white/5 shadow-inner">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                        className="h-6 px-3 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-200 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                        {isCopied ? 'Copied' : 'Copy'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy Source</TooltipContent>
                  </Tooltip>

                  <div className="w-[1px] h-3 bg-white/10" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleReset(); }}
                        className="h-6 px-3 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-200 hover:bg-white/5 hover:text-slate-200 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        {isReset ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" /> : <RotateCcw className="w-3.5 h-3.5 mr-1.5" />}
                        {isReset ? 'Done' : 'Reset'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset Content</TooltipContent>
                  </Tooltip>

                  <div className="w-[1px] h-3 bg-white/10" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDownloadMd(); }}
                        className="h-6 px-3 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-200 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        {isDownloaded ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
                        Export
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download Source</TooltipContent>
                  </Tooltip>

                  <div className="md:hidden ml-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Menu" className="h-6 w-6 rounded-full text-slate-500 hover:text-slate-200">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-100 min-w-40">
                        <DropdownMenuItem onClick={handleCopy} className="gap-2 text-xs">
                          {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy Source
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleReset} className="gap-2 text-xs">
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reset Content
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadMd} className="gap-2 text-xs">
                          <Download className="w-3.5 h-3.5" />
                          Export Markdown
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDownloadPdf} className="gap-2 text-xs">
                          <Download className="w-3.5 h-3.5" />
                          Export PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-grow relative overflow-hidden group/editor">
              <div className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 h-9 bg-transparent text-[10px] font-medium tracking-tight select-none pointer-events-none transition-opacity duration-75 ${isEditorAtTop ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1.5 group/stat">
                    <span className="uppercase tracking-widest text-[9px] font-bold text-slate-500/80">Words</span>
                    <span className="tabular-nums text-slate-300">{stats.words}</span>
                  </div>
                  <div className="flex items-center gap-1.5 group/stat">
                    <span className="uppercase tracking-widest text-[9px] font-bold text-slate-500/80">Characters</span>
                    <span className="tabular-nums text-slate-300">{stats.chars}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {uploadTime && (
                    <div className="flex items-center gap-1.5 group/stat">
                      <span className="uppercase tracking-widest text-[9px] font-bold text-blue-400/50">Uploaded</span>
                      <span className="tabular-nums text-slate-300">{formatDateTime(uploadTime)}</span>
                    </div>
                  )}
                  {lastModifiedTime && (
                    <div className="flex items-center gap-1.5 group/stat">
                      <span className="uppercase tracking-widest text-[9px] font-bold text-emerald-400/50">Modified</span>
                      <span className="tabular-nums text-slate-300">{formatDateTime(lastModifiedTime)}</span>
                    </div>
                  )}
                </div>
              </div>

              <Editor
                innerRef={textareaRef}
                value={rawContent}
                onChange={handleContentChange}
                className="absolute inset-0 w-full h-full resize-none border-none p-4 lg:p-6 pt-10 lg:pt-10 font-mono text-sm focus-visible:ring-0 bg-slate-950 text-slate-300 selection:bg-primary/30 custom-scrollbar dark-editor"
                placeholder="Write your markdown here..."
              />
            </div>
          </div>

          <div className={`flex-1 flex flex-col overflow-hidden bg-slate-900/10 transition-all duration-300 ${
            activeTab === 'preview' ? 'flex tab-enter' : 'hidden lg:flex'
          }`}>
            <MdPreview
              content={content}
              metadata={metadata}
              showToolbar={true}
              onDownload={handleDownloadPdf}
              onGeneratePdf={generatePdfBlob}
              isGenerating={isGenerating}
              isDownloaded={isPdfDownloaded}
              isLoading={isLoading}
              basePath={basePath}
            />
          </div>
        </div>
        </div>
        {activeImage && (
          <ImageModal 
            activeImage={activeImage}
            images={imageGallery}
            onClose={() => setActiveImage(null)}
            onSelectImage={setActiveImage}
          />
        )}

        <UploadRulesModal 
          isOpen={uploadRulesModal.isOpen}
          type={uploadRulesModal.type}
          onClose={() => setUploadRulesModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handleUploadModalConfirm}
        />
      </main>
    </TooltipProvider>
  );
}
