import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BatchWrapper from "./BatchWrapper";

export default async function BatchConverterPage(): Promise<React.JSX.Element> {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  return <BatchWrapper user={user} />;
}
