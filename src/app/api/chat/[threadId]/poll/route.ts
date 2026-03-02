import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/chat/[threadId]/poll — Poll for new messages in a chat thread
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ threadId: string }> }
) {
    try {
        const { threadId } = await params;

        // Get the 'after' cursor (ISO timestamp) for incremental polling
        const after = req.nextUrl.searchParams.get("after");

        const messages = await prisma.chatMessage.findMany({
            where: {
                threadId,
                ...(after ? { createdAt: { gt: new Date(after) } } : {}),
            },
            orderBy: { createdAt: "asc" },
            take: 50,
            select: {
                id: true,
                sender: true,
                text: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ messages });
    } catch (error) {
        console.error("Error polling chat messages:", error);
        return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 }
        );
    }
}
