"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, Image as ImageIcon, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFileSize } from "@/lib/formatters"

interface FileUploadViewProps {
  files: File[];
  uploading: boolean;
  uploadProgress: number;
  error: string | null;
  setError: (error: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  folderInputRef: React.RefObject<HTMLInputElement | null>;
  setFiles: (files: File[]) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
  uploadFiles: () => Promise<void>;
  triggerFolderUpload: () => void;
}

export function FileUploadView({
  files,
  uploading,
  uploadProgress,
  error,
  setError,
  fileInputRef,
  folderInputRef,
  setFiles,
  handleFileSelect,
  removeFile,
  uploadFiles,
  triggerFolderUpload,
}: FileUploadViewProps) {
  /* formatFileSize removed */

  const getFileIcon = (file: File): React.JSX.Element => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />
    }
    return <FileText className="h-8 w-8 text-green-500" />
  }

  return (
    <div className="space-y-6">
      {/* Selection Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1 h-32 flex-col gap-3 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="bg-blue-100 p-2 rounded-full">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="font-bold">Files</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">.md files</p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="flex-1 h-32 flex-col gap-3 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all shadow-sm"
          onClick={triggerFolderUpload}
        >
          <div className="bg-amber-100 p-2 rounded-full">
            <FolderOpen className="h-6 w-6 text-amber-600" />
          </div>
          <div className="text-center">
            <p className="font-bold">Folder</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Project Dir</p>
          </div>
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept=".md"
        onChange={handleFileSelect}
      />
      <input
        type="file"
        ref={folderInputRef}
        className="hidden"
        {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
        onChange={handleFileSelect}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/5 border-l-4 border-destructive text-destructive rounded-r-lg p-4 flex items-start gap-4 animate-in fade-in slide-in-from-left-2 shadow-sm">
          <div className="flex-1 text-sm">
            <p className="font-bold uppercase text-[10px] tracking-widest mb-1 opacity-70">Violation Detected</p>
            <p className="whitespace-pre-line leading-relaxed font-medium">{error}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 opacity-50 hover:opacity-100" 
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Empty State / Instruction */}
      {files.length === 0 && !error && (
        <div className="py-12 px-6 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/30 dark:bg-gray-900/10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mb-4 rotate-3">
             <Upload className="h-8 w-8 text-gray-200" />
          </div>
          <h3 className="text-sm font-semibold text-gray-400">Ready for Project Import</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Use the buttons above to select your files or project folder</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Selection ({files.length})</h3>
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => {
                setFiles([]);
                setError(null);
              }} 
              disabled={uploading} 
              className="h-auto p-0 text-xs text-destructive hover:no-underline"
            >
              Clear selection
            </Button>
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {(file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {uploading && (
            <div className="p-4 bg-primary/10 rounded-xl space-y-3">
              <div className="flex justify-between text-xs font-bold text-primary italic">
                <span>CONVERTING CONTENT...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {!uploading && (
            <Button
              onClick={uploadFiles}
              className="w-full h-12 shadow-lg shadow-primary/20 text-md font-bold"
              size="lg"
            >
              Start Conversion
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
