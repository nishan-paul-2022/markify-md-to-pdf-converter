'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { useAlert } from '@/components/AlertProvider';
import UserNav from '@/components/auth/UserNav';
import Editor from '@/components/converter/Editor';
import MdPreview from '@/components/converter/MdPreview';
import { UploadRulesModal } from '@/components/converter/UploadRulesModal';
import { FileTree } from '@/components/file-manager/FileTree';
import { ImageModal } from '@/components/file-manager/ImageModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useConverter } from '@/hooks/use-converter';
import type { File as AppFile } from '@/hooks/use-files';
import type { FileTreeNode } from '@/lib/file-tree';
import { buildFileTree } from '@/lib/file-tree';
import { formatDateTime } from '@/lib/formatters';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/use-editor-store';

import {
  Check,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Download,
  Eye,
  FileArchive,
  FileCode,
  FolderOpen,
  Layers,
  ListChecks,
  MoreVertical,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { PanelLeftClose, PanelLeftOpen, RefreshCw, Search } from 'lucide-react';

interface EditorViewProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  files: AppFile[];
  filesLoading: boolean;
  handleFileDelete: (id: string | string[]) => Promise<void> | void;
  handleFileRename: (
    id: string,
    newName: string,
    type: 'file' | 'folder',
    batchId?: string,
    oldPath?: string,
  ) => Promise<void>;
  onFileSelect: (node: FileTreeNode) => void;
  refreshFiles: () => Promise<void>;
}

