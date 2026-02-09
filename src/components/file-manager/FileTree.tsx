"use client"

import React, { useState } from "react"
import { ChevronRight, ChevronDown, Folder, FileText, ImageIcon, MoreVertical, Trash2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { FileTreeNode } from "@/lib/file-tree"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FileTreeProps {
  nodes: FileTreeNode[];
  level?: number;
  onFileSelect: (node: FileTreeNode) => void;
  onDelete: (id: string | string[]) => void;
  selectedFileId?: string;
}

export function FileTree({
  nodes,
  level = 0,
  onFileSelect,
  onDelete,
  selectedFileId,
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

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

        if (node.type === "folder") {
          const folderFileIds = collectFileIds(node);
          const isDefaultFolder = node.id.startsWith("folder-no-batch") || 
            folderFileIds.some(id => id.startsWith("default-"));

          return (
            <div key={node.path} className="flex flex-col group/folder">
              <div
                className={cn(
                  "flex items-center justify-between hover:bg-white/5 transition-colors text-slate-400 hover:text-slate-100",
                  isFolderActive && "text-slate-100 bg-white/5 border-l-2 border-amber-500/50",
                  level > 0 && `ml-${level * 2}`
                )}
                style={{ paddingLeft: `${(level + 1) * 1}rem` }}
              >
                <button
                  onClick={() => toggleFolder(node.path)}
                  className="flex-1 flex items-center gap-2 py-1.5 text-sm text-left truncate"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  <Folder className="h-4 w-4 text-amber-500/80" />
                  <span className="truncate">{node.name}</span>
                </button>
                <div className="opacity-0 group-hover/folder:opacity-100 flex items-center px-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-100">
                      {!isDefaultFolder && folderFileIds.length > 0 && (
                        <DropdownMenuItem 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the folder "${node.name}" and all its contents?`)) {
                              onDelete(folderFileIds);
                            }
                          }} 
                          className="gap-2 text-xs text-red-400 focus:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete Folder
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => toggleFolder(node.path)} className="gap-2 text-xs">
                        {isExpanded ? "Collapse" : "Expand"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {isExpanded && node.children && (
                <FileTree
                  nodes={node.children}
                  level={level + 1}
                  onFileSelect={onFileSelect}
                  onDelete={onDelete}
                  selectedFileId={selectedFileId}
                />
              )}
            </div>
          )
        }

        return (
          <div
            key={node.id}
            className={cn(
              "group flex items-center justify-between hover:bg-white/5 transition-colors",
              isSelected ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-100"
            )}
            style={{ paddingLeft: `${(level + 1.5) * 1}rem` }}
          >
            <button
              onClick={() => onFileSelect(node)}
              className="flex-1 flex items-center gap-2 py-1.5 text-sm text-left truncate"
            >
              {getFileIcon(node.name, node.file?.mimeType)}
              <span className="truncate">{node.name}</span>
            </button>
            <div className="opacity-0 group-hover:opacity-100 flex items-center px-2">
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
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${node.name}"?`)) {
                          onDelete(node.id);
                        }
                      }} 
                      className="gap-2 text-xs text-red-400 focus:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )
      })}
    </div>
  )
}
