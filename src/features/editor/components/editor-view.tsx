'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { TooltipProvider } from '@/components/ui/tooltip';
import UserNav from '@/features/auth/components/user-nav';
import { UploadRulesModal } from '@/features/converter/components/upload-rules-modal';
import Editor from '@/features/editor/components/editor';
import { EditorSidebar } from '@/features/editor/components/editor-sidebar';
import { EditorStats } from '@/features/editor/components/editor-stats';
import { EditorToolbar } from '@/features/editor/components/editor-toolbar';
import MdPreview from '@/features/editor/components/md-preview';
import { useConverter } from '@/features/editor/hooks/use-converter';
import { ImageModal } from '@/features/file-management/components/image-modal';
import type { AppFile } from '@/features/file-management/hooks/use-files';
import {
  loadSortPreference,
  saveSortPreference,
  sortFileTreeNodes,
  type SortPreference,
} from '@/features/file-management/utils/file-sorting';
import { buildFileTree, type FileTreeNode } from '@/features/file-management/utils/file-tree';
import { cn } from '@/utils/cn';

import { Eye, Layers, Loader2, Search, X } from 'lucide-react';

interface EditorViewProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  files: AppFile[];
  filesLoading: boolean;
  handleFileDelete: (id: string | string[]) => Promise<void>;
  handleFileRename: (
    id: string,
    newName: string,
    type: 'file' | 'folder',
    batchId?: string,
    oldPath?: string,
  ) => Promise<void>;
  refreshFiles: () => Promise<void>;
  onFileSelect: (node: FileTreeNode) => Promise<void> | void;
}

