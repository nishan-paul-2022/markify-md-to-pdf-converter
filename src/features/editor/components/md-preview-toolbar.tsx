import React from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ViewMode, ZoomMode } from '@/features/editor/hooks/use-preview';
import { cn } from '@/utils/cn';

import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronsDown,
  ChevronsUp,
  ChevronUp,
  DownloadCloud,
  Eye,
  Loader2,
  Maximize,
  MoreVertical,
  Pause,
  Play,
  Printer,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface MdPreviewToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isAutoRender: boolean;
  setIsAutoRender: (auto: boolean) => void;
  renderSuccess: boolean;
  handleManualRefresh: () => void;
  isPdfRendering: boolean;
  isPdfReady: boolean;
  hasChanges: boolean;
  scrollToPage: (page: number) => void;
  currentPage: number;
  totalPages: number;
  isInitializing: boolean;
  pageInput: string;
  handlePageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePageInputSubmit: (e: React.FormEvent) => void;
  zoomMode: ZoomMode;
  setZoomMode: (mode: ZoomMode) => void;
  handleZoomChange: (delta: number) => void;
  getScale: () => number;
  isScaleCalculated: boolean;
  zoomInput: string;
  handleZoomInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleZoomInputSubmit: (e: React.FormEvent) => void;
  onDownload?: () => void;
  isGenerating: boolean;
  isDownloaded: boolean;
}

