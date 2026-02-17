'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logger } from '@/lib/logger';

import { Loader2, LogOut, Trash2 } from 'lucide-react';

interface UserNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function UserNav({ user }: UserNavProps): React.JSX.Element {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      });

      if (response.ok) {
        // Redirect to landing page and sign out
        await signOut({ callbackUrl: '/' });
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete account');
        setIsDeleting(false);
      }
    } catch (error) {
      logger.error('Error deleting account:', error);
      alert('An unexpected error occurred');
      setIsDeleting(false);
    }
  };

  const initials =
    user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() ||
    user.email?.[0].toUpperCase() ||
    'U';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="group relative h-10 w-10 overflow-hidden rounded-full border border-white/10 shadow-lg transition-all hover:border-white/20"
          >
            <Avatar className="h-10 w-10 transition-transform group-hover:scale-110">
              <AvatarImage src={user.image || ''} alt={user.name || ''} />
              <AvatarFallback className="bg-slate-900 text-slate-100">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="animate-in zoom-in-95 mt-2 w-64 border-white/10 bg-slate-950 p-2 shadow-2xl duration-200"
          align="end"
          forceMount
        >
          <DropdownMenuLabel className="px-3 py-3 font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <p className="text-sm leading-none font-bold text-white">{user.name}</p>
              </div>
              <p className="ml-4 text-xs leading-none font-medium text-slate-400">{user.email}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="mx-1 bg-white/5" />
          <div className="p-1">
            <DropdownMenuItem
              className="cursor-pointer rounded-lg px-3 py-3 text-slate-300 transition-colors focus:bg-white/5 focus:text-white"
              onClick={async () => {
                await signOut({ callbackUrl: '/' });
              }}
            >
              <LogOut className="mr-3 h-4 w-4 text-slate-500" />
              <span className="text-xs font-black tracking-[0.15em] uppercase">Log out</span>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="mx-1 bg-white/5" />
          <div className="p-1">
            <DropdownMenuItem
              className="group cursor-pointer rounded-lg px-3 py-3 text-red-500/60 transition-colors focus:bg-red-600 focus:text-white"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="mr-3 h-4 w-4 text-red-500/40 transition-colors group-focus:text-white" />
              <span className="text-xs font-black tracking-[0.15em] uppercase">Delete account</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="border-white/10 bg-slate-950">
          <AlertDialogHeader className="p-6">
            <AlertDialogTitle className="flex items-center gap-2 font-black tracking-widest text-red-500 uppercase">
              <Trash2 className="h-5 w-5" />
              Delete Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 font-medium text-slate-400">
              This action cannot be undone. This will permanently delete your account, all uploaded
              files, and all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-center gap-4 bg-white/5 p-6 sm:justify-center">
            <AlertDialogCancel className="h-11 w-36 rounded-xl border-white/10 bg-transparent text-[10px] font-black tracking-widest text-slate-400 uppercase hover:bg-white/5 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteAccount();
              }}
              disabled={isDeleting}
              className="flex h-11 w-36 items-center justify-center gap-2 rounded-xl border-none bg-red-600 text-[10px] font-black tracking-widest text-white uppercase hover:bg-red-500"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
