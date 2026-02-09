"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react"
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
          className="sm:max-w-[400px]"
        >
          <AlertDialogHeader>
            {title ? (
              <AlertDialogTitle className={cn(
                "flex items-center gap-2",
                variant === "warning" && "text-amber-500",
                variant === "info" && "text-blue-500",
                variant === "destructive" && "text-red-500"
              )}>
                {variant === "warning" && <AlertTriangle className="h-5 w-5" />}
                {variant === "info" && <Info className="h-5 w-5" />}
                {variant === "destructive" && <AlertTriangle className="h-5 w-5" />}
                {variant === "default" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                {title}
              </AlertDialogTitle>
            ) : null}
            <AlertDialogDescription
              className={cn(
                "text-slate-300",
                !title && "text-foreground font-medium"
              )}
            >
              {message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={cn(
            isConfirm ? "sm:justify-end" : "sm:justify-center"
          )}>
            {isConfirm && (
              <AlertDialogCancel onClick={handleCancel}>
                {cancelText}
              </AlertDialogCancel>
            )}
            <AlertDialogAction 
              onClick={handleAction}
              className={cn(
                variant === "warning" && "bg-amber-600 hover:bg-amber-700",
                variant === "info" && "bg-blue-600 hover:bg-blue-700"
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
