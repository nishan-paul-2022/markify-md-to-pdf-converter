"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
export type AlertOptions = {
  title?: string
  message: string
}

type AlertApi = {
  show: (messageOrOptions: string | AlertOptions) => void
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
    }
  }
  return api
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")

  const show = useCallback((messageOrOptions: string | AlertOptions) => {
    if (typeof messageOrOptions === "string") {
      setTitle("")
      setMessage(messageOrOptions)
    } else {
      setTitle(messageOrOptions.title ?? "")
      setMessage(messageOrOptions.message)
    }
    setOpen(true)
  }, [])

  const api: AlertApi = React.useMemo(() => ({ show }), [show])

  useEffect(() => {
    globalAlertRef = api
    return () => {
      globalAlertRef = null
    }
  }, [api])

  return (
    <AlertContext.Provider value={api}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent
          variant="default"
          className="sm:max-w-[380px]"
        >
          <AlertDialogHeader>
            {title ? (
              <AlertDialogTitle>{title}</AlertDialogTitle>
            ) : null}
            <AlertDialogDescription
              className={title ? "" : "text-foreground font-medium"}
            >
              {message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertContext.Provider>
  )
}
