import type { Metadata } from '@/constants/default-content';
import { DEFAULT_METADATA } from '@/constants/default-content';
import type { AppFile } from '@/features/file-management/hooks/use-files';

import { create } from 'zustand';

interface EditorState {
  // --- Content Store ---
  rawContent: string;
  content: string;
  metadata: Metadata;
  filename: string;
  tempFilename: string;
  originalContent: string;

  // --- UI State ---
  activeTab: 'editor' | 'preview';
  isSidebarOpen: boolean;
  isEditingTitle: boolean;
  isLoading: boolean;
  isGenerating: boolean;
  isUploaded: boolean;
  isReset: boolean;
  isCopied: boolean;
  isDownloaded: boolean;
  isPdfDownloaded: boolean;
  activeImage: AppFile | null;
  imageGallery: AppFile[];

  // --- File System ---
  selectedFileId: string | null;
  basePath: string;
  isSelectionMode: boolean;
  selectedIds: Set<string>;

  // --- Actions ---
  setRawContent: (content: string) => void;
  setContent: (content: string) => void;
  setMetadata: (metadata: Metadata) => void;
  setFilename: (name: string) => void;
  setTempFilename: (name: string) => void;
  setOriginalContent: (content: string) => void;
  setActiveTab: (tab: 'editor' | 'preview') => void;
  setIsSidebarOpen: (open: boolean) => void;
  setIsEditingTitle: (editing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsGenerating: (generating: boolean) => void;
  setIsUploaded: (uploaded: boolean) => void;
  setIsReset: (reset: boolean) => void;
  setIsCopied: (copied: boolean) => void;
  setIsDownloaded: (downloaded: boolean) => void;
  setIsPdfDownloaded: (pdfDownloaded: boolean) => void;
  setSelectedFileId: (id: string | null) => void;
  setBasePath: (path: string) => void;
  setActiveImage: (image: AppFile | null) => void;
  setImageGallery: (images: AppFile[]) => void;
  setIsSelectionMode: (mode: boolean) => void;
  setSelectedIds: (ids: Set<string>) => void;
  toggleSelection: (id: string | string[]) => void;

  // Computed Stats
  getStats: () => { chars: number; words: number };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Defaults
  rawContent: '',
  content: '',
  metadata: DEFAULT_METADATA,
  filename: 'document.md',
  tempFilename: '',
  originalContent: '',
  activeTab: 'editor',
  isSidebarOpen: true,
  isEditingTitle: false,
  isLoading: true,
  isGenerating: false,
  isUploaded: false,
  isReset: false,
  isCopied: false,
  isDownloaded: false,
  isPdfDownloaded: false,
  selectedFileId: null,
  basePath: '',
  activeImage: null,
  imageGallery: [],
  isSelectionMode: false,
  selectedIds: new Set(),

  // Actions
  setRawContent: (rawContent) => set({ rawContent }),
  setContent: (content) => set({ content }),
  setMetadata: (metadata) => set({ metadata }),
  setFilename: (filename) => set({ filename }),
  setTempFilename: (tempFilename) => set({ tempFilename }),
  setOriginalContent: (originalContent) => set({ originalContent }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setIsEditingTitle: (isEditingTitle) => set({ isEditingTitle }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setIsUploaded: (isUploaded) => set({ isUploaded }),
  setIsReset: (isReset) => set({ isReset }),
  setIsCopied: (isCopied) => set({ isCopied }),
  setIsDownloaded: (isDownloaded) => set({ isDownloaded }),
  setIsPdfDownloaded: (isPdfDownloaded) => set({ isPdfDownloaded }),
  setSelectedFileId: (selectedFileId) => set({ selectedFileId }),
  setBasePath: (basePath) => set({ basePath }),
  setActiveImage: (activeImage) => set({ activeImage }),
  setImageGallery: (imageGallery) => set({ imageGallery }),
  setIsSelectionMode: (isSelectionMode) => set({ isSelectionMode }),
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  toggleSelection: (id) => {
    const { selectedIds } = get();
    const next = new Set(selectedIds);
    const ids = Array.isArray(id) ? id : [id];
    const allInPrev = ids.every((i) => selectedIds.has(i));

    if (allInPrev) {
      ids.forEach((i) => next.delete(i));
    } else {
      ids.forEach((i) => next.add(i));
    }
    set({ selectedIds: next });
  },

  getStats: () => {
    const { rawContent } = get();
    const chars = rawContent.length;
    const words = rawContent.trim() ? rawContent.trim().split(/\s+/).length : 0;
    return { chars, words };
  },
}));
