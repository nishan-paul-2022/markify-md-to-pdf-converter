'use client';

import dynamic from 'next/dynamic';

const ConverterClient = dynamic(() => import('@/components/converter/EditorClient'), {
  ssr: false,
});

export default ConverterClient;
