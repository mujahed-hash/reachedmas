import { NextRequest, NextResponse } from "next/server";

// Simple server-side proxy for the QR code image so the browser canvas can draw
// it without CORS restrictions.
export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url");
    if (!url) return new NextResponse("Missing url", { status: 400 });

    try {
        const upstream = await fetch(url, { cache: "force-cache" });
        const buf = await upstream.arrayBuffer();
        return new NextResponse(buf, {
            headers: {
                "Content-Type": upstream.headers.get("Content-Type") ?? "image/png",
                "Cache-Control": "public, max-age=86400",
                "Access-Control-Allow-Origin": "*",
            },
        });
    } catch {
        return new NextResponse("Failed to fetch", { status: 502 });
    }
}
