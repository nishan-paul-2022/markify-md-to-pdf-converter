'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import UserNav from '@/components/auth/user-nav';
import Editor from '@/components/converter/editor';
import { EditorSidebar } from '@/components/converter/editor/editor-sidebar';
import { EditorStats } from '@/components/converter/editor/editor-stats';
import { EditorToolbar } from '@/components/converter/editor/editor-toolbar';
import MdPreview from '@/components/converter/md-preview';
import { UploadRulesModal } from '@/components/converter/upload-rules-modal';
import { ImageModal } from '@/components/file-manager/image-modal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useConverter } from '@/hooks/use-converter';
import type { AppFile } from '@/hooks/use-files';
import { buildFileTree, type FileTreeNode } from '@/lib/file-tree';
import { cn } from '@/lib/utils';

import { Eye, Layers } from 'lucide-react';

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
  const router = useRouter();

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
    isEditorAtTop,
    stats,
    uploadTime,
    lastModifiedTime,

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
  } = useConverter();

  const fileTree = React.useMemo(() => buildFileTree(files), [files]);

  return (
    <TooltipProvider delayDuration={0}>
      <main className="flex min-h-screen flex-col overflow-hidden bg-slate-900 font-sans text-slate-100 antialiased selection:bg-primary/20">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/converter')}
              className="group flex items-center gap-2.5 rounded-full bg-white/[0.03] py-1.5 pr-4 pl-1.5 transition-all hover:bg-white/[0.08]"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary transition-transform group-hover:scale-105">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-xs font-black tracking-widest text-white uppercase opacity-90">
                Markify
              </span>
            </button>
          </div>

          <div className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex">
            <div className="relative flex w-64 items-center rounded-xl bg-slate-900/80 p-1.5 shadow-2xl backdrop-blur-xl">
              <button
                onClick={() => setActiveTab('editor')}
                className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 ${
                  activeTab === 'editor' ? 'text-white' : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                <span>Editor</span>
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 ${
                  activeTab === 'preview' ? 'text-white' : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                <Eye className={cn('h-3.5 w-3.5', activeTab === 'preview' && 'scale-110')} />
                <span>Preview</span>
              </button>

              <div
                className="absolute top-1.5 bottom-1.5 rounded-lg bg-white/10 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  width: 'calc(50% - 6px)',
                  left: activeTab === 'editor' ? '6px' : 'calc(50% + 0px)',
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
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
            setSearchQuery={setSearchQuery}
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
                  isEditorAtTop={isEditorAtTop}
                  stats={stats}
                  uploadTime={uploadTime}
                  lastModifiedTime={lastModifiedTime}
                />

                <Editor
                  innerRef={textareaRef}
                  value={rawContent}
                  onChange={handleContentChange}
                  className="selection:bg-primary/30 custom-scrollbar dark-editor absolute inset-0 h-full w-full resize-none border-none bg-slate-950 p-4 pt-10 font-mono text-sm text-slate-300 focus-visible:ring-0 lg:p-6 lg:pt-10"
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
