import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  relativePath?: string;
  batchId?: string;
  createdAt: string;
}

interface FileListResponse {
  files: File[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useFiles() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFiles = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch("/api/files?limit=100");
      if (!response.ok) {
        let errorDetail = "";
        try {
          const errorData = await response.json();
          errorDetail = errorData.details || errorData.error || "";
        } catch {
          // Fallback if not JSON
        }
        throw new Error(errorDetail || `Failed to fetch files (Status: ${response.status})`);
      }
      
      const data: FileListResponse = await response.json();
      console.log(`📂 Fetched ${data.files.length} files from API (including defaults)`);
      
      setFiles(data.files);
    } catch (error: unknown) {
      console.error("Error fetching files:", error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDelete = useCallback(async (id: string): Promise<void> => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/files/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete file");
      }

      setFiles((prev) => prev.filter((file) => file.id !== id));
      router.refresh();
    } catch (error: unknown) {
      console.error("Delete error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete file");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }, [router]);

  return {
    files,
    loading,
    deleteId,
    deleting,
    setDeleteId,
    handleDelete,
    refreshFiles: fetchFiles
  };
}
