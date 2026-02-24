import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const query = url.searchParams.toString();
  const pathWithSearchParams = `${pathname}${query ? `?${query}` : ""}`;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const host = req.headers.get("host") ?? "";
  const domain = process.env.NEXT_PUBLIC_DOMAIN;
  const customSubDomain = domain
    ? host
        .split(domain)
        .filter(Boolean)[0]
        ?.replace(/\.$/, "")
    : undefined;

  if (customSubDomain) {
    return NextResponse.rewrite(
      new URL(`/${customSubDomain}${pathWithSearchParams}`, req.url)
    );
  }

  if (pathname === "/sign-in" || pathname === "/sign-up") {
    return NextResponse.redirect(new URL("/agency/sign-in", req.url));
  }

  if (
    pathname === "/" ||
    (pathname === "/site" && url.host === process.env.NEXT_PUBLIC_DOMAIN)
  ) {
    return NextResponse.rewrite(new URL("/site", req.url));
  }

  const isAgencyAuthRoute =
    pathname.startsWith("/agency/sign-in") ||
    pathname.startsWith("/agency/sign-up") ||
    pathname.startsWith("/agency/reset-password");
  const isProtectedRoute =
    pathname.startsWith("/agency") || pathname.startsWith("/subaccount");
  const isAuthenticated = Boolean(req.auth?.user);

  if (isProtectedRoute && !isAgencyAuthRoute && !isAuthenticated) {
    const signInUrl = new URL("/agency/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathWithSearchParams);
    return NextResponse.redirect(signInUrl);
  }

  if (isProtectedRoute) {
    return NextResponse.rewrite(new URL(pathWithSearchParams, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
