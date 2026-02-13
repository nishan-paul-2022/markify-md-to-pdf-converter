import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileCode, FolderOpen, FileDown } from 'lucide-react';

interface SourceSegmentProps {
  onUploadClick: (type: 'file' | 'folder' | 'zip') => void;
}

/**
 * Guideline 7: Composition Over Inheritance
 * Segment 1 of the Converter Pipeline (Source).
 */
export const SourceSegment: React.FC<SourceSegmentProps> = ({ onUploadClick }) => {
  return (
    <section className="w-[260px] h-full flex flex-col gap-4 shrink-0">
      <div className="flex items-center justify-between px-2 text-xs font-black uppercase tracking-[0.2em] text-amber-400/80 h-11 flex-none">
        <div className="flex items-center gap-2">
          <Upload className="w-3.5 h-3.5" />
          <span>Source</span>
        </div>
      </div>
      
      <div className="flex-grow bg-amber-400/[0.03] border border-amber-400/10 rounded-[1.5rem] p-6 backdrop-blur-xl flex flex-col justify-center gap-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/[0.05] to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="space-y-4 w-full relative z-10">
          <Button 
            onClick={(e) => { e.stopPropagation(); onUploadClick('file'); }}
            className="w-full h-16 bg-slate-900/40 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 rounded-2xl flex items-center justify-start px-6 gap-4 transition-all duration-300 group/btn shadow-lg backdrop-blur-sm"
          >
            <div className="w-11 h-11 bg-amber-500/5 rounded-xl flex items-center justify-center text-amber-500/60 group-hover/btn:bg-amber-500/20 group-hover/btn:text-amber-400 group-hover/btn:scale-110 transition-all">
              <FileCode className="w-6 h-6" />
            </div>
            <div className="text-left flex-grow">
              <p className="text-[12px] font-black uppercase tracking-wider leading-none text-slate-400 group-hover/btn:text-amber-300 transition-colors">Upload Files</p>
            </div>
          </Button>

          <Button 
            onClick={(e) => { e.stopPropagation(); onUploadClick('folder'); }}
            className="w-full h-16 bg-slate-900/40 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 rounded-2xl flex items-center justify-start px-6 gap-4 transition-all duration-300 group/btn shadow-lg backdrop-blur-sm"
          >
            <div className="w-11 h-11 bg-indigo-500/5 rounded-xl flex items-center justify-center text-indigo-400/60 group-hover/btn:bg-indigo-500/20 group-hover/btn:text-indigo-400 group-hover/btn:scale-110 transition-all">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="text-left flex-grow">
              <p className="text-[12px] font-black uppercase tracking-wider leading-none text-slate-400 group-hover/btn:text-indigo-300 transition-colors">Upload Project</p>
            </div>
          </Button>

          <Button 
            onClick={(e) => { e.stopPropagation(); onUploadClick('zip'); }}
            className="w-full h-16 bg-slate-900/40 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 rounded-2xl flex items-center justify-start px-6 gap-4 transition-all duration-300 group/btn shadow-lg backdrop-blur-sm"
          >
            <div className="w-11 h-11 bg-cyan-500/5 rounded-xl flex items-center justify-center text-cyan-400/60 group-hover/btn:bg-cyan-500/20 group-hover/btn:text-cyan-400 group-hover/btn:scale-110 transition-all">
              <FileDown className="w-6 h-6" />
            </div>
            <div className="text-left flex-grow">
              <p className="text-[12px] font-black uppercase tracking-wider leading-none text-slate-400 group-hover/btn:text-cyan-300 transition-colors">Upload Zip</p>
            </div>
          </Button>
        </div>
      </div>
    </section>
  );
};
