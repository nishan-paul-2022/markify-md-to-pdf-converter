import React from 'react';

import { Button } from '@/components/ui/button';

import { FileCode, FileDown, FolderOpen, Upload } from 'lucide-react';

interface SourceSegmentProps {
  onUploadClick: (type: 'file' | 'folder' | 'zip') => void;
}

/**
 * Guideline 7: Composition Over Inheritance
 * Segment 1 of the Converter Pipeline (Source).
 */
export const SourceSegment: React.FC<SourceSegmentProps> = ({ onUploadClick }) => {
  return (
    <section className="flex h-full w-[260px] shrink-0 flex-col gap-4">
      <div className="flex h-11 flex-none items-center justify-between px-2 text-xs font-black tracking-[0.2em] text-amber-400/80 uppercase">
        <div className="flex items-center gap-2">
          <Upload className="h-3.5 w-3.5" />
          <span>Source</span>
        </div>
      </div>

      <div className="group relative flex flex-grow flex-col justify-center gap-6 overflow-hidden rounded-[1.5rem] border border-amber-400/10 bg-amber-400/[0.03] p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/[0.05] to-transparent opacity-50 transition-opacity duration-1000 group-hover:opacity-100" />

        <div className="relative z-10 w-full space-y-4">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onUploadClick('file');
            }}
            className="group/btn flex h-16 w-full items-center justify-start gap-4 rounded-2xl border border-white/10 bg-slate-900/40 px-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-amber-500/50 hover:bg-amber-500/10"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/5 text-amber-500/60 transition-all group-hover/btn:scale-110 group-hover/btn:bg-amber-500/20 group-hover/btn:text-amber-400">
              <FileCode className="h-6 w-6" />
            </div>
            <div className="flex-grow text-left">
              <p className="text-[12px] leading-none font-black tracking-wider text-slate-400 uppercase transition-colors group-hover/btn:text-amber-300">
                Upload Files
              </p>
            </div>
          </Button>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              onUploadClick('folder');
            }}
            className="group/btn flex h-16 w-full items-center justify-start gap-4 rounded-2xl border border-white/10 bg-slate-900/40 px-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/50 hover:bg-indigo-500/10"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/5 text-indigo-400/60 transition-all group-hover/btn:scale-110 group-hover/btn:bg-indigo-500/20 group-hover/btn:text-indigo-400">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div className="flex-grow text-left">
              <p className="text-[12px] leading-none font-black tracking-wider text-slate-400 uppercase transition-colors group-hover/btn:text-indigo-300">
                Upload Project
              </p>
            </div>
          </Button>

          <Button
            onClick={(e) => {
              e.stopPropagation();
              onUploadClick('zip');
            }}
            className="group/btn flex h-16 w-full items-center justify-start gap-4 rounded-2xl border border-white/10 bg-slate-900/40 px-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/50 hover:bg-cyan-500/10"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/5 text-cyan-400/60 transition-all group-hover/btn:scale-110 group-hover/btn:bg-cyan-500/20 group-hover/btn:text-cyan-400">
              <FileDown className="h-6 w-6" />
            </div>
            <div className="flex-grow text-left">
              <p className="text-[12px] leading-none font-black tracking-wider text-slate-400 uppercase transition-colors group-hover/btn:text-cyan-300">
                Upload Zip
              </p>
            </div>
          </Button>
        </div>
      </div>
    </section>
  );
};
