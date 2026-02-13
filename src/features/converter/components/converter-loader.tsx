'use client';

import dynamic from 'next/dynamic';

const ConverterClient = dynamic(() => import('@/features/editor/components/editor-client'), {
  ssr: false,
});

export default ConverterClient;
