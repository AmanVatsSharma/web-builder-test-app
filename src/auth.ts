/**
 * @file auth.ts
 * @module auth
 * @description NextAuth v5 configuration with Credentials provider and Prisma adapter
 * @author BharatERP
 * @created 2025-02-23
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

const authSecrets = [
  process.env.AUTH_SECRET,
  process.env.NEXTAUTH_SECRET,
  process.env.AUTH_SECRET_PREVIOUS,
].filter((secret): secret is string => Boolean(secret));

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  trustHost: true,
  secret: authSecrets.length > 1 ? authSecrets : authSecrets[0],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/agency/sign-in",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const { default: bcrypt } = await import("bcryptjs");
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image ?? user.avatarUrl ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session }) {
      if (!session.user?.email) {
        return session;
      }

      const user = await db.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          role: true,
          image: true,
          avatarUrl: true,
        },
      });

      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.image = user.image ?? user.avatarUrl ?? session.user.image;
      }

      return session;
    },
  },
});
