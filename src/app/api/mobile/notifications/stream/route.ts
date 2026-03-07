import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/mobile-auth";
import { notificationEmitter, NotificationEvent } from "@/lib/notification-emitter";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const session = await getSessionFromRequest(req);
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            // 1. Send initial unread notifications on connect
            sendInitialNotifications(userId, controller, encoder);

            // 2. Listen for real-time events via EventEmitter
            const handler = (notification: NotificationEvent) => {
                try {
                    const data = `data: ${JSON.stringify(notification)}\n\n`;
                    controller.enqueue(encoder.encode(data));
                } catch (err) {
                    console.error("[MOBILE-SSE] Error enqueuing notification:", err);
                }
            };

            notificationEmitter.on(`notification:${userId}`, handler);

            // 3. Heartbeat every 20s to keep mobile connection alive (more aggressive than web)
            const heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(": heartbeat\n\n"));
                } catch {
                    clearInterval(heartbeat);
                }
            }, 20000);

            // 4. Cleanup on close
            req.signal.addEventListener("abort", () => {
                notificationEmitter.off(`notification:${userId}`, handler);
                clearInterval(heartbeat);
                try { controller.close(); } catch { /* already closed */ }
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", // Disable Nginx buffering
        },
    });
}

async function sendInitialNotifications(
    userId: string,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder
) {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId, isRead: false },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
                interaction: {
                    include: {
                        tag: {
                            include: {
                                asset: { select: { name: true, subtitle: true, type: true } },
                            },
                        },
                    },
                },
            },
        });

        const initial = {
            type: "initial",
            unreadCount: notifications.length,
            notifications: notifications.map((n) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                body: n.body,
                asset: n.interaction?.tag?.asset
                    ? `${n.interaction.tag.asset.name} ${n.interaction.tag.asset.subtitle || ""}`.trim()
                    : "Unknown asset",
                tagCode: n.interaction?.tag?.shortCode || "N/A",
                createdAt: n.createdAt.toISOString(),
            })),
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initial)}\n\n`));
    } catch (error) {
        console.error("[MOBILE-SSE] Error sending initial notifications:", error);
    }
}
