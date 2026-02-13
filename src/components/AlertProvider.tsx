"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
export type AlertOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "warning" | "destructive" | "info"
}

type AlertApi = {
  show: (messageOrOptions: string | AlertOptions) => void
  confirm: (options: AlertOptions) => Promise<boolean>
}

const AlertContext = createContext<AlertApi | null>(null)

let globalAlertRef: AlertApi | null = null

export function getAlert(): AlertApi | null {
  return globalAlertRef
}

export function useAlert(): AlertApi {
  const api = useContext(AlertContext)
  if (!api) {
    return {
      show: (msg) => {
        if (typeof window !== "undefined") {
          window.alert(typeof msg === "string" ? msg : msg.message)
        }
      },
      confirm: async (options) => {
        if (typeof window !== "undefined") {
          return window.confirm(options.message)
        }
        return false
      }
    }
  }
  return api
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [confirmText, setConfirmText] = useState("OK")
  const [cancelText, setCancelText] = useState("Cancel")
  const [variant, setVariant] = useState<AlertOptions["variant"]>("default")
  const [isConfirm, setIsConfirm] = useState(false)
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null)

  const show = useCallback((messageOrOptions: string | AlertOptions) => {
    setIsConfirm(false)
    if (typeof messageOrOptions === "string") {
      setTitle("")
      setMessage(messageOrOptions)
      setConfirmText("OK")
      setVariant("default")
    } else {
      setTitle(messageOrOptions.title ?? "")
      setMessage(messageOrOptions.message)
      setConfirmText(messageOrOptions.confirmText ?? "OK")
      setVariant(messageOrOptions.variant ?? "default")
    }
    setOpen(true)
  }, [])

  const confirm = useCallback((options: AlertOptions) => {
    setIsConfirm(true)
    setTitle(options.title ?? "Confirm Action")
    setMessage(options.message)
    setConfirmText(options.confirmText ?? "Continue")
    setCancelText(options.cancelText ?? "Cancel")
    setVariant(options.variant ?? "default")
    setOpen(true)

    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve)
    })
  }, [])

  const handleAction = useCallback(() => {
    setOpen(false)
    if (resolveRef) {
      resolveRef(true)
      setResolveRef(null)
    }
  }, [resolveRef])

  const handleCancel = useCallback(() => {
    setOpen(false)
    if (resolveRef) {
      resolveRef(false)
      setResolveRef(null)
    }
  }, [resolveRef])

  const api: AlertApi = React.useMemo(() => ({ show, confirm }), [show, confirm])

  useEffect(() => {
    globalAlertRef = api
    return () => {
      globalAlertRef = null
    }
  }, [api])

  return (
    <AlertContext.Provider value={api}>
      {children}
      <AlertDialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel()
        }
      }}>
        <AlertDialogContent
          variant={variant === "destructive" ? "destructive" : "default"}
          className="w-fit sm:max-w-none bg-slate-900/95 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden p-0 gap-0"
        >
          <div className="relative p-6 sm:p-8 min-w-[320px]">
            {/* Background Decoration */}
            <div className={cn(
              "absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20",
              variant === "destructive" ? "bg-red-500/20" : 
              variant === "warning" ? "bg-amber-500/20" : 
              variant === "info" ? "bg-blue-500/20" : "bg-emerald-500/20"
            )} />

            <button 
              onClick={handleCancel}
              className="absolute top-2 right-2 p-4 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all z-10 cursor-pointer group"
              aria-label="Close"
            >
              <X className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </button>

            <AlertDialogHeader className="relative z-10">
              {title ? (
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "p-2.5 rounded-xl bg-opacity-10 shadow-inner",
                    variant === "warning" && "bg-amber-500/10 text-amber-500",
                    variant === "info" && "bg-blue-500/10 text-blue-500",
                    variant === "destructive" && "bg-red-500/10 text-red-500",
                    variant === "default" && "bg-emerald-500/10 text-emerald-500"
                  )}>
                    {variant === "warning" && <AlertTriangle className="h-6 w-6" />}
                    {variant === "info" && <Info className="h-6 w-6" />}
                    {variant === "destructive" && <AlertTriangle className="h-6 w-6" />}
                    {variant === "default" && <CheckCircle2 className="h-6 w-6" />}
                  </div>
                  <AlertDialogTitle className="text-xl font-bold text-white tracking-tight">
                    {title}
                  </AlertDialogTitle>
                </div>
              ) : null}
              
              <AlertDialogDescription
                className={cn(
                  "text-slate-300 leading-relaxed mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 relative z-10",
                  !title && "text-foreground font-medium"
                )}
                asChild
              >
                <div className="flex items-center whitespace-nowrap">
                  <p className="text-xs sm:text-sm text-slate-300 font-medium leading-normal tracking-wide italic whitespace-nowrap">
                    {message.split(/(\.md|images\/|`.+?`)/).map((part, i) => {
                      const isHighlighted = part === ".md" || part === "images/" || (part.startsWith('`') && part.endsWith('`'));
                      const cleanPart = (part.startsWith('`') && part.endsWith('`')) ? part.slice(1, -1) : part;
                      
                      return isHighlighted ? (
                        <span key={i} className="text-blue-400 font-mono font-bold not-italic mx-0.5">
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

          <AlertDialogFooter className="p-6 pt-2 sm:flex-row gap-3 relative z-10 bg-white/[0.01]">
            {isConfirm && (
              <AlertDialogCancel onClick={handleCancel} className="sm:flex-1 h-10 bg-transparent border-none text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
                {cancelText}
              </AlertDialogCancel>
            )}
            <AlertDialogAction 
              onClick={handleAction}
              className={cn(
                "sm:flex-1 h-10 rounded-lg text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-lg",
                variant === "warning" && "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20",
                variant === "info" && "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20",
                variant === "destructive" && "bg-red-600 hover:bg-red-500 text-white shadow-red-900/20",
                variant === "default" && "bg-slate-100 text-slate-950 hover:bg-white shadow-slate-950/20"
              )}
            >
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AlertContext.Provider>
  )
}
