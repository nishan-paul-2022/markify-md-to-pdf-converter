import Image from 'next/image';
import React from 'react';
import { Metadata } from '@/constants/default-content';

export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

interface CoverPageProps {
  metadata: Metadata | undefined;
}

export const CoverPage = ({ metadata }: CoverPageProps): React.JSX.Element | null => {
  if (!metadata) return null;

  return (
    <div className="pdf-page relative bg-[#020617] overflow-hidden flex flex-col items-center text-center p-0 mx-auto shrink-0 shadow-2xl"
      style={{ width: `${A4_WIDTH_PX}px`, height: `${A4_HEIGHT_PX}px`, color: 'white', fontFamily: 'var(--font-inter), sans-serif' }}>
      
      {/* Dynamic Glassmorphism Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px]" />
      
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center mix-blend-overlay opacity-40"
        style={{ backgroundImage: `url('/cover-bg.png')` }}
      />

      <div className="relative z-10 w-full h-full flex flex-col items-center p-14">
        {/* Header Section */}
        <div className="w-full flex justify-between items-start mb-10">
          <div className="">
            <Image src="/university-logo.png" alt="University Logo" width={100} height={100} className="w-[100px] h-auto drop-shadow-2xl" />
          </div>
          <div className="text-right">
             <div className="text-[14px] font-black tracking-[0.3em] uppercase text-blue-400 mb-1">Session 2025-26</div>
             <div className="text-[12px] font-medium text-white/40 tracking-widest">{metadata.date}</div>
          </div>
        </div>

        {/* University Info */}
        <div className="mb-14 text-center w-full">
          {metadata.university && (
            <div className="text-[28px] font-black tracking-[0.2em] uppercase text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] leading-tight">
              {metadata.university}
            </div>
          )}
          {metadata.program && (
            <div className="text-[16px] font-bold mt-4 text-white/60 tracking-[0.12em] uppercase border-t border-white/10 pt-4 inline-block whitespace-nowrap">
              {metadata.program}
            </div>
          )}
        </div>

        {/* Title Section (Centered Hero) */}
        <div className="flex-grow flex flex-col justify-center items-center w-full max-w-[95%] text-center">
          {(metadata.title || metadata.subtitle) && (
            <div className="mb-12 w-full">
              {metadata.title && (
                <h1 className="text-[40px] font-black leading-[1.2] mb-6 tracking-tight bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent drop-shadow-2xl px-4">
                  {metadata.title}
                </h1>
              )}
              {metadata.subtitle && (
                <div className="text-[20px] font-semibold text-white/90 leading-relaxed whitespace-nowrap px-4 overflow-hidden text-ellipsis">
                  {metadata.subtitle}
                </div>
              )}
            </div>
          )}

          {metadata.course && (
            <div className="inline-flex items-center px-6 py-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl shadow-inner font-black text-[16px] tracking-wide text-blue-400 whitespace-nowrap">
              {metadata.course.replace(',', ':')}
            </div>
          )}
        </div>

        {/* Bottom Info Section */}
        <div className="w-full grid grid-cols-12 gap-8 items-end mt-12 pt-8 border-t border-white/10">
          
          {/* Left Column: Submitter Info */}
          <div className="col-span-5 text-left">
            <div className="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 rounded-md text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-blue-500/20">
              Submitted By
            </div>
            
            <div className="space-y-3.5">
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Name of Student</span>
                  <span className="text-[16px] font-black text-white">{metadata.name}</span>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Roll Number</span>
                    <span className="text-[14px] font-bold text-white tabular-nums">{metadata.roll}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Reg. No</span>
                    <span className="text-[14px] font-bold text-white tabular-nums">{metadata.reg}</span>
                  </div>
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Batch</span>
                  <span className="text-[14px] font-bold text-white">{metadata.batch}</span>
               </div>
            </div>
          </div>

          {/* Right Column: Collaborative Group Members */}
          <div className="col-span-7">
            {metadata.groupMembers && metadata.groupMembers.length > 0 ? (
              <div className="bg-white/5 rounded-2xl border border-white/10 p-5 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between mb-4 px-1">
                   <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400">Collaborative Group</h3>
                   <span className="text-[10px] font-bold text-white/40">{metadata.groupMembers.length} Members</span>
                </div>
                
                <div className="space-y-2">
                  {metadata.groupMembers.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-[10px] font-black text-blue-400 group-hover:scale-110 transition-transform">
                          {idx + 1}
                        </div>
                        <span className="text-[13px] font-bold text-white/90 group-hover:text-white">{member.name}</span>
                      </div>
                      <span className="text-[12px] font-bold text-white/40 tabular-nums group-hover:text-blue-400">{member.roll}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
                <div className="text-right flex flex-col items-end">
                  <div className="inline-block px-3 py-1 bg-white/5 text-white/40 rounded-md text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-white/10">
                    Confidential
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5 w-full">
                      <div className="text-[20px] font-black text-white/20 uppercase tracking-[0.3em]">Confidential</div>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PageWrapper = ({ children, pageNumber, totalPages }: { children: React.ReactNode, pageNumber: number, totalPages: number }): React.JSX.Element => {
  return (
    <div className="pdf-page relative bg-white mx-auto flex flex-col shrink-0 shadow-sm"
      style={{
        width: `${A4_WIDTH_PX}px`,
        minHeight: `${A4_HEIGHT_PX}px`,
        height: 'fit-content',
        color: '#111827',
        fontFamily: 'var(--font-inter), sans-serif',
        padding: '15mm',
      }}>
      <div className="flex-grow">
        {children}
      </div>

      <div className="mt-auto pt-4 flex justify-end text-[8pt] text-slate-400 font-sans">
        Page {pageNumber} of {totalPages}
      </div>
    </div>
  );
};
