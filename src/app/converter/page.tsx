import { Metadata } from "next";
import { auth } from "@/lib/auth";

import { redirect } from "next/navigation";
import ConverterWrapper from "./ConverterWrapper";
    
export const metadata: Metadata = {
  title: "Markify - Converter",
  description: "Advanced Markdown to PDF conversion pipeline",
};


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
