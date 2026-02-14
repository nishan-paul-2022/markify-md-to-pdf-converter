import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import UserNav from '@/features/auth/components/user-nav';

import { FileCode, Search, X } from 'lucide-react';

interface ConverterHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

/**
 * Guideline 7: Composition Over Inheritance
 * Top header for the Converter application.
 */
export const ConverterHeader: React.FC<ConverterHeaderProps> = ({
  user,
  searchQuery,
  onSearchChange,
}) => {
  const router = useRouter();

  return (
    <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/50 px-6 backdrop-blur-xl">
      <div
        className="group/logo flex w-[280px] cursor-pointer items-center gap-4"
        onClick={() => router.push('/')}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center transition-transform group-hover/logo:scale-110">
            <Image
              src="/brand-logo.svg"
              alt="Markify"
              width={32}
              height={32}
              priority
              className="drop-shadow-xl"
            />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-[0.05em] tracking-tight text-white transition-colors group-hover/logo:text-blue-400">
              Markify
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <div className="group relative hidden lg:block">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400" />
          <input
            type="text"
            placeholder="Search file"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-56 rounded-full border border-white/5 bg-white/5 pr-9 pl-9 text-[10px] font-black tracking-[0.2em] text-slate-400 transition-all placeholder:text-slate-600 focus:w-80 focus:border-blue-500/30 focus:bg-blue-500/5 focus:text-blue-100 focus:outline-none lg:focus:w-96"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <Button
          variant="ghost"
          onClick={() => router.push('/editor')}
          className="group flex h-9 cursor-pointer items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-white active:scale-95"
        >
          <FileCode className="h-3.5 w-3.5 transition-all duration-300 group-hover:scale-110 group-hover:text-blue-400" />
          <span>Editor</span>
        </Button>

        <UserNav user={user} />
      </div>
    </header>
  );
};
