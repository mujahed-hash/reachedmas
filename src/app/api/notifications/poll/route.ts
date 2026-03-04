import { getSessionFromRequest } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ unreadCount: 0, notifications: [] });
        }

        const notifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id,
                isRead: false,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: {
                interaction: {
                    include: {
                        tag: {
                            include: {
                                asset: {
                                    select: { name: true, subtitle: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            unreadCount: notifications.length,
            notifications: notifications.map((n) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                body: n.body,
                createdAt: n.createdAt,
                asset: n.interaction?.tag?.asset
                    ? `${n.interaction.tag.asset.name} ${n.interaction.tag.asset.subtitle || ""}`.trim()
                    : "Unknown asset",
                tagCode: n.interaction?.tag?.shortCode || "N/A",
            })),
        });
    } catch (error) {
        console.error("Notification poll error:", error);
        return NextResponse.json({ unreadCount: 0, notifications: [] });
    }
}
