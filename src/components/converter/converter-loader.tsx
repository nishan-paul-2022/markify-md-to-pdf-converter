'use client';

import dynamic from 'next/dynamic';

const ConverterClient = dynamic(() => import('@/components/converter/editor-client'), {
  ssr: false,
});

export default ConverterClient;
