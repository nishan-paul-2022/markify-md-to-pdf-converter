"use client"

import React, { useState, useCallback } from "react"
import { useFiles, File as AppFile } from "@/hooks/use-files"
import { FileListView } from "@/components/file-manager/FileListView"
import { ImageModal } from "@/components/file-manager/ImageModal"

export default function FileList(): React.JSX.Element {
  const filesState = useFiles()
  const { files } = filesState
  const [activeImage, setActiveImage] = useState<AppFile | null>(null)
  const [imageGallery, setImageGallery] = useState<AppFile[]>([])

  const handleImageClick = useCallback((file: AppFile) => {
    // In flat list view, we just show all images in the same batch or all images if no batch
    const gallery = files.filter(f => 
      f.mimeType.startsWith("image/") && f.batchId === file.batchId
    )
    setActiveImage(file)
    setImageGallery(gallery)
  }, [files])

  return (
    <>
      <FileListView {...filesState} onImageClick={handleImageClick} />
      {activeImage && (
        <ImageModal
          activeImage={activeImage}
          images={imageGallery}
          onClose={() => setActiveImage(null)}
          onSelectImage={(img) => setActiveImage(img)}
        />
      )}
    </>
  )
}
