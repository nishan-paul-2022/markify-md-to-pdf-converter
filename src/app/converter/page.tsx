import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ConverterWrapper from "./ConverterWrapper";

export default async function ConverterPage(): Promise<React.JSX.Element> {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  return <ConverterWrapper user={user} />;
}
