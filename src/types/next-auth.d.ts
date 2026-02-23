/**
 * @file next-auth.d.ts
 * @module types
 * @description NextAuth session and JWT type extensions
 * @author BharatERP
 * @created 2025-02-23
 */

import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
