'use client';

import dynamic from 'next/dynamic';

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const BatchConverterClient = dynamic<{ user: User }>(
  () => import('@/components/converter/BatchConverterClient'),
  { ssr: false }
);

export default function BatchWrapper({ user }: { user: User }) {
  return <BatchConverterClient user={user} />;
}
