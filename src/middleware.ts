import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/forgot-password/sent",
  "/auth/reset-password",
  "/auth/verify",
  "/auth/client-onboarding",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Assign or propagate correlation Request ID
  const requestId =
    request.headers.get("x-request-id") ||
    `req_${Math.random().toString(36).substring(2, 12)}`;

  // 2. Allow public static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    const response = NextResponse.next();
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // 3. Unauthenticated user trying to access protected workspace routes
  if (!sessionToken && !isPublicPath) {
    const loginUrl = new URL("/auth/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // 4. Authenticated user visiting login/signup -> redirect to dashboard
  if (sessionToken && isPublicPath && pathname !== "/auth/client-onboarding") {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    response.headers.set("x-request-id", requestId);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
