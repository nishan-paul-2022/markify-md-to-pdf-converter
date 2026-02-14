'use client';

import React from 'react';

import { useUpload } from '@/features/converter/hooks/use-upload';
import { FileUploadView } from '@/features/file-management/components/file-upload-view';

export default function FileUpload(): React.JSX.Element {
  const uploadState = useUpload();

  return <FileUploadView {...uploadState} />;
}
