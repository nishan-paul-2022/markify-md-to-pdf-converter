'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AppFile as File } from '@/hooks/use-files';
import { cn } from '@/lib/utils';

import { Download, Eye, FileText, Lock, MoreVertical, PencilLine, Trash2 } from 'lucide-react';

interface FileGridViewProps {
  files: File[];
  loading: boolean;
  onImageClick?: (file: File) => void;
  setDeleteId: (id: string | null) => void;
  handleRename: (id: string, newName: string, type: 'file' | 'folder') => Promise<void>;
}

export function FileGridView({
  files,
  loading,
  onImageClick,
  setDeleteId,
  handleRename,
}: FileGridViewProps) {
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [isRenaming, setIsRenaming] = React.useState(false);

  const handleRenameStart = (file: File) => {
    setRenamingId(file.id);
    const parts = file.originalName.split('.');
    if (parts.length > 1) {
      setRenameValue(parts.slice(0, -1).join('.'));
    } else {
      setRenameValue(file.originalName);
    }
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameSubmit = async (file: File) => {
    let finalName = renameValue.trim();
    if (!finalName) {
      handleRenameCancel();
      return;
    }

    const parts = file.originalName.split('.');
    if (parts.length > 1) {
      const extension = parts[parts.length - 1];
      finalName = `${finalName}.${extension}`;
    }

    if (finalName === file.originalName) {
      handleRenameCancel();
      return;
    }

    setIsRenaming(true);
    try {
      await handleRename(file.id, finalName, 'file');
      handleRenameCancel();
    } catch (error) {
      console.error('Rename failed:', error);
    } finally {
      setIsRenaming(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
          />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium">No files yet</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {files.map((file) => {
        const isDefault = file.id.startsWith('default-');
        const isImage = file.mimeType.startsWith('image/');
        const isCurrentlyRenaming = renamingId === file.id;

        return (
          <div
            key={file.id}
            className="group hover:shadow-primary/5 relative flex transform flex-col overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900"
          >
            {/* Preview Area */}
            <div
              className={cn(
                'relative flex aspect-square w-full items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950/50',
                isImage && 'cursor-pointer',
              )}
              onClick={() => isImage && onImageClick?.(file)}
            >
              {isImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={file.url}
                  alt={file.originalName}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-12 w-12 text-blue-500/50 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    MD Document
                  </span>
                </div>
              )}

              {/* Hover Overlays */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                {isImage && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageClick?.(file);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button size="icon" variant="secondary" className="rounded-full shadow-lg" asChild>
                  <a href={file.url} download={file.originalName}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>

              {isDefault && (
                <div className="absolute top-2 left-2 z-10">
                  <div className="bg-primary/90 rounded-md p-1 text-white shadow-sm">
                    <Lock className="h-3 w-3" />
                  </div>
                </div>
              )}
            </div>

            {/* Info Area */}
            <div className="border-t p-3">
              {isCurrentlyRenaming ? (
                <input
                  autoFocus
                  className="bg-background border-primary mb-1 w-full rounded border px-2 py-1 text-sm font-medium outline-none"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleRenameSubmit(file);
                    }
                    if (e.key === 'Escape') {
                      handleRenameCancel();
                    }
                  }}
                  onBlur={() => {
                    if (!isRenaming) {
                      void handleRenameSubmit(file);
                    }
                  }}
                />
              ) : (
                <p
                  className={cn(
                    'mb-0.5 truncate pr-6 text-sm font-semibold',
                    isDefault && 'text-slate-500 italic',
                  )}
                >
                  {file.originalName}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-[10px] font-bold tracking-tight uppercase">
                  {isImage ? 'Image' : 'Markdown'}
                </span>

                {!isDefault && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mr-1 h-6 w-6 rounded-full">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRenameStart(file)}>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={() => setDeleteId(file.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
