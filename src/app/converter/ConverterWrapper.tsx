'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const ConverterClient = dynamic<{ user: User }>(
  () => import('@/components/converter/ConverterClient'),
  { ssr: false }
);

export default function ConverterWrapper({ user }: { user: User }) {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white">Loading pipeline...</div>}>
      <ConverterClient user={user} />
    </Suspense>
  );
}
