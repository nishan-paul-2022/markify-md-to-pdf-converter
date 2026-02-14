'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/utils/cn';

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  X,
} from 'lucide-react';

interface UploadRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'file' | 'folder' | 'zip';
}

export function UploadRulesModal({ isOpen, onClose, onConfirm, type }: UploadRulesModalProps) {
  const isFile = type === 'file';

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="w-fit max-w-[95vw] gap-0 overflow-hidden border-white/10 bg-slate-900/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-none">
        <div className="relative p-6 sm:p-8">
          {/* Background Decoration */}
          <div className="bg-primary/5 pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full blur-3xl" />

          <button
            onClick={onClose}
            className="group absolute top-2 right-2 z-10 cursor-pointer rounded-full p-4 text-slate-500 transition-all hover:bg-white/5 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 transition-transform group-hover:scale-110" />
          </button>

          <AlertDialogHeader className="relative z-10">
            <div className="mb-2 flex items-center gap-3">
              <div
                className={cn(
                  'bg-opacity-10 rounded-xl p-2.5 shadow-inner',
                  isFile
                    ? 'bg-blue-500/10 text-blue-400'
                    : type === 'folder'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-purple-500/10 text-purple-400',
                )}
              >
                {isFile ? (
                  <FileText className="h-6 w-6" />
                ) : type === 'folder' ? (
                  <FolderOpen className="h-6 w-6" />
                ) : (
                  <FileText className="h-6 w-6" />
                )}
              </div>
              <div>
                <AlertDialogTitle className="text-xl font-bold tracking-tight text-white">
                  {isFile
                    ? 'File Upload Rules'
                    : type === 'folder'
                      ? 'Folder Upload Rules'
                      : 'Zip Upload Rules'}
                </AlertDialogTitle>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="relative z-10 mt-8 space-y-4">
            {isFile ? (
              <div className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/10">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 transition-transform group-hover:scale-110">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">Markdown Files</h4>
                  <p className="mt-1 text-xs leading-relaxed whitespace-nowrap text-slate-400">
                    Upload one or more{' '}
                    <span className="font-mono font-bold text-emerald-400">.md</span> files at a
                    time.
                  </p>
                </div>
              </div>
            ) : type === 'zip' ? (
              <>
                <div className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/10">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 transition-transform group-hover:scale-110">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Archive Support</h4>
                    <p className="mt-1 text-xs leading-relaxed whitespace-nowrap text-slate-400">
                      Upload one or more{' '}
                      <span className="font-mono font-bold text-emerald-400">.zip</span> archive
                      files at a time.
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/10">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 transition-transform group-hover:scale-110">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Markdown Requirements</h4>
                    <p className="mt-1 text-xs leading-relaxed whitespace-nowrap text-slate-400">
                      Archive must contain at least one{' '}
                      <span className="font-mono font-bold text-emerald-400">.md</span> file (at the
                      root or inside folders).
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/10">
                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400 transition-transform group-hover:scale-110">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Image Hierarchy</h4>
                    <p className="mt-1 text-xs leading-relaxed whitespace-nowrap text-slate-400">
                      If using folders, all referenced images must be stored in{' '}
                      <span className="font-mono font-bold text-blue-400">images/</span> subfolder.
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-4 rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-4 transition-all duration-300 hover:border-red-500/20">
                  <div className="rounded-lg bg-red-500/10 p-2 text-red-400 transition-transform group-hover:scale-110">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Strict Validation</h4>
                    <p className="mt-1 text-xs leading-relaxed whitespace-nowrap text-slate-400">
                      Extra subfolders or files will fail validation.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/10">
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 transition-transform group-hover:scale-110">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Markdown Files</h4>
                    <p className="mt-1 text-xs leading-relaxed whitespace-nowrap text-slate-400">
                      Folder must contain one or more{' '}
                      <span className="font-mono font-bold text-emerald-400">.md</span> files.
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/10">
                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400 transition-transform group-hover:scale-110">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Assets Hierarchy</h4>
                    <p className="mt-1 text-xs leading-relaxed whitespace-nowrap text-slate-400">
                      Store referenced images in an{' '}
                      <span className="font-mono font-bold text-blue-400">images/</span> subfolder.
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-4 rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-4 transition-all duration-300 hover:border-red-500/20">
                  <div className="rounded-lg bg-red-500/10 p-2 text-red-400 transition-transform group-hover:scale-110">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">Strict Validation</h4>
                    <p className="mt-1 text-xs leading-relaxed whitespace-nowrap text-slate-400">
                      Extra subfolders or files will fail validation.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <AlertDialogFooter className="gap-3 p-6 pt-2 sm:flex-row">
          <AlertDialogCancel
            onClick={onClose}
            className="h-10 rounded-lg border-none bg-transparent text-xs font-bold tracking-widest text-slate-500 uppercase transition-all hover:bg-white/5 hover:text-slate-200 sm:flex-1"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              'h-10 rounded-lg text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 sm:flex-1',
              'bg-slate-100 text-slate-950 shadow-sm hover:bg-white active:scale-[0.98]',
            )}
          >
            Upload
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
