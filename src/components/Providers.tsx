'use client';

import { SessionProvider } from 'next-auth/react';

import { AlertProvider } from '@/components/AlertProvider';

export default function Providers({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <SessionProvider>
      <AlertProvider>{children}</AlertProvider>
    </SessionProvider>
  );
}
