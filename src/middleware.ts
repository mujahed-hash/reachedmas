import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Create a new headers object and set the current path
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-path", path);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

// Only run middleware on admin routes to keep it light
export const config = {
    matcher: ["/admin/:path*", "/login", "/setup"],
};
