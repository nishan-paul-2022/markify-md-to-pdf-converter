'use client';

import dynamic from 'next/dynamic';

const ConverterClient = dynamic(
  () => import('@/components/converter/ConverterClient'),
  { ssr: false }
);

export default ConverterClient;
