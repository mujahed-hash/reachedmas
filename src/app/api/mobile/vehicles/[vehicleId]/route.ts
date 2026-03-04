import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/mobile-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ vehicleId: string }> }) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { vehicleId: assetId } = await params;

        const asset = await prisma.asset.findFirst({
            where: { id: assetId, ownerId: session.user.id },
            include: { tags: true },
        });

        if (!asset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        const autoReplies = await prisma.autoReply.findMany({
            where: { assetId },
            orderBy: { createdAt: "desc" },
        });

        const tagIds = asset.tags.map((t) => t.id);
        const interactions = await prisma.interaction.findMany({
            where: { tagId: { in: tagIds } },
            orderBy: { timestamp: "desc" },
            take: 100,
            include: {
                tag: { select: { shortCode: true } },
            },
        });

        return NextResponse.json({
            success: true,
            vehicle: asset,
            asset,
            autoReplies,
            interactions,
        });
    } catch (error) {
        console.error("[mobile-asset-detail] GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch asset" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ vehicleId: string }> }) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { vehicleId: assetId } = await params;

        const asset = await prisma.asset.findFirst({
            where: { id: assetId, ownerId: session.user.id },
        });

        if (!asset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        await prisma.asset.delete({ where: { id: assetId } });

        return NextResponse.json({ success: true, message: "Asset deleted" });
    } catch (error) {
        console.error("[mobile-asset-detail] DELETE Error:", error);
        return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
    }
}
