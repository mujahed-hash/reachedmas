import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// GET /api/mobile/dashboard — Mobile-optimized dashboard data
export async function GET(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Fetch assets with tags
        const assets = await prisma.asset.findMany({
            where: { ownerId: userId },
            include: {
                tags: {
                    select: {
                        id: true,
                        shortCode: true,
                        label: true,
                        status: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Recent notifications (unread first)
        const recentNotifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
                id: true,
                type: true,
                title: true,
                body: true,
                isRead: true,
                createdAt: true,
            },
        });

        // Stats
        const totalScans = await prisma.interaction.count({
            where: {
                tag: {
                    asset: { ownerId: userId },
                },
            },
        });

        const activeTags = assets.reduce(
            (sum, a) => sum + a.tags.filter((t) => t.status === "ACTIVE").length,
            0
        );

        return NextResponse.json({
            // Keep backward compat: send both `vehicles` and `assets`
            vehicles: assets,
            assets,
            recentNotifications,
            stats: {
                totalScans,
                activeTags,
                vehicleCount: assets.length,
                assetCount: assets.length,
            },
        });
    } catch (error) {
        console.error("Error fetching mobile dashboard:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard data" },
            { status: 500 }
        );
    }
}
