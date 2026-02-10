"use client"

import React, { useState } from "react"
import { ChevronRight, ChevronDown, ChevronUp, Folder, FileText, ImageIcon, MoreVertical, Trash2, ExternalLink, PencilLine, Lock, LayoutGrid, List, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileTreeNode } from "@/lib/file-tree"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAlert } from "@/components/AlertProvider"

interface FileTreeProps {
  nodes: FileTreeNode[];
  level?: number;
  onFileSelect: (node: FileTreeNode) => void;
  onDelete: (id: string | string[]) => void;
  onRename: (id: string, newName: string, type: "file" | "folder", batchId?: string, oldPath?: string) => Promise<void>;
  selectedFileId?: string;
  isSelectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string | string[]) => void;
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
}: FileTreeProps) {
  const { confirm } = useAlert()
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)
  
  // Track grid mode for individual folders. Default 'images' folders to grid.
  const [folderGridModes, setFolderGridModes] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    nodes.forEach(node => {
      if (node.type === 'folder' && node.name.toLowerCase() === 'images') {
        initial.add(node.path);
      }
    });
    return initial;
  });

  const toggleFolderGridMode = (path: string) => {
    setFolderGridModes(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  const handleRenameStart = (node: FileTreeNode) => {
    setRenamingId(node.id)
    if (node.type === "file") {
      const parts = node.name.split(".");
      if (parts.length > 1) {
        setRenameValue(parts.slice(0, -1).join("."));
      } else {
        setRenameValue(node.name);
      }
    } else {
      setRenameValue(node.name);
    }
  }

  const handleRenameCancel = () => {
    setRenamingId(null)
    setRenameValue("")
  }

  const handleRenameSubmit = async (node: FileTreeNode) => {
    let finalName = renameValue.trim();
    if (!finalName) {
      handleRenameCancel();
      return;
    }

    if (node.type === "file") {
      const parts = node.name.split(".");
      if (parts.length > 1) {
        const extension = parts[parts.length - 1];
        finalName = `${finalName}.${extension}`;
      }
    }

    if (finalName === node.name) {
      handleRenameCancel()
      return
    }

    setIsRenaming(true)
    try {
      await onRename(
        node.id, 
        finalName,
        node.type,
        node.batchId,
        node.path
      )
      handleRenameCancel()
    } catch (error) {
      console.error("Rename failed:", error)
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDeleteClick = async (node: FileTreeNode, isFolder: boolean) => {
    const fileIds = isFolder ? collectFileIds(node) : [node.id]
    const confirmed = await confirm({
      title: isFolder ? "Delete folder?" : "Delete file?",
      message: isFolder 
        ? `Are you sure you want to delete the folder "${node.name}" and all its contents? This cannot be undone.`
        : `Are you sure you want to delete "${node.name}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    })

    if (confirmed) {
      onDelete(fileIds.length === 1 ? fileIds[0] : fileIds)
    }
  }

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const collectFileIds = (node: FileTreeNode): string[] => {
    if (node.type === "file") {
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
    if (!selectedId) {return false;}
    if (node.type === "file") {return node.id === selectedId;}
    if (node.children) {
      return node.children.some(child => containsSelectedFile(child, selectedId));
    }
    return false;
  };

  // Auto-expand folders containing the selected file
  React.useEffect(() => {
    if (selectedFileId && nodes.length > 0) {
      const foldersToExpand = new Set<string>()
      const findAndExpand = (items: FileTreeNode[]): boolean => {
        let found = false
        for (const item of items) {
          if (item.id === selectedFileId) {
            found = true
          } else if (item.children) {
            if (findAndExpand(item.children)) {
              foldersToExpand.add(item.path)
              found = true
            }
          }
        }
        return found
      }
      
      if (findAndExpand(nodes)) {
        setExpandedFolders(prev => {
          const combined = new Set(prev)
          foldersToExpand.forEach(path => combined.add(path))
          return combined.size === prev.size ? prev : combined
        })
      }
    }
  }, [selectedFileId, nodes]);

  const getFileIcon = (fileName: string, mimeType?: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    if (mimeType?.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) {
      return <ImageIcon className="h-3.5 w-3.5 text-blue-400 group-hover:text-blue-300 transition-colors" />
    }
    if (ext === "pdf") {
      return <FileText className="h-3.5 w-3.5 text-red-400 group-hover:text-red-300 transition-colors" />
    }
    if (ext === "md") {
      return <FileText className="h-3.5 w-3.5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
    }
    return <FileText className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
  }

  return (
    <div className="flex flex-col">
      {nodes.map((node) => {
        const isExpanded = expandedFolders.has(node.path)
        const isSelected = selectedFileId === node.id
        const isFolderActive = containsSelectedFile(node, selectedFileId)
        const isCurrentlyRenaming = renamingId === node.id
        const isGridMode = folderGridModes.has(node.path)

        if (node.type === "folder") {
          const folderFileIds = collectFileIds(node);
          const isDefaultFolder = node.id.startsWith("folder-no-batch") || 
            folderFileIds.some(id => id.startsWith("default-"));

          return (
            <div key={node.id} className="flex flex-col group/folder">
              <div
                className={cn(
                  "flex items-center justify-between hover:bg-white/5 transition-all text-slate-400 hover:text-slate-100",
                  isFolderActive && "text-slate-100 bg-white/[0.03] border-l-2 border-amber-500/70",
                  level > 0 && `ml-${level * 2}`
                )}
                style={{ paddingLeft: `${(level + 1) * 1}rem` }}
              >
                {isCurrentlyRenaming ? (
                  <div className="flex-1 flex items-center gap-2 py-1.5 h-8">
                    <Folder className="h-4 w-4 text-amber-500/80 shrink-0" />
                    <input
                      autoFocus
                      className="flex-1 bg-slate-900 border border-amber-500/50 rounded px-1.5 py-0.5 text-sm text-slate-100 outline-none focus:border-amber-500 transition-all font-medium"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {handleRenameSubmit(node);}
                        if (e.key === "Escape") {handleRenameCancel();}
                      }}
                      onBlur={() => {
                        if (!isRenaming) {handleRenameSubmit(node);}
                      }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => toggleFolder(node.path)}
                    className="flex-1 flex items-center gap-2 py-1.5 text-sm text-left truncate"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    <Folder className={cn("h-4 w-4", isDefaultFolder ? "text-amber-500/50" : "text-amber-500/80")} />
                    <span className={cn("truncate", isDefaultFolder && "opacity-80 italic")}>{node.name}</span>
                    {isDefaultFolder && <Lock className="h-2.5 w-2.5 ml-1 opacity-40" />}
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
                           "h-4 w-4 rounded-md border transition-all duration-300 flex items-center justify-center cursor-pointer",
                           folderFileIds.every(id => selectedIds.has(id))
                             ? "bg-primary border-primary/50 shadow-[0_0_10px_-2px_rgba(var(--primary),0.3)] scale-110"
                             : "bg-slate-950 border-white/10 hover:border-primary/50"
                         )}
                       >
                         {folderFileIds.every(id => selectedIds.has(id)) && (
                           <Check className="h-3 w-3 text-slate-950 stroke-[4]" />
                         )}
                       </div>
                    </div>
                  )}
                  {!isCurrentlyRenaming && (
                    <div className="opacity-0 group-hover/folder:opacity-100 flex items-center px-1 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-100">
                          <DropdownMenuItem 
                            onClick={() => toggleFolderGridMode(node.path)}
                            className="gap-2 text-xs"
                          >
                            {isGridMode ? <List className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
                            {isGridMode ? "View as List" : "View as Grid"}
                          </DropdownMenuItem>
                          {!isDefaultFolder && (
                            <DropdownMenuItem 
                              onClick={() => handleRenameStart(node)}
                              className="gap-2 text-xs"
                            >
                              <PencilLine className="h-3.5 w-3.5" /> Rename Folder
                            </DropdownMenuItem>
                          )}
                          {!isDefaultFolder && folderFileIds.length > 0 && level === 0 && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(node, true)}
                              className="gap-2 text-xs text-red-400 focus:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete Project
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => toggleFolder(node.path)} className="gap-2 text-xs">
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            {isExpanded ? "Collapse" : "Expand"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>
              {isExpanded && node.children && (
                <div className={cn(
                  "transition-all duration-300",
                  isGridMode ? "p-2 pl-6 grid grid-cols-2 gap-2" : "flex flex-col"
                )}>
                  {isGridMode ? (
                    node.children.map(child => {
                      const isImg = child.type === 'file' && (child.file?.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(child.name));
                      const isChildSelected = selectedFileId === child.id;

                      return (
                        <button
                          key={child.id}
                          onClick={() => onFileSelect(child)}
                          className={cn(
                            "aspect-square rounded-lg border flex flex-col items-center justify-center p-1.5 transition-all group/grid overflow-hidden relative",
                            isChildSelected 
                              ? "bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/20 shadow-lg shadow-amber-500/10" 
                              : "bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-800/80"
                          )}
                          title={child.name}
                        >
                          {isImg && child.file?.url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img 
                              src={child.file.url} 
                              alt={child.name}
                              className="w-full h-full object-cover rounded shadow-sm group-hover/grid:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 opacity-60 group-hover/grid:opacity-100 transition-opacity">
                              {child.type === 'folder' ? <Folder className="h-6 w-6 text-amber-500/80" /> : getFileIcon(child.name, child.file?.mimeType)}
                              <span className="text-[8px] truncate max-w-full font-medium text-slate-400 px-1">{child.name}</span>
                            </div>
                          )}
                          {isChildSelected && (
                            <div className="absolute inset-0 border-2 border-amber-500 rounded-lg pointer-events-none" />
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
                      onToggleSelection={onToggleSelection}
                    />
                  )}
                </div>
              )}
            </div>
          )
        }

        return (
          <div
            key={node.id}
            className={cn(
              "group flex items-center justify-between hover:bg-white/5 transition-all text-slate-400",
              isSelected 
                ? "bg-white/10 text-white border-l-2 border-emerald-500 shadow-[inset_4px_0_12px_-4px_rgba(16,185,129,0.1)]" 
                : "hover:text-slate-100"
            )}
            style={{ paddingLeft: `${(level + 1.5) * 1}rem` }}
          >
            {isCurrentlyRenaming ? (
               <div className="flex-1 flex items-center gap-2 py-1.5 h-8">
                {getFileIcon(node.name, node.file?.mimeType)}
                <input
                  autoFocus
                  className="flex-1 bg-slate-900 border border-emerald-500/50 rounded px-1.5 py-0.5 text-sm text-slate-100 outline-none focus:border-emerald-500 transition-all font-medium"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {handleRenameSubmit(node);}
                    if (e.key === "Escape") {handleRenameCancel();}
                  }}
                  onBlur={() => {
                    if (!isRenaming) {handleRenameSubmit(node);}
                  }}
                />
              </div>
            ) : (
              <button
                onClick={() => onFileSelect(node)}
                className="flex-1 flex items-center gap-2 py-1.5 text-sm text-left truncate"
              >
                {getFileIcon(node.name, node.file?.mimeType)}
                <span className={cn("truncate", node.id.startsWith("default-") && "opacity-80 italic")}>{node.name}</span>
                {node.id.startsWith("default-") && <Lock className="h-2.5 w-2.5 ml-1 opacity-40 text-emerald-500/50" />}
              </button>
            )}
            <div className="flex items-center gap-1">
              {isSelectionMode && !node.id.startsWith("default-") && level === 0 && (
                <div className="flex items-center px-2">
                   <div 
                     onClick={(e) => {
                       e.stopPropagation();
                       if (onToggleSelection) {
                         onToggleSelection(node.id);
                       }
                     }}
                     className={cn(
                       "h-4 w-4 rounded-md border transition-all duration-300 flex items-center justify-center cursor-pointer",
                       selectedIds.has(node.id)
                         ? "bg-primary border-primary/50 shadow-[0_0_10px_-2px_rgba(var(--primary),0.3)] scale-110"
                         : "bg-slate-950 border-white/10 hover:border-primary/50"
                     )}
                   >
                     {selectedIds.has(node.id) && (
                       <Check className="h-3 w-3 text-slate-950 stroke-[4]" />
                     )}
                   </div>
                </div>
              )}
              {!isCurrentlyRenaming && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center px-1 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-100">
                      <DropdownMenuItem onClick={() => onFileSelect(node)} className="gap-2 text-xs">
                        <ExternalLink className="h-3.5 w-3.5" /> Open
                      </DropdownMenuItem>
                      {!node.id.startsWith("default-") && (
                        <DropdownMenuItem 
                          onClick={() => handleRenameStart(node)}
                          className="gap-2 text-xs"
                        >
                          <PencilLine className="h-3.5 w-3.5" /> Rename
                        </DropdownMenuItem>
                      )}
                      {!node.id.startsWith("default-") && level === 0 && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(node, false)}
                          className="gap-2 text-xs text-red-400 focus:text-red-400"
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
        )
      })}
    </div>
  )
}
