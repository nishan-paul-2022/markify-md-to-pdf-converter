"use client"

import React, { useState, useEffect, useCallback } from "react"
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

  if (!activeImage) {return null;}

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-16 bg-gradient-to-b from-black/50 to-transparent z-10">
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm truncate max-w-[300px]">
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
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 transition-all"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 transition-all"
          >
            <a href={activeImage.url} download={activeImage.originalName}>
              <Download className="h-5 w-5" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 transition-all"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4 md:p-12">
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 md:left-8 z-20 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white/50 hover:text-white transition-all backdrop-blur-md border border-white/5 group"
            >
              <ChevronLeft className="h-8 w-8 group-active:scale-90 transition-transform" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 md:right-8 z-20 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white/50 hover:text-white transition-all backdrop-blur-md border border-white/5 group"
            >
              <ChevronRight className="h-8 w-8 group-active:scale-90 transition-transform" />
            </button>
          </>
        )}

        <div className={cn(
          "relative max-w-full max-h-full flex items-center justify-center transition-all duration-300",
          imgLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeImage.id}
            src={activeImage.url}
            alt={activeImage.originalName}
            onLoad={() => setImgLoaded(true)}
            className={cn(
              "max-w-full max-h-[80vh] shadow-2xl transition-transform duration-300 ease-out object-contain",
              isFullscreen ? "scale-110" : "scale-100"
            )}
          />
        </div>

        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Thumbnails Footer */}
      <div className="bg-gradient-to-t from-black/80 to-transparent p-6 pt-12 pb-8 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 overflow-x-auto pb-4 custom-scrollbar justify-center no-scrollbar">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => {
                  setImgLoaded(false);
                  onSelectImage(img);
                }}
                className={cn(
                  "relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 active:scale-95 group",
                  img.id === activeImage.id ? "border-blue-500 ring-2 ring-blue-500/50 scale-110 z-10" : "border-white/10 opacity-40 hover:opacity-100 hover:border-white/30"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.originalName}
                  className="w-full h-full object-cover"
                />
                <div className={cn(
                  "absolute inset-0 bg-blue-500/10 transition-opacity",
                  img.id === activeImage.id ? "opacity-100" : "opacity-0"
                )} />
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
      `}</style>
    </div>
  )
}
