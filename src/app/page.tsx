import LandingContent from '@/app/LandingContent';
import { auth } from '@/lib/auth';

export default async function LandingPage(): Promise<React.JSX.Element> {
  const session = await auth();

  return <LandingContent session={session} />;
}
