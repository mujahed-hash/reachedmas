import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/mobile-auth";
import { generateShortCode } from "@/lib/utils";

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { type = "CAR", name, subtitle, metadata } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, message: "Name is required" },
                { status: 400 }
            );
        }

        // Enforce plan limits
        const existingCount = await prisma.asset.count({
            where: { ownerId: session.user.id },
        });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { plan: true },
        });

        if (!user || user.plan === "FREE") {
            return NextResponse.json(
                {
                    success: false,
                    message: "A paid plan is required to add your first tag. Upgrade to continue.",
                },
                { status: 403 }
            );
        }

        const limit = user.plan === "PREMIUM" ? 1 : 0;

        if (existingCount >= limit) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Your ${user.plan} plan supports up to ${limit} asset(s). Upgrade to add more.`,
                },
                { status: 403 }
            );
        }

        let shortCode = generateShortCode();
        let attempts = 0;
        while (attempts < 10) {
            const existing = await prisma.tag.findUnique({ where: { shortCode } });
            if (!existing) break;
            shortCode = generateShortCode();
            attempts++;
        }

        const asset = await prisma.asset.create({
            data: {
                ownerId: session.user.id,
                type,
                name,
                subtitle: subtitle || null,
                metadata: metadata ? JSON.stringify(metadata) : null,
                tags: {
                    create: {
                        shortCode,
                        status: "ACTIVE",
                    },
                },
            },
            include: { tags: true },
        });

        return NextResponse.json({
            success: true,
            message: `Asset added with tag code: ${shortCode}`,
            assetId: asset.id,
            asset,
        });
    } catch (error) {
        console.error("[mobile-assets] POST Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to add asset" },
            { status: 500 }
        );
    }
}
