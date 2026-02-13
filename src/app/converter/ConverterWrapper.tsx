import dynamic from 'next/dynamic';
import { Suspense } from 'react';

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
