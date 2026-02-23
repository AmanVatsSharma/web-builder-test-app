/**
 * @file page.tsx
 * @module app
 * @description Root page - redirects based on auth state
 * @author BharatERP
 * @created 2025-02-23
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();
  if (!session?.user) return redirect("/site");
  if (session.user) return redirect("/agency");
  return <div>main page</div>;
};

export default Page;
