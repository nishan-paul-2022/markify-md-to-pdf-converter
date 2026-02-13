'use client';

import React from 'react';

import { FileTree } from '@/features/file-management/components/file-tree';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { FileTreeNode } from '@/features/file-management/utils/file-tree';
import { cn } from '@/utils/cn';

import { 
  FolderOpen, 
  ListChecks, 
  PanelLeftClose, 
  RefreshCw, 
  Search, 
  Trash2, 
  X 
} from 'lucide-react';

interface EditorSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isSelectionMode: boolean;
  setIsSelectionMode: (mode: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filesLoading: boolean;
  refreshFiles: () => Promise<void>;
  fileTree: FileTreeNode[];
  selectedFileId: string | null;
  onFileSelect: (node: FileTreeNode) => Promise<void> | void;
  handleFileDelete: (id: string | string[]) => Promise<void>;
  handleFileRename: (id: string, newName: string, type: 'file' | 'folder', batchId?: string, oldPath?: string) => Promise<void>;
  selectedIds: Set<string>;
  toggleSelection: (id: string | string[]) => void;
  setSelectedIds: (ids: Set<string>) => void;
  handleSelectAll: () => void;
  handleBulkDeleteClick: () => void;
  getSelectedCount: () => number;
  getAllDeletableFileIds: () => string[];
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  isSelectionMode,
  setIsSelectionMode,
  searchQuery,
  setSearchQuery,
  filesLoading,
  refreshFiles,
  fileTree,
  selectedFileId,
  onFileSelect,
  handleFileDelete,
  handleFileRename,
  selectedIds,
  toggleSelection,
  setSelectedIds,
  handleSelectAll,
  handleBulkDeleteClick,
  getSelectedCount,
  getAllDeletableFileIds,
}) => {
  return (
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
  );
};
