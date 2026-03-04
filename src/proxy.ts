import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth(async (req) => {
    const url = req.nextUrl;
    const host = req.headers.get("host") || "";
    const pathname = url.pathname;

    // 1. Redirect reachmasked.com/admin to admin.reachmasked.com
    if (host === "reachmasked.com" && pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL(`https://admin.reachmasked.com${pathname.replace("/admin", "")}`, req.url));
    }

    // 2. Handle admin subdomain
    if (host.startsWith("admin.")) {
        // If they still access /admin/..., strip it to avoid /admin/admin internally
        if (pathname.startsWith("/admin")) {
            return NextResponse.redirect(new URL(pathname.replace("/admin", "") || "/", req.url));
        }

        // Allow login page to be shared but rewrite to admin-specific version
        if (pathname === "/login") {
            return NextResponse.rewrite(new URL("/admin/login", req.url));
        }

        // Internal rewrite to /admin
        return NextResponse.rewrite(new URL(`/admin${pathname === "/" ? "" : pathname}`, req.url));
    }

    // Authentication Guard
    const session = req.auth;
    const isProtected = [
        "/dashboard",
        "/settings",
        "/notifications",
        "/admin",
    ].some(path => pathname.startsWith(path));

    if (isProtected && !session) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
