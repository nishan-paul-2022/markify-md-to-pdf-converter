"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { X, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { File as AppFile } from "@/hooks/use-files"

interface ImageModalProps {
  activeImage: AppFile;
  images: AppFile[];
  onClose: () => void;
  onSelectImage: (image: AppFile) => void;
}

export function ImageModal({ 
  activeImage, 
  images, 
  onClose, 
  onSelectImage 
}: ImageModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const thumbnailsRef = useRef<HTMLDivElement>(null)
  
  const currentIndex = images.findIndex(img => img.id === activeImage.id)
  
  const handlePrev = useCallback(() => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length
    setImgLoaded(false)
    onSelectImage(images[prevIndex])
  }, [currentIndex, images, onSelectImage])

  const handleNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % images.length
    setImgLoaded(false)
    onSelectImage(images[nextIndex])
  }, [currentIndex, images, onSelectImage])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {onClose();}
      if (e.key === "ArrowLeft") {handlePrev();}
      if (e.key === "ArrowRight") {handleNext();}
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, handlePrev, handleNext])

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailsRef.current) {
      const activeBtn = thumbnailsRef.current.querySelector('[data-active="true"]') as HTMLElement
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        })
      }
    }
  }, [activeImage.id])

  // Handle horizontal scroll with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (thumbnailsRef.current) {
      thumbnailsRef.current.scrollLeft += e.deltaY;
    }
  }

  if (!activeImage) {return null;}

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 animate-in fade-in duration-300">
      {/* Dynamic Blurred Background (Facebook Style) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-[-20%] bg-cover bg-center scale-150"
          style={{ 
            backgroundImage: `url(${activeImage.url})`,
            filter: 'blur(20px) brightness(0.25)',
          }}
        />
      </div>
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-16 bg-gradient-to-b from-black/60 to-transparent z-50">
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm truncate max-w-[300px] drop-shadow-md">
            {activeImage.originalName}
          </span>
          <span className="text-white/50 text-[10px] uppercase tracking-widest font-bold">
            {currentIndex + 1} of {images.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 transition-all cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 transition-all cursor-pointer"
          >
            <a href={activeImage.url} download={activeImage.originalName}>
              <Download className="h-5 w-5" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 transition-all cursor-pointer"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-6 z-20 p-2 rounded-full bg-black/10 hover:bg-black/40 text-white/30 hover:text-white transition-all backdrop-blur-sm border border-white/5 group cursor-pointer"
            >
              <ChevronLeft className="h-10 w-10 group-active:scale-90 transition-transform" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-6 z-20 p-2 rounded-full bg-black/10 hover:bg-black/40 text-white/30 hover:text-white transition-all backdrop-blur-sm border border-white/5 group cursor-pointer"
            >
              <ChevronRight className="h-10 w-10 group-active:scale-90 transition-transform" />
            </button>
          </>
        )}

        <div className={cn(
          "relative max-w-full max-h-full flex items-center justify-center",
          imgLoaded ? "opacity-100" : "opacity-0"
        )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeImage.id}
            src={activeImage.url}
            alt={activeImage.originalName}
            onLoad={() => setImgLoaded(true)}
            className={cn(
              "max-w-full max-h-[82vh] shadow-2xl object-contain",
              isFullscreen ? "scale-105" : "scale-100"
            )}
          />
        </div>

        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Thumbnails Footer */}
      <div className="bg-gradient-to-t from-black/90 to-transparent p-4 pt-10 pb-6">
        <div className="relative max-w-5xl mx-auto flex justify-center">
          <div 
            ref={thumbnailsRef}
            onWheel={handleWheel}
            className="flex items-center gap-1.5 overflow-x-auto py-2 px-10 no-scrollbar custom-scrollbar mask-fade"
            style={{ 
              maxWidth: '100%',
              scrollSnapType: 'x proximity'
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
                  "relative shrink-0 w-12 h-12 rounded-sm overflow-hidden transition-all duration-200 cursor-pointer scroll-snap-align-center",
                  img.id === activeImage.id 
                    ? "ring-2 ring-white scale-110 z-10 opacity-100 shadow-lg shadow-white/20" 
                    : "opacity-40 hover:opacity-100 hover:scale-105"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.originalName}
                  className="w-full h-full object-cover"
                />
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
          mask-image: linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent);
        }
        .scroll-snap-align-center {
          scroll-snap-align: center;
        }
      `}</style>
    </div>
  )
}
