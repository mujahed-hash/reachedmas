import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const assetId = req.nextUrl.searchParams.get("assetId") || req.nextUrl.searchParams.get("vehicleId");
        if (!assetId) {
            return NextResponse.json({ error: "Missing assetId" }, { status: 400 });
        }

        const replies = await prisma.autoReply.findMany({
            where: {
                assetId,
                asset: { ownerId: session.user.id },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, autoReplies: replies });
    } catch (error) {
        console.error("[mobile-auto-replies] GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch auto-replies" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const assetId = body.assetId || body.vehicleId;
        const { label, message } = body;

        if (!assetId || !label || !message) {
            return NextResponse.json({ success: false, message: "Label and message are required" }, { status: 400 });
        }

        if (message.length > 200) {
            return NextResponse.json({ success: false, message: "Message must be under 200 characters" }, { status: 400 });
        }

        const asset = await prisma.asset.findFirst({
            where: { id: assetId, ownerId: session.user.id },
        });
        if (!asset) return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });

        const count = await prisma.autoReply.count({ where: { assetId } });
        if (count >= 5) {
            return NextResponse.json({ success: false, message: "Maximum 5 auto-replies per asset" }, { status: 400 });
        }

        await prisma.autoReply.create({
            data: { assetId, label: label.trim(), message: message.trim() },
        });

        return NextResponse.json({ success: true, message: "Auto-reply added" });
    } catch (error) {
        console.error("[mobile-auto-replies] POST Error:", error);
        return NextResponse.json({ error: "Failed to add auto-reply" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { replyId, isActive } = body;

        if (!replyId || isActive === undefined) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const reply = await prisma.autoReply.findFirst({
            where: { id: replyId, asset: { ownerId: session.user.id } },
        });
        if (!reply) return NextResponse.json({ success: false, message: "Reply not found" }, { status: 404 });

        await prisma.autoReply.update({
            where: { id: replyId },
            data: { isActive },
        });

        return NextResponse.json({ success: true, message: isActive ? "Auto-reply enabled" : "Auto-reply disabled" });
    } catch (error) {
        console.error("[mobile-auto-replies] PUT Error:", error);
        return NextResponse.json({ error: "Failed to update auto-reply" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { replyId } = body;

        if (!replyId) {
            return NextResponse.json({ error: "Missing replyId" }, { status: 400 });
        }

        const reply = await prisma.autoReply.findFirst({
            where: { id: replyId, asset: { ownerId: session.user.id } },
        });
        if (!reply) return NextResponse.json({ success: false, message: "Reply not found" }, { status: 404 });

        await prisma.autoReply.delete({ where: { id: replyId } });

        return NextResponse.json({ success: true, message: "Auto-reply deleted" });
    } catch (error) {
        console.error("[mobile-auto-replies] DELETE Error:", error);
        return NextResponse.json({ error: "Failed to delete auto-reply" }, { status: 500 });
    }
}
