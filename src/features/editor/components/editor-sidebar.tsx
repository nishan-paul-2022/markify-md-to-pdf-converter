'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FileTree } from '@/features/file-management/components/file-tree';
import { SortPanel, SortToggle } from '@/features/file-management/components/sort-control';
import type { SortPreference } from '@/features/file-management/utils/file-sorting';
import type { FileTreeNode } from '@/features/file-management/utils/file-tree';
import { cn } from '@/utils/cn';

import { FolderOpen, ListChecks, PanelLeftClose, RefreshCw, Trash2, X } from 'lucide-react';

interface EditorSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isSelectionMode: boolean;
  setIsSelectionMode: (mode: boolean) => void;
  searchQuery: string;
  filesLoading: boolean;
  refreshFiles: () => Promise<void>;
  fileTree: FileTreeNode[];
  selectedFileId: string | null;
  onFileSelect: (node: FileTreeNode) => Promise<void> | void;
  handleFileDelete: (id: string | string[]) => Promise<void>;
  handleFileRename: (
    id: string,
    newName: string,
    type: 'file' | 'folder',
    batchId?: string,
    oldPath?: string,
  ) => Promise<void>;
  selectedIds: Set<string>;
  toggleSelection: (id: string | string[]) => void;
  setSelectedIds: (ids: Set<string>) => void;
  handleSelectAll: () => void;
  handleBulkDeleteClick: () => void;
  getSelectedCount: () => number;
  getAllDeletableFileIds: () => string[];
  sortPreference: SortPreference;
  onSortChange: (preference: SortPreference) => void;
  isSortExpanded: boolean;
  setIsSortExpanded: (expanded: boolean) => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  isSelectionMode,
  setIsSelectionMode,
  searchQuery,
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
  sortPreference,
  onSortChange,
  isSortExpanded,
  setIsSortExpanded,
}) => {
  // Close sort panel when selection mode opens
  React.useEffect(() => {
    if (isSelectionMode) {
      setIsSortExpanded(false);
    }
  }, [isSelectionMode, setIsSortExpanded]);

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
          <SortToggle
            onClick={() => {
              if (!isSortExpanded && isSelectionMode) {
                setIsSelectionMode(false);
                setSelectedIds(new Set());
              }
              setIsSortExpanded(!isSortExpanded);
            }}
            isOpen={isSortExpanded}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={undefined}
                size="icon"
                onClick={() => {
                  if (!isSelectionMode && isSortExpanded) {
                    setIsSortExpanded(false);
                  }
                  if (isSelectionMode) {
                    setSelectedIds(new Set());
                  }
                  setIsSelectionMode(!isSelectionMode);
                }}
                className={cn(
                  'h-6.5 w-6.5 transition-all hover:scale-110 !bg-transparent hover:!bg-transparent',
                  isSelectionMode ? 'text-sky-400' : 'text-slate-500 hover:text-white',
                )}
              >
                <ListChecks className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="border-slate-800 bg-slate-900 text-xs">
              {isSelectionMode ? 'Exit Selection' : 'Bulk Select'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={undefined}
                size="icon"
                onClick={() => refreshFiles()}
                className="h-6.5 w-6.5 transition-all text-slate-500 hover:text-white hover:scale-110 !bg-transparent hover:!bg-transparent"
                disabled={filesLoading}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', filesLoading && 'animate-spin')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="border-slate-800 bg-slate-900 text-xs">
              Refresh Explorer
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={undefined}
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSidebarOpen(false);
                }}
                className="h-6.5 w-6.5 transition-all text-slate-500 hover:text-white hover:scale-110 !bg-transparent hover:!bg-transparent"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="border-slate-800 bg-slate-900 text-xs">
              Collapse Sidebar
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Sort Panel */}
      {isSortExpanded && (
        <SortPanel
          sortPreference={sortPreference}
          onSortChange={onSortChange}
          onClose={() => setIsSortExpanded(false)}
        />
      )}

      {/* Selection Toolbar - Replacing Default Items Area */}
      {isSelectionMode && (
        <div className="animate-in fade-in slide-in-from-top-2 z-30 mx-3 mt-2 mb-4 flex shrink-0 flex-col rounded-xl border border-white/10 bg-slate-950/40 shadow-2xl duration-300">
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
                className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-all hover:bg-white/5 hover:text-slate-200"
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
            nodes={fileTree}
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
