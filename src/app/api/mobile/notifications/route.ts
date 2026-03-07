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

        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
                interaction: {
                    include: {
                        tag: {
                            include: {
                                asset: {
                                    select: { name: true, type: true },
                                }
                            }
                        }
                    }
                }
            },
        });

        const formattedNotifications = notifications.map(n => ({
            id: n.id,
            title: n.title,
            body: n.body,
            type: n.type,
            isRead: n.isRead,
            createdAt: n.createdAt,
            asset: n.interaction?.tag?.asset || null,
            tagCode: n.interaction?.tag?.shortCode || null,
        }));

        const unreadCount = formattedNotifications.filter(n => !n.isRead).length;

        return NextResponse.json({
            success: true,
            notifications: formattedNotifications,
            unreadCount,
        });
    } catch (error) {
        console.error("[mobile-notifications] GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
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
