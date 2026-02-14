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
  SortAsc,
  Square,
  Trash2,
  X,
  Zap,
} from 'lucide-react';

interface PipelineHeaderProps {
  filteredFilesCount: number;
  completedResultsCount: number;
  selectionMode: 'none' | 'conversion' | 'deletion';
  selectedCount: number;
  sortBy: 'name' | 'time' | 'size';
  sortOrder: 'asc' | 'desc';
  isBatchProcessing: boolean;
  deleting: boolean;
  onToggleConversionMode: () => void;
  onToggleDeletionMode: () => void;
  onToggleSelectAll: () => void;
  onSortByChange: (val: 'name' | 'time' | 'size') => void;
  onSortOrderChange: () => void;
  onDownloadArchive: () => void;
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
  selectionMode,
  selectedCount,
  sortBy,
  sortOrder,
  isBatchProcessing,
  deleting,
  onToggleConversionMode,
  onToggleDeletionMode,
  onToggleSelectAll,
  onSortByChange,
  onSortOrderChange,
  onDownloadArchive,
  onDownloadAll,
  onBatchDelete,
  onBatchConvert,
}) => {
  const showSelectionBar = selectionMode !== 'none';
  const isConversion = selectionMode === 'conversion';
  const isDeletion = selectionMode === 'deletion';

  return (
    <div
      className={cn(
        'relative flex h-11 flex-none items-center justify-between px-4 text-xs font-black tracking-[0.2em] uppercase transition-all duration-300',
        showSelectionBar
          ? isDeletion
            ? 'rounded-xl border border-red-500/30 bg-red-500/5 shadow-lg shadow-red-500/5'
            : 'rounded-xl border border-indigo-500/30 bg-indigo-500/5 shadow-lg shadow-indigo-500/5'
          : '',
      )}
    >
      {showSelectionBar ? (
        /* Selection Mode Layout */
        <>
          <div className="animate-in fade-in slide-in-from-left-4 flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button
                onClick={isDeletion ? onToggleDeletionMode : onToggleConversionMode}
                className={cn(
                  'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-all hover:text-white',
                  isDeletion
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500'
                    : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500',
                )}
              >
                <X className="h-4 w-4" />
              </button>
              <span
                className={cn(
                  'font-black',
                  isDeletion ? 'text-red-300' : 'text-indigo-300',
                )}
              >
                {selectedCount} {selectedCount === 1 ? 'FILE' : 'FILES'} SELECTED
              </span>
            </div>

            <button
              onClick={onToggleSelectAll}
              className={cn(
                'group flex h-7 cursor-pointer items-center gap-2 rounded-lg px-3 text-[10px] font-black tracking-widest transition-all',
                isDeletion
                  ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30 hover:text-white'
                  : 'bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 hover:text-white',
              )}
            >
              {selectedCount === filteredFilesCount && filteredFilesCount > 0 ? (
                <>
                  <Square className="h-3.5 w-3.5" />
                  <span>DESELECT ALL</span>
                </>
              ) : (
                <>
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>SELECT ALL</span>
                </>
              )}
            </button>
          </div>

          <div className="animate-in fade-in slide-in-from-right-4 flex items-center gap-3">
            {isDeletion && (
              <Button
                size="sm"
                onClick={onBatchDelete}
                disabled={isBatchProcessing || deleting}
                className="h-8 gap-2 rounded-lg bg-red-500 px-4 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-red-500/20 transition-all hover:bg-red-600 hover:scale-[1.02] active:scale-95"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Delete Selected</span>
              </Button>
            )}

            {isConversion && (
              <Button
                size="sm"
                onClick={onBatchConvert}
                disabled={isBatchProcessing || deleting}
                className="h-8 gap-2 rounded-lg bg-indigo-500 px-4 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-600 hover:scale-[1.02] active:scale-95"
              >
                {isBatchProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5 fill-current" />
                )}
                <span>Convert Selected</span>
              </Button>
            )}
          </div>
        </>
      ) : (
        /* Normal Mode Layout */
        <>
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
                {/* 1. Selection Mode Entry */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onToggleConversionMode}
                      className="group flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black tracking-wider uppercase">
                        CONVERT
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="border-slate-800 bg-slate-900 text-xs text-white">
                    Enable Conversion Selection
                  </TooltipContent>
                </Tooltip>

                {/* 2. Deletion Mode Entry (Minimal) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onToggleDeletionMode}
                      className="group flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black tracking-wider uppercase">
                        DELETE
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="border-slate-800 bg-slate-900 text-xs text-white">
                    Delete Multiple Files
                  </TooltipContent>
                </Tooltip>

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
                        <span className="text-xs font-bold tracking-wider uppercase">
                          Most Recent
                        </span>
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
                        <span className="text-xs font-bold tracking-wider uppercase">
                          Alphabetical
                        </span>
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
                        <span className="text-xs font-bold tracking-wider uppercase">
                          File Size
                        </span>
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
                    <TooltipContent side="bottom" className="border-slate-800 bg-slate-900 text-xs text-white">
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
                          onClick={onDownloadArchive}
                          className="flex cursor-pointer items-center gap-3 px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white focus:bg-white/5 focus:text-white"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black text-emerald-400 uppercase">
                            ZIP
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold tracking-wider uppercase">
                              Download as Zip
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
          </div>
        </>
      )}
    </div>
  );
};
