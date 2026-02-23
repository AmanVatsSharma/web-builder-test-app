/**
 * @file session-provider.tsx
 * @module providers
 * @description SessionProvider wrapper for NextAuth client-side session access
 * @author BharatERP
 * @created 2025-02-23
 */

"use client";

import { SessionProvider } from "next-auth/react";

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
