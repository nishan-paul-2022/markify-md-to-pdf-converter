"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logger } from "@/lib/logger";

import { Loader2,LogOut, Trash2 } from "lucide-react";

interface UserNavProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function UserNav({ user }: UserNavProps): React.JSX.Element {
  const pathname = usePathname();
  const isEditor = pathname.startsWith("/editor");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
      });

      if (response.ok) {
        // Redirect to landing page and sign out
        await signOut({ callbackUrl: "/" });
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete account");
        setIsDeleting(false);
      }
    } catch (error) {
      logger.error("Error deleting account:", error);
      alert("An unexpected error occurred");
      setIsDeleting(false);
    }
  };

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user.email?.[0].toUpperCase() || "U";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-white/10 hover:border-white/20 transition-all overflow-hidden group shadow-lg">
            <Avatar className="h-10 w-10 transition-transform group-hover:scale-110">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback className="bg-slate-900 text-slate-100">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 mt-2 bg-slate-950/80 backdrop-blur-xl border-white/10 p-2 shadow-2xl animate-in zoom-in-95 duration-200" align="end" forceMount>
          <DropdownMenuLabel className="font-normal px-3 py-3">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-sm font-bold leading-none text-white">{user.name}</p>
              </div>
              <p className="text-xs leading-none text-slate-400 font-medium ml-4">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>

          {isEditor && (
            <>
              <DropdownMenuSeparator className="bg-white/5 mx-1" />
              <div className="py-1">
                <Link href="/">
                  <DropdownMenuItem className="py-3 px-3 rounded-lg focus:bg-blue-500/10 cursor-pointer group/item transition-all">
                    <div className="mr-3 w-5 h-5 flex items-center justify-center transition-transform group-hover/item:scale-110">
                      <Image src="/brand-logo.svg" alt="Markify" width={20} height={20} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.15em] text-slate-400 group-hover/item:text-blue-400 transition-colors">Markify</span>
                  </DropdownMenuItem>
                </Link>
              </div>
            </>
          )}

          <DropdownMenuSeparator className="bg-white/5 mx-1" />
          <div className="py-1">
            <DropdownMenuItem
              className="py-3 px-3 rounded-lg focus:bg-red-500/10 text-red-500/80 focus:text-red-500 cursor-pointer transition-colors"
              onClick={async () => { await signOut({ callbackUrl: "/" }); }}
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-[0.15em]">Log out</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="py-3 px-3 rounded-lg focus:bg-red-600/20 text-red-600/60 focus:text-red-500 cursor-pointer transition-colors mt-1"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="mr-3 h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-[0.15em]">Delete account</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-slate-950 border-white/10">
          <AlertDialogHeader className="p-6">
            <AlertDialogTitle className="text-red-500 font-black uppercase tracking-widest flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-medium pt-2">
              This action cannot be undone. This will permanently delete your account,
              all uploaded files, and all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="bg-white/5 p-6 flex flex-row justify-center sm:justify-center gap-4">
            <AlertDialogCancel className="bg-transparent border-white/10 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl uppercase text-[10px] font-black tracking-widest w-36 h-11">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteAccount();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-500 text-white border-none rounded-xl uppercase text-[10px] font-black tracking-widest flex items-center justify-center gap-2 w-36 h-11"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
