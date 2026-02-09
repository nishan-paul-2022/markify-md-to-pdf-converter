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
      console.log(`📂 Fetched ${data.files.length} files from API`);
      
      // Create the default folder structure
      const defaultProjectFiles: File[] = [
        {
          id: "default-md",
          filename: "sample-document.md",
          originalName: "sample-document.md",
          mimeType: "text/markdown",
          size: 0,
          url: "/content-3/sample-document.md",
          relativePath: "Sample Project/sample-document.md",
          batchId: "default-sample-project",
          createdAt: new Date().toISOString()
        },
        // Adding a few sample images to represent the images folder
        {
          id: "default-img-1",
          filename: "img-019-email-script.png",
          originalName: "img-019-email-script.png",
          mimeType: "image/png",
          size: 0,
          url: "/content-3/images/img-019-email-script.png",
          relativePath: "Sample Project/images/img-019-email-script.png",
          batchId: "default-sample-project",
          createdAt: new Date().toISOString()
        },
        {
          id: "default-img-2",
          filename: "img-020-phishing-email.png",
          originalName: "img-020-phishing-email.png",
          mimeType: "image/png",
          size: 0,
          url: "/content-3/images/img-020-phishing-email.png",
          relativePath: "Sample Project/images/img-020-phishing-email.png",
          batchId: "default-sample-project",
          createdAt: new Date().toISOString()
        }
      ];

      setFiles([...defaultProjectFiles, ...data.files]);
    } catch (error: unknown) {
      console.error("Error fetching files:", error);
      // Fallback structure on error
      setFiles([
        {
          id: "default-md",
          filename: "sample-document.md",
          originalName: "sample-document.md",
          mimeType: "text/markdown",
          size: 0,
          url: "/content-3/sample-document.md",
          relativePath: "Sample Project/sample-document.md",
          batchId: "default-sample-project",
          createdAt: new Date().toISOString()
        },
        {
          id: "default-img-1",
          filename: "img-019-email-script.png",
          originalName: "img-019-email-script.png",
          mimeType: "image/png",
          size: 0,
          url: "/content-3/images/img-019-email-script.png",
          relativePath: "Sample Project/images/img-019-email-script.png",
          batchId: "default-sample-project",
          createdAt: new Date().toISOString()
        }
      ]);
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
