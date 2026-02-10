'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import MdPreview from '@/components/converter/MdPreview';
import Editor from '@/components/converter/Editor';
import { FileCode, Upload, RotateCcw, ChevronsUp, ChevronsDown, PencilLine, Check, X, Copy, Download, Eye, MoreVertical, FolderOpen, Trash2, ListChecks } from 'lucide-react';
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

import { File as AppFile } from '@/hooks/use-files';
import { useAlert } from "@/components/AlertProvider";
import { FileTree } from '@/components/file-manager/FileTree';
import { FileTreeNode, buildFileTree } from '@/lib/file-tree';
import { PanelLeftClose, PanelLeftOpen, RefreshCw, Search } from 'lucide-react';
import { ImageModal } from '@/components/file-manager/ImageModal';

interface ConverterViewProps {
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
  filename: string;
  isEditing: boolean;
  isUploaded: boolean;
  isReset: boolean;
  tempFilename: string;
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
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  stats: {
    chars: number;
    words: number;
  };
  setActiveTab: (tab: 'editor' | 'preview') => void;
  setTempFilename: (name: string) => void;
  handleStartEdit: () => void;
  handleSave: () => void;
  handleCancel: () => void;
  handleContentChange: (content: string) => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  handleFolderUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  triggerFileUpload: () => void;
  triggerFolderUpload: () => void;
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

export function ConverterView({
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
  setIsLoading,
  MAX_FILENAME_LENGTH,
  getBaseName,
  activeImage,
  setActiveImage,
  imageGallery,
}: ConverterViewProps) {
  const { confirm } = useAlert();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDragging, setIsDragging] = React.useState(false);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

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
      .filter(f => !f.id.startsWith("default-"))
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

