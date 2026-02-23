/**
 * @file middleware.ts
 * @module middleware
 * @description NextAuth middleware for route protection
 * @author BharatERP
 * @created 2025-02-23
 */

import { auth } from "@/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isSignedIn = !!req.auth;

  const isAuthRoute =
    nextUrl.pathname.startsWith("/agency/sign-in") ||
    nextUrl.pathname.startsWith("/agency/sign-up");
  const isPublicRoute = nextUrl.pathname.startsWith("/site") || nextUrl.pathname === "/";

  if (isAuthRoute) {
    if (isSignedIn) {
      return Response.redirect(new URL("/agency", nextUrl));
    }
    return;
  }

  if (nextUrl.pathname.startsWith("/agency") && !isSignedIn) {
    return Response.redirect(new URL("/agency/sign-in", nextUrl));
  }

  return;
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
