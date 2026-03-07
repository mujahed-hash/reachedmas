import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/mobile-auth";

// Fetch notifications (already exists at /api/notifications/poll but we want a better structured GET/POST)
// We will use this new route for GET (history) and POST (read)

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use a simpler query first — avoid deeply nested includes that
        // may fail if the Prisma client cache is stale on Vercel.
        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
                interaction: {
                    select: {
                        id: true,
                        actionType: true,
                        tagId: true,
                        tag: {
                            select: {
                                shortCode: true,
                                assetId: true,
                            },
                        },
                    },
                },
            },
        });

        // Build asset lookup in a second query if needed
        const assetIds = [
            ...new Set(
                notifications
                    .map((n: any) => n.interaction?.tag?.assetId)
                    .filter(Boolean)
            ),
        ];
        const assetsMap: Record<string, { name: string; type: string }> = {};
        if (assetIds.length > 0) {
            const assets = await prisma.asset.findMany({
                where: { id: { in: assetIds as string[] } },
                select: { id: true, name: true, type: true },
            });
            for (const a of assets) {
                assetsMap[a.id] = { name: a.name, type: a.type };
            }
        }

        const formattedNotifications = notifications.map((n: any) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            type: n.type,
            isRead: n.isRead,
            createdAt: n.createdAt,
            asset: n.interaction?.tag?.assetId
                ? assetsMap[n.interaction.tag.assetId] || null
                : null,
            tagCode: n.interaction?.tag?.shortCode || null,
        }));

        const unreadCount = formattedNotifications.filter((n: any) => !n.isRead).length;

        return NextResponse.json({
            success: true,
            notifications: formattedNotifications,
            unreadCount,
        });
    } catch (error: any) {
        console.error("[mobile-notifications] GET Error:", error);
        return NextResponse.json({
            error: "Failed to fetch notifications",
            detail: error?.message || String(error),
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { notificationId, markAll } = body;

        if (markAll) {
            await prisma.notification.updateMany({
                where: { userId: session.user.id, isRead: false },
                data: { isRead: true },
            });
            return NextResponse.json({ success: true, message: "All marked read" });
        }

        if (notificationId) {
            await prisma.notification.updateMany({
                where: { id: notificationId, userId: session.user.id },
                data: { isRead: true },
            });
            return NextResponse.json({ success: true, message: "Marked read" });
        }

        return NextResponse.json({ error: "Missing notificationId or markAll flag" }, { status: 400 });
    } catch (error) {
        console.error("[mobile-notifications] POST Error:", error);
        return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
    }
}
