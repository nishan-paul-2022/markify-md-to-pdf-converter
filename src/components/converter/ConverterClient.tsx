'use client';

import React from 'react';

import { useAlert } from '@/components/AlertProvider';
import { ConverterHeader } from '@/components/converter/ConverterHeader';
import { FileRow } from '@/components/converter/FileRow';
import { PipelineHeader } from '@/components/converter/PipelineHeader';
import { SourceSegment } from '@/components/converter/SourceSegment';
import { UploadRulesModal } from '@/components/converter/UploadRulesModal';
// Components
import { TooltipProvider } from '@/components/ui/tooltip';
import { parseMetadataFromMarkdown, removeLandingPageSection } from '@/constants/default-content';
import { useConverterFiles } from '@/hooks/use-converter-files';
// Hooks
import type { File as AppFile } from '@/hooks/use-files';
import { useFiles } from '@/hooks/use-files';
import { useSelection } from '@/hooks/use-selection';
import { formatConverterDate, formatFileSize } from '@/lib/formatters';
// Utilities
import { addTimestampToName, generateStandardName } from '@/lib/utils/naming';
import { createTar } from '@/lib/utils/tar';

import JSZip from 'jszip';
import { FileCode, Loader2 } from 'lucide-react';

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ConverterClientProps {
  user: User;
}

