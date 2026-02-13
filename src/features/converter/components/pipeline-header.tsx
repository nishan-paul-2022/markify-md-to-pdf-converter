import React from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CheckSquare,
  Clock,
  Download,
  HardDrive,
  Layers,
  Loader2,
  MinusSquare,
  MousePointer2,
  SortAsc,
  Square,
  Trash2,
  X,
  Zap,
} from 'lucide-react';

interface PipelineHeaderProps {
  filteredFilesCount: number;
  completedResultsCount: number;
  isSelectionMode: boolean;
  selectedCount: number;
  sortBy: 'name' | 'time' | 'size';
  sortOrder: 'asc' | 'desc';
  isBatchProcessing: boolean;
  deleting: boolean;
  onToggleSelectionMode: () => void;
  onToggleSelectAll: () => void;
  onSortByChange: (val: 'name' | 'time' | 'size') => void;
  onSortOrderChange: () => void;
  onDownloadArchive: (format: 'zip' | 'tar') => void;
  onDownloadAll: () => void;
  onBatchDelete: () => void;
  onBatchConvert: () => void;
}

/**
 * Guideline 7: Composition Over Inheritance
 * Unified header for the Processing & Results segments.
 */
export const PipelineHeader: React.FC<PipelineHeaderProps> = ({
  filteredFilesCount,
  completedResultsCount,
  isSelectionMode,
  selectedCount,
  sortBy,
  sortOrder,
  isBatchProcessing,
  deleting,
  onToggleSelectionMode,
  onToggleSelectAll,
  onSortByChange,
  onSortOrderChange,
  onDownloadArchive,
  onDownloadAll,
  onBatchDelete,
  onBatchConvert,
}) => {
  return (
    <div className="flex h-11 flex-none items-center justify-between px-4 text-xs font-black tracking-[0.2em] uppercase">
      <div className="flex flex-nowrap items-center gap-10">
        <div className="flex items-center gap-2 whitespace-nowrap text-indigo-400/80">
          <Layers className="h-3.5 w-3.5" />
          <div className="flex items-baseline gap-2">
            <span>FILES</span>
            {filteredFilesCount > 0 && (
              <span className="text-[10px] font-medium text-indigo-400/60">
                ({filteredFilesCount})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 whitespace-nowrap text-emerald-400/80">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>OUTPUT</span>
          {completedResultsCount > 0 && (
            <span className="text-[10px] font-medium text-emerald-400/60">
              ({completedResultsCount})
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {filteredFilesCount > 0 && (
          <div className="flex items-center gap-3">
            {/* 1. Selection Actions */}
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggleSelectionMode}
                    className={cn(
                      'group flex h-8 cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 whitespace-nowrap transition-all',
                      isSelectionMode
                        ? 'bg-red-500/20 font-bold text-red-400 hover:bg-red-500/30'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    {isSelectionMode ? (
                      <X className="h-3.5 w-3.5" />
                    ) : (
                      <MousePointer2 className="h-3.5 w-3.5" />
                    )}
                    <span className="text-[10px] font-black tracking-wider uppercase">
                      {isSelectionMode ? 'CANCEL' : 'SELECT'}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="border-slate-800 bg-slate-900 text-xs">
                  {isSelectionMode ? 'Cancel Selection Mode' : 'Enable Selection Mode'}
                </TooltipContent>
              </Tooltip>

              {isSelectionMode && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onToggleSelectAll}
                      className="group animate-in fade-in slide-in-from-left-2 flex h-8 cursor-pointer items-center gap-2 rounded-md bg-indigo-500/15 px-3 py-1.5 font-bold whitespace-nowrap text-indigo-300 transition-all hover:bg-indigo-500/25"
                    >
                      {selectedCount === filteredFilesCount ? (
                        <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
                      ) : selectedCount > 0 ? (
                        <MinusSquare className="h-3.5 w-3.5 text-indigo-400" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-slate-400" />
                      )}
                      <span className="text-[10px] font-black tracking-wider uppercase">
                        {selectedCount === filteredFilesCount ? 'NONE' : 'SELECT ALL'}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="border-slate-800 bg-slate-900 text-xs">
                    {selectedCount === filteredFilesCount ? 'Deselect All' : 'Select All Files'}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* 2. Sorting Actions */}
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group flex h-8 cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-slate-300 transition-all hover:bg-white/10 hover:text-white">
                    {sortBy === 'name' ? (
                      <SortAsc className="h-3.5 w-3.5" />
                    ) : sortBy === 'size' ? (
                      <HardDrive className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    <span className="text-[10px] font-black tracking-wider uppercase">
                      {sortBy === 'name' ? 'NAME' : sortBy === 'size' ? 'SIZE' : 'DATE'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 border-white/10 bg-slate-900/95 backdrop-blur-xl"
                >
                  <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    Sort Files
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    onClick={() => onSortByChange('time')}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors',
                      sortBy === 'time'
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-bold tracking-wider uppercase">Most Recent</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onSortByChange('name')}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors',
                      sortBy === 'name'
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <SortAsc className="h-4 w-4" />
                    <span className="text-xs font-bold tracking-wider uppercase">Alphabetical</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onSortByChange('size')}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors',
                      sortBy === 'size'
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <HardDrive className="h-4 w-4" />
                    <span className="text-xs font-bold tracking-wider uppercase">File Size</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onSortOrderChange}
                    className="group flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-300 transition-all hover:bg-white/10 hover:text-white"
                  >
                    {sortOrder === 'asc' ? (
                      <ArrowUp className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="border-slate-800 bg-slate-900 text-xs">
                  {sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* 3. Download Actions */}
            {completedResultsCount > 0 && (
              <div className="animate-in fade-in slide-in-from-right-4 flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="group flex h-8 cursor-pointer items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-1.5 text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-95">
                      <Download className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                      <span className="text-[10px] font-black tracking-wider uppercase">
                        Download
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 border-white/10 bg-slate-900/95 backdrop-blur-xl"
                  >
                    <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      Archive Format
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem
                      onClick={() => onDownloadArchive('zip')}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black text-emerald-400 uppercase">
                        ZIP
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold tracking-wider uppercase">
                          Standard Zip
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDownloadArchive('tar')}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-blue-500/20 bg-blue-500/10 text-[10px] font-black text-blue-400 uppercase">
                        TAR
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold tracking-wider uppercase">
                          Tape Archive
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem
                      onClick={onDownloadAll}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white"
                    >
                      <Layers className="mr-2 ml-2 h-4 w-4 text-indigo-400" />
                      <span className="text-xs font-bold tracking-wider uppercase">
                        Individual Files
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        )}

        {isSelectionMode && selectedCount > 0 && (
          <div className="animate-in fade-in slide-in-from-right-4 flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onBatchDelete}
                  disabled={isBatchProcessing || deleting}
                  className="h-8 gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 text-[9px] font-black tracking-[0.2em] text-red-400 uppercase transition-all hover:bg-red-500 hover:text-white"
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span>Delete ({selectedCount})</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-slate-800 bg-slate-900 text-xs">
                Permanently delete selected files
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={onBatchConvert}
                  disabled={isBatchProcessing || deleting}
                  className="h-8 gap-2 rounded-full bg-indigo-500 px-4 text-[9px] font-black tracking-[0.2em] text-white uppercase transition-all hover:bg-indigo-600"
                >
                  {isBatchProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5 fill-current" />
                  )}
                  <span>Convert ({selectedCount})</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-slate-800 bg-slate-900 text-xs">
                Bulk convert selected files to PDF
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};