  const getInputWidth = (name: string): string => {
    const charCount = name.length || 8;
    return `${Math.max(charCount * 0.65, 5)}rem`;
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {handleSave();}
    if (e.key === 'Escape') {handleCancel();}
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
             <UserNav user={user} />
        </div>

        <div className="lg:hidden p-3 bg-slate-950/50 backdrop-blur-xl border-b border-white/5 flex justify-center">
          <div className="flex items-center p-1 bg-slate-900/50 border border-white/5 rounded-xl w-full max-w-sm shadow-inner relative overflow-hidden">
            <button
              onClick={() => setActiveTab('editor')}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-[0.15em] rounded-lg transition-all duration-300 ${
                activeTab === 'editor' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <FileCode className={`w-3.5 h-3.5 transition-transform duration-300 ${activeTab === 'editor' ? 'scale-110' : ''}`} /> 
              <span>Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-[0.15em] rounded-lg transition-all duration-300 ${
                activeTab === 'preview' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
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
                          className="h-7 w-7 rounded-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
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
                        className="h-7 w-7 rounded-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
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
                        className="h-7 w-7 rounded-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
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
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-slate-300 transition-colors" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-md py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:border-white/10 focus:bg-slate-950 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Selection Toolbar - Replacing Default Items Area */}
            {isSelectionMode && (
              <div className="z-30 bg-[#0f111a] flex flex-col border-b border-white/5 animate-in slide-in-from-top duration-300 shadow-xl mb-4">
                <div className="flex items-center justify-between px-4 h-14 bg-white/[0.03]">
                  <div className="flex flex-col">
                     <span className="text-[14px] font-black text-primary tabular-nums tracking-tight">
                       {selectedIds.size} Selected
                     </span>
                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                       Management Mode
                     </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors rounded-full border border-white/5"
                    >
                      {selectedIds.size === getAllDeletableFileIds().length && selectedIds.size > 0 ? "Reset" : "Select All"}
                    </Button>
                    <button
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedIds(new Set());
                      }}
                      className="h-8 w-8 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-3 bg-white/[0.01]">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={selectedIds.size === 0}
                    onClick={handleBulkDeleteClick}
                    className={cn(
                      "w-full h-11 text-[11px] font-black uppercase tracking-[0.2em] gap-3 transition-all duration-300 rounded-lg",
                      selectedIds.size > 0 
                        ? "text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
                        : "text-slate-600 border border-white/5 opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected Items
                  </Button>
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
                />
              )}
            </div>
          </aside>

          <div className="flex-grow flex flex-col lg:flex-row gap-0 overflow-hidden relative">
          <div className={`flex-1 flex flex-col border-r border-slate-800/50 overflow-hidden transition-all duration-300 ${
            activeTab === 'editor' ? 'flex tab-enter' : 'hidden lg:flex'
          }`}>
            <div
              className="h-12 bg-slate-900/80 px-4 border-b border-slate-800 flex items-center justify-between transition-colors backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                {/* Sidebar Toggle Button (when collapsed) */}
                {!isSidebarOpen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(true)}
                    className="hidden lg:flex h-7 w-7 rounded-sm text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
                    title="Open Sidebar"
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </Button>
                )}
                
                <div 
                  className={`group hidden sm:flex items-center gap-1.5 px-3 h-7 rounded-full transition-all duration-200 border ${
                    isEditing 
                      ? 'bg-slate-800 border-primary/50 ring-1 ring-primary/20' 
                      : 'bg-slate-800/50 hover:bg-slate-800/70 border-white/5 hover:border-white/10'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={tempFilename}
                            onChange={(e) => {
                              if (e.target.value.length <= MAX_FILENAME_LENGTH) {
                                setTempFilename(e.target.value);
                              }
                            }}
                            onKeyDown={handleKeyDown}
                            onBlur={() => {
                              setTimeout(handleSave, 200);
                            }}
                            autoFocus
                            maxLength={MAX_FILENAME_LENGTH}
                            style={{ width: getInputWidth(tempFilename) }}
                            className="bg-transparent border-none outline-none text-xs font-medium placeholder:text-slate-500 text-slate-100 h-6 flex items-center focus-visible:ring-0 focus-visible:ring-offset-0"
                            placeholder="document"
                          />
                        <span className="text-[10px] tabular-nums select-none opacity-40 font-medium text-slate-400">
                          {tempFilename.length}/{MAX_FILENAME_LENGTH}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 border-l border-slate-700 ml-1 pl-1">
                        <Button 
                          variant="ghost"
                          size="icon"
                          aria-label="Save filename"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => { e.stopPropagation(); handleSave(); }}
                          className="h-6 w-6 p-0 cursor-pointer text-green-400/80 hover:text-green-400 hover:bg-green-400/10 rounded-full transition-all border-transparent"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost"
                          size="icon"
                          aria-label="Cancel rename"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                          className="h-6 w-6 p-0 cursor-pointer text-red-400/80 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all border-transparent"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs text-slate-300 font-medium">
                        {getBaseName(filename)}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Rename file"
                            onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}
                            className="h-6 w-6 p-0 text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-full transition-all cursor-pointer ml-2"
                          >
                            <PencilLine className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Rename File</TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 lg:gap-5">
                <div className="flex items-center gap-1 bg-slate-800/40 rounded-full h-7 px-[2px] border border-white/5 shadow-inner">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Scroll to top"
                        onClick={scrollToStart}
                        className="h-6 w-6 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 hover:border-white/10 border border-transparent active:scale-90 transition-all duration-200"
                      >
                        <ChevronsUp className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Scroll to Top</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Scroll to bottom"
                        onClick={scrollToEnd}
                        className="h-6 w-6 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 hover:border-white/10 border border-transparent active:scale-90 transition-all duration-200"
                      >
                        <ChevronsDown className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Scroll to Bottom</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-1 bg-slate-800/40 rounded-full h-7 px-[2px] border border-white/5 shadow-inner">
                  <input
                    type="file"
                    accept=".md,image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={folderInputRef}
                    className="hidden"
                    {...({ webkitdirectory: "", directory: "" } as unknown as React.InputHTMLAttributes<HTMLInputElement>)}
                    onChange={handleFolderUpload}
                  />
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); triggerFileUpload(); }}
                        className="h-6 w-16 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        {isUploaded ? <Check className="w-3 h-3 mr-1 text-green-400" /> : <Upload className="w-3 h-3 mr-1" />}
                        File
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload .md File</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); triggerFolderUpload(); }}
                        className="h-6 w-20 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        <FolderOpen className="w-3 h-3 mr-1 text-amber-500/70" />
                        Folder
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload Folder (.md + images)</TooltipContent>
                  </Tooltip>

                  <div className="w-[1px] h-3 bg-white/10 mx-1" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDownloadMd(); }}
                        className="h-6 w-24 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        {isDownloaded ? <Check className="w-3 h-3 mr-1 text-green-400" /> : <Download className="w-3 h-3 mr-1" />}
                        Export
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download Source</TooltipContent>
                  </Tooltip>
                </div>

                <div className="hidden md:flex items-center gap-1 bg-slate-800/40 rounded-full h-7 px-[2px] border border-white/5 shadow-inner">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                        className="h-6 w-20 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                        {isCopied ? 'Copied' : 'Copy'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy Source</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleReset(); }}
                        className="h-6 w-20 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:text-slate-200 hover:border-white/10 border border-transparent active:scale-95 transition-all duration-200 rounded-full"
                      >
                        {isReset ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-400" /> : <RotateCcw className="w-3.5 h-3.5 mr-1.5" />}
                        {isReset ? 'Done' : 'Reset'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset Content</TooltipContent>
                  </Tooltip>
                </div>

                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Menu" className="h-7 w-7 rounded-full text-slate-400">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-100 min-w-40">
                      <DropdownMenuItem onClick={handleCopy} className="gap-2 text-xs">
                        {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? 'Copied' : 'Copy Source'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleReset} className="gap-2 text-xs">
                        <RotateCcw className="w-3.5 h-3.5" /> Reset Content
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
            onSelectImage={(img) => setActiveImage(img)}
          />
        )}
      </main>
    </TooltipProvider>
  );
}
