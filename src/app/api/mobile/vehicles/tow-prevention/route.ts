import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { vehicleId, assetId, enabled } = body;
        const targetId = assetId || vehicleId;

        if (!targetId || enabled === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const asset = await prisma.asset.findFirst({
            where: { id: targetId, ownerId: session.user.id },
        });

        if (!asset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        await prisma.asset.update({
            where: { id: targetId },
            data: { towPreventionMode: enabled },
        });

        return NextResponse.json({
            success: true,
            message: enabled ? "Tow-prevention mode enabled" : "Tow-prevention mode disabled",
        });
    } catch (error) {
        console.error("[mobile-tow-prevention] POST Error:", error);
        return NextResponse.json({ error: "Failed to update tow prevention mode" }, { status: 500 });
    }
}
