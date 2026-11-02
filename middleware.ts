import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "luxury-rewards-super-secret-jwt-key-for-auth-and-tokens-2026"
);

const COOKIE_NAME = "luxury_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static files and internal Next.js assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/reset-password") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let sessionPayload: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY, {
        algorithms: ["HS256"],
      });
      sessionPayload = payload;
    } catch {
      // Invalid or expired token
      sessionPayload = null;
    }
  }

  // Handle Root Route "/" -> redirect to dashboard or login
  if (pathname === "/") {
    if (!sessionPayload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (sessionPayload.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (sessionPayload.role === "OPERATOR") {
      return NextResponse.redirect(new URL("/operador", request.url));
    }
    return NextResponse.redirect(new URL("/mi-cuenta", request.url));
  }

  // If visiting /login or /recuperar-password while authenticated, redirect to appropriate home
  if (pathname === "/login" || pathname === "/recuperar-password") {
    if (sessionPayload) {
      if (sessionPayload.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (sessionPayload.role === "OPERATOR") {
        return NextResponse.redirect(new URL("/operador", request.url));
      }
      return NextResponse.redirect(new URL("/mi-cuenta", request.url));
    }
    return NextResponse.next();
  }

  // Admin Routes: /admin/*
  if (pathname.startsWith("/admin")) {
    if (!sessionPayload) {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
    }
    if (sessionPayload.role !== "ADMIN") {
      // Unauthorized role
      if (sessionPayload.role === "OPERATOR") {
        return NextResponse.redirect(new URL("/operador", request.url));
      }
      return NextResponse.redirect(new URL("/mi-cuenta", request.url));
    }
    return NextResponse.next();
  }

  // Operator Routes: /operador/*
  if (pathname.startsWith("/operador")) {
    if (!sessionPayload) {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
    }
    if (sessionPayload.role !== "OPERATOR" && sessionPayload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/mi-cuenta", request.url));
    }
    return NextResponse.next();
  }

  // Customer Routes: /mi-cuenta/*
  if (pathname.startsWith("/mi-cuenta")) {
    if (!sessionPayload) {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

