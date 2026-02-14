'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SortBy, SortPreference } from '@/features/file-management/utils/file-sorting';
import { cn } from '@/utils/cn';

import { ArrowDown, ArrowUp, Calendar, FileText, HardDrive } from 'lucide-react';

interface SortControlProps {
  sortPreference: SortPreference;
  onSortChange: (preference: SortPreference) => void;
}

export function SortControl({ sortPreference, onSortChange }: SortControlProps) {
  const { sortBy, direction } = sortPreference;

  const handleSortByChange = (newSortBy: SortBy) => {
    onSortChange({ sortBy: newSortBy, direction });
  };

  const handleDirectionToggle = () => {
    onSortChange({ sortBy, direction: direction === 'asc' ? 'desc' : 'asc' });
  };

  const getSortIcon = () => {
    switch (sortBy) {
      case 'time':
        return <Calendar className="h-3.5 w-3.5" />;
      case 'size':
        return <HardDrive className="h-3.5 w-3.5" />;
      case 'name':
        return <FileText className="h-3.5 w-3.5" />;
    }
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'time':
        return 'Time';
      case 'size':
        return 'Size';
      case 'name':
        return 'Name';
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center overflow-hidden rounded-sm border border-white/10 bg-white/5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-none border-r border-white/10 text-slate-500 transition-all hover:bg-white/5 hover:text-slate-200"
              >
                {getSortIcon()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-slate-800 bg-slate-900 text-slate-100"
            >
              <DropdownMenuItem
                onClick={() => handleSortByChange('time')}
                className={cn('gap-2 text-xs', sortBy === 'time' && 'bg-white/5 text-blue-400')}
              >
                <Calendar className="h-3.5 w-3.5" />
                Upload Time
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSortByChange('size')}
                className={cn('gap-2 text-xs', sortBy === 'size' && 'bg-white/5 text-blue-400')}
              >
                <HardDrive className="h-3.5 w-3.5" />
                File Size
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleSortByChange('name')}
                className={cn('gap-2 text-xs', sortBy === 'name' && 'bg-white/5 text-blue-400')}
              >
                <FileText className="h-3.5 w-3.5" />
                Name
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDirectionToggle}
            className="h-7 w-7 rounded-none text-slate-500 transition-all hover:bg-white/5 hover:text-slate-200"
          >
            {direction === 'asc' ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="border-slate-800 bg-slate-900 text-xs">
        Sort by {getSortLabel()} ({direction === 'asc' ? 'Ascending' : 'Descending'})
      </TooltipContent>
    </Tooltip>
  );
}
