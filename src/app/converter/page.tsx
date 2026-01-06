import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ConverterClient from "@/components/ConverterClient";

export default async function ConverterPage(): Promise<React.JSX.Element> {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return <ConverterClient user={session.user} />;
}