export default function ConverterClient({ user }: ConverterClientProps): React.JSX.Element {
  const { files, loading, refreshFiles, handleBulkDelete, deleting, handleDelete } =
    useFiles('converter');
  const { show: showAlert, confirm: confirmAlert } = useAlert();

  const [uploadRulesModal, setUploadRulesModal] = React.useState<{
    isOpen: boolean;
    type: 'file' | 'folder' | 'zip';
  }>({ isOpen: false, type: 'file' });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);
  const zipInputRef = React.useRef<HTMLInputElement>(null);

  // Status and result management (kept local as it's ephemeral/session-based)
  const [processingStates, setProcessingStates] = React.useState<
    Record<string, 'pending' | 'converting' | 'done' | 'error' | undefined>
  >({});
  const [convertedFiles, setConvertedFiles] = React.useState<Record<string, Blob | undefined>>({});
  const [isBatchProcessing, setIsBatchProcessing] = React.useState(false);

  // Modular Hooks (Guidelines 4 & 6)
  const {
    filteredMdFiles,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
  } = useConverterFiles(files);

  const {
    selectedIds: selectedFileIds,
    isSelectionMode,
    toggleSelectionMode,
    toggleId: toggleSelection,
    selectAll,
    clearSelection,
  } = useSelection('converter');

  // Derived state for the "Converted" column (matching filtered set)
  const completedResults = React.useMemo(() => {
    return filteredMdFiles.filter(
      (f) =>
        processingStates[f.id] === 'done' ||
        convertedFiles[f.id] ||
        (f.metadata && f.metadata.generatedPdfUrl),
    );
  }, [filteredMdFiles, processingStates, convertedFiles]);

  const toggleSelectAll = () => {
    if (selectedFileIds.size === filteredMdFiles.length && filteredMdFiles.length > 0) {
      clearSelection();
    } else {
      selectAll(filteredMdFiles.map((f) => f.id));
    }
  };

  const handleBatchConvert = async () => {
    if (selectedFileIds.size === 0) {
      return;
    }

    setIsBatchProcessing(true);
    const idsToConvert = Array.from(selectedFileIds);

    for (const id of idsToConvert) {
      const file = filteredMdFiles.find((f) => f.id === id);
      if (file && processingStates[id] !== 'done' && processingStates[id] !== 'converting') {
        await handleConvertFile(file);
      }
    }

    setIsBatchProcessing(false);
    clearSelection();
    toggleSelectionMode(); // Exit selection mode after batch action
  };

  const handleBatchDelete = async () => {
    if (selectedFileIds.size === 0) {
      return;
    }

    const confirmed = await confirmAlert({
      title: 'Delete Multiple Files',
      message: `Are you sure you want to delete ${selectedFileIds.size} selected files? This action cannot be undone.`,
      confirmText: 'Delete Files',
      variant: 'destructive',
    });

    if (!confirmed) {
      return;
    }

    await handleBulkDelete(Array.from(selectedFileIds));
    clearSelection();
    toggleSelectionMode(); // Exit selection mode after batch action
  };

  const handleConvertFile = async (file: AppFile) => {
    setProcessingStates((prev) => ({ ...prev, [file.id]: 'converting' }));

    try {
      const contentRes = await fetch(file.url);
      if (!contentRes.ok) {
        throw new Error('Failed to fetch file content');
      }
      const markdown = await contentRes.text();

      const lastSlashIndex = file.url.lastIndexOf('/');
      const basePath = file.url.substring(0, lastSlashIndex);

      const parsedMetadata = parseMetadataFromMarkdown(markdown);
      const contentWithoutLandingPage = removeLandingPageSection(markdown);

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown: contentWithoutLandingPage,
          basePath: basePath.startsWith('/api') ? basePath : `/api${basePath}`,
          metadata: parsedMetadata,
          saveToServer: true,
          sourceFileId: file.id,
        }),
      });

      if (!response.ok) {
        throw new Error('PDF generation failed');
      }

      const blob = await response.blob();
      setConvertedFiles((prev) => ({ ...prev, [file.id]: blob }));
      setProcessingStates((prev) => ({ ...prev, [file.id]: 'done' }));

      await refreshFiles();
      return true;
    } catch (error) {
      console.error('Conversion error:', error);
      setProcessingStates((prev) => ({ ...prev, [file.id]: 'error' }));
      return false;
    }
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
      const pdfUrl = file.metadata?.generatedPdfUrl;

      if (!blob && !pdfUrl) {
        return;
      }

      if (pdfUrl && !blob) {
        const a = document.createElement('a');
        a.href = pdfUrl as string;
        a.download = `${generateStandardName(file.originalName)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const url = URL.createObjectURL(blob as Blob);
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

  const handleDownloadAll = () => {
    completedResults.forEach((f) => handleDownloadFile(f, 'pdf'));
  };

  const handleDownloadArchive = async (format: 'zip' | 'tar') => {
    if (completedResults.length === 0) {
      return;
    }

    const filesToArchive = await Promise.all(
      completedResults.map(async (file) => {
        let blob = convertedFiles[file.id];
        if (!blob && file.metadata?.generatedPdfUrl) {
          try {
            const pdfUrl = file.metadata.generatedPdfUrl;
            if (typeof pdfUrl === 'string') {
              const res = await fetch(pdfUrl);
              if (res.ok) {
                blob = await res.blob();
              }
            }
          } catch (e) {
            console.error(`Failed to fetch PDF for archive: ${file.originalName}`, e);
          }
        }

        if (!blob) {
          return null;
        }
        return {
          name: `${generateStandardName(file.originalName)}.pdf`,
          blob: blob,
        };
      }),
    );

    const validFiles = filesToArchive.filter(Boolean) as { name: string; blob: Blob }[];
    if (validFiles.length === 0) {
      return;
    }

    try {
      let content: Blob;
      let filename = `markify_export_${addTimestampToName('archive')}`;

      if (format === 'zip') {
        const zip = new JSZip();
        const folder = zip.folder('converted_pdfs');
        if (folder) {
          validFiles.forEach((f) => folder.file(f.name, f.blob));
        }
        content = await zip.generateAsync({ type: 'blob' });
        filename += '.zip';
      } else {
        content = await createTar(validFiles);
        filename += '.tar';
      }

      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Failed to generate ${format} archive`, error);
      showAlert({
        title: 'Archive Failed',
        message: `Could not create ${format} archive.`,
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

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

      if (!response.ok) {
        const errorText = await response.text();
        return { error: errorText, file: file.name };
      }
      return response.ok;
    });

    await Promise.all(uploadPromises);
    await refreshFiles();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    const batchId = self.crypto.randomUUID();
    const uploadPromises = Array.from(selectedFiles).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('batchId', batchId);
      const relativePath =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      formData.append('relativePath', relativePath);
      formData.append('source', 'converter');

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        return { error: await response.text(), file: file.name };
      }
      return response.ok;
    });

    await Promise.all(uploadPromises);
    await refreshFiles();
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    try {
      const uploadPromises = Array.from(selectedFiles).map(async (archiveFile) => {
        const formData = new FormData();
        formData.append('file', archiveFile);
        formData.append('source', 'converter');

        const response = await fetch('/api/files/archive', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }
        return response.json();
      });

      await Promise.all(uploadPromises);
      await refreshFiles();
    } catch (error) {
      showAlert({
        title: 'Processing Failed',
        message: error instanceof Error ? error.message : 'Failed',
        variant: 'destructive',
      });
    } finally {
      if (zipInputRef.current) {
        zipInputRef.current.value = '';
      }
    }
  };

  return (
    <TooltipProvider>
      <main className="relative flex h-dvh w-full flex-col overflow-hidden bg-slate-950 text-slate-100 selection:bg-blue-500/30">
        {/* Background Decorative Elements */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        </div>

        <ConverterHeader user={user} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

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
          {...({
            webkitdirectory: '',
            directory: '',
          } as React.InputHTMLAttributes<HTMLInputElement>)}
        />
        <input
          type="file"
          multiple
          accept=".zip,.7z,.rar,.tar,.tar.gz,.tgz"
          ref={zipInputRef}
          onChange={handleZipUpload}
          className="hidden"
        />

        <div className="relative z-10 flex flex-grow flex-row gap-6 overflow-hidden p-6">
          <SourceSegment onUploadClick={(type) => setUploadRulesModal({ isOpen: true, type })} />

          <section className="flex h-full flex-grow flex-col gap-4 overflow-hidden">
            <PipelineHeader
              filteredFilesCount={filteredMdFiles.length}
              completedResultsCount={completedResults.length}
              isSelectionMode={isSelectionMode}
              selectedCount={selectedFileIds.size}
              sortBy={sortBy}
              sortOrder={sortOrder}
              isBatchProcessing={isBatchProcessing}
              deleting={deleting}
              onToggleSelectionMode={toggleSelectionMode}
              onToggleSelectAll={toggleSelectAll}
              onSortByChange={setSortBy}
              onSortOrderChange={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              onDownloadArchive={handleDownloadArchive}
              onDownloadAll={handleDownloadAll}
              onBatchDelete={handleBatchDelete}
              onBatchConvert={handleBatchConvert}
            />

            <div className="shadow-3xl relative flex flex-grow flex-col overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900/20 p-4 backdrop-blur-3xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-500/[0.03] to-transparent" />
              <div className="custom-scrollbar relative z-10 flex flex-grow flex-col gap-4 overflow-y-auto pr-2">
                {!loading && filteredMdFiles.length > 0 ? (
                  filteredMdFiles.map((file, index) => (
                    <FileRow
                      key={file.id}
                      file={file}
                      index={index}
                      isSelected={selectedFileIds.has(file.id)}
                      isSelectionMode={isSelectionMode}
                      processingState={
                        processingStates[file.id] ||
                        (file.metadata?.generatedPdfUrl ? 'done' : 'pending')
                      }
                      hasLocalBlob={!!convertedFiles[file.id]}
                      onToggleSelection={toggleSelection}
                      onConvert={handleConvertFile}
                      onDelete={handleDelete}
                      onDownload={handleDownloadFile}
                      formatDate={formatConverterDate}
                      formatSize={formatFileSize}
                    />
                  ))
                ) : !loading ? (
                  <div className="flex flex-grow flex-col items-center justify-center gap-4 text-slate-500 opacity-50">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/5 bg-white/5">
                      <FileCode className="h-8 w-8" />
                    </div>
                    <p className="text-[10px] font-black tracking-[0.2em] uppercase">
                      Queue is empty
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-grow items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <UploadRulesModal
          isOpen={uploadRulesModal.isOpen}
          onClose={() => setUploadRulesModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={() => {
            setUploadRulesModal((prev) => ({ ...prev, isOpen: false }));
            if (uploadRulesModal.type === 'file') {
              fileInputRef.current?.click();
            } else if (uploadRulesModal.type === 'folder') {
              folderInputRef.current?.click();
            } else {
              zipInputRef.current?.click();
            }
          }}
          type={uploadRulesModal.type}
        />
      </main>
    </TooltipProvider>
  );
}
