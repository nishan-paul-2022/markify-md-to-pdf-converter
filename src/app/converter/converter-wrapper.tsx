'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const ConverterClient = dynamic<{ user: User }>(
  () => import('@/components/converter/converter-client'),
  { ssr: false },
);

export default function ConverterWrapper({ user }: { user: User }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
          Loading pipeline...
        </div>
      }
    >
      <ConverterClient user={user} />
    </Suspense>
  );
}
