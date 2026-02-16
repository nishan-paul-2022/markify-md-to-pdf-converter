'use client';

import React from 'react';

import { formatDateTime } from '@/utils/formatters';

interface EditorStatsProps {
  scrollTop: number;
  stats: {
    words: number;
    chars: number;
  };
  uploadTime: Date | null;
}

export const EditorStats = React.forwardRef<HTMLDivElement, Omit<EditorStatsProps, 'scrollTop'>>(
  ({ stats, uploadTime }, ref) => {
    return (
      <div
        ref={ref}
        className="pointer-events-none absolute top-0 right-0 left-0 z-20 flex h-9 items-center justify-between bg-transparent px-4 text-[10px] font-medium tracking-tight select-none lg:px-6"
      >
        <div className="flex items-center gap-6">
          <div className="group/stat flex items-center gap-1.5">
            <span className="text-[9px] font-bold tracking-widest text-amber-400/50 uppercase">
              Words
            </span>
            <span className="text-slate-300 tabular-nums">{stats.words}</span>
          </div>
          <div className="group/stat flex items-center gap-1.5">
            <span className="text-[9px] font-bold tracking-widest text-emerald-400/50 uppercase">
              Characters
            </span>
            <span className="text-slate-300 tabular-nums">{stats.chars}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {uploadTime && (
            <div className="group/stat flex items-center gap-1.5">
              <span className="text-[9px] font-bold tracking-widest text-blue-400/50 uppercase">
                Uploaded
              </span>
              <span className="text-slate-300 tabular-nums">{formatDateTime(uploadTime)}</span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

EditorStats.displayName = 'EditorStats';
