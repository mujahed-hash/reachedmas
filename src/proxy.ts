import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth(async (req) => {
    const url = req.nextUrl;
    const host = req.headers.get("host") || "";
    const pathname = url.pathname;

    // Create a new headers object to pass data to RSC
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-path", pathname);

    // 1. Redirect reachmasked.com/admin to admin.reachmasked.com
    if (host === "reachmasked.com" && pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL(`https://admin.reachmasked.com${pathname.replace("/admin", "")}`, req.url));
    }

    // 2. Handle admin subdomain — STRICT WHITELIST
    if (host.startsWith("admin.")) {
        // Strip /admin prefix if present (legacy links)
        const cleanPath = pathname.startsWith("/admin") ? pathname.replace("/admin", "") || "/" : pathname;

        // WHITELIST: Only these paths are valid on the admin subdomain
        const isUserDetail = cleanPath.startsWith("/users/") && cleanPath.split("/").length >= 3;
        const allowedAdminPaths = ["/", "/users", "/tags", "/analytics", "/setup", "/login", "/stickers", "/settings"];
        const isAllowed = allowedAdminPaths.some(p => cleanPath === p) || isUserDetail;

        // BLOCK: Any path not in the whitelist → redirect to admin root
        if (!isAllowed) {
            console.log(`[PROXY_DEBUG] Blocked path: ${cleanPath}. Redirecting home.`);
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
        return NextResponse.rewrite(new URL(internalPath, req.url), {
            request: {
                headers: requestHeaders,
            }
        });
    }

    // 4. Default Authentication Guard (for main domain)
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

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        }
    });
});

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
