'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SortBy, SortPreference } from '@/features/file-management/utils/file-sorting';
import { cn } from '@/utils/cn';

import { ArrowDown, ArrowUp, ArrowUpDown, Calendar, FileText, HardDrive, X } from 'lucide-react';

interface SortProps {
  sortPreference: SortPreference;
  onSortChange: (preference: SortPreference) => void;
  onClose?: () => void;
}

interface SortToggleProps {
  onClick: () => void;
  isOpen: boolean;
}

export function SortToggle({ onClick, isOpen }: SortToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className={cn(
            "h-7 w-7 rounded-sm text-slate-500 transition-all hover:bg-white/5 hover:text-slate-200",
            isOpen && "bg-white/10 text-slate-100"
          )}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="border-slate-800 bg-slate-900 text-xs">
        Sort Files
      </TooltipContent>
    </Tooltip>
  );
}

export function SortPanel({ sortPreference, onSortChange, onClose }: SortProps) {
  const { sortBy, direction } = sortPreference;

  const handleSortByChange = (newSortBy: SortBy) => {
    onSortChange({ sortBy: newSortBy, direction });
  };

  const getSortIcon = (type: SortBy) => {
    switch (type) {
      case 'time':
        return <Calendar className="h-4 w-4" />;
      case 'size':
        return <HardDrive className="h-4 w-4" />;
      case 'name':
        return <FileText className="h-4 w-4" />;
    }
  };

  const getSortLabel = (type: SortBy) => {
    switch (type) {
      case 'time':
        return 'Upload Time';
      case 'size':
        return 'File Size';
      case 'name':
        return 'Name';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-top-2 z-30 mx-3 mb-4 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-950/40 shadow-2xl duration-300">
      <div className="p-2 space-y-2">
        {/* Compact Header with Close */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.2em] text-slate-500 uppercase">
            <ArrowUpDown className="h-3 w-3" />
            Sort Files
          </div>
          <button
            onClick={onClose}
            className="group flex h-5 w-5 cursor-pointer items-center justify-center rounded text-slate-500 transition-all hover:bg-white/10 hover:text-slate-200"
            aria-label="Close sort panel"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Sort By Options - Vertical Stack */}
          <div className="space-y-1">
            <span className="text-[8px] font-bold tracking-[0.2em] text-slate-600 uppercase px-1">
              By
            </span>
            <div className="flex flex-col gap-1">
              {(['time', 'size', 'name'] as SortBy[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleSortByChange(type)}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-2 py-1.5 text-[9px] font-bold tracking-wider uppercase transition-all duration-300',
                    sortBy === type
                      ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                      : 'border-white/5 bg-transparent text-slate-500 hover:border-white/10 hover:bg-white/5 hover:text-slate-300',
                  )}
                >
                  {getSortIcon(type)}
                  <span>{getSortLabel(type)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Direction Toggle - Vertical Stack */}
          <div className="space-y-1">
            <span className="text-[8px] font-bold tracking-[0.2em] text-slate-600 uppercase px-1">
              Order
            </span>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => onSortChange({ sortBy, direction: 'asc' })}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-2 py-1.5 text-[9px] font-bold tracking-wider uppercase transition-all duration-300',
                  direction === 'asc'
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                    : 'border-white/5 bg-transparent text-slate-500 hover:border-white/10 hover:bg-white/5 hover:text-slate-300',
                )}
              >
                <ArrowUp className="h-3.5 w-3.5" />
                Ascending
              </button>
              <button
                onClick={() => onSortChange({ sortBy, direction: 'desc' })}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-2 py-1.5 text-[9px] font-bold tracking-wider uppercase transition-all duration-300',
                  direction === 'desc'
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-400'
                    : 'border-white/5 bg-transparent text-slate-500 hover:border-white/10 hover:bg-white/5 hover:text-slate-300',
                )}
              >
                <ArrowDown className="h-3.5 w-3.5" />
                Descending
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
