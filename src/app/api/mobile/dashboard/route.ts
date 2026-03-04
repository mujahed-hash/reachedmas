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

        // Fetch vehicle with tags and recent interactions
        const vehicles = await prisma.vehicle.findMany({
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
        });

        // Recent notifications (unread first)
        const notifications = await prisma.notification.findMany({
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
                interactionId: true,
            },
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false },
        });

        // Stats
        const totalScans = await prisma.interaction.count({
            where: {
                tag: {
                    vehicle: { ownerId: userId },
                },
            },
        });

        return NextResponse.json({
            vehicles,
            notifications,
            unreadCount,
            stats: {
                totalScans,
                totalVehicles: vehicles.length,
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
