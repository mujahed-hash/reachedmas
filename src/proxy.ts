/**
 * NextAuth v5 Proxy (formerly middleware) for route protection.
 * Runs at the edge before any page or API route is executed,
 * providing a hard server-side guard against unauthenticated access.
 *
 * Protected routes: /dashboard, /settings, /admin, /notifications
 * Public routes: /, /login, /register, /t/[shortCode], /api/auth, /privacy, /terms
 */
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    const session = await auth();

    if (!session) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/settings/:path*",
        "/notifications/:path*",
        "/admin/:path*",
    ],
};
