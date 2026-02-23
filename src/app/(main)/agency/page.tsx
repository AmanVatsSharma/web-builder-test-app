/**
 * @file page.tsx
 * @module agency
 * @description Agency dashboard page - protected route
 * @author BharatERP
 * @created 2025-02-23
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();
  if (!session?.user) return redirect("/agency/sign-in");

  return <div>agency page</div>;
};

export default Page;
