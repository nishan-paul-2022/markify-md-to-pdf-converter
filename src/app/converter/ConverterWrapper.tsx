'use client';

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
  return <ConverterClient user={user} />;
}
