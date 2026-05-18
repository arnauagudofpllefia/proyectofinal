import { NextResponse } from "next/server";

const PUBLIC_ROUTES = new Set(["/login", "/register"]);

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;
  const isAuthenticated = Boolean(token);
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};