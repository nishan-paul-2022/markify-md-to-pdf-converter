"use client"

import React from "react"
import { 
  FileText, 
  FolderOpen, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2,
  X,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface UploadRulesModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  type: "file" | "folder" | "zip"
}

export function UploadRulesModal({
  isOpen,
  onClose,
  onConfirm,
  type
}: UploadRulesModalProps) {
  const isFile = type === "file"

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="w-fit sm:max-w-none max-w-[95vw] bg-slate-900/95 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden p-0 gap-0">
        <div className="relative p-6 sm:p-8">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 p-4 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all z-10 cursor-pointer group"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>

          <AlertDialogHeader className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "p-2.5 rounded-xl bg-opacity-10 shadow-inner",
                isFile ? "bg-blue-500/10 text-blue-400" : (type === "folder" ? "bg-amber-500/10 text-amber-400" : "bg-purple-500/10 text-purple-400")
              )}>
                {isFile ? <FileText className="h-6 w-6" /> : (type === "folder" ? <FolderOpen className="h-6 w-6" /> : <FileText className="h-6 w-6" />)}
              </div>
              <div>
                <AlertDialogTitle className="text-xl font-bold text-white tracking-tight">
                  {isFile ? "File Upload Rules" : (type === "folder" ? "Folder Upload Rules" : "Zip Upload Rules")}
                </AlertDialogTitle>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="mt-8 space-y-4 relative z-10">
            {isFile ? (
                <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Markdown Files</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed whitespace-nowrap">
                    Upload one or more <span className="text-emerald-400 font-mono font-bold">.md</span> files at a time.
                  </p>
                </div>
              </div>
            ) : type === "zip" ? (
              <>
                <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Archive Formats</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed whitespace-nowrap">
                      Supports <span className="text-emerald-400 font-mono font-bold">.zip</span>, <span className="text-emerald-400 font-mono font-bold">.7z</span>, <span className="text-emerald-400 font-mono font-bold">.rar</span>, and <span className="text-emerald-400 font-mono font-bold">.tar</span> formats.
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Direct Files</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed whitespace-nowrap">
                      ZIP can contain one or more <span className="text-emerald-400 font-mono font-bold">.md</span> files directly.
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Folder Structure</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed whitespace-nowrap">
                      ZIP can contain folders with <span className="text-emerald-400 font-mono font-bold">.md</span> + optional <span className="text-blue-400 font-mono font-bold">images/</span> subfolder.
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-4 p-4 rounded-2xl bg-amber-500/[0.02] border border-amber-500/10 hover:border-amber-500/20 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Required Content</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed whitespace-nowrap">
                      At least one <span className="text-emerald-400 font-mono font-bold">.md</span> file must exist (direct or in folder).
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-4 p-4 rounded-2xl bg-red-500/[0.02] border border-red-500/10 hover:border-red-500/20 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:scale-110 transition-transform">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Strict Validation</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed whitespace-nowrap">
                      Only <span className="text-blue-400 font-mono font-bold">images/</span> subfolder allowed. Extra folders will fail validation.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Markdown Files</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed whitespace-nowrap">
                      Folder must contain one or more <span className="text-emerald-400 font-mono font-bold">.md</span> files.
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Assets Hierarchy</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed whitespace-nowrap">
                       Store referenced images in an <span className="text-blue-400 font-mono font-bold">images/</span> subfolder.
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-4 p-4 rounded-2xl bg-red-500/[0.02] border border-red-500/10 hover:border-red-500/20 transition-all duration-300">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:scale-110 transition-transform">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Strict Validation</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed whitespace-nowrap">
                      Extra subfolders or files will fail validation.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <AlertDialogFooter className="p-6 pt-2 sm:flex-row gap-3">
          <AlertDialogCancel onClick={onClose} className="sm:flex-1 h-10 bg-transparent border-none text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={cn(
              "sm:flex-1 h-10 rounded-lg text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300",
              "bg-slate-100 text-slate-950 hover:bg-white active:scale-[0.98] shadow-sm"
            )}
          >
            Upload
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
