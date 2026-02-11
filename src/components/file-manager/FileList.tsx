"use client"

import React, { useState, useCallback } from "react"
import { LayoutGrid, List } from "lucide-react"
import { useFiles, File as AppFile } from "@/hooks/use-files"
import { FileListView } from "@/components/file-manager/FileListView"
import { FileGridView } from "@/components/file-manager/FileGridView"
import { ImageModal } from "@/components/file-manager/ImageModal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function FileList(): React.JSX.Element {
  const filesState = useFiles()
  const { files, deleteId, deleting, setDeleteId, handleDelete } = filesState
  const [activeImage, setActiveImage] = useState<AppFile | null>(null)
  const [imageGallery, setImageGallery] = useState<AppFile[]>([])
  
  // Initialize from localStorage safely
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('markify-view-mode') as 'list' | 'grid'
      return savedMode || 'grid'
    }
    return 'grid'
  })

  const toggleViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode)
    localStorage.setItem('markify-view-mode', mode)
  }

  const handleImageClick = useCallback((file: AppFile) => {
    const gallery = files.filter(f => 
      f.mimeType.startsWith("image/") && f.batchId === file.batchId
    )
    setActiveImage(file)
    setImageGallery(gallery)
  }, [files])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">Project Artifacts</h3>
        
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleViewMode('grid')}
            className={cn(
              "h-8 px-3 rounded-md transition-all duration-200",
              viewMode === 'grid' && "bg-white dark:bg-slate-700 shadow-sm"
            )}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            <span className="text-xs font-medium">Grid</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleViewMode('list')}
            className={cn(
              "h-8 px-3 rounded-md transition-all duration-200",
              viewMode === 'list' && "bg-white dark:bg-slate-700 shadow-sm"
            )}
          >
            <List className="h-4 w-4 mr-2" />
            <span className="text-xs font-medium">List</span>
          </Button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {viewMode === 'list' ? (
          <FileListView 
            files={files} 
            loading={filesState.loading}
            onImageClick={handleImageClick}
            setDeleteId={setDeleteId}
            handleRename={filesState.handleRename}
          />
        ) : (
          <FileGridView 
            files={files} 
            loading={filesState.loading}
            onImageClick={handleImageClick}
            setDeleteId={setDeleteId}
            handleRename={filesState.handleRename}
          />
        )}
      </div>

      {activeImage && (
        <ImageModal
          activeImage={activeImage}
          images={imageGallery}
          onClose={() => setActiveImage(null)}
          onSelectImage={(img) => setActiveImage(img)}
        />
      )}

      {/* Shared Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent variant="destructive" className="sm:max-w-[400px]">
          <div className="p-6 sm:p-7 relative">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete file?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the file
                from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6">
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && handleDelete(deleteId)}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                {deleting ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
