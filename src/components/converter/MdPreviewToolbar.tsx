import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ZoomIn, ZoomOut, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Maximize, ArrowLeftRight, DownloadCloud, Loader2, RefreshCw, Play, Pause, Check, MoreVertical, Eye, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewMode, ZoomMode } from '@/hooks/use-preview';

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
    <div className="flex items-center justify-center px-4 h-12 bg-slate-900/80 border-b border-slate-800 shrink-0 select-none backdrop-blur-sm relative transition-colors">
      <div className={cn(
        "flex items-center transition-all duration-500 ease-in-out",
        viewMode === 'preview' ? "gap-2 sm:gap-4 lg:gap-6" : "gap-4 sm:gap-8 lg:gap-10"
      )}>
        {/* Pill 1: View Mode */}
        <div className="flex items-center gap-1 bg-slate-800/40 rounded-full h-8 px-1 border border-white/5 shadow-inner">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('live')}
                className={cn(
                  "h-6 px-2 md:px-3 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-full border border-transparent flex items-center justify-center gap-1 sm:gap-1.5",
                  viewMode === 'live'
                    ? "bg-white/10 text-white border-white/20 shadow-sm"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/5 hover:border-white/10"
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                LIVE
              </Button>
            </TooltipTrigger>
            <TooltipContent>Switch to Live Preview</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('preview')}
                className={cn(
                  "h-6 px-2 md:px-3 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 rounded-full border border-transparent flex items-center justify-center gap-1 sm:gap-1.5",
                  viewMode === 'preview'
                      ? "bg-white/10 text-white border-white/20 shadow-sm"
                      : "text-slate-500 hover:text-slate-200 hover:bg-white/5 hover:border-white/10"
                )}
              >
                <Printer className="w-3.5 h-3.5" />
                PRINT
              </Button>
            </TooltipTrigger>
            <TooltipContent>Switch to Print Preview</TooltipContent>
          </Tooltip>
        </div>

        {/* Pill 2: Sync (Preview Mode Only) */}
        {viewMode === 'preview' && (
          <div className="flex items-center gap-0.5 bg-slate-800/40 rounded-full h-8 px-1 border border-white/5 shadow-inner animate-in fade-in slide-in-from-left-2 duration-300">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAutoRender(!isAutoRender)}
                  aria-label="Toggle auto-sync"
                  className={cn(
                    "h-6 w-6 rounded-full transition-all duration-200 active:scale-90 border flex items-center justify-center",
                    isAutoRender
                      ? "text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-200 hover:border-white/10"
                      : "bg-white/10 text-white border-white/20 shadow-sm hover:bg-white/15"
                  )}
                >
                  {isAutoRender ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isAutoRender ? "Pause Auto-Sync" : "Resume Auto-Sync"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => !renderSuccess && handleManualRefresh()}
                    disabled={!renderSuccess && (isPdfRendering || (isAutoRender && isPdfReady) || !hasChanges)}
                    aria-label="Refresh manual sync"
                    className={cn(
                      "h-6 w-6 rounded-full transition-all duration-200 active:scale-90 border border-transparent flex items-center justify-center",
                      renderSuccess
                        ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                        : !isAutoRender && !isPdfRendering && hasChanges
                          ? "text-blue-400 hover:bg-blue-400/10 hover:border-white/10"
                          : "text-slate-500 hover:bg-white/5 hover:text-slate-200 hover:border-white/10 disabled:opacity-20 disabled:hover:bg-transparent"
                    )}
                  >
                    {renderSuccess ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <RefreshCw className={cn(
                        "w-3.5 h-3.5",
                        isPdfRendering && "animate-spin"
                      )} />
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {renderSuccess 
                  ? "Sync Complete" 
                  : isPdfRendering
                    ? "Syncing" 
                    : !hasChanges
                      ? "No Changes" 
                      : isAutoRender 
                        ? "Auto-Sync ON"
                        : "Sync Pending"}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Pill 3: Page Navigation */}
        <div className="flex items-center gap-0.5 bg-slate-800/40 rounded-full h-8 px-1 border border-white/5 shadow-inner">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(1)}
                disabled={isInitializing || isPdfRendering || currentPage === 1}
                aria-label="First page"
                className="h-6 w-6 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent hover:border-white/10 active:scale-90 transition-all duration-200 disabled:opacity-10"
              >
                <ChevronsUp className="w-3.5 h-3.5" />
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
                className="h-6 w-6 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent hover:border-white/10 active:scale-90 transition-all duration-200 disabled:opacity-10"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Prev Page</TooltipContent>
          </Tooltip>

          <div className="px-1.5 min-w-[3.5rem] flex justify-center items-center relative h-6 overflow-hidden">
            <div className={cn(
              "absolute transition-all duration-300 ease-in-out flex items-center justify-center",
              (isInitializing || isPdfRendering) 
                ? "opacity-100 scale-100 blur-0" 
                : "opacity-0 scale-75 blur-sm pointer-events-none"
            )}>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
            </div>

            <div className={cn(
              "transition-all duration-300 ease-out flex items-center justify-center",
              !(isInitializing || isPdfRendering) 
                ? "opacity-100 scale-100 translate-y-0" 
                : "opacity-0 scale-95 translate-y-1 pointer-events-none"
            )}>
              <form onSubmit={handlePageInputSubmit} className="flex items-baseline gap-1">
                <Input
                  type="text"
                  value={pageInput}
                  onChange={handlePageInputChange}
                  onBlur={handlePageInputSubmit}
                  className="h-5 w-10 text-center bg-white/5 border-none p-0 text-white text-[11px] font-bold focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-0 rounded-full tabular-nums shadow-inner transition-all hover:bg-white/10"
                />
                <span className="text-[10px] text-slate-500 font-bold select-none tabular-nums">/ {totalPages}</span>
              </form>
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollToPage(currentPage + 1)}
                disabled={isInitializing || isPdfRendering || currentPage === totalPages || totalPages === 0}
                aria-label="Next page"
                className="h-6 w-6 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent hover:border-white/10 active:scale-90 transition-all duration-200 disabled:opacity-10"
              >
                <ChevronDown className="w-3.5 h-3.5" />
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
                disabled={isInitializing || isPdfRendering || currentPage === totalPages || totalPages === 0}
                aria-label="Last page"
                className="h-6 w-6 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent hover:border-white/10 active:scale-90 transition-all duration-200 disabled:opacity-10"
              >
                <ChevronsDown className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Last Page</TooltipContent>
          </Tooltip>
        </div>

        {/* Pill 4: Page Scale / Zoom */}
        <div className="flex items-center gap-0.5 bg-slate-800/40 rounded-full h-8 px-1 border border-white/5 shadow-inner">
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleZoomChange(-10)}
                  disabled={getScale() * 100 <= 25}
                  aria-label="Zoom out"
                  className="h-[24px] w-[24px] rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent hover:border-white/10 active:scale-90 transition-all duration-200 disabled:opacity-10"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>

            <form onSubmit={handleZoomInputSubmit} className="min-w-[3.5rem] flex justify-center">
              {!isScaleCalculated ? (
                <div className="flex items-center justify-center w-8 h-5">
                  <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                </div>
              ) : (
                <Input
                  type="text"
                  value={zoomInput}
                  onChange={handleZoomInputChange}
                  onBlur={handleZoomInputSubmit}
                  className="h-5 w-14 text-center bg-white/5 border-none p-0 text-white text-[11px] font-bold focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-0 rounded-full tabular-nums shadow-inner transition-all hover:bg-white/10"
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
                  className="h-6 w-6 rounded-full text-slate-500 hover:bg-white/5 hover:text-slate-200 border border-transparent hover:border-white/10 active:scale-90 transition-all duration-200 disabled:opacity-10"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoomMode('fit-page')}
                  aria-label="Fit page"
                  className={cn(
                    "h-6 w-6 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 border cursor-pointer outline-none",
                    zoomMode === 'fit-page'
                      ? "bg-white/10 text-white border-white/20 shadow-sm"
                      : "text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-200 hover:border-white/10"
                  )}
                >
                  <Maximize className="w-3.5 h-3.5" />
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
                    "h-6 w-6 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 border cursor-pointer outline-none",
                    zoomMode === 'fit-width'
                      ? "bg-white/10 text-white border-white/20 shadow-sm"
                      : "text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-200 hover:border-white/10"
                  )}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fit Width</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Pill 5: Download PDF */}
        <div className="flex items-center gap-1 bg-slate-800/40 rounded-full h-8 px-1 border border-white/5 shadow-inner">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDownload}
                  disabled={isGenerating}
                  aria-label="Download PDF"
                  className={cn(
                    "h-6 w-8 rounded-full transition-all duration-200 active:scale-95 border border-transparent flex items-center justify-center",
                    isDownloaded 
                      ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      : isGenerating 
                        ? "bg-white/10 text-white shadow-sm" 
                        : "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/20 shadow-sm"
                  )}
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isDownloaded ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <DownloadCloud className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isGenerating ? "Generating PDF..." : isDownloaded ? "PDF Downloaded" : "Download PDF"}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="lg:hidden flex items-center ml-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu" className="h-7 w-7 rounded-full text-slate-500 hover:text-slate-200">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-100 min-w-44">
              {viewMode === 'preview' && (
                <>
                  <DropdownMenuItem onClick={() => setIsAutoRender(!isAutoRender)} className="gap-2 text-xs">
                    {isAutoRender ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {isAutoRender ? 'Pause Auto-Sync' : 'Resume Auto-Sync'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    disabled={isPdfRendering || (isAutoRender && isPdfReady) || !hasChanges} 
                    onClick={handleManualRefresh} 
                    className="gap-2 text-xs"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isPdfRendering && "animate-spin")} />
                    Sync Changes
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-800" />
                </>
              )}
              <DropdownMenuItem onClick={() => setZoomMode('fit-page')} className="gap-2 text-xs">
                <Maximize className="w-3.5 h-3.5" /> Fit Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setZoomMode('fit-width')} className="gap-2 text-xs">
                <ArrowLeftRight className="w-3.5 h-3.5" /> Fit Width
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem onClick={() => handleZoomChange(10)} className="gap-2 text-xs">
                <ZoomIn className="w-3.5 h-3.5" /> Zoom In
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleZoomChange(-10)} className="gap-2 text-xs">
                <ZoomOut className="w-3.5 h-3.5" /> Zoom Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
