"use client"

import { signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut } from "lucide-react"

interface UserNavProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function UserNav({ user }: UserNavProps): React.JSX.Element {
  const pathname = usePathname()
  const isEditor = pathname?.startsWith("/editor")

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user.email?.[0].toUpperCase() || "U"

  return (
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
        <DropdownMenuItem
          className="py-3 px-3 rounded-lg focus:bg-red-500/10 text-red-500/80 focus:text-red-500 cursor-pointer transition-colors"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="text-xs font-black uppercase tracking-[0.15em]">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
