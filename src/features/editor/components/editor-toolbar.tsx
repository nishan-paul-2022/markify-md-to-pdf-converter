'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import {
  Check,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Download,
  FileArchive,
  FolderOpen,
  MoreVertical,
  PanelLeftOpen,
  RotateCcw,
  Upload,
} from 'lucide-react';

interface EditorToolbarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  folderInputRef: React.RefObject<HTMLInputElement | null>;
  zipInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleFolderUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleZipUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  refreshFiles: () => Promise<void>;
  scrollToStart: () => void;
  scrollToEnd: () => void;
  handleCopy: () => Promise<void>;
  handleReset: () => Promise<void>;
  handleDownloadMd: () => void;
  isUploaded: boolean;
  isCopied: boolean;
  isReset: boolean;
  isDownloaded: boolean;
  setUploadRulesModal: (modal: { isOpen: boolean; type: 'file' | 'folder' | 'zip' }) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  fileInputRef,
  folderInputRef,
  zipInputRef,
  handleFileUpload,
  handleFolderUpload,
  handleZipUpload,
  refreshFiles,
  scrollToStart,
  scrollToEnd,
  handleCopy,
  handleReset,
  handleDownloadMd,
  isUploaded,
  isCopied,
  isReset,
  isDownloaded,
  setUploadRulesModal,
}) => {
  return (
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
            } as React.InputHTMLAttributes<HTMLInputElement> & {
              webkitdirectory: string;
              directory: string;
            })}
            onChange={(e) => {
              void (async () => {
                await handleFolderUpload(e);
                void refreshFiles();
              })();
            }}
          />
          <input
            type="file"
            accept=".zip"
            ref={zipInputRef}
            onChange={(e) => {
              void (async () => {
                await handleZipUpload(e);
                void refreshFiles();
              })();
            }}
            className="hidden"
          />

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

          <div className="h-3 w-[1px] bg-white/10" />

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

          <div className="h-3 w-[1px] bg-white/10" />

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

          <div className="h-3 w-[1px] bg-white/10" />

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

          <div className="h-3 w-[1px] bg-white/10" />

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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};
