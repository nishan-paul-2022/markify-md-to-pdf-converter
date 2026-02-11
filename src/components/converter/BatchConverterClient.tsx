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
  Filter,
  FileText,
  Clock,
  MoreVertical,
  Download,
  Trash2, 
  Play,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserNav from '@/components/auth/UserNav';
import { useFiles, File as AppFile } from '@/hooks/use-files';
import { formatFileSize } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { generateStandardName } from '@/lib/utils/naming';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import JSZip from 'jszip';

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface BatchConverterClientProps {
  user: User;
}

interface BatchGroup {
  id: string;
  name: string;
  files: AppFile[];
  createdAt: string;
  isProject: boolean;
}

export default function BatchConverterClient({ user }: BatchConverterClientProps): React.JSX.Element {
  const router = useRouter();
  const { files, loading, refreshFiles, handleDelete } = useFiles();
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);

  // Status and result management
  const [processingStates, setProcessingStates] = React.useState<Record<string, 'pending' | 'converting' | 'done' | 'error'>>({});
  const [convertedFiles, setConvertedFiles] = React.useState<Record<string, Blob>>({});
  const [batchProgress, setBatchProgress] = React.useState<Record<string, { current: number, total: number }>>({});
  const [zipLoading, setZipLoading] = React.useState<Record<string, boolean>>({});

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

      // 3. Call PDF generation API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown,
          basePath: basePath.startsWith('/api') ? basePath : `/api${basePath}`,
          metadata: {
            title: file.originalName.replace('.md', ''),
            author: user.name || 'Markify User',
            subject: 'Converted via Markify Batch',
            keywords: 'markdown, pdf, batch',
            pageFormat: 'a4',
            orientation: 'portrait',
            margin: '20'
          }
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
      const fileName = generateStandardName(file.originalName);
      a.download = `${fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadZip = async (group: BatchGroup) => {
    setZipLoading(prev => ({ ...prev, [group.id]: true }));
    try {
      const zip = new JSZip();
      
      // Add all converted PDFs to the zip
      for (const file of group.files) {
        const blob = convertedFiles[file.id];
        const baseName = generateStandardName(file.originalName);
        if (blob) {
          zip.file(`${baseName}.pdf`, blob);
        } else {
          const res = await fetch(file.url);
          if (res.ok) {
            const mdBlob = await res.blob();
            zip.file(`${baseName}.md`, mdBlob);
          }
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      const zipName = generateStandardName(group.name);
      a.download = `${zipName}_batch.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Zip generation error:', error);
    } finally {
      setZipLoading(prev => ({ ...prev, [group.id]: false }));
    }
  };

  const handleDownloadMulti = async (group: BatchGroup) => {
    // Trigger multiple individual downloads sequentially with a small delay
    // to avoid browser download blocking
    for (const file of group.files) {
      if (processingStates[file.id] === 'done') {
        handleDownloadFile(file, 'pdf');
      } else {
        handleDownloadFile(file, 'md');
      }
      // Brief delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
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

  return (
    <main className="h-dvh w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative selection:bg-blue-500/30">
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
        {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
      />

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
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-14 bg-white text-slate-950 hover:bg-slate-200 rounded-2xl flex items-center justify-start px-5 gap-4 shadow-xl shadow-blue-500/10 group/btn transition-all active:scale-[0.98]"
                >
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-wider leading-none mb-1">Upload Files</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select multiple .md files</p>
                  </div>
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => folderInputRef.current?.click()}
                    className="h-28 flex-col border-white/5 bg-slate-900/50 hover:bg-slate-800 hover:border-amber-500/30 rounded-2xl gap-3 transition-all group/upload relative overflow-hidden"
                  >
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
          <div className="flex items-center justify-between px-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            <div className="flex items-center gap-3">
               <h2>{loading ? 'Refreshing Library...' : 'Library & Projects'}</h2>
               {!loading && batchGroups.length > 0 && (
                 <span className="bg-slate-900 px-2 py-0.5 rounded text-[10px] border border-white/5">{batchGroups.length} Batches</span>
               )}
            </div>
            <div className="flex items-center gap-4">
               <span className="cursor-pointer hover:text-white transition-colors">Sort: Date</span>
               <div className="h-3 w-[1px] bg-white/10" />
               <span className="cursor-pointer hover:text-white transition-colors">View: Grid</span>
            </div>
          </div>

          <div className="flex-grow overflow-y-scroll custom-scrollbar pb-32">
            {!loading && batchGroups.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {batchGroups.map(group => (
                  <div 
                    key={group.id} 
                    className="bg-slate-900/30 border border-white/10 rounded-[2rem] p-6 hover:border-white/20 hover:bg-slate-900/50 transition-all group/card shadow-lg"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border border-white/5",
                          group.isProject ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-400"
                        )}>
                          {group.isProject ? <FolderOpen className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white mb-1 group-hover/card:text-blue-400 transition-colors truncate max-w-[200px]">
                            {group.name}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                            <span className="text-slate-700">•</span>
                            <span>{group.files.length} Files</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white transition-all">
                               <MoreVertical className="w-4 h-4" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="w-56 bg-slate-900/95 border-white/10 backdrop-blur-xl text-slate-300">
                             <DropdownMenuItem 
                               onClick={() => handleDownloadMulti(group)}
                               className="hover:bg-white/10 focus:bg-white/10 hover:text-white cursor-pointer gap-2"
                             >
                               <Download className="w-4 h-4" />
                               <span>Download All (Individual)</span>
                             </DropdownMenuItem>
                             <DropdownMenuItem 
                               onClick={() => handleDelete(group.files[0].id)} 
                               className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-400 cursor-pointer gap-2"
                             >
                               <Trash2 className="w-4 h-4" />
                               <span>Delete Group</span>
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                      </div>
                    </div>

                    <div className="space-y-3 mb-8">
                       {group.files.slice(0, 3).map(file => {
                         const status = processingStates[file.id] || 'pending';
                         const isConverted = status === 'done';
                         const isConverting = status === 'converting';

                         return (
                           <div key={file.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/30 border border-white/5 group/file hover:bg-slate-950/50 transition-colors">
                             <div className="flex items-center gap-3">
                               <FileText className="w-4 h-4 text-slate-600" />
                               <div>
                                 <p className="text-[11px] font-bold text-slate-300 truncate max-w-[150px]">{file.originalName}</p>
                                 <p className="text-[9px] text-slate-500 font-medium uppercase tracking-tight">{formatFileSize(file.size)} • {file.mimeType.split('/')[1]}</p>
                               </div>
                             </div>
                             <div className="flex items-center gap-2">
                                {/* Conversion Status */}
                                <div className={cn(
                                  "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest transition-all",
                                  status === 'pending' && "bg-slate-900 border-white/5 text-slate-500",
                                  status === 'converting' && "bg-blue-500/10 border-blue-500/20 text-blue-400 animate-pulse",
                                  status === 'done' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                                  status === 'error' && "bg-red-500/10 border-red-500/20 text-red-400"
                                )}>
                                  <span className={cn(
                                    "w-1 h-1 rounded-full",
                                    status === 'pending' && "bg-slate-500",
                                    status === 'converting' && "bg-blue-400",
                                    status === 'done' && "bg-emerald-400",
                                    status === 'error' && "bg-red-400"
                                  )} />
                                  {status}
                                </div>
                                
                                <div className="flex items-center gap-1 pl-2 border-l border-white/5">
                                  {!isConverted ? (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleConvertFile(file)}
                                      disabled={isConverting}
                                      className="h-7 w-7 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10"
                                    >
                                      {isConverting ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Play className="w-3 h-3" />
                                      )}
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleDownloadFile(file, 'pdf')}
                                      className="h-7 w-7 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDownloadFile(file, 'md')}
                                    className="h-7 w-7 rounded-lg text-slate-500 hover:text-white"
                                  >
                                    <FileText className="w-3 h-3" />
                                  </Button>
                                </div>
                             </div>
                           </div>
                         );
                       })}
                       {group.files.length > 3 && (
                         <button className="w-full text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-slate-400 py-1 transition-colors">
                           + {group.files.length - 3} More Files
                         </button>
                       )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button 
                        onClick={() => handleConvertBatch(group)}
                        disabled={!!batchProgress[group.id]}
                        className={cn(
                          "flex-1 h-11 transition-all active:scale-[0.98] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] gap-2",
                          batchProgress[group.id] ? "bg-blue-600 text-white" : "bg-white text-slate-950 hover:bg-blue-500 hover:text-white"
                        )}
                      >
                        {batchProgress[group.id] ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {batchProgress[group.id].current} / {batchProgress[group.id].total} Converting...
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Convert All
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleDownloadZip(group)}
                        disabled={zipLoading[group.id]}
                        className="h-11 border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] gap-2 text-slate-400 group/zip"
                      >
                        {zipLoading[group.id] ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5 group-hover/zip:text-blue-400 transition-colors" />
                        )}
                        Zip
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => handleDelete(group.files[0].id)} // Placeholder for group delete
                        className="h-11 w-11 rounded-xl text-slate-600 hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="col-span-full h-[400px] border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-6 group hover:border-white/10 transition-colors">
                <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center border border-white/5 shadow-inner relative overflow-hidden">
                   <div className="absolute inset-0 bg-blue-500/5 blur-xl animate-pulse" />
                   <Upload className="w-8 h-8 text-slate-600 group-hover:text-blue-400 transition-colors relative z-10" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">
                    {loading ? 'Scanning Files...' : 'No batches found'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {loading ? 'Accessing your private library' : 'Upload a project folder or select files to get started'}
                  </p>
                </div>
                {!loading && (
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline" 
                    className="rounded-full border-white/10 hover:bg-white/5 px-8 text-xs font-bold uppercase tracking-widest"
                  >
                    Browse Files
                  </Button>
                )}
              </div>
            )}
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
