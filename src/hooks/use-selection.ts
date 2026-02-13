import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook to manage multi-selection state with localStorage persistence.
 * Follows Guideline 6 (Logic Extraction).
 */
export function useSelection(storageKey: string) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') { return new Set(); }
    const savedIds = localStorage.getItem(`${storageKey}_selected_ids`);
    if (savedIds) {
      try {
        const ids = JSON.parse(savedIds);
        if (Array.isArray(ids)) {
          return new Set(ids);
        }
      } catch (e) {
        console.error('Failed to parse saved selection IDs', e);
      }
    }
    return new Set();
  });

  const [isSelectionMode, setIsSelectionMode] = useState(() => {
    if (typeof window === 'undefined') { return false; }
    const savedMode = localStorage.getItem(`${storageKey}_selection_mode`);
    return savedMode === 'true';
  });

  const isInitialized = useRef(false);

  // Mark as initialized on mount
  useEffect(() => {
    isInitialized.current = true;
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!isInitialized.current) { return; }
    localStorage.setItem(`${storageKey}_selected_ids`, JSON.stringify(Array.from(selectedIds)));
  }, [selectedIds, storageKey]);

  useEffect(() => {
    if (!isInitialized.current) { return; }
    localStorage.setItem(`${storageKey}_selection_mode`, String(isSelectionMode));
  }, [isSelectionMode, storageKey]);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      const next = !prev;
      if (!next) {
        setSelectedIds(new Set());
      }
      return next;
    });
  }, []);

  const toggleId = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    isSelectionMode,
    toggleSelectionMode,
    toggleId,
    selectAll,
    clearSelection,
    setSelectedIds
  };
}
