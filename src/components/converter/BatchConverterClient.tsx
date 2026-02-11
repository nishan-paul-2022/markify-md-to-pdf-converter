'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Layers, 
  ArrowLeft, 
  Upload, 
  FolderOpen, 
  FileArchive, 
  Search,
  Settings2,
  Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserNav from '@/components/auth/UserNav';

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface BatchConverterClientProps {
  user: User;
}

export default function BatchConverterClient({ user }: BatchConverterClientProps): React.JSX.Element {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <main className="h-dvh w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative selection:bg-blue-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      </div>

      {/* Header */}
      <header className="relative z-10 h-16 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/converter')}
            className="h-9 w-9 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="h-8 w-[1px] bg-white/5" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shadow-inner">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white uppercase tracking-[0.1em]">Batch Processing</h1>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Bulk PDF Conversion Library</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="Search batches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/50 border border-white/5 rounded-full py-2 pl-10 pr-4 text-xs w-64 focus:outline-none focus:border-blue-500/50 focus:bg-slate-900 transition-all placeholder:text-slate-600"
            />
          </div>
          <div className="h-4 w-[1px] bg-white/5 hidden md:block" />
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-500 hover:text-white hover:bg-white/5">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-500 hover:text-white hover:bg-white/5">
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex-grow overflow-hidden flex flex-col md:flex-row p-6 gap-6">
        
        {/* Left Panel: Upload Controls */}
        <aside className="w-full md:w-80 flex flex-col gap-6 shrink-0">
          <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 backdrop-blur-sm flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4 px-1">Upload Options</h2>
              <div className="flex flex-col gap-3">
                <Button className="h-14 bg-white text-slate-950 hover:bg-slate-200 rounded-2xl flex items-center justify-start px-5 gap-4 shadow-xl shadow-blue-500/10 group/btn transition-all active:scale-[0.98]">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-wider leading-none mb-1">Upload Files</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select multiple .md files</p>
                  </div>
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-28 flex-col border-white/5 bg-slate-900/50 hover:bg-slate-800 hover:border-amber-500/30 rounded-2xl gap-3 transition-all group/upload relative overflow-hidden">
                    <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover/upload:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 group-hover/upload:scale-110 transition-transform relative z-10">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div className="text-center relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Folder</p>
                      <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tight">Project Upload</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-28 flex-col border-white/5 bg-slate-900/50 hover:bg-slate-800 hover:border-blue-500/30 rounded-2xl gap-3 transition-all group/upload relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/upload:opacity-100 transition-opacity" />
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover/upload:scale-110 transition-transform relative z-10">
                      <FileArchive className="w-5 h-5" />
                    </div>
                    <div className="text-center relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Zip</p>
                      <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tight">Archive Upload</p>
                    </div>
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4 px-1">Information</h2>
              <div className="space-y-4 px-1">
                <div className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Batch processing allows you to convert multiple Markdown files to PDF simultaneously.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Supports folder structure and localized assets (images/ subfolders).</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Panel: Batch Library List */}
        <section className="flex-grow flex flex-col gap-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Library & Projects</h2>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
               <span>Sort by: Date</span>
               <div className="h-3 w-[1px] bg-white/10" />
               <span>View: Grid</span>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-20">
              
              {/* Empty State Placeholder (for now) */}
              <div className="col-span-full h-[400px] border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 group hover:border-white/10 transition-colors">
                <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center border border-white/5 shadow-inner relative overflow-hidden">
                   <div className="absolute inset-0 bg-blue-500/5 blur-xl animate-pulse" />
                   <Upload className="w-8 h-8 text-slate-600 group-hover:text-blue-400 transition-colors relative z-10" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">No batches found</h3>
                  <p className="text-xs text-slate-500 font-medium">Upload a project folder or select files to get started</p>
                </div>
                <Button variant="outline" className="rounded-full border-white/10 hover:bg-white/5 px-8 text-xs font-bold uppercase tracking-widest">
                  Browse Files
                </Button>
              </div>

            </div>
          </div>
        </section>

      </div>
      
      {/* Absolute User Nav (Bottom Right) */}
      <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-[60] flex items-center gap-3">
           <UserNav user={user} />
      </div>
    </main>
  );
}
