import React from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { AppFile } from '@/features/file-management/hooks/use-files';
import { cn } from '@/utils/cn';

import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Download,
  FileCode,
  FileDown,
  Loader2,
  Trash2,
  Zap,
} from 'lucide-react';

interface FileRowProps {
  file: AppFile;
  index: number;
  isSelected: boolean;
  isSelectionMode: boolean;
  processingState: 'pending' | 'converting' | 'done' | 'error';
  hasLocalBlob: boolean;
  onToggleSelection: (id: string) => void;
  onConvert: (file: AppFile) => void;
  onDelete: (id: string) => void;
  onDownload: (file: AppFile, type: 'md' | 'pdf') => void;
  formatDate: (date: string | Date) => string;
  formatSize: (bytes: number) => string;
}

/**
 * Guideline 7: Composition Over Inheritance
 * Individual file row with interactive states.
 */
export const FileRow: React.FC<FileRowProps> = ({
  file,
  index,
  isSelected,
  isSelectionMode,
  processingState,
  hasLocalBlob,
  onToggleSelection,
  onConvert,
  onDelete,
  onDownload,
  formatDate,
  formatSize,
}) => {
  const isProcessing = processingState === 'converting';
  const isDone = processingState === 'done';
  const isError = processingState === 'error';

  const hasOutput = !!(
    hasLocalBlob ||
    isDone ||
    (file.metadata && file.metadata.generatedPdfUrl)
  );

  return (
    <div
      style={{ animationDelay: `${index * 0.05}s` }}
      className={cn('group/row animate-card-in flex items-stretch gap-4', isSelected && 'z-20')}
    >
      {/* Input File Card */}
      <div
        className={cn(
          'relative flex flex-grow items-center justify-between overflow-hidden rounded-3xl border border-white/5 bg-slate-900/40 p-5 shadow-xl transition-all hover:border-indigo-500/30',
          isSelected && 'border-indigo-500/50 bg-indigo-500/[0.05]',
        )}
      >
        <div className="relative z-10 flex min-w-0 flex-1 items-center gap-4">
          {/* Selection Checkbox */}
          {isSelectionMode && (
            <button
              onClick={() => onToggleSelection(file.id)}
              className={cn(
                'animate-in zoom-in-50 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg transition-all',
                isSelected
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'border border-white/10 bg-white/5 text-transparent hover:border-indigo-500/30',
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          )}

          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover/row:scale-110',
              isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-400',
            )}
          >
            <FileCode className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-slate-200 transition-colors group-hover/row:text-indigo-300">
              {file.originalName}
            </h3>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
                {formatSize(file.size)}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-700" />
              <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">
                {formatDate(file.createdAt)}
              </span>
              {file.relativePath && file.relativePath !== file.originalName && (
                <>
                  <span className="h-1 w-1 rounded-full bg-slate-700" />
                  <span className="max-w-[150px] truncate text-[10px] font-black tracking-wider text-indigo-500/60 uppercase">
                    {file.relativePath}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onDownload(file, 'md')}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
              >
                <Download className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="border-slate-800 bg-slate-900 text-xs text-slate-300"
            >
              Download Markdown
            </TooltipContent>
          </Tooltip>

          {!isSelectionMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDelete(file.id)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-all hover:bg-red-500/20 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="border-slate-800 bg-slate-900 text-xs text-red-400/80"
              >
                Delete Source
              </TooltipContent>
            </Tooltip>
          )}

          <div className="mx-1 h-6 w-px bg-white/5" />

          <Button
            size="sm"
            onClick={() => onConvert(file)}
            disabled={isProcessing || isSelectionMode}
            className={cn(
              'flex h-9 items-center gap-2 rounded-xl px-4 text-[10px] font-black tracking-wider uppercase transition-all active:scale-95',
              processingState === 'done'
                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                : processingState === 'error'
                  ? 'border border-red-500/20 bg-red-500/10 text-red-400'
                  : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600',
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : processingState === 'done' ? (
              <CheckCircle className="h-3.5 w-3.5" />
            ) : processingState === 'error' ? (
              <AlertCircle className="h-3.5 w-3.5" />
            ) : (
              <Zap className="h-3.5 w-3.5 fill-current" />
            )}
            <span>
              {isProcessing ? 'Converting...' : processingState === 'done' ? 'Update' : 'Convert'}
            </span>
          </Button>
        </div>
      </div>

      {/* Output File Card (Always visible for every file) */}
      <div
        className={cn(
          'group/output animate-in slide-in-from-right-8 relative flex w-[340px] items-center justify-between overflow-hidden rounded-3xl border transition-all duration-500 shadow-xl',
          isProcessing
            ? 'border-amber-500/20 bg-amber-500/[0.02] hover:bg-amber-500/[0.04]'
            : isError
              ? 'border-red-500/20 bg-red-500/[0.02] hover:bg-red-500/[0.04]'
              : isDone || hasOutput
                ? 'border-emerald-500/10 bg-emerald-500/[0.03] hover:border-emerald-500/30 hover:bg-emerald-500/[0.06]'
                : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] opacity-40 hover:opacity-60',
        )}
      >
        <div className="relative z-10 flex min-w-0 items-center gap-4">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              isProcessing
                ? 'bg-amber-500/10 text-amber-500'
                : isError
                  ? 'bg-red-500/10 text-red-500'
                  : isDone || hasOutput
                    ? 'bg-emerald-500/10 text-emerald-400 transition-transform group-hover/output:scale-110'
                    : 'bg-white/5 text-slate-500',
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isError ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <FileDown className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-[9px] font-black tracking-widest uppercase',
                  isProcessing
                    ? 'text-amber-500'
                    : isError
                      ? 'text-red-500'
                      : isDone || hasOutput
                        ? 'text-emerald-500'
                        : 'text-slate-500',
                )}
              >
                {isProcessing
                  ? 'Processing'
                  : isError
                    ? 'Failed'
                    : isDone || hasOutput
                      ? 'Ready'
                      : 'Silent'}
              </span>
              {(isDone || hasOutput) && !isProcessing && (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              )}
            </div>
            <p className="mt-0.5 truncate text-xs font-bold text-slate-300">
              {file.originalName.replace(/\.md$/i, '')}.pdf
            </p>
          </div>
        </div>

        {!isProcessing && (isDone || hasOutput) && (
          <div className="relative z-10 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDownload(file, 'pdf')}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10 transition-all hover:bg-emerald-500 hover:text-white active:scale-90"
                >
                  <Download className="h-4.5 w-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="border-slate-800 bg-slate-900 text-xs text-emerald-400"
              >
                Download PDF
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};
