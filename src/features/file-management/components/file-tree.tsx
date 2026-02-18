'use client';

import React, { useState } from 'react';

import { useAlert } from '@/components/alert-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FileTreeNode } from '@/features/file-management/utils/file-tree';
import { logger } from '@/lib/logger';
import { cn } from '@/utils/cn';

import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  FileText,
  Folder,
  ImageIcon,
  LayoutGrid,
  List,
  Lock,
  MoreVertical,
  PencilLine,
  Trash2,
} from 'lucide-react';

interface FileTreeProps {
  nodes: FileTreeNode[];
  level?: number;
  onFileSelect: (node: FileTreeNode) => void;
  onDelete: (id: string | string[]) => void;
  onRename: (
    id: string,
    newName: string,
    type: 'file' | 'folder',
    batchId?: string,
    oldPath?: string,
  ) => Promise<void>;
  selectedFileId?: string;
  isSelectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string | string[]) => void;
  searchQuery?: string;
}

export function FileTree({
  nodes,
  level = 0,
  onFileSelect,
  onDelete,
  onRename,
  selectedFileId,
  isSelectionMode = false,
  selectedIds = new Set(),
  onToggleSelection,
  searchQuery = '',
}: FileTreeProps) {
  const { confirm } = useAlert();
  // Helper to get and save expanded folders from/to localStorage
  const getPersistedExpandedFolders = React.useCallback((): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem('markify-expanded-folders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (error) {
      console.warn('Failed to parse expanded folders:', error);
    }
    return new Set();
  }, []);

  const persistExpandedFolder = React.useCallback(
    (id: string, expanded: boolean) => {
      if (typeof window === 'undefined') return;
      const current = getPersistedExpandedFolders();
      if (expanded) current.add(id);
      else current.delete(id);
      localStorage.setItem('markify-expanded-folders', JSON.stringify(Array.from(current)));
    },
    [getPersistedExpandedFolders],
  );

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const initial = new Set<string>();

    // Priority 1: Search mode (if initial searchQuery is somehow present, though rare here)
    // Priority 2: Persistent state
    if (typeof window !== 'undefined') {
      const persisted = localStorage.getItem('markify-expanded-folders');
      if (persisted) {
        try {
          const parsed = JSON.parse(persisted);
          if (Array.isArray(parsed)) {
            parsed.forEach((p) => initial.add(p));
          }
        } catch (error) {
          console.warn('Failed to parse expanded folders:', error);
        }
      }
    }

    return initial;
  });

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Track the last file that was auto-expanded to prevent infinite/annoying re-expansion
  const lastExpandedFileId = React.useRef<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('markify-last-expanded-file-id') : null,
  );
  const isFirstLoad = React.useRef(true);

  // Track grid mode for individual folders. Persist in localStorage.
  const [folderGridModes, setFolderGridModes] = useState<Set<string>>(() => {
    const initial = new Set<string>();

    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('markify-folder-grid-modes');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach((p) => initial.add(p));
          }
        }
      } catch (error) {
        console.warn('Failed to parse folder grid modes:', error);
      }
    }

    return initial;
  });

  // Helper to check if a node matches (recursive)
  const doesNodeMatch = React.useCallback((node: FileTreeNode, query: string): boolean => {
    // 1. Strict Exclusion Rules (Always apply if query is present)
    if (query) {
      // Exclude 'images' folder and its contents
      if (node.name === 'images' && node.type === 'folder') return false;

      // Exclude image files (by mimeType or extension)
      if (node.type === 'file') {
        if (node.file?.mimeType.startsWith('image/')) return false;
        if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(node.name)) return false;
      }
    } else {
      // If no query, we generally show everything,
      // BUT if we wanted to enforce "searching is only for files", matches are irrelevant.
      // However, doesNodeMatch is usually called when query exists.
      return true;
    }

    // 2. Match Logic
    const nameMatch = node.name.toLowerCase().includes(query.toLowerCase());

    // If it's a file, it must match name
    if (node.type === 'file') {
      return nameMatch;
    }

    // If it's a folder, it matches if:
    // a) The folder name matches (User said "searching is only for files", but usually context helps.
    //    However, strict filtering "others hidden" implies looking for content.
    //    Let's keep folder name matching effectively "expanding" it, but we need to see if children match.
    //    If we assume "searching is only for files", maybe we ONLY return true if CHILDREN match?
    //    "searching is only for files" -> strongly implies folder names shouldn't trigger a match unless content matches.
    //    Let's try: Match if children match. OR if name matches?
    //    Let's stick to: Match if children match OR name matches (standard tree search).

    // Check children recursively
    const childrenMatch = node.children?.some((child) => doesNodeMatch(child, query)) ?? false;

    return nameMatch || childrenMatch;
  }, []);

  const filteredNodes = React.useMemo(() => {
    if (!searchQuery) return nodes;
    return nodes.filter((node) => doesNodeMatch(node, searchQuery));
  }, [nodes, searchQuery, doesNodeMatch]);

  // Optimize expansion: Only calculate when searchQuery really changes
  React.useEffect(() => {
    if (!searchQuery) {
      // Revert to persisted expanded folders when not searching
      const persisted = getPersistedExpandedFolders();
      setExpandedFolders(persisted);
      return;
    }

    const newExpanded = new Set<string>();

    const collectExpanded = (nodes: FileTreeNode[]) => {
      for (const node of nodes) {
        // We only care about folders
        if (node.type === 'folder') {
          // If this node matches (meaning it contains matching files or matches itself), expand it
          if (doesNodeMatch(node, searchQuery)) {
            newExpanded.add(node.id);
            // Recurse
            if (node.children) {
              collectExpanded(node.children);
            }
          }
        }
      }
    };

    collectExpanded(nodes);
    setExpandedFolders(newExpanded);
  }, [searchQuery, nodes, doesNodeMatch, getPersistedExpandedFolders]);

  const toggleFolderGridMode = (id: string) => {
    setFolderGridModes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('markify-folder-grid-modes', JSON.stringify(Array.from(next)));
      }

      return next;
    });
  };

  const handleRenameStart = (node: FileTreeNode) => {
    if (node.type === 'folder' && node.name === 'images') {
      return;
    }
    setRenamingId(node.id);
    if (node.type === 'file') {
      const parts = node.name.split('.');
      if (parts.length > 1) {
        setRenameValue(parts.slice(0, -1).join('.'));
      } else {
        setRenameValue(node.name);
      }
    } else {
      setRenameValue(node.name);
    }
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameSubmit = async (node: FileTreeNode) => {
    let finalName = renameValue.trim();
    if (!finalName) {
      handleRenameCancel();
      return;
    }

    if (node.type === 'file') {
      const parts = node.name.split('.');
      if (parts.length > 1) {
        const extension = parts[parts.length - 1];
        finalName = `${finalName}.${extension}`;
      }
    }

    if (finalName === node.name) {
      handleRenameCancel();
      return;
    }

    setIsRenaming(true);
    try {
      await onRename(node.id, finalName, node.type, node.batchId, node.path);
      handleRenameCancel();
    } catch (error) {
      logger.error('Rename failed:', error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteClick = async (node: FileTreeNode, isFolder: boolean) => {
    const fileIds = isFolder ? collectFileIds(node) : [node.id];
    const confirmed = await confirm({
      title: isFolder ? 'Delete folder?' : 'Delete file?',
      message: isFolder
        ? `Are you sure you want to delete the folder "${node.name}" and all its contents? This cannot be undone.`
        : `Are you sure you want to delete "${node.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (confirmed) {
      onDelete(fileIds.length === 1 ? fileIds[0] : fileIds);
    }
  };

  const toggleFolder = (id: string) => {
    const isExpanding = !expandedFolders.has(id);
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);

    // Save to localStorage
    persistExpandedFolder(id, isExpanding);
  };

  const collectFileIds = (node: FileTreeNode): string[] => {
    if (node.type === 'file') {
      return [node.id];
    }
    let ids: string[] = [];
    if (node.children) {
      for (const child of node.children) {
        ids = [...ids, ...collectFileIds(child)];
      }
    }
    return ids;
  };

  const containsSelectedFile = (node: FileTreeNode, selectedId?: string): boolean => {
    if (!selectedId) {
      return false;
    }
    if (node.type === 'file') {
      return node.id === selectedId;
    }
    if (node.children) {
      return node.children.some((child) => containsSelectedFile(child, selectedId));
    }
    return false;
  };

  // Auto-expand folders containing the selected file
  React.useEffect(() => {
    if (selectedFileId && nodes.length > 0) {
      // Only auto-expand if the selected file has changed or if it's the first build of nodes
      // AND don't auto-expand if we're in search mode (search has its own logic)
      if (searchQuery) return;

      const isSameFile = lastExpandedFileId.current === selectedFileId;
      if (isSameFile) return;

      const foldersToExpand = new Set<string>();

      // First, find the selected file and get its batchId
      const findSelectedFile = (items: FileTreeNode[]): FileTreeNode | null => {
        for (const item of items) {
          if (item.id === selectedFileId) {
            return item;
          }
          if (item.children) {
            const found = findSelectedFile(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const selectedFile = findSelectedFile(nodes);
      if (!selectedFile) return;

      const selectedFileBatchId = selectedFile.batchId;

      // Only expand folders if they're in the same batch as the selected file
      const findAndExpand = (items: FileTreeNode[]): boolean => {
        let found = false;
        for (const item of items) {
          if (item.id === selectedFileId) {
            found = true;
          } else if (item.children) {
            // Only expand this folder if it's in the same batch as the selected file
            // or if it's a default folder (no batch) and the selected file is also default
            const shouldConsiderFolder =
              !selectedFileBatchId ||
              item.batchId === selectedFileBatchId ||
              (item.id.startsWith('folder-no-batch') && !selectedFileBatchId);

            if (shouldConsiderFolder && findAndExpand(item.children)) {
              foldersToExpand.add(item.id);
              found = true;
            }
          }
        }
        return found;
      };

      if (findAndExpand(nodes)) {
        lastExpandedFileId.current = selectedFileId;
        if (typeof window !== 'undefined') {
          localStorage.setItem('markify-last-expanded-file-id', selectedFileId);
        }
        isFirstLoad.current = false;

        setExpandedFolders((prev) => {
          const combined = new Set(prev);
          let changed = false;
          for (const id of foldersToExpand) {
            if (!combined.has(id)) {
              combined.add(id);
              changed = true;
              // Also persist auto-expansion
              persistExpandedFolder(id, true);
            }
          }
          return changed ? combined : prev;
        });
      }
    }
  }, [selectedFileId, nodes, searchQuery, persistExpandedFolder]);

  const getFileIcon = (fileName: string, mimeType?: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (
      mimeType?.startsWith('image/') ||
      ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')
    ) {
      return (
        <ImageIcon className="h-3.5 w-3.5 text-blue-400 transition-colors group-hover:text-blue-300" />
      );
    }
    if (ext === 'pdf') {
      return (
        <FileText className="h-3.5 w-3.5 text-red-400 transition-colors group-hover:text-red-300" />
      );
    }
    if (ext === 'md') {
      return (
        <FileText className="h-3.5 w-3.5 text-emerald-400 transition-colors group-hover:text-emerald-300" />
      );
    }
    return (
      <FileText className="h-3.5 w-3.5 text-slate-500 transition-colors group-hover:text-slate-300" />
    );
  };

  return (
    <div className="flex flex-col">
      {filteredNodes.map((node) => {
        const isExpanded = expandedFolders.has(node.id);
        const isSelected = selectedFileId === node.id;
        const isFolderActive = containsSelectedFile(node, selectedFileId);
        const isCurrentlyRenaming = renamingId === node.id;
        const isGridMode = node.name === 'images' && folderGridModes.has(node.id);

        // Pass strict searchQuery down to children to enforce hidden state
        const childSearchQuery = searchQuery;

        if (node.type === 'folder') {
          const folderFileIds = collectFileIds(node);
          const isDefaultFolder =
            node.id.startsWith('folder-no-batch') ||
            folderFileIds.some((id) => id.startsWith('default-'));

          return (
            <div key={node.id} className="group/folder flex flex-col">
              <div
                className={cn(
                  'flex items-center justify-between text-slate-400 transition-all hover:bg-white/5 hover:text-slate-100',
                  isFolderActive && 'border-l-2 border-amber-500/70 bg-white/[0.03] text-slate-100',
                  level > 0 && `ml-${level * 2}`,
                )}
                style={{ paddingLeft: `${(level + 1) * 1}rem` }}
              >
                {isCurrentlyRenaming ? (
                  <div className="flex h-8 flex-1 items-center gap-2 py-1.5">
                    <Folder className="h-4 w-4 shrink-0 text-amber-500/80" />
                    <input
                      autoFocus
                      className="flex-1 rounded border border-amber-500/50 bg-slate-900 px-1.5 py-0.5 text-sm font-medium text-slate-100 transition-all outline-none focus:border-amber-500"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          void handleRenameSubmit(node);
                        }
                        if (e.key === 'Escape') {
                          handleRenameCancel();
                        }
                      }}
                      onBlur={() => {
                        if (!isRenaming) {
                          void handleRenameSubmit(node);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => toggleFolder(node.id)}
                    className="flex flex-1 cursor-pointer items-center gap-2 truncate py-1.5 text-left text-sm"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    <Folder
                      className={cn(
                        'h-4 w-4',
                        isDefaultFolder ? 'text-amber-500/50' : 'text-amber-500/80',
                      )}
                    />
                    <span className={cn('truncate', isDefaultFolder && 'italic opacity-80')}>
                      {node.name}
                    </span>
                    {isDefaultFolder && <Lock className="ml-1 h-2.5 w-2.5 opacity-40" />}
                  </button>
                )}
                <div className="flex items-center gap-1">
                  {isSelectionMode && !isDefaultFolder && level === 0 && (
                    <div className="flex items-center px-2">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onToggleSelection) {
                            onToggleSelection(folderFileIds);
                          }
                        }}
                        className={cn(
                          'flex h-4 w-4 cursor-pointer items-center justify-center rounded-md border transition-all duration-300',
                          folderFileIds.every((id) => selectedIds.has(id))
                            ? 'bg-primary border-primary/50 scale-110 shadow-[0_0_10px_-2px_rgba(var(--primary),0.3)]'
                            : 'hover:border-primary/50 border-white/10 bg-slate-950',
                        )}
                      >
                        {folderFileIds.every((id) => selectedIds.has(id)) && (
                          <Check className="h-3 w-3 stroke-[4] text-slate-950" />
                        )}
                      </div>
                    </div>
                  )}
                  {!isCurrentlyRenaming && (
                    <div className="flex items-center px-1 opacity-0 transition-opacity group-hover/folder:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-slate-800 bg-slate-900 text-slate-100"
                        >
                          {node.name === 'images' && (
                            <DropdownMenuItem
                              onClick={() => toggleFolderGridMode(node.id)}
                              className="cursor-pointer gap-2 text-xs"
                            >
                              {isGridMode ? (
                                <List className="h-3.5 w-3.5" />
                              ) : (
                                <LayoutGrid className="h-3.5 w-3.5" />
                              )}
                              {isGridMode ? 'View as List' : 'View as Grid'}
                            </DropdownMenuItem>
                          )}
                          {!isDefaultFolder && node.name !== 'images' && (
                            <DropdownMenuItem
                              onClick={() => handleRenameStart(node)}
                              className="cursor-pointer gap-2 text-xs"
                            >
                              <PencilLine className="h-3.5 w-3.5" /> Rename Folder
                            </DropdownMenuItem>
                          )}
                          {!isDefaultFolder && folderFileIds.length > 0 && level === 0 && (
                            <DropdownMenuItem
                              onClick={() => {
                                void handleDeleteClick(node, true);
                              }}
                              className="cursor-pointer gap-2 text-xs text-red-400 focus:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete Folder
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => toggleFolder(node.id)}
                            className="cursor-pointer gap-2 text-xs"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                            {isExpanded ? 'Collapse' : 'Expand'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>
              {isExpanded && node.children && (
                <div
                  className={cn(
                    'transition-all duration-300',
                    isGridMode ? 'grid grid-cols-2 gap-2 p-2 pl-6' : 'flex flex-col',
                  )}
                >
                  {isGridMode ? (
                    node.children.map((child) => {
                      const isImg =
                        child.type === 'file' &&
                        (child.file?.mimeType.startsWith('image/') ||
                          /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(child.name));
                      const isChildSelected = selectedFileId === child.id;

                      // During search, images are hidden via logic, but we must check if this map needs filter
                      // If we are in grid mode and searching, doesNodeMatch handles it in parent filter,
                      // but 'nodes.map' inside here is iterating raw children?
                      // NO, 'node' comes from 'filteredNodes', but 'node.children' is raw.
                      // We must filter children here too if we want strict grid view filtering.
                      if (searchQuery && !doesNodeMatch(child, searchQuery)) return null;

                      return (
                        <button
                          key={child.id}
                          onClick={() => onFileSelect(child)}
                          className={cn(
                            'group/grid relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border p-1.5 transition-all',
                            isChildSelected
                              ? 'border-amber-500/50 bg-amber-500/10 shadow-lg ring-1 shadow-amber-500/10 ring-amber-500/20'
                              : 'border-white/5 bg-slate-900/40 hover:border-white/10 hover:bg-slate-800/80',
                          )}
                          title={child.name}
                        >
                          {isImg && child.file?.url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={child.file.url}
                              alt={child.name}
                              className="h-full w-full rounded object-cover shadow-sm transition-transform duration-300 group-hover/grid:scale-110"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 opacity-60 transition-opacity group-hover/grid:opacity-100">
                              {child.type === 'folder' ? (
                                <Folder className="h-6 w-6 text-amber-500/80" />
                              ) : (
                                getFileIcon(child.name, child.file?.mimeType)
                              )}
                              <span className="max-w-full truncate px-1 text-[8px] font-medium text-slate-400">
                                {child.name}
                              </span>
                            </div>
                          )}
                          {isChildSelected && (
                            <div className="pointer-events-none absolute inset-0 rounded-lg border-2 border-amber-500" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <FileTree
                      nodes={node.children}
                      level={level + 1}
                      onFileSelect={onFileSelect}
                      onDelete={onDelete}
                      onRename={onRename}
                      selectedFileId={selectedFileId}
                      isSelectionMode={isSelectionMode}
                      selectedIds={selectedIds}
                      searchQuery={childSearchQuery}
                      onToggleSelection={onToggleSelection}
                    />
                  )}
                </div>
              )}
            </div>
          );
        }

        return (
          <div
            key={node.id}
            className={cn(
              'group flex items-center justify-between text-slate-400 transition-all hover:bg-white/5',
              isSelected
                ? 'border-l-2 border-emerald-500 bg-white/10 text-white shadow-[inset_4px_0_12px_-4px_rgba(16,185,129,0.1)]'
                : 'hover:text-slate-100',
            )}
            style={{ paddingLeft: `${(level + 1.5) * 1}rem` }}
          >
            {isCurrentlyRenaming ? (
              <div className="flex h-8 flex-1 items-center gap-2 py-1.5">
                {getFileIcon(node.name, node.file?.mimeType)}
                <input
                  autoFocus
                  className="flex-1 rounded border border-emerald-500/50 bg-slate-900 px-1.5 py-0.5 text-sm font-medium text-slate-100 transition-all outline-none focus:border-emerald-500"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleRenameSubmit(node);
                    }
                    if (e.key === 'Escape') {
                      handleRenameCancel();
                    }
                  }}
                  onBlur={() => {
                    if (!isRenaming) {
                      void handleRenameSubmit(node);
                    }
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => onFileSelect(node)}
                className="flex flex-1 cursor-pointer items-center gap-2 truncate py-1.5 text-left text-sm"
              >
                {getFileIcon(node.name, node.file?.mimeType)}
                <span
                  className={cn('truncate', node.id.startsWith('default-') && 'italic opacity-80')}
                >
                  {node.name}
                </span>
                {node.id.startsWith('default-') && (
                  <Lock className="ml-1 h-2.5 w-2.5 text-emerald-500/50 opacity-40" />
                )}
              </button>
            )}
            <div className="flex items-center gap-1">
              {isSelectionMode && !node.id.startsWith('default-') && level === 0 && (
                <div className="flex items-center px-2">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleSelection) {
                        onToggleSelection(node.id);
                      }
                    }}
                    className={cn(
                      'flex h-4 w-4 cursor-pointer items-center justify-center rounded-md border transition-all duration-300',
                      selectedIds.has(node.id)
                        ? 'bg-primary border-primary/50 scale-110 shadow-[0_0_10px_-2px_rgba(var(--primary),0.3)]'
                        : 'hover:border-primary/50 border-white/10 bg-slate-950',
                    )}
                  >
                    {selectedIds.has(node.id) && (
                      <Check className="h-3 w-3 stroke-[4] text-slate-950" />
                    )}
                  </div>
                </div>
              )}
              {!isCurrentlyRenaming && (
                <div className="flex items-center px-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="border-slate-800 bg-slate-900 text-slate-100"
                    >
                      <DropdownMenuItem
                        onClick={() => onFileSelect(node)}
                        className="cursor-pointer gap-2 text-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open
                      </DropdownMenuItem>
                      {!node.id.startsWith('default-') && (
                        <DropdownMenuItem
                          onClick={() => handleRenameStart(node)}
                          className="cursor-pointer gap-2 text-xs"
                        >
                          <PencilLine className="h-3.5 w-3.5" /> Rename
                        </DropdownMenuItem>
                      )}
                      {!node.id.startsWith('default-') && level === 0 && (
                        <DropdownMenuItem
                          onClick={() => {
                            void handleDeleteClick(node, false);
                          }}
                          className="cursor-pointer gap-2 text-xs text-red-400 focus:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
