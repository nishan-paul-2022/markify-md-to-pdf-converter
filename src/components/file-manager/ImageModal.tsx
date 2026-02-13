'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import type { File as AppFile } from '@/hooks/use-files';
import { cn } from '@/lib/utils';

import { ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, X } from 'lucide-react';

interface ImageModalProps {
  activeImage: AppFile;
  images: AppFile[];
  onClose: () => void;
  onSelectImage: (image: AppFile) => void;
}

export function ImageModal({ activeImage, images, onClose, onSelectImage }: ImageModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const currentIndex = images.findIndex((img) => img.id === activeImage.id);

  const handlePrev = useCallback(() => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setImgLoaded(false);
    onSelectImage(images[prevIndex]);
  }, [currentIndex, images, onSelectImage]);

  const handleNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % images.length;
    setImgLoaded(false);
    onSelectImage(images[nextIndex]);
  }, [currentIndex, images, onSelectImage]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
      }
      if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailsRef.current) {
      const activeBtn = thumbnailsRef.current.querySelector('[data-active="true"]') as HTMLElement;
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeImage.id]);

  // Handle horizontal scroll with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (thumbnailsRef.current) {
      thumbnailsRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-[100] flex flex-col bg-slate-950 duration-300">
      {/* Dynamic Blurred Background (Facebook Style) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-[-20%] scale-150 bg-cover bg-center"
          style={{
            backgroundImage: `url(${activeImage.url})`,
            filter: 'blur(20px) brightness(0.25)',
          }}
        />
      </div>
      {/* Header */}
      <div className="z-50 flex h-16 items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-6">
        <div className="flex flex-col">
          <span className="max-w-[300px] truncate text-sm font-medium text-white drop-shadow-md">
            {activeImage.originalName}
          </span>
          <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
            {currentIndex + 1} of {images.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-10 w-10 cursor-pointer rounded-full text-white/70 transition-all hover:bg-white/10 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-10 w-10 cursor-pointer rounded-full text-white/70 transition-all hover:bg-white/10 hover:text-white"
          >
            <a href={activeImage.url} download={activeImage.originalName}>
              <Download className="h-5 w-5" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="group h-12 w-12 cursor-pointer rounded-full text-white/70 transition-all hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-6 w-6 transition-transform group-hover:scale-110" />
          </Button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="group absolute left-6 z-20 cursor-pointer rounded-full border border-white/5 bg-black/10 p-2 text-white/30 backdrop-blur-sm transition-all hover:bg-black/40 hover:text-white"
            >
              <ChevronLeft className="h-10 w-10 transition-transform group-active:scale-90" />
            </button>
            <button
              onClick={handleNext}
              className="group absolute right-6 z-20 cursor-pointer rounded-full border border-white/5 bg-black/10 p-2 text-white/30 backdrop-blur-sm transition-all hover:bg-black/40 hover:text-white"
            >
              <ChevronRight className="h-10 w-10 transition-transform group-active:scale-90" />
            </button>
          </>
        )}

        <div
          className={cn(
            'relative flex max-h-full max-w-full items-center justify-center',
            imgLoaded ? 'opacity-100' : 'opacity-0',
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeImage.id}
            src={activeImage.url}
            alt={activeImage.originalName}
            onLoad={() => setImgLoaded(true)}
            className={cn(
              'max-h-[82vh] max-w-full object-contain shadow-2xl',
              isFullscreen ? 'scale-105' : 'scale-100',
            )}
          />
        </div>

        {!imgLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-white" />
          </div>
        )}
      </div>

      {/* Thumbnails Footer */}
      <div className="bg-gradient-to-t from-black/90 to-transparent p-4 pt-10 pb-6">
        <div className="relative mx-auto flex max-w-5xl justify-center">
          <div
            ref={thumbnailsRef}
            onWheel={handleWheel}
            className="no-scrollbar custom-scrollbar mask-fade flex items-center gap-1.5 overflow-x-auto px-10 py-2"
            style={{
              maxWidth: '100%',
              scrollSnapType: 'x proximity',
            }}
          >
            {images.map((img) => (
              <button
                key={img.id}
                data-active={img.id === activeImage.id}
                onClick={() => {
                  if (img.id !== activeImage.id) {
                    setImgLoaded(false);
                    onSelectImage(img);
                  }
                }}
                className={cn(
                  'scroll-snap-align-center relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-sm transition-all duration-200',
                  img.id === activeImage.id
                    ? 'z-10 scale-110 opacity-100 shadow-lg ring-2 shadow-white/20 ring-white'
                    : 'opacity-40 hover:scale-105 hover:opacity-100',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.originalName} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .mask-fade {
          mask-image: linear-gradient(
            to right,
            transparent,
            black 40px,
            black calc(100% - 40px),
            transparent
          );
        }
        .scroll-snap-align-center {
          scroll-snap-align: center;
        }
      `}</style>
    </div>
  );
}
