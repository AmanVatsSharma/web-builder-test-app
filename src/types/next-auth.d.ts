/**
 * @file next-auth.d.ts
 * @module types
 * @description NextAuth session and JWT type extensions
 * @author BharatERP
 * @created 2025-02-23
 */

import "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: Role;
    };
  }

  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