export default function EditorView({
  user,
  files,
  filesLoading,
  handleFileDelete,
  handleFileRename,
  refreshFiles,
  onFileSelect,
}: EditorViewProps) {
  const {
    // State
    rawContent,
    content,
    metadata,
    isSidebarOpen,
    activeTab,
    selectedFileId,
    basePath,
    isGenerating,
    isPdfDownloaded,
    isLoading,
    searchQuery,
    isSelectionMode,
    selectedIds,
    activeImage,
    imageGallery,
    uploadRulesModal,
    isUploaded,
    isCopied,
    isReset,
    isDownloaded,
    statsRef,
    stats,
    uploadTime,

    // Refs
    textareaRef,
    fileInputRef,
    folderInputRef,
    zipInputRef,

    // Actions
    setIsSidebarOpen,
    setActiveTab,
    handleContentChange,
    generatePdfBlob,
    handleDownloadPdf,
    setSearchQuery,
    setIsSelectionMode,
    toggleSelection,
    setSelectedIds,
    handleSelectAll,
    handleBulkDeleteClick,
    getSelectedCount,
    getAllDeletableFileIds,
    handleFileUpload,
    handleFolderUpload,
    handleZipUpload,
    scrollToStart,
    scrollToEnd,
    handleCopy,
    handleReset,
    handleDownloadMd,
    setActiveImage,
    setUploadRulesModal,
    handleUploadModalConfirm,
  } = useConverter(files, handleFileDelete);

  // Sort preference state
  const [sortPreference, setSortPreference] = React.useState<SortPreference>(() =>
    loadSortPreference(),
  );

  const handleSortChange = React.useCallback((preference: SortPreference) => {
    setSortPreference(preference);
    saveSortPreference(preference);
  }, []);

  // Sort expanded state
  const [isSortExpanded, setIsSortExpanded] = React.useState(false);

  // Build and sort file tree
  const fileTree = React.useMemo(() => {
    const tree = buildFileTree(files);
    return sortFileTreeNodes(tree, sortPreference);
  }, [files, sortPreference]);

  // Prevent page-level scrolling (Guidelines 1 & 4)
  React.useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <main className="selection:bg-primary/20 flex h-screen flex-col overflow-hidden bg-slate-900 font-sans text-slate-100 antialiased">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center transition-transform group-hover:scale-110">
                <Image
                  src="/images/brand-logo.svg"
                  alt="Markify"
                  width={32}
                  height={32}
                  priority
                  className="drop-shadow-xl"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold tracking-[0.05em] tracking-tight text-white transition-colors group-hover:text-blue-400">
                  Markify
                </h1>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="group relative hidden lg:block">
              <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-400" />
              <input
                type="text"
                placeholder="Search file"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-56 rounded-full border border-white/5 bg-white/5 pr-9 pl-9 text-[10px] font-black tracking-[0.2em] text-slate-400 transition-all placeholder:text-slate-600 focus:w-80 focus:border-blue-500/30 focus:bg-blue-500/5 focus:text-blue-100 focus:outline-none lg:focus:w-96"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <Link href="/converter">
              <button className="group flex h-9 cursor-pointer items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-white active:scale-95">
                <Layers className="h-3.5 w-3.5 transition-all duration-300 group-hover:scale-110 group-hover:text-blue-400" />
                <span>Converter</span>
              </button>
            </Link>
            <UserNav user={user} />
          </div>
        </header>

        {/* Dynamic Nav (only mobile/tablet) */}
        <div className="flex min-h-14 items-center border-b border-white/5 bg-slate-950/50 px-4 backdrop-blur-md lg:hidden">
          <div className="relative flex w-full items-center rounded-xl bg-slate-900/80 p-1 shadow-inner">
            <button
              onClick={() => setActiveTab('editor')}
              className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 ${
                activeTab === 'editor' ? 'text-white' : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              <span>Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 ${
                activeTab === 'preview' ? 'text-white' : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              <Eye className={cn('h-3.5 w-3.5', activeTab === 'preview' && 'scale-110')} />
              <span>Preview</span>
            </button>

            <div
              className="absolute top-1 bottom-1 rounded-lg bg-white/10 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                width: 'calc(50% - 4px)',
                left: activeTab === 'editor' ? '4px' : 'calc(50% + 0px)',
              }}
            />
          </div>
        </div>

        <div className="relative flex flex-grow flex-row overflow-hidden">
          {/* Sidebar */}
          <EditorSidebar
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
            searchQuery={searchQuery}
            filesLoading={filesLoading}
            refreshFiles={refreshFiles}
            fileTree={fileTree}
            selectedFileId={selectedFileId}
            onFileSelect={onFileSelect}
            handleFileDelete={handleFileDelete}
            handleFileRename={handleFileRename}
            selectedIds={selectedIds}
            toggleSelection={toggleSelection}
            setSelectedIds={setSelectedIds}
            handleSelectAll={handleSelectAll}
            handleBulkDeleteClick={handleBulkDeleteClick}
            getSelectedCount={getSelectedCount}
            getAllDeletableFileIds={getAllDeletableFileIds}
            sortPreference={sortPreference}
            onSortChange={handleSortChange}
            isSortExpanded={isSortExpanded}
            setIsSortExpanded={setIsSortExpanded}
          />


          <div className="relative flex flex-grow flex-col gap-0 overflow-hidden lg:flex-row">
            <div
              className={cn(
                'flex flex-1 flex-col overflow-hidden border-r border-slate-800/50 transition-all duration-300',
                activeTab === 'editor' ? 'tab-enter flex' : 'hidden lg:flex',
              )}
            >
              <EditorToolbar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                fileInputRef={fileInputRef}
                folderInputRef={folderInputRef}
                zipInputRef={zipInputRef}
                handleFileUpload={handleFileUpload}
                handleFolderUpload={handleFolderUpload}
                handleZipUpload={handleZipUpload}
                refreshFiles={refreshFiles}
                scrollToStart={scrollToStart}
                scrollToEnd={scrollToEnd}
                handleCopy={handleCopy}
                handleReset={handleReset}
                handleDownloadMd={handleDownloadMd}
                isUploaded={isUploaded}
                isCopied={isCopied}
                isReset={isReset}
                isDownloaded={isDownloaded}
                setUploadRulesModal={setUploadRulesModal}
              />

              <div className="group/editor relative flex-grow overflow-hidden">
                <EditorStats
                  ref={statsRef}
                  stats={stats}
                  uploadTime={uploadTime}
                />

                {isLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                )}

                <Editor
                  innerRef={textareaRef}
                  value={rawContent}
                  onChange={handleContentChange}
                  className="selection:bg-primary/30 custom-scrollbar dark-editor absolute inset-0 h-full w-full resize-none border-none rounded-none bg-slate-950 p-4 pt-10 font-mono text-sm text-slate-300 focus-visible:ring-0 lg:p-6 lg:pt-10"
                  placeholder="Write your markdown here..."
                />
              </div>
            </div>

            <div
              className={cn(
                'flex flex-1 flex-col overflow-hidden bg-slate-900/10 transition-all duration-300',
                activeTab === 'preview' ? 'tab-enter flex' : 'hidden lg:flex',
              )}
            >
              <MdPreview
                content={content}
                metadata={metadata}
                showToolbar={true}
                onDownload={handleDownloadPdf}
                onGeneratePdf={generatePdfBlob}
                isGenerating={isGenerating}
                isDownloaded={isPdfDownloaded}
                isLoading={isLoading}
                basePath={basePath}
              />
            </div>
          </div>
        </div>

        {activeImage && (
          <ImageModal
            activeImage={activeImage}
            images={imageGallery}
            onClose={() => setActiveImage(null)}
            onSelectImage={setActiveImage}
          />
        )}

        <UploadRulesModal
          isOpen={uploadRulesModal.isOpen}
          type={uploadRulesModal.type}
          onClose={() => setUploadRulesModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={handleUploadModalConfirm}
        />
      </main>
    </TooltipProvider>
  );
}
