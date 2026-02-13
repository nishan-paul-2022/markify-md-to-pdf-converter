import React from 'react';
import Image from 'next/image';

import type { Metadata } from '@/constants/default-content';

export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

interface CoverPageProps {
  metadata: Metadata | undefined;
}

const IndividualCoverPage = ({ metadata }: CoverPageProps): React.JSX.Element => {
  return (
    <div
      className="pdf-page relative mx-auto flex shrink-0 flex-col items-center overflow-hidden bg-white p-0 text-center shadow-2xl"
      style={{
        width: `${A4_WIDTH_PX}px`,
        height: `${A4_HEIGHT_PX}px`,
        color: 'white',
        fontFamily: 'var(--font-inter), sans-serif',
      }}
    >
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/cover-bg.png')` }}
      />

      <div className="relative z-10 flex h-full w-full flex-col items-center">
        <div className="mt-[2cm] flex justify-center p-4">
          <Image
            src="/university-logo.png"
            alt="University Logo"
            width={120}
            height={120}
            className="h-auto w-[120px] drop-shadow-2xl"
          />
        </div>

        {metadata?.university && (
          <div className="mt-[10px] text-[28px] font-bold tracking-[2px] uppercase drop-shadow-lg">
            {metadata.university}
          </div>
        )}
        {metadata?.program && (
          <div className="mt-[8px] text-[16px] font-normal opacity-90 drop-shadow-md">
            {metadata.program}
          </div>
        )}

        {(metadata?.title || metadata?.subtitle) && (
          <div className="mt-[2cm] mb-[2cm] flex w-full flex-col items-center">
            {metadata.title && (
              <div className="mb-[8px] w-full px-8 text-center text-[32px] leading-[1.2] font-extrabold break-words drop-shadow-xl">
                {metadata.title}
              </div>
            )}
            {metadata.subtitle && (
              <div className="w-full px-8 text-center text-[18px] font-semibold break-words opacity-95 drop-shadow-lg">
                {metadata.subtitle}
              </div>
            )}
          </div>
        )}

        {metadata?.course && (
          <div className="mt-[1cm] w-[85%] border-b border-white/20 pb-[10px] text-[15px] break-words drop-shadow-md">
            {metadata.course}
          </div>
        )}

        {(metadata?.name ||
          metadata?.roll ||
          metadata?.reg ||
          metadata?.batch ||
          metadata?.date) && (
          <div className="mt-[1cm] w-[70%] rounded-2xl border border-white/10 bg-white/10 p-[25px] shadow-2xl backdrop-blur-md">
            <div className="space-y-[12px]">
              {[
                { label: 'Name', value: metadata.name },
                { label: 'Roll No', value: metadata.roll },
                { label: 'Reg. No', value: metadata.reg },
                { label: 'Batch', value: metadata.batch },
                { label: 'Submission Date', value: metadata.date },
              ]
                .filter((detail) => detail.value)
                .map((detail, idx) => (
                  <div key={idx} className="flex text-left text-[14px]">
                    <div className="flex w-[42%] justify-between font-bold text-white/90">
                      {detail.label}
                      <span className="mr-2">:</span>
                    </div>
                    <div className="w-[58%] pl-2 text-left font-semibold break-words text-white">
                      {detail.value}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const GroupCoverPage = ({ metadata }: CoverPageProps): React.JSX.Element => {
  if (!metadata) {
    return <></>;
  }

  return (
    <div
      className="pdf-page relative mx-auto flex shrink-0 flex-col items-center overflow-hidden bg-[#020617] p-0 text-center shadow-2xl"
      style={{
        width: `${A4_WIDTH_PX}px`,
        height: `${A4_HEIGHT_PX}px`,
        color: 'white',
        fontFamily: 'var(--font-inter), sans-serif',
      }}
    >
      {/* Dynamic Glassmorphism Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] animate-pulse rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 blur-[140px]" />

      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-overlay"
        style={{ backgroundImage: `url('/cover-bg.png')` }}
      />

      <div className="relative z-10 flex h-full w-full flex-col items-center p-14">
        {/* Header Section */}
        <div className="mb-10 flex w-full items-start justify-between">
          <div className="">
            <Image
              src="/university-logo.png"
              alt="University Logo"
              width={100}
              height={100}
              className="h-auto w-[100px] drop-shadow-2xl"
            />
          </div>
          <div className="text-right">
            <div className="mb-1 text-[14px] font-black tracking-[0.3em] text-blue-400 uppercase">
              Session 2025-26
            </div>
            <div className="text-[12px] font-medium tracking-widest text-white/40">
              {metadata.date}
            </div>
          </div>
        </div>

        {/* University Info */}
        <div className="mb-14 w-full text-center">
          {metadata.university && (
            <div className="text-[28px] leading-tight font-black tracking-[0.2em] text-white uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              {metadata.university}
            </div>
          )}
          {metadata.program && (
            <div className="mt-4 inline-block border-t border-white/10 pt-4 text-[16px] font-bold tracking-[0.12em] whitespace-nowrap text-white/60 uppercase">
              {metadata.program}
            </div>
          )}
        </div>

        {/* Title Section (Centered Hero) */}
        <div className="flex w-full max-w-[95%] flex-grow flex-col items-center justify-center text-center">
          {(metadata.title || metadata.subtitle) && (
            <div className="mb-12 w-full">
              {metadata.title && (
                <h1 className="mb-6 bg-gradient-to-br from-white via-white to-white/60 bg-clip-text px-4 text-[40px] leading-[1.2] font-black tracking-tight text-transparent drop-shadow-2xl">
                  {metadata.title}
                </h1>
              )}
              {metadata.subtitle && (
                <div className="overflow-hidden px-4 text-[20px] leading-relaxed font-semibold text-ellipsis whitespace-nowrap text-white/90">
                  {metadata.subtitle}
                </div>
              )}
            </div>
          )}

          {metadata.course && (
            <div className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-[16px] font-black tracking-wide whitespace-nowrap text-blue-400 shadow-inner backdrop-blur-xl">
              {metadata.course.replace(',', ':')}
            </div>
          )}
        </div>

        {/* Bottom Info Section */}
        <div className="mt-12 grid w-full grid-cols-12 items-end gap-8 border-t border-white/10 pt-8">
          {/* Left Column: Submitter Info */}
          <div className="col-span-5 text-left">
            <div className="mb-4 inline-block rounded-md border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-blue-400 uppercase">
              Submitted By
            </div>

            <div className="space-y-3.5">
              <div className="flex flex-col">
                <span className="mb-1 text-[10px] font-bold tracking-widest text-white/40 uppercase">
                  Name of Student
                </span>
                <span className="text-[16px] font-black text-white">{metadata.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="mb-1 text-[10px] font-bold tracking-widest text-white/40 uppercase">
                    Roll Number
                  </span>
                  <span className="text-[14px] font-bold text-white tabular-nums">
                    {metadata.roll}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="mb-1 text-[10px] font-bold tracking-widest text-white/40 uppercase">
                    Reg. No
                  </span>
                  <span className="text-[14px] font-bold text-white tabular-nums">
                    {metadata.reg}
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="mb-1 text-[10px] font-bold tracking-widest text-white/40 uppercase">
                  Batch
                </span>
                <span className="text-[14px] font-bold text-white">{metadata.batch}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Collaborative Group Members */}
          <div className="col-span-7">
            {metadata.groupMembers && metadata.groupMembers.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between px-1">
                  <h3 className="text-[11px] font-black tracking-[0.2em] text-blue-400 uppercase">
                    Collaborative Group
                  </h3>
                  <span className="text-[10px] font-bold text-white/40">
                    {metadata.groupMembers.length} Members
                  </span>
                </div>

                <div className="space-y-2">
                  {metadata.groupMembers.map((member, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 transition-all duration-300 hover:bg-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-blue-500/40 bg-blue-500/20 text-[10px] font-black text-blue-400 transition-transform group-hover:scale-110">
                          {idx + 1}
                        </div>
                        <span className="text-[13px] font-bold text-white/90 group-hover:text-white">
                          {member.name}
                        </span>
                      </div>
                      <span className="text-[12px] font-bold text-white/40 tabular-nums group-hover:text-blue-400">
                        {member.roll}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CoverPage = ({ metadata }: CoverPageProps): React.JSX.Element | null => {
  if (!metadata) {
    return null;
  }

  const isGroupSubmission = metadata.groupMembers && metadata.groupMembers.length > 0;

  if (isGroupSubmission) {
    return <GroupCoverPage metadata={metadata} />;
  }

  return <IndividualCoverPage metadata={metadata} />;
};

export const PageWrapper = ({
  children,
  pageNumber,
  totalPages,
}: {
  children: React.ReactNode;
  pageNumber: number;
  totalPages: number;
}): React.JSX.Element => {
  return (
    <div
      className="pdf-page relative mx-auto flex shrink-0 flex-col bg-white shadow-sm"
      style={{
        width: `${A4_WIDTH_PX}px`,
        minHeight: `${A4_HEIGHT_PX}px`,
        height: 'fit-content',
        color: '#111827',
        fontFamily: 'var(--font-inter), sans-serif',
        padding: '15mm',
      }}
    >
      <div className="flex-grow">{children}</div>

      <div className="mt-auto flex justify-end pt-4 font-sans text-[8pt] text-slate-400">
        Page {pageNumber} of {totalPages}
      </div>
    </div>
  );
};
