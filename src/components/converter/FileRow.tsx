import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { File as AppFile } from '@/hooks/use-files';
import { cn } from '@/lib/utils';

import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Download,
  FileCode,
  FileDown,
  Loader2,
  Trash2,
  Zap} from 'lucide-react';

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
  formatSize
}) => {
  const hasOutput = !!(hasLocalBlob || processingState === 'done' || (file.metadata && file.metadata.generatedPdfUrl));
  const isProcessing = processingState === 'converting';

  return (
    <div
      style={{ animationDelay: `${index * 0.05}s` }}
      className={cn(
        "group/row flex items-stretch gap-4 animate-card-in",
        isSelected && "z-20"
      )}
    >
      {/* Input File Card */}
      <div className={cn(
        "flex-grow flex items-center justify-between bg-slate-900/40 border border-white/5 rounded-3xl p-5 hover:border-indigo-500/30 transition-all shadow-xl relative overflow-hidden",
        isSelected && "border-indigo-500/50 bg-indigo-500/[0.05]"
      )}>
        <div className="flex items-center gap-4 min-w-0 flex-1 relative z-10">
          {/* Selection Checkbox */}
          {isSelectionMode && (
            <button
              onClick={() => onToggleSelection(file.id)}
              className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer animate-in zoom-in-50",
                isSelected
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-white/5 border border-white/10 text-transparent hover:border-indigo-500/30"
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover/row:scale-110",
            isSelected ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-slate-400"
          )}>
            <FileCode className="w-6 h-6" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-200 truncate group-hover/row:text-indigo-300 transition-colors">
              {file.originalName}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{formatSize(file.size)}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{formatDate(file.createdAt)}</span>
              {file.relativePath && file.relativePath !== file.originalName && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500/60 truncate max-w-[150px]">
                    {file.relativePath}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onDownload(file, 'md')}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-slate-900 border-slate-800 text-xs text-slate-300">Download Markdown</TooltipContent>
          </Tooltip>

          {!isSelectionMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDelete(file.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-900 border-slate-800 text-xs text-red-400/80">Delete Source</TooltipContent>
            </Tooltip>
          )}

          <div className="w-px h-6 bg-white/5 mx-1" />

          <Button
            size="sm"
            onClick={() => onConvert(file)}
            disabled={isProcessing || isSelectionMode}
            className={cn(
              "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95",
              processingState === 'done'
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                : processingState === 'error'
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : processingState === 'done' ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : processingState === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : (
              <Zap className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isProcessing ? 'Converting...' : processingState === 'done' ? 'Update' : 'Convert'}</span>
          </Button>
        </div>
      </div>

      {/* Output File Card (Only if output exists or is converting) */}
      {(hasOutput || isProcessing) && (
        <div className={cn(
          "w-[340px] flex items-center justify-between bg-emerald-500/[0.03] border rounded-3xl p-5 hover:bg-emerald-500/[0.06] transition-all shadow-xl relative overflow-hidden group/output animate-in slide-in-from-right-8 duration-500",
          processingState === 'error' ? "border-red-500/20 bg-red-500/[0.02]" : "border-emerald-500/10 hover:border-emerald-500/30"
        )}>
          <div className="flex items-center gap-4 min-w-0 relative z-10">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              isProcessing ? "bg-amber-500/10 text-amber-500" :
              processingState === 'error' ? "bg-red-500/10 text-red-500" :
              "bg-emerald-500/10 text-emerald-400 group-hover/output:scale-110 transition-transform"
            )}>
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> :
               processingState === 'error' ? <AlertCircle className="w-5 h-5" /> :
               <FileDown className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[9px] font-black tracking-widest uppercase",
                  isProcessing ? "text-amber-500" :
                  processingState === 'error' ? "text-red-500" : "text-emerald-500"
                )}>
                  {isProcessing ? 'Processing' : processingState === 'error' ? 'Failed' : 'Ready'}
                </span>
                {hasOutput && !isProcessing && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              </div>
              <p className="text-xs font-bold text-slate-300 truncate mt-0.5">
                {file.originalName.replace(/\.md$/i, '')}.pdf
              </p>
            </div>
          </div>

          {!isProcessing && hasOutput && (
            <div className="relative z-10 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onDownload(file, 'pdf')}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-90"
                  >
                    <Download className="w-4.5 h-4.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 border-slate-800 text-xs text-emerald-400">Download PDF</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
