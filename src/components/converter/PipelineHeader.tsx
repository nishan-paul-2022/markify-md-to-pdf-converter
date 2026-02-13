import React from 'react';
import { 
  Layers, 
  CheckCircle2, 
  X, 
  MousePointer2, 
  CheckSquare, 
  MinusSquare, 
  Square, 
  SortAsc, 
  Clock, 
  HardDrive, 
  ArrowUp, 
  ArrowDown, 
  Download,
  Loader2,
  Trash2,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

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
    <div className="flex items-center justify-between px-4 text-xs font-black uppercase tracking-[0.2em] h-11 flex-none">
      <div className="flex items-center gap-10 flex-nowrap">
        <div className="flex items-center gap-2 text-indigo-400/80 whitespace-nowrap">
          <Layers className="w-3.5 h-3.5" />
          <div className="flex items-baseline gap-2">
            <span>FILES</span>
            {filteredFilesCount > 0 && (
              <span className="text-[10px] text-indigo-400/60 font-medium">({filteredFilesCount})</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-emerald-400/80 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>OUTPUT</span>
          {completedResultsCount > 0 && (
            <span className="text-[10px] text-emerald-400/60 font-medium">({completedResultsCount})</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {filteredFilesCount > 0 && (
          <div className="flex items-center gap-3">
            {/* 1. Selection Actions */}
            <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 p-1 rounded-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={onToggleSelectionMode}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all group cursor-pointer h-8 whitespace-nowrap",
                      isSelectionMode 
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold" 
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {isSelectionMode ? <X className="w-3.5 h-3.5" /> : <MousePointer2 className="w-3.5 h-3.5" />}
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
                      onClick={onToggleSelectAll}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 transition-all group animate-in fade-in slide-in-from-left-2 cursor-pointer h-8 whitespace-nowrap font-bold"
                    >
                      {selectedCount === filteredFilesCount ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                      ) : selectedCount > 0 ? (
                        <MinusSquare className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {selectedCount === filteredFilesCount ? 'NONE' : 'SELECT ALL'}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">
                    {selectedCount === filteredFilesCount ? 'Deselect All' : 'Select All Files'}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* 2. Sorting Actions */}
            <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 p-1 rounded-lg">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer h-8 group">
                    {sortBy === 'name' ? <SortAsc className="w-3.5 h-3.5" /> : sortBy === 'size' ? <HardDrive className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {sortBy === 'name' ? 'NAME' : sortBy === 'size' ? 'SIZE' : 'DATE'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-slate-900/95 border-white/10 backdrop-blur-xl">
                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 py-2">Sort Files</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={() => onSortByChange('time')} className={cn("flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors", sortBy === 'time' ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:text-white hover:bg-white/5")}>
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Most Recent</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSortByChange('name')} className={cn("flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors", sortBy === 'name' ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:text-white hover:bg-white/5")}>
                    <SortAsc className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Alphabetical</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSortByChange('size')} className={cn("flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors", sortBy === 'size' ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:text-white hover:bg-white/5")}>
                    <HardDrive className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">File Size</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onSortOrderChange} className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer group">
                    {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">
                  {sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* 3. Download Actions */}
            {completedResultsCount > 0 && (
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
                    <DropdownMenuItem onClick={() => onDownloadArchive('zip')} className="flex items-center gap-3 px-3 py-2 cursor-pointer text-slate-300 hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white">
                      <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center text-[10px] font-black uppercase text-emerald-400 border border-emerald-500/20">ZIP</div>
                      <div className="flex flex-col gap-0.5"><span className="text-xs font-bold uppercase tracking-wider">Standard Zip</span></div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDownloadArchive('tar')} className="flex items-center gap-3 px-3 py-2 cursor-pointer text-slate-300 hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white">
                      <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-[10px] font-black uppercase text-blue-400 border border-blue-500/20">TAR</div>
                      <div className="flex flex-col gap-0.5"><span className="text-xs font-bold uppercase tracking-wider">Tape Archive</span></div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem onClick={onDownloadAll} className="flex items-center gap-3 px-3 py-2 cursor-pointer text-slate-300 hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white">
                      <Layers className="w-4 h-4 text-indigo-400 ml-2 mr-2" />
                      <span className="text-xs font-bold uppercase tracking-wider">Individual Files</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        )}

        {isSelectionMode && selectedCount > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm"
                  variant="ghost"
                  onClick={onBatchDelete}
                  disabled={isBatchProcessing || deleting}
                  className="h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 gap-2 transition-all"
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Delete ({selectedCount})</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">Permanently delete selected files</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm"
                  onClick={onBatchConvert}
                  disabled={isBatchProcessing || deleting}
                  className="h-8 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 gap-2 transition-all"
                >
                  {isBatchProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
                  <span>Convert ({selectedCount})</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-xs">Bulk convert selected files to PDF</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};
