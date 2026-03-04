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

    // 2. Handle admin subdomain — STRICT WHITELIST
    if (host.startsWith("admin.")) {
        // Strip /admin prefix if present (legacy links)
        const cleanPath = pathname.startsWith("/admin") ? pathname.replace("/admin", "") || "/" : pathname;

        // WHITELIST: Only these paths are valid on the admin subdomain
        const allowedAdminPaths = ["/", "/users", "/tags", "/analytics", "/setup", "/login"];
        const isAllowed = allowedAdminPaths.some(p => cleanPath === p);

        // BLOCK: Any path not in the whitelist → redirect to admin root
        // This prevents /dashboard, /pricing, /settings, etc. from ever loading
        if (!isAllowed) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        // Public paths that don't require auth
        const publicPaths = ["/login", "/setup"];
        const isPublic = publicPaths.includes(cleanPath);

        // Auth guard: unauthenticated users go to admin login
        if (!req.auth && !isPublic) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        // Rewrite to internal /admin/* file structure
        const internalPath = cleanPath === "/" ? "/admin" : `/admin${cleanPath}`;
        return NextResponse.rewrite(new URL(internalPath, req.url));
    }

    // Create response and set path header
    const response = NextResponse.next();

    // Set custom header for path detection in layouts
    response.headers.set("x-path", pathname);

    // Default Authentication Guard (for main domain)
    const session = req.auth;
    const isProtected = [
        "/dashboard",
        "/settings",
        "/notifications",
        "/admin", // This handles reachmasked.com/admin if not redirected
    ].some(path => pathname.startsWith(path));

    if (isProtected && !session) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Ensure the response from rewrites or redirects also gets the path header if needed
    // However, for rewriting, we usually return a new NextResponse.rewrite.
    // Let's ensure headers are passed where possible.

    return response;
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
