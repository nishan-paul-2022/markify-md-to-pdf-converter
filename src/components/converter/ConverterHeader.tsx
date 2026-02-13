import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import UserNav from '@/components/auth/UserNav';
import { Button } from '@/components/ui/button';

import { FileCode,Search } from 'lucide-react';

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
    <header className="relative z-10 h-16 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
      <div
        className="flex items-center gap-4 w-[280px] cursor-pointer group/logo"
        onClick={() => router.push('/')}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover/logo:scale-110">
            <Image src="/brand-logo.svg" alt="Markify" width={32} height={32} priority className="drop-shadow-xl" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-tight text-white tracking-[0.05em] group-hover/logo:text-blue-400 transition-colors">Markify</h1>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        <div className="relative group hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input
            type="text"
            placeholder="SEARCH"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-56 bg-white/5 border border-white/5 rounded-full pl-9 pr-4 text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30 focus:bg-blue-500/5 focus:text-blue-100 transition-all"
          />
        </div>

        <Button
          variant="ghost"
          onClick={() => router.push('/editor')}
          className="h-9 px-4 bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-all group flex items-center gap-2"
        >
          <FileCode className="w-3.5 h-3.5 group-hover:text-blue-400 transition-colors" />
          <span>Editor</span>
        </Button>

        <UserNav user={user} />
      </div>
    </header>
  );
};
