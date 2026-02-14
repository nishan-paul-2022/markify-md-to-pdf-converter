'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AppFile as File } from '@/features/file-management/hooks/use-files';
import { logger } from '@/lib/logger';
import { cn } from '@/utils/cn';

import {
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  PencilLine,
  Trash2,
} from 'lucide-react';

interface FileListViewProps {
  files: File[];
  loading: boolean;
  setDeleteId: (id: string | null) => void;
  handleRename: (id: string, newName: string, type: 'file' | 'folder') => Promise<void>;
  onImageClick?: (file: File) => void;
}

export function FileListView({
  files,
  loading,
  setDeleteId,
  handleRename,
  onImageClick,
}: FileListViewProps) {
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
      logger.error('Rename failed:', error);
    } finally {
      setIsRenaming(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getFileIcon = (type: string): React.JSX.Element => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium">No files yet</h3>
        <p className="text-muted-foreground text-sm">Upload your first file to get started</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => {
            const isDefault = file.id.startsWith('default-');
            const isCurrentlyRenaming = renamingId === file.id;

            return (
              <TableRow key={file.id}>
                <TableCell>
                  {file.mimeType.startsWith('image/') && onImageClick ? (
                    <button
                      onClick={() => onImageClick(file)}
                      className="flex cursor-pointer items-center justify-center border-none bg-transparent p-0 transition-transform outline-none hover:scale-110 active:scale-95"
                    >
                      {getFileIcon(file.mimeType)}
                    </button>
                  ) : (
                    getFileIcon(file.mimeType)
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    {isCurrentlyRenaming ? (
                      <div className="flex max-w-xs items-center gap-2">
                        <input
                          autoFocus
                          className="bg-background border-primary flex-1 rounded border px-2 py-1 text-sm font-medium outline-none"
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
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={cn('max-w-xs truncate', isDefault && 'italic opacity-80')}>
                          {file.originalName}
                        </span>
                        {isDefault && <Lock className="h-3 w-3 opacity-40" />}
                      </div>
                    )}
                    <span className="text-muted-foreground text-xs">{file.mimeType}</span>
                  </div>
                </TableCell>
                <TableCell>{formatFileSize(file.size)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(file.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={file.url} download={file.originalName}>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    {!isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRenameStart(file)}
                        disabled={isCurrentlyRenaming}
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                    )}
                    {!isDefault && (
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(file.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
