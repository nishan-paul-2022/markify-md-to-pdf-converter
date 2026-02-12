'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Layers, 
  Upload, 
  FolderOpen, 
  Search,
  Download,
  Loader2,
  FileDown,
  Zap,
  CheckCircle2,
  FileCode
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserNav from '@/components/auth/UserNav';
import { useFiles, File as AppFile } from '@/hooks/use-files';
import { cn } from '@/lib/utils';
import { generateStandardName, addTimestampToName } from '@/lib/utils/naming';
import { parseMetadataFromMarkdown, removeLandingPageSection } from '@/constants/default-content';
import {
  TooltipProvider,
} from "@/components/ui/tooltip";



interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ConverterClientProps {
  user: User;
}

interface BatchGroup {
  id: string;
  name: string;
  files: AppFile[];
  createdAt: string;
  isProject: boolean;
}

export default function ConverterClient({ user }: ConverterClientProps): React.JSX.Element {
  const router = useRouter();
  const { files, loading, refreshFiles } = useFiles('converter');
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);
  const zipInputRef = React.useRef<HTMLInputElement>(null);

  // Status and result management
  const [processingStates, setProcessingStates] = React.useState<Record<string, 'pending' | 'converting' | 'done' | 'error'>>({});
  const [convertedFiles, setConvertedFiles] = React.useState<Record<string, Blob>>({});
  const [batchProgress, setBatchProgress] = React.useState<Record<string, { current: number, total: number }>>({});

  // Grouping logic
  const batchGroups = React.useMemo(() => {
    const groups: Record<string, BatchGroup> = {};
    
    // Sort files by creation date first
    const sortedFiles = [...files].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    sortedFiles.forEach(file => {
      if (file.id.startsWith('default-') || file.batchId === 'sample-document' || file.batchId === 'sample-project') {
        return;
      }

      const batchId = file.batchId || 'ungrouped';
      if (!groups[batchId]) {
        // Determine a name for the batch
        let name = file.originalName;
        const isProject = !!file.relativePath && file.relativePath.includes('/');
        
        if (isProject && file.relativePath) {
          name = file.relativePath.split('/')[0];
        } else if (file.batchId) {
          name = `Batch: ${file.batchId.substring(0, 8)}`;
        }

        groups[batchId] = {
          id: batchId,
          name: name,
          files: [],
          createdAt: file.createdAt,
          isProject: isProject
        };
      }
      groups[batchId].files.push(file);
    });

    return Object.values(groups).filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.files.some(f => f.originalName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [files, searchQuery]);

  // Derived state for the "Converted" column
  const completedResults = React.useMemo(() => {
    return files.filter(f => processingStates[f.id] === 'done' || convertedFiles[f.id]);
  }, [files, processingStates, convertedFiles]);

  const handleConvertFile = async (file: AppFile) => {
    setProcessingStates(prev => ({ ...prev, [file.id]: 'converting' }));
    
    try {
      // 1. Fetch original content
      const contentRes = await fetch(file.url);
      if (!contentRes.ok) { throw new Error('Failed to fetch file content'); }
      const markdown = await contentRes.text();

      // 2. Prepare metadata and base path
      const lastSlashIndex = file.url.lastIndexOf('/');
      const basePath = file.url.substring(0, lastSlashIndex);

      // 3. Parse Metadata and Content (Consistently with Editor)
      const parsedMetadata = parseMetadataFromMarkdown(markdown);
      const contentWithoutLandingPage = removeLandingPageSection(markdown);

      // 4. Call PDF generation API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: contentWithoutLandingPage,
          basePath: basePath.startsWith('/api') ? basePath : `/api${basePath}`,
          metadata: parsedMetadata // Use parsed metadata directly to match Editor logic
        }),
      });

      if (!response.ok) { throw new Error('PDF generation failed'); }
      
      const blob = await response.blob();
      setConvertedFiles(prev => ({ ...prev, [file.id]: blob }));
      setProcessingStates(prev => ({ ...prev, [file.id]: 'done' }));
      return true;
    } catch (error) {
      console.error('Conversion error:', error);
      setProcessingStates(prev => ({ ...prev, [file.id]: 'error' }));
      return false;
    }
  };

  const handleConvertBatch = async (group: BatchGroup) => {
    const total = group.files.length;
    setBatchProgress(prev => ({ ...prev, [group.id]: { current: 0, total } }));

    for (let i = 0; i < group.files.length; i++) {
      const file = group.files[i];
      // Skip if already converted
      if (processingStates[file.id] === 'done') {
        setBatchProgress(prev => ({ 
          ...prev, 
          [group.id]: { ...prev[group.id], current: i + 1 } 
        }));
        continue;
      }
      
      await handleConvertFile(file);
      setBatchProgress(prev => ({ 
        ...prev, 
        [group.id]: { ...prev[group.id], current: i + 1 } 
      }));
    }
    
    // Clear progress after a delay
    setTimeout(() => {
      setBatchProgress(prev => {
        const next = { ...prev };
        delete next[group.id];
        return next;
      });
    }, 5000);
  };

  const handleDownloadFile = (file: AppFile, type: 'md' | 'pdf') => {
    if (type === 'md') {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = convertedFiles[file.id];
      if (!blob) { return; }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = generateStandardName(file.originalName);
      const timestampedName = addTimestampToName(baseName);
      a.download = `${timestampedName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {return;}

    const batchId = self.crypto.randomUUID();
    const uploadPromises = Array.from(selectedFiles).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('batchId', batchId);
      formData.append('relativePath', file.name);
      formData.append('source', 'converter');
      
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      return response.ok;
    });

    await Promise.all(uploadPromises);
    await refreshFiles();
    if (fileInputRef.current) {fileInputRef.current.value = '';}
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {return;}

    const batchId = self.crypto.randomUUID();
    const uploadPromises = Array.from(selectedFiles).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('batchId', batchId);
      // Explicitly cast to include webkitRelativePath which exists on files from folder upload
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      formData.append('relativePath', relativePath);
      formData.append('source', 'converter');
      
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      return response.ok;
    });

    await Promise.all(uploadPromises);
    await refreshFiles();
    if (folderInputRef.current) {folderInputRef.current.value = '';}
  };
  const triggerFileUpload = () => fileInputRef.current?.click();
  const triggerFolderUpload = () => folderInputRef.current?.click();
  const triggerZipUpload = () => {
    zipInputRef.current?.click();
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Placeholder for future zip logic
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {return;}
    alert("ZIP upload coming soon!");
    if (zipInputRef.current) {zipInputRef.current.value = '';}
  };

  return (
    <TooltipProvider>
    <main className="h-dvh w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative selection:bg-blue-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
      </div>

      {/* Header */}
      <header className="relative z-10 h-16 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4 w-[280px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shadow-inner">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold tracking-tight text-white uppercase tracking-[0.1em]">Converter</h1>
            </div>
          </div>
        </div>

        <input 
          type="file" 
          multiple 
          accept=".md" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
        />
        <input 
          type="file" 
          ref={folderInputRef} 
          onChange={handleFolderUpload} 
          className="hidden" 
          {...( { webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement> )}
        />
        <input 
          type="file" 
          accept=".zip" 
          ref={zipInputRef} 
          onChange={handleZipUpload} 
          className="hidden" 
        />

        <div className="flex items-center justify-end gap-4">
          <div className="relative group hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Pipeline Content Area */}
      <div className="relative z-10 flex-grow overflow-hidden flex flex-row p-6 gap-6">
        
        {/* SEGMENT 1: SOURCE (Upload Hub) */}
        <section className="w-[300px] flex flex-col gap-4 shrink-0">
          <div className="flex items-center gap-2 px-2 text-xs font-black uppercase tracking-[0.2em] text-amber-400/80">
            <Upload className="w-3.5 h-3.5" />
            <h2>Source</h2>
          </div>
          
          <div className="flex-grow bg-amber-400/[0.03] border border-amber-400/10 rounded-[2.5rem] p-6 backdrop-blur-xl flex flex-col justify-center gap-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/[0.05] to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
            


            <div className="space-y-4 w-full relative z-10">
              <Button 
                onClick={triggerFileUpload}
                className="w-full h-16 bg-slate-900/40 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 rounded-2xl flex items-center justify-start px-6 gap-4 transition-all duration-300 group/btn shadow-lg backdrop-blur-sm"
              >
                <div className="w-11 h-11 bg-amber-500/5 rounded-xl flex items-center justify-center text-amber-500/60 group-hover/btn:bg-amber-500/20 group-hover/btn:text-amber-400 group-hover/btn:scale-110 transition-all">
                  <FileCode className="w-6 h-6" />
                </div>
                <div className="text-left flex-grow">
                  <p className="text-[12px] font-black uppercase tracking-wider leading-none text-slate-400 group-hover/btn:text-amber-300 transition-colors">Upload Files</p>
                </div>
              </Button>

              <Button 
                onClick={triggerFolderUpload}
                className="w-full h-16 bg-slate-900/40 border border-white/10 hover:border-indigo-400/50 hover:bg-indigo-400/10 rounded-2xl flex items-center justify-start px-6 gap-4 transition-all duration-300 group/btn shadow-lg backdrop-blur-sm"
              >
                <div className="w-11 h-11 bg-indigo-400/5 rounded-xl flex items-center justify-center text-indigo-400/60 group-hover/btn:bg-indigo-400/20 group-hover/btn:text-indigo-400 group-hover/btn:scale-110 transition-all">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div className="text-left flex-grow">
                  <p className="text-[12px] font-black uppercase tracking-wider leading-none text-slate-400 group-hover/btn:text-indigo-300 transition-colors">Upload Project</p>
                </div>
              </Button>

              <Button 
                onClick={triggerZipUpload}
                className="w-full h-16 bg-slate-900/40 border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-400/10 rounded-2xl flex items-center justify-start px-6 gap-4 transition-all duration-300 group/btn shadow-lg backdrop-blur-sm"
              >
                <div className="w-11 h-11 bg-cyan-400/5 rounded-xl flex items-center justify-center text-cyan-400/60 group-hover/btn:bg-cyan-400/20 group-hover/btn:text-cyan-400 group-hover/btn:scale-110 transition-all">
                  <FileDown className="w-6 h-6" />
                </div>
                <div className="text-left flex-grow">
                  <p className="text-[12px] font-black uppercase tracking-wider leading-none text-slate-400 group-hover/btn:text-cyan-300 transition-colors">Upload Zip</p>
                </div>
              </Button>


            </div>
          </div>
        </section>

        {/* SEGMENT 2: PROCESSING (Management / Batches) */}
        <section className="flex-grow flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between px-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-400/80">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              <h2>Processing Engine</h2>
              {batchGroups.length > 0 && (
                <span className="ml-2 text-[9px] bg-indigo-400/10 border border-indigo-400/20 px-2 py-0.5 rounded-full text-indigo-300/80">{batchGroups.length}</span>
              )}
            </div>

          </div>

          <div className="flex-grow bg-indigo-400/[0.03] border border-indigo-400/10 rounded-[2.5rem] p-4 flex flex-col overflow-hidden relative group/engine backdrop-blur-xl">
             <div className="absolute inset-0 bg-gradient-to-b from-indigo-400/[0.05] to-transparent pointer-events-none" />
             <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-4 pr-1 relative z-10">
              {!loading && batchGroups.length > 0 ? (
                batchGroups.map((group, index) => (
                <div 
                  key={group.id} 
                  style={{ animationDelay: `${index * 0.1}s` }}
                  className="bg-slate-900/40 border border-white/5 rounded-[2rem] p-5 hover:border-blue-500/20 transition-all group/card shadow-xl relative overflow-hidden animate-card-in"
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 transition-transform group-hover/card:scale-105",
                        group.isProject ? "bg-amber-500/5 text-amber-500/80" : "bg-blue-500/5 text-blue-400/80"
                      )}>
                        {group.isProject ? <FolderOpen className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white group-hover/card:text-blue-400 transition-colors truncate max-w-[200px]">
                          {group.name}
                        </h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                          {group.files.length} Modules Identified
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm"
                      onClick={() => handleConvertBatch(group)}
                      disabled={!!batchProgress[group.id]}
                      className={cn(
                        "h-10 rounded-xl text-[9px] font-black uppercase tracking-widest px-4 gap-2 shadow-lg active:scale-95 transition-all outline-none border-none",
                        batchProgress[group.id] ? "bg-blue-600 text-white" : "bg-white text-slate-950 hover:bg-blue-500 hover:text-white"
                      )}
                    >
                      {batchProgress[group.id] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3 fill-current" />
                      )}
                      {batchProgress[group.id] ? 'Syncing...' : 'Deploy'}
                    </Button>
                  </div>

                  {/* Group progress bar if active */}
                  {batchProgress[group.id] && (
                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${(batchProgress[group.id].current / batchProgress[group.id].total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex-grow border border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center opacity-40">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500/50">Awaiting Ingestion</p>
              </div>
            )}
            </div>
          </div>
        </section>



        {/* SEGMENT 3: RESULTS (Converted PDFs) */}
        <section className="w-[380px] flex flex-col gap-4 shrink-0 overflow-hidden">
          <div className="flex items-center justify-between px-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-400/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.3)]" />
              <h2>Output</h2>
            </div>
            {completedResults.length > 0 && (
              <button 
                onClick={() => setConvertedFiles({})}
                className="text-[9px] hover:text-red-400 transition-colors uppercase font-black"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="flex-grow bg-emerald-400/[0.03] border border-emerald-400/10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col p-4 relative group/results">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/[0.05] to-transparent pointer-events-none" />
            <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-1 relative z-10">
              {completedResults.length > 0 ? (
                completedResults.map((file, idx) => (
                  <div 
                    key={file.id} 
                    style={{ animationDelay: `${idx * 0.05}s` }}
                    className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between group/result hover:border-emerald-500/20 transition-all animate-card-in"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-500/80 group-hover/result:scale-110 transition-transform">
                        <FileDown className="w-5 h-5" />
                      </div>
                      <div className="max-w-[160px]">
                        <p className="text-[11px] font-bold text-slate-200 truncate group-hover/result:text-white transition-colors">
                          {generateStandardName(file.originalName)}.pdf
                        </p>
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight mt-0.5">Ready for Transfer</p>
                      </div>
                    </div>
                    
                    <Button 
                      size="icon"
                      onClick={() => handleDownloadFile(file, 'pdf')}
                      className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-950/20"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center opacity-30 gap-4" />
              )}
            </div>

            {completedResults.length > 1 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <Button 
                  onClick={() => completedResults.forEach(f => handleDownloadFile(f, 'pdf'))}
                  className="w-full h-12 bg-white text-slate-950 hover:bg-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl"
                >
                  Download Library
                </Button>
              </div>
            )}
          </div>
        </section>

      </div>
      

    </main>
    </TooltipProvider>
  );
}
