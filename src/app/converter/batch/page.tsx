import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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

export default async function BatchConverterPage(): Promise<React.JSX.Element> {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return <BatchConverterClient user={session.user} />;
}
