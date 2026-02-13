'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
export interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'warning' | 'destructive' | 'info';
}

interface AlertApi {
  show: (messageOrOptions: string | AlertOptions) => void;
  confirm: (options: AlertOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertApi | null>(null);

let globalAlertRef: AlertApi | null = null;

export function getAlert(): AlertApi | null {
  return globalAlertRef;
}

export function useAlert(): AlertApi {
  const api = useContext(AlertContext);
  if (!api) {
    return {
      show: (msg) => {
        if (typeof window !== 'undefined') {
          window.alert(typeof msg === 'string' ? msg : msg.message);
        }
      },
      confirm: async (options) => {
        if (typeof window !== 'undefined') {
          return window.confirm(options.message);
        }
        return false;
      },
    };
  }
  return api;
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [confirmText, setConfirmText] = useState('OK');
  const [cancelText, setCancelText] = useState('Cancel');
  const [variant, setVariant] = useState<AlertOptions['variant']>('default');
  const [isConfirm, setIsConfirm] = useState(false);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const show = useCallback((messageOrOptions: string | AlertOptions) => {
    setIsConfirm(false);
    if (typeof messageOrOptions === 'string') {
      setTitle('');
      setMessage(messageOrOptions);
      setConfirmText('OK');
      setVariant('default');
    } else {
      setTitle(messageOrOptions.title ?? '');
      setMessage(messageOrOptions.message);
      setConfirmText(messageOrOptions.confirmText ?? 'OK');
      setVariant(messageOrOptions.variant ?? 'default');
    }
    setOpen(true);
  }, []);

  const confirm = useCallback((options: AlertOptions) => {
    setIsConfirm(true);
    setTitle(options.title ?? 'Confirm Action');
    setMessage(options.message);
    setConfirmText(options.confirmText ?? 'Continue');
    setCancelText(options.cancelText ?? 'Cancel');
    setVariant(options.variant ?? 'default');
    setOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleAction = useCallback(() => {
    setOpen(false);
    if (resolveRef) {
      resolveRef(true);
      setResolveRef(null);
    }
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    if (resolveRef) {
      resolveRef(false);
      setResolveRef(null);
    }
  }, [resolveRef]);

  const api: AlertApi = React.useMemo(() => ({ show, confirm }), [show, confirm]);

  useEffect(() => {
    globalAlertRef = api;
    return () => {
      globalAlertRef = null;
    };
  }, [api]);

  return (
    <AlertContext.Provider value={api}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCancel();
          }
        }}
      >
        <AlertDialogContent
          variant={variant === 'destructive' ? 'destructive' : 'default'}
          className="w-fit gap-0 overflow-hidden border-white/10 bg-slate-900/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-none"
        >
          <div className="relative min-w-[320px] p-6 sm:p-8">
            {/* Background Decoration */}
            <div
              className={cn(
                'pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full opacity-20 blur-3xl',
                variant === 'destructive'
                  ? 'bg-red-500/20'
                  : variant === 'warning'
                    ? 'bg-amber-500/20'
                    : variant === 'info'
                      ? 'bg-blue-500/20'
                      : 'bg-emerald-500/20',
              )}
            />

            <button
              onClick={handleCancel}
              className="group absolute top-2 right-2 z-10 cursor-pointer rounded-full p-4 text-slate-500 transition-all hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4 transition-transform group-hover:scale-110" />
            </button>

            <AlertDialogHeader className="relative z-10">
              {title ? (
                <div className="mb-2 flex items-center gap-3">
                  <div
                    className={cn(
                      'bg-opacity-10 rounded-xl p-2.5 shadow-inner',
                      variant === 'warning' && 'bg-amber-500/10 text-amber-500',
                      variant === 'info' && 'bg-blue-500/10 text-blue-500',
                      variant === 'destructive' && 'bg-red-500/10 text-red-500',
                      variant === 'default' && 'bg-emerald-500/10 text-emerald-500',
                    )}
                  >
                    {variant === 'warning' && <AlertTriangle className="h-6 w-6" />}
                    {variant === 'info' && <Info className="h-6 w-6" />}
                    {variant === 'destructive' && <AlertTriangle className="h-6 w-6" />}
                    {variant === 'default' && <CheckCircle2 className="h-6 w-6" />}
                  </div>
                  <AlertDialogTitle className="text-xl font-bold tracking-tight text-white">
                    {title}
                  </AlertDialogTitle>
                </div>
              ) : null}

              <AlertDialogDescription
                className={cn(
                  'relative z-10 mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 leading-relaxed text-slate-300',
                  !title && 'text-foreground font-medium',
                )}
                asChild
              >
                <div className="flex items-center whitespace-nowrap">
                  <p className="text-xs leading-normal font-medium tracking-wide whitespace-nowrap text-slate-300 italic sm:text-sm">
                    {message.split(/(\.md|images\/|`.+?`)/).map((part, i) => {
                      const isHighlighted =
                        part === '.md' ||
                        part === 'images/' ||
                        (part.startsWith('`') && part.endsWith('`'));
                      const cleanPart =
                        part.startsWith('`') && part.endsWith('`') ? part.slice(1, -1) : part;

                      return isHighlighted ? (
                        <span
                          key={i}
                          className="mx-0.5 font-mono font-bold text-blue-400 not-italic"
                        >
                          {cleanPart}
                        </span>
                      ) : (
                        part
                      );
                    })}
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          <AlertDialogFooter className="relative z-10 gap-3 bg-white/[0.01] p-6 pt-2 sm:flex-row">
            {isConfirm && (
              <AlertDialogCancel
                onClick={handleCancel}
                className="h-10 rounded-lg border-none bg-transparent text-xs font-bold tracking-widest text-slate-500 uppercase transition-all hover:bg-white/5 hover:text-slate-200 sm:flex-1"
              >
                {cancelText}
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={handleAction}
              className={cn(
                'h-10 rounded-lg text-xs font-bold tracking-[0.15em] uppercase shadow-lg transition-all duration-300 sm:flex-1',
                variant === 'warning' &&
                  'bg-amber-600 text-white shadow-amber-900/20 hover:bg-amber-500',
                variant === 'info' && 'bg-blue-600 text-white shadow-blue-900/20 hover:bg-blue-500',
                variant === 'destructive' &&
                  'bg-red-600 text-white shadow-red-900/20 hover:bg-red-500',
                variant === 'default' &&
                  'bg-slate-100 text-slate-950 shadow-slate-950/20 hover:bg-white',
              )}
            >
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertContext.Provider>
  );
}
