import type { AppFile } from '@/hooks/use-files';
import { fetchApi, fetchApiFormData } from '@/lib/api/client';

export interface FileListResponse {
  files: AppFile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const FilesService = {
  list: (source?: string, limit = 100) => {
    const queryParams = new URLSearchParams({ limit: limit.toString() });
    if (source) queryParams.append('source', source);
    return fetchApi<FileListResponse>(`/api/files?${queryParams.toString()}`);
  },

  upload: (file: File, batchId: string, relativePath: string, source = 'editor') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('batchId', batchId);
    formData.append('relativePath', relativePath);
    formData.append('source', source);
    return fetchApiFormData<AppFile>('/api/files', formData);
  },

  uploadArchive: (file: File, batchId: string, source = 'editor') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('batchId', batchId);
    formData.append('source', source);
    return fetchApiFormData<{ files: AppFile[] }>('/api/files/archive', formData);
  },

  delete: (id: string) => {
    return fetchApi<unknown>(`/api/files/${id}`, { method: 'DELETE' });
  },

  bulkDelete: (ids: string[]) => {
    return fetchApi<unknown>('/api/files', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
  },

  rename: (params: {
    id: string;
    newName: string;
    type: 'file' | 'folder';
    batchId?: string;
    oldPath?: string;
  }) => {
    return fetchApi<unknown>('/api/files', {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  },

  getContent: async (url: string) => {
    const fetchUrl = url.startsWith('/uploads/') && !url.startsWith('/api/')
      ? `/api${url}`
      : url;
    
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error('Failed to fetch file content');
    return response.text();
  }
};