export const MdPreviewToolbar = ({
  viewMode,
  setViewMode,
  isAutoRender,
  setIsAutoRender,
  renderSuccess,
  handleManualRefresh,
  isPdfRendering,
  isPdfReady,
  hasChanges,
  scrollToPage,
  currentPage,
  totalPages,
  isInitializing,
  pageInput,
  handlePageInputChange,
  handlePageInputSubmit,
  zoomMode,
  setZoomMode,
  handleZoomChange,
  getScale,
  isScaleCalculated,
  zoomInput,
  handleZoomInputChange,
  handleZoomInputSubmit,
  onDownload,
  isGenerating,
  isDownloaded,
}: MdPreviewToolbarProps) => {
  return (
    <div className="relative flex h-12 shrink-0 items-center justify-center border-b border-slate-800 bg-slate-900/80 px-4 backdrop-blur-sm transition-colors select-none">
      <div
        className={cn(
          'flex items-center',
          viewMode === 'preview' ? 'gap-2 sm:gap-4 lg:gap-6' : 'gap-4 sm:gap-8 lg:gap-10',
        )}
      >
        {/* Pill 1: View Mode */}
        <div className="flex h-8 items-center gap-1 rounded-full border border-white/5 bg-slate-800/40 px-1 shadow-inner">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('live')}
                className={cn(
                  'flex h-6 items-center justify-center gap-1 rounded-full border border-transparent px-2 text-[10px] font-bold tracking-wider uppercase transition-all duration-200 sm:gap-1.5 md:px-3',
                  viewMode === 'live'
                    ? 'border-white/20 bg-white/10 text-white shadow-sm'
                    : 'text-slate-500 hover:border-white/10 hover:bg-white/5 hover:text-slate-200',
                )}
              >
                <Eye className="h-3.5 w-3.5" />
                LIVE
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('preview')}
                className={cn(
                  'flex h-6 items-center justify-center gap-1 rounded-full border border-transparent px-2 text-[10px] font-bold tracking-wider uppercase transition-all duration-200 sm:gap-1.5 md:px-3',
                  viewMode === 'preview'
                    ? 'border-white/20 bg-white/10 text-white shadow-sm'
                    : 'text-slate-500 hover:border-white/10 hover:bg-white/5 hover:text-slate-200',
                )}
              >
                <Printer className="h-3.5 w-3.5" />
                PRINT
              </Button>
        </div>

        {/* Pill 2: Sync (Preview Mode Only) */}
        {viewMode === 'preview' && (
          <div className="flex h-8 items-center gap-0.5 rounded-full border border-white/5 bg-slate-800/40 px-1 shadow-inner">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAutoRender(!isAutoRender)}
                  aria-label="Toggle auto-sync"
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200 active:scale-90',
                    isAutoRender
                      ? 'border-transparent text-slate-500 hover:border-white/10 hover:bg-white/5 hover:text-slate-200'
                      : 'border-white/20 bg-white/10 text-white shadow-sm hover:bg-white/15',
                  )}
                >
                  {isAutoRender ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isAutoRender ? 'Pause Auto-Sync' : 'Resume Auto-Sync'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => !renderSuccess && handleManualRefresh()}
                    disabled={
                      !renderSuccess &&
                      (isPdfRendering || (isAutoRender && isPdfReady) || !hasChanges)
                    }
                    aria-label="Refresh manual sync"
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border border-transparent transition-all duration-200 active:scale-90',
                      renderSuccess
                        ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        : !isAutoRender && !isPdfRendering && hasChanges
                          ? 'text-blue-400 hover:border-white/10 hover:bg-blue-400/10'
                          : 'text-slate-500 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 disabled:opacity-20 disabled:hover:bg-transparent',
                    )}
                  >
                    {renderSuccess ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <RefreshCw className={cn('h-3.5 w-3.5', isPdfRendering && 'animate-spin')} />
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {renderSuccess
                  ? 'Sync Complete'
                  : isPdfRendering
                    ? 'Syncing'
                    : !hasChanges
                      ? 'No Changes'
                      : isAutoRender
                        ? 'Auto-Sync ON'
                        : 'Sync Pending'}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Pill 3: Page Navigation */}
        <div className="flex h-8 items-center gap-0.5 rounded-full border border-white/5 bg-slate-800/40 px-1 shadow-inner">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(1)}
                disabled={isInitializing || isPdfRendering || currentPage === 1}
                aria-label="First page"
                className="h-6 w-6 rounded-full border border-transparent text-slate-500 transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 active:scale-90 disabled:opacity-10"
              >
                <ChevronsUp className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>First Page</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(currentPage - 1)}
                disabled={isInitializing || isPdfRendering || currentPage === 1}
                aria-label="Previous page"
                className="h-6 w-6 rounded-full border border-transparent text-slate-500 transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 active:scale-90 disabled:opacity-10"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Prev Page</TooltipContent>
          </Tooltip>

          <div className="relative flex h-6 min-w-[5.5rem] items-center justify-center overflow-hidden px-1.5">
            <div
              className={cn(
                'absolute flex items-center justify-center transition-all duration-300 ease-in-out',
                isInitializing || isPdfRendering
                  ? 'blur-0 scale-100 opacity-100'
                  : 'pointer-events-none scale-75 opacity-0 blur-sm',
              )}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
            </div>

            <div
              className={cn(
                'flex items-center justify-center transition-all duration-300 ease-out',
                !(isInitializing || isPdfRendering)
                  ? 'translate-y-0 scale-100 opacity-100'
                  : 'pointer-events-none translate-y-1 scale-95 opacity-0',
              )}
            >
              <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5 whitespace-nowrap">
                <Input
                  type="text"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputSubmit}
                  className="h-5 w-11 shrink-0 rounded-full border-none bg-white/5 p-0 text-center text-[10px] font-bold text-slate-200 tabular-nums leading-none shadow-inner transition-all hover:bg-white/10 focus:text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <span className="flex items-center text-[12px] font-bold text-slate-400 tabular-nums select-none shrink-0 leading-none">
                  / {totalPages}
                </span>
              </form>
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(currentPage + 1)}
                disabled={
                  isInitializing || isPdfRendering || currentPage === totalPages || totalPages === 0
                }
                aria-label="Next page"
                className="h-6 w-6 rounded-full border border-transparent text-slate-500 transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 active:scale-90 disabled:opacity-10"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Next Page</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(totalPages)}
                disabled={
                  isInitializing || isPdfRendering || currentPage === totalPages || totalPages === 0
                }
                aria-label="Last page"
                className="h-6 w-6 rounded-full border border-transparent text-slate-500 transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 active:scale-90 disabled:opacity-10"
              >
                <ChevronsDown className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Last Page</TooltipContent>
          </Tooltip>
        </div>

        {/* Pill 4: Page Scale / Zoom */}
        <div className="flex h-8 items-center gap-0.5 rounded-full border border-white/5 bg-slate-800/40 px-1 shadow-inner">
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleZoomChange(-10)}
                  disabled={getScale() * 100 <= 25}
                  aria-label="Zoom out"
                  className="h-[24px] w-[24px] rounded-full border border-transparent text-slate-500 transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 active:scale-90 disabled:opacity-10"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>

            <form onSubmit={handleZoomInputSubmit} className="flex min-w-[4rem] items-center justify-center whitespace-nowrap">
              {!isScaleCalculated ? (
                <div className="flex h-5 w-8 items-center justify-center">
                  <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                </div>
              ) : (
                <Input
                  type="text"
                  value={zoomInput}
                  onChange={handleZoomInputChange}
                  onBlur={handleZoomInputSubmit}
                  className="h-5 w-14 shrink-0 rounded-full border-none bg-white/5 p-0 text-center text-[10px] font-bold text-slate-200 tabular-nums leading-none shadow-inner transition-all hover:bg-white/10 focus:text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              )}
            </form>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleZoomChange(10)}
                  disabled={getScale() * 100 >= 400}
                  aria-label="Zoom in"
                  className="h-6 w-6 rounded-full border border-transparent text-slate-500 transition-all duration-200 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 active:scale-90 disabled:opacity-10"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
          </div>

          <div className="hidden items-center gap-1 md:flex">
            <div className="mx-0.5 h-3 w-[1px] bg-white/10" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoomMode('fit-page')}
                  aria-label="Fit page"
                  className={cn(
                    'flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 outline-none active:scale-90',
                    zoomMode === 'fit-page'
                      ? 'border-white/20 bg-white/10 text-white shadow-sm'
                      : 'border-transparent text-slate-500 hover:border-white/10 hover:bg-white/5 hover:text-slate-200',
                  )}
                >
                  <Maximize className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fit Page</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoomMode('fit-width')}
                  aria-label="Fit width"
                  className={cn(
                    'flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 outline-none active:scale-90',
                    zoomMode === 'fit-width'
                      ? 'border-white/20 bg-white/10 text-white shadow-sm'
                      : 'border-transparent text-slate-500 hover:border-white/10 hover:bg-white/5 hover:text-slate-200',
                  )}
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fit Width</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Pill 5: Download PDF */}
        <div className="flex h-8 items-center gap-1 rounded-full border border-white/5 bg-slate-800/40 px-1 shadow-inner">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn('flex items-center', isGenerating && 'cursor-not-allowed opacity-50')}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDownload}
                  disabled={isGenerating}
                  aria-label="Download PDF"
                  className={cn(
                    'flex h-6 w-8 items-center justify-center rounded-full border border-transparent transition-all duration-200 active:scale-95',
                    isDownloaded
                      ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      : isGenerating
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-rose-400 shadow-sm hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-300',
                  )}
                >
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isDownloaded ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <DownloadCloud className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isGenerating
                ? 'Generating PDF...'
                : isDownloaded
                  ? 'PDF Downloaded'
                  : 'Download PDF'}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="ml-1 flex items-center lg:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Menu"
                className="h-7 w-7 rounded-full text-slate-500 hover:text-slate-200"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-44 border-slate-800 bg-slate-900 text-slate-100"
            >
              {viewMode === 'preview' && (
                <>
                  <DropdownMenuItem
                    onClick={() => setIsAutoRender(!isAutoRender)}
                    className="gap-2 text-xs"
                  >
                    {isAutoRender ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    {isAutoRender ? 'Pause Auto-Sync' : 'Resume Auto-Sync'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={isPdfRendering || (isAutoRender && isPdfReady) || !hasChanges}
                    onClick={handleManualRefresh}
                    className="gap-2 text-xs"
                  >
                    <RefreshCw className={cn('h-3.5 w-3.5', isPdfRendering && 'animate-spin')} />
                    Sync Changes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-800" />
                </>
              )}
              <DropdownMenuItem onClick={() => setZoomMode('fit-page')} className="gap-2 text-xs">
                <Maximize className="h-3.5 w-3.5" /> Fit Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setZoomMode('fit-width')} className="gap-2 text-xs">
                <ArrowLeftRight className="h-3.5 w-3.5" /> Fit Width
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem onClick={() => handleZoomChange(10)} className="gap-2 text-xs">
                <ZoomIn className="h-3.5 w-3.5" /> Zoom In
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleZoomChange(-10)} className="gap-2 text-xs">
                <ZoomOut className="h-3.5 w-3.5" /> Zoom Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
