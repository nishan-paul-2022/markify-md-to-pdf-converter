'use client';

import React from 'react';

import { FileUploadView } from '@/features/file-management/components/file-upload-view';
import { useUpload } from '@/features/converter/hooks/use-upload';

export default function FileUpload(): React.JSX.Element {
  const uploadState = useUpload();

  return <FileUploadView {...uploadState} />;
}
