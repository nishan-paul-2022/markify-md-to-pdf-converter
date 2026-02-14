import type { Metadata } from '@/constants/default-content';

export const PdfApiService = {
  generate: async (params: {
    markdown: string;
    metadata: Metadata;
    saveToServer?: boolean;
    sourceFileId?: string;
  }) => {
    // Generate PDF returns a blob, so we use fetch directly or handle it in client
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to generate PDF' }));
      throw new Error(error.error || 'Failed to generate PDF');
    }

    return response.blob();
  },
};