export function EditorView({
  user,
  files,
  filesLoading,
  handleFileDelete,
  handleFileRename,
  onFileSelect,
  refreshFiles,
}: EditorViewProps) {
  const router = useRouter();
  const { confirm } = useAlert();
  const converter = useConverter();

  // Destructure for easier access in JSX
  const {
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
    setFilename,
    setIsLoading,
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
    activeImage,
    setActiveImage,
    imageGallery,
  } = converter;

  const { isSidebarOpen, setIsSidebarOpen } = useEditorStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDragging, setIsDragging] = React.useState(false);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [uploadRulesModal, setUploadRulesModal] = React.useState<{
    isOpen: boolean;
    type: 'file' | 'folder' | 'zip';
  }>({ isOpen: false, type: 'file' });

  const toggleSelection = React.useCallback((id: string | string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const ids = Array.isArray(id) ? id : [id];

      const allSelected = ids.every((i) => next.has(i));
      if (allSelected) {
        ids.forEach((i) => next.delete(i));
      } else {
        ids.forEach((i) => next.add(i));
      }
      return next;
    });
  }, []);

  const handleBulkDeleteClick = async () => {
    if (selectedIds.size === 0) {
      return;
    }

    const confirmed = await confirm({
      title: 'Delete multiple items?',
      message: `Are you sure you want to delete ${selectedIds.size} selected items? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (confirmed) {
      void handleFileDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  const getAllDeletableFileIds = React.useCallback(() => {
    return files
      .filter(
        (f) =>
          !f.id.startsWith('default-') &&
          f.batchId !== 'sample-document' &&
          f.batchId !== 'sample-project',
      )
      .map((f) => f.id);
  }, [files]);

  const handleSelectAll = React.useCallback(() => {
    const allIds = getAllDeletableFileIds();
    const allSelected = allIds.every((id) => selectedIds.has(id));

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

  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const items = Array.from(e.dataTransfer.items);
      if (items.length === 0) {
        return;
      }

      const newFiles: { file: File; path: string }[] = [];

      const traverseFileTree = async (item: FileSystemEntry, path = '') => {
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
            await traverseFileTree(entry, path + item.name + '/');
          }
        }
      };

      const itemPromises = items.map((item) => {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          return traverseFileTree(entry);
        }
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

            if (response.ok) {
              return await response.json();
            }
            return null;
          });

          await Promise.all(uploadPromises);

          // Find first MD file and load it
          const mdFile = newFiles.find((nf) => nf.file.name.endsWith('.md'));
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

          void refreshFiles();
        } catch (err) {
          logger.error('Drop upload error:', err);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [refreshFiles, handleContentChange, setFilename, setIsLoading],
  );

  React.useEffect(() => {
    logger.debug('Sidebar state changed to:', isSidebarOpen);
  }, [isSidebarOpen]);

  const fileTree = React.useMemo(() => {
    const filteredFiles = files.filter(
      (f) =>
        f.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.relativePath && f.relativePath.toLowerCase().includes(searchQuery.toLowerCase())),
    );
    return buildFileTree(filteredFiles);
  }, [files, searchQuery]);

  const getSelectedCount = React.useCallback(() => {
    let count = 0;
    fileTree.forEach((node) => {
      if (
        node.id.startsWith('default-') ||
        node.batchId === 'sample-document' ||
        node.batchId === 'sample-project'
      ) {
        return;
      }

      if (node.type === 'folder') {
        const batchFiles = files.filter((f) => f.batchId === node.batchId);
        if (batchFiles.length > 0 && batchFiles.every((f) => selectedIds.has(f.id))) {
          count++;
        }
      } else {
        if (selectedIds.has(node.id)) {
          count++;
        }
      }
    });
    return count;
  }, [fileTree, files, selectedIds]);

  const handleUploadModalConfirm = () => {
    const type = uploadRulesModal.type;
    setUploadRulesModal((prev) => ({ ...prev, isOpen: false }));
    if (type === 'file') {
      triggerFileUpload();
    } else if (type === 'folder') {
      triggerFolderUpload();
    } else {
      triggerZipUpload();
    }
  };

  return (
    <TooltipProvider>
      <main
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative flex h-dvh w-full flex-col overflow-hidden bg-slate-950 text-slate-100"
      >
        {isDragging && (
          <div className="border-primary/50 animate-in fade-in absolute inset-0 z-[100] flex flex-col items-center justify-center border-2 border-dashed bg-slate-900/80 backdrop-blur-sm duration-200">
            <div className="flex scale-110 transform flex-col items-center gap-4 rounded-2xl border border-white/10 bg-slate-800 p-6 shadow-2xl transition-transform">
              <div className="bg-primary/20 flex h-16 w-16 items-center justify-center rounded-full">
                <Upload className="text-primary h-8 w-8 animate-bounce" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">Drop to Upload</h3>
                <p className="mt-1 text-sm text-slate-400">Files will be added to your library</p>
              </div>
            </div>
          </div>
        )}
        <div className="fixed right-4 bottom-4 z-[60] flex items-center gap-3 lg:right-6 lg:bottom-6">
          <Button
            variant="default"
            onClick={() => router.push('/converter')}
            className="group flex h-10 items-center gap-2.5 rounded-full border border-white/10 bg-slate-900 px-5 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase shadow-2xl transition-all hover:border-blue-500/50 hover:bg-slate-800 hover:text-white"
          >
            <Layers className="h-3.5 w-3.5 transition-all duration-300 group-hover:text-blue-400" />
            <span>Converter</span>
          </Button>
          <UserNav user={user} />
        </div>

        <div className="flex justify-center border-b border-white/5 bg-slate-950/50 p-3 backdrop-blur-xl lg:hidden">
          <div className="relative flex w-full max-w-sm items-center overflow-hidden rounded-xl border border-white/5 bg-slate-900/50 p-1 shadow-inner">
            <button
              onClick={() => setActiveTab('editor')}
              className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 ${
                activeTab === 'editor' ? 'text-white' : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              <FileCode
                className={`h-3.5 w-3.5 transition-transform duration-300 ${activeTab === 'editor' ? 'scale-110' : ''}`}
              />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 ${
                activeTab === 'preview' ? 'text-white' : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              <Eye
                className={`h-3.5 w-3.5 transition-transform duration-300 ${activeTab === 'preview' ? 'scale-110' : ''}`}
              />
              <span>Preview</span>
            </button>

            <div
              className="absolute top-1 bottom-1 rounded-lg bg-white/10 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                width: 'calc(50% - 4px)',
                left: activeTab === 'editor' ? '4px' : 'calc(50% + 0px)',
              }}
            />
          </div>
        </div>

        <div className="relative flex flex-grow flex-row overflow-hidden">
          {/* Sidebar */}
          <aside
            className={cn(
              'z-30 hidden shrink-0 flex-col overflow-hidden border-r border-white/5 bg-slate-900/30 transition-all duration-300 ease-in-out lg:flex',
              isSidebarOpen ? 'w-72 opacity-100' : 'pointer-events-none w-0 border-r-0 opacity-0',
            )}
          >
            <div className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-white/5 bg-slate-900/50 px-4">
              <span className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
                Explorer
              </span>
              <div className="flex items-center gap-1">
                {!isSelectionMode && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSelectionMode(true)}
                        className="h-7 w-7 rounded-sm text-slate-500 transition-all hover:bg-white/5 hover:text-slate-200"
                      >
                        <ListChecks className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="border-slate-800 bg-slate-900 text-xs">
                      Bulk Select
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => refreshFiles()}
                      className="h-7 w-7 rounded-sm text-slate-500 transition-all hover:bg-white/5 hover:text-slate-200"
                      disabled={filesLoading}
                    >
                      <RefreshCw className={cn('h-3.5 w-3.5', filesLoading && 'animate-spin')} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="border-slate-800 bg-slate-900 text-xs">
                    Refresh Explorer
                  </TooltipContent>
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
                      className="h-7 w-7 rounded-sm text-slate-500 transition-all hover:bg-white/5 hover:text-slate-200"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="border-slate-800 bg-slate-900 text-xs">
                    Collapse Sidebar
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="p-3">
              <div className="group relative">
                <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-200" />
                <input
                  type="text"
                  placeholder="Search files"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-white/5 bg-slate-950/50 py-1.5 pr-10 pl-8 text-xs transition-all placeholder:text-slate-600 focus:border-white/10 focus:bg-slate-950 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="group absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded-full p-2 text-slate-500 transition-all hover:bg-white/10 hover:text-slate-200"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  </button>
                )}
              </div>
            </div>

            {/* Selection Toolbar - Replacing Default Items Area */}
            {isSelectionMode && (
              <div className="animate-in fade-in slide-in-from-top-2 z-30 mx-3 mb-4 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-950/40 shadow-2xl duration-300">
                <div className="flex h-12 items-center justify-between border-b border-white/5 bg-white/[0.02] px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold tracking-[0.15em] text-slate-500 uppercase tabular-nums">
                      {getSelectedCount()} Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className={cn(
                        'h-7 rounded-md border border-white/20 px-3 text-[9px] font-bold tracking-widest uppercase shadow-sm transition-all',
                        selectedIds.size === getAllDeletableFileIds().length && selectedIds.size > 0
                          ? 'text-primary border-primary/40 hover:bg-white/10 hover:text-slate-100'
                          : 'text-slate-500 hover:bg-white/10 hover:text-slate-100',
                      )}
                    >
                      {selectedIds.size === getAllDeletableFileIds().length && selectedIds.size > 0
                        ? 'Reset'
                        : 'Select All'}
                    </Button>

                    <button
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedIds(new Set());
                      }}
                      className="group flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-all hover:bg-white/5 hover:text-slate-200"
                      aria-label="Exit selection mode"
                    >
                      <X className="h-4 w-4 transition-transform group-hover:scale-110" />
                    </button>
                  </div>
                </div>

                <div className="p-2.5">
                  <button
                    disabled={selectedIds.size === 0}
                    onClick={handleBulkDeleteClick}
                    className={cn(
                      'flex h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-lg border text-[11px] font-black tracking-[0.25em] uppercase transition-all duration-300',
                      selectedIds.size > 0
                        ? 'border-red-500/20 bg-transparent text-red-500/80 shadow-sm hover:border-red-500 hover:bg-red-500 hover:text-white'
                        : 'cursor-not-allowed border-white/5 bg-transparent text-slate-600 opacity-50',
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            <div className="custom-scrollbar flex-grow overflow-y-auto px-2 pb-4">
              {fileTree.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center space-y-2 opacity-50">
                  <FolderOpen className="h-5 w-5 text-slate-500" />
                  <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    Empty Explorer
                  </span>
                </div>
              ) : (
                <FileTree
                  nodes={
                    isSelectionMode
                      ? fileTree.filter(
                          (node) =>
                            node.batchId !== 'sample-document' && node.batchId !== 'sample-project',
                        )
                      : fileTree
                  }
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

          <div className="relative flex flex-grow flex-col gap-0 overflow-hidden lg:flex-row">
            <div
              className={`flex flex-1 flex-col overflow-hidden border-r border-slate-800/50 transition-all duration-300 ${
                activeTab === 'editor' ? 'tab-enter flex' : 'hidden lg:flex'
              }`}
            >
              <div className="relative flex h-12 shrink-0 items-center justify-center border-b border-slate-800 bg-slate-900/80 px-4 backdrop-blur-sm transition-colors select-none">
                {/* Sidebar Toggle Button (when collapsed) */}
                {!isSidebarOpen && (
                  <div className="absolute left-4 flex h-full items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSidebarOpen(true)}
                      className="hidden h-7 w-7 rounded-sm text-slate-500 transition-all hover:bg-white/5 hover:text-slate-200 lg:flex"
                      title="Open Sidebar"
                    >
                      <PanelLeftOpen className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-4 sm:gap-8 lg:gap-10">
                  {/* Group 1: Uploads */}
                  <div className="flex h-8 items-center gap-0.5 rounded-full border border-white/5 bg-slate-800/40 px-1 shadow-inner">
                    <input
                      type="file"
                      accept=".md,image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      multiple
                      ref={fileInputRef}
                      onChange={(e) => {
                        void (async () => {
                          await handleFileUpload(e);
                          void refreshFiles();
                        })();
                      }}
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={folderInputRef}
                      className="hidden"
                      {...({
                        webkitdirectory: '',
                        directory: '',
                      } as unknown as React.InputHTMLAttributes<HTMLInputElement>)}
                      onChange={(e) => {
                        void (async () => {
                          await handleFolderUpload(e);
                          void refreshFiles();
                        })();
                      }}
                    />
                    <input
                      type="file"
                      accept=".zip,.7z,.rar,.tar,.tar.gz,.tgz"
                      ref={zipInputRef}
                      onChange={(e) => {
                        void (async () => {
                          await handleZipUpload(e);
                          void refreshFiles();
                        })();
                      }}
                      className="hidden"
                    />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadRulesModal({ isOpen: true, type: 'file' });
                          }}
                          className="flex h-6 items-center justify-center rounded-full border border-transparent px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 active:scale-95"
                        >
                          {isUploaded ? (
                            <Check className="mr-1.5 h-3 w-3 text-green-400" />
                          ) : (
                            <Upload className="mr-1.5 h-3 w-3" />
                          )}
                          File
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Upload File</TooltipContent>
                    </Tooltip>

                    <div className="h-3 w-[1px] bg-white/10" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadRulesModal({ isOpen: true, type: 'folder' });
                          }}
                          className="flex h-6 items-center justify-center rounded-full border border-transparent px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 active:scale-95"
                        >
                          <FolderOpen className="mr-1.5 h-3.5 w-3.5 text-amber-500/70" />
                          Folder
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Upload Folder</TooltipContent>
                    </Tooltip>

                    <div className="h-3 w-[1px] bg-white/10" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadRulesModal({ isOpen: true, type: 'zip' });
                          }}
                          className="flex h-6 items-center justify-center rounded-full border border-transparent px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 active:scale-95"
                        >
                          <FileArchive className="mr-1.5 h-3.5 w-3.5 text-blue-400/70" />
                          Zip
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Upload Zip Archive</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Group 2: Navigation */}
                  <div className="flex h-8 items-center gap-0.5 rounded-full border border-white/5 bg-slate-800/40 px-1 shadow-inner">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Scroll to top"
                          onClick={scrollToStart}
                          className="h-6 w-8 rounded-full border border-transparent text-slate-500 transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 active:scale-90"
                        >
                          <ChevronsUp className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Scroll to Top</TooltipContent>
                    </Tooltip>

                    <div className="h-3 w-[1px] bg-white/10" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Scroll to bottom"
                          onClick={scrollToEnd}
                          className="h-6 w-8 rounded-full border border-transparent text-slate-500 transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 active:scale-90"
                        >
                          <ChevronsDown className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Scroll to Bottom</TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Group 3: Actions */}
                  <div className="flex h-8 items-center gap-0.5 rounded-full border border-white/5 bg-slate-800/40 px-1 shadow-inner">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleCopy();
                          }}
                          className="flex h-6 items-center justify-center rounded-full border border-transparent px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 active:scale-95"
                        >
                          {isCopied ? (
                            <Check className="mr-1.5 h-3.5 w-3.5 text-green-400" />
                          ) : (
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {isCopied ? 'Copied' : 'Copy'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy Source</TooltipContent>
                    </Tooltip>

                    <div className="h-3 w-[1px] bg-white/10" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleReset();
                          }}
                          className="flex h-6 items-center justify-center rounded-full border border-transparent px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 active:scale-95"
                        >
                          {isReset ? (
                            <Check className="mr-1.5 h-3.5 w-3.5 text-green-400" />
                          ) : (
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {isReset ? 'Done' : 'Reset'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reset Content</TooltipContent>
                    </Tooltip>

                    <div className="h-3 w-[1px] bg-white/10" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadMd();
                          }}
                          className="flex h-6 items-center justify-center rounded-full border border-transparent px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 active:scale-95"
                        >
                          {isDownloaded ? (
                            <Check className="mr-1.5 h-3.5 w-3.5 text-green-400" />
                          ) : (
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Export
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download Source</TooltipContent>
                    </Tooltip>

                    <div className="ml-1 md:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Menu"
                            className="h-6 w-6 rounded-full text-slate-500 hover:text-slate-200"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="min-w-40 border-slate-800 bg-slate-900 text-slate-100"
                        >
                          <DropdownMenuItem onClick={handleCopy} className="gap-2 text-xs">
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-green-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            Copy Source
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleReset} className="gap-2 text-xs">
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset Content
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleDownloadMd} className="gap-2 text-xs">
                            <Download className="h-3.5 w-3.5" />
                            Export Markdown
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleDownloadPdf} className="gap-2 text-xs">
                            <Download className="h-3.5 w-3.5" />
                            Export PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group/editor relative flex-grow overflow-hidden">
                <div
                  className={`pointer-events-none absolute top-0 right-0 left-0 z-20 flex h-9 items-center justify-between bg-transparent px-6 text-[10px] font-medium tracking-tight transition-opacity duration-75 select-none ${isEditorAtTop ? 'opacity-100' : 'opacity-0'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className="group/stat flex items-center gap-1.5">
                      <span className="text-[9px] font-bold tracking-widest text-slate-500/80 uppercase">
                        Words
                      </span>
                      <span className="text-slate-300 tabular-nums">{stats.words}</span>
                    </div>
                    <div className="group/stat flex items-center gap-1.5">
                      <span className="text-[9px] font-bold tracking-widest text-slate-500/80 uppercase">
                        Characters
                      </span>
                      <span className="text-slate-300 tabular-nums">{stats.chars}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {uploadTime && (
                      <div className="group/stat flex items-center gap-1.5">
                        <span className="text-[9px] font-bold tracking-widest text-blue-400/50 uppercase">
                          Uploaded
                        </span>
                        <span className="text-slate-300 tabular-nums">
                          {formatDateTime(uploadTime)}
                        </span>
                      </div>
                    )}
                    {lastModifiedTime && (
                      <div className="group/stat flex items-center gap-1.5">
                        <span className="text-[9px] font-bold tracking-widest text-emerald-400/50 uppercase">
                          Modified
                        </span>
                        <span className="text-slate-300 tabular-nums">
                          {formatDateTime(lastModifiedTime)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Editor
                  innerRef={textareaRef}
                  value={rawContent}
                  onChange={handleContentChange}
                  className="selection:bg-primary/30 custom-scrollbar dark-editor absolute inset-0 h-full w-full resize-none border-none bg-slate-950 p-4 pt-10 font-mono text-sm text-slate-300 focus-visible:ring-0 lg:p-6 lg:pt-10"
                  placeholder="Write your markdown here..."
                />
              </div>
            </div>

            <div
              className={`flex flex-1 flex-col overflow-hidden bg-slate-900/10 transition-all duration-300 ${
                activeTab === 'preview' ? 'tab-enter flex' : 'hidden lg:flex'
              }`}
            >
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
          onClose={() => setUploadRulesModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={handleUploadModalConfirm}
        />
      </main>
    </TooltipProvider>
  );
}
