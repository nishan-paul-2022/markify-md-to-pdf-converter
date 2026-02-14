'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/utils/formatters';

import { FileText, FolderOpen, Image as ImageIcon, Upload, X } from 'lucide-react';

interface FileUploadViewProps {
  files: File[];
  uploading: boolean;
  uploadProgress: number;
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
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Selection Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="hover:border-primary hover:bg-primary/5 h-32 flex-1 flex-col gap-3 border-2 border-dashed shadow-sm transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="rounded-full bg-blue-100 p-2">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="font-bold">Files</p>
            <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
              .md files
            </p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="hover:border-primary hover:bg-primary/5 h-32 flex-1 flex-col gap-3 border-2 border-dashed shadow-sm transition-all"
          onClick={triggerFolderUpload}
        >
          <div className="rounded-full bg-amber-100 p-2">
            <FolderOpen className="h-6 w-6 text-amber-600" />
          </div>
          <div className="text-center">
            <p className="font-bold">Folder</p>
            <p className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
              Folder Root
            </p>
          </div>
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".md"
        onChange={handleFileSelect}
      />
      <input
        type="file"
        ref={folderInputRef}
        className="hidden"
        {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
        onChange={handleFileSelect}
      />

      {/* Empty State / Instruction */}
      {files.length === 0 && (
        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/30 px-6 py-12 text-center dark:border-gray-800 dark:bg-gray-900/10">
          <div className="mb-4 flex h-16 w-16 rotate-3 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-gray-800">
            <Upload className="h-8 w-8 text-gray-200" />
          </div>
          <h3 className="text-sm font-semibold text-gray-400">Ready for Folder Import</h3>
          <p className="mt-1 max-w-[200px] text-xs text-gray-400">
            Use the buttons above to select your files or folder
          </p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
              Selection ({files.length})
            </h3>
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setFiles([]);
              }}
              disabled={uploading}
              className="text-destructive h-auto p-0 text-xs hover:no-underline"
            >
              Clear selection
            </Button>
          </div>

          <div className="custom-scrollbar max-h-64 space-y-2 overflow-y-auto pr-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50 dark:hover:bg-gray-800"
              >
                {getFileIcon(file)}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {(file as File & { webkitRelativePath?: string }).webkitRelativePath ||
                      file.name}
                  </p>
                  <p className="text-muted-foreground text-[10px] font-medium">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="text-muted-foreground hover:text-destructive h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {uploading && (
            <div className="bg-primary/10 space-y-3 rounded-xl p-4">
              <div className="text-primary flex justify-between text-xs font-bold italic">
                <span>CONVERTING CONTENT...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="bg-primary/20 h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {!uploading && (
            <Button
              onClick={uploadFiles}
              className="shadow-primary/20 text-md h-12 w-full font-bold shadow-lg"
              size="lg"
            >
              Start Conversion
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
