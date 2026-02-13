import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import ConverterLoader from '@/components/converter/ConverterLoader';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Markify - Editor',
  description: 'Craft pixel-perfect Markdown documents',
};

export default async function EditorPage(): Promise<React.JSX.Element> {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  return <ConverterLoader user={session.user} />;
}
