import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/chat/send — Send a chat message (scanner or owner)
export async function POST(req: NextRequest) {
    try {
        const { threadId, interactionId, sender, text } = await req.json();

        if (!sender || !text) {
            return NextResponse.json(
                { error: "sender and text are required" },
                { status: 400 }
            );
        }

        if (!["SCANNER", "OWNER"].includes(sender)) {
            return NextResponse.json(
                { error: "sender must be 'SCANNER' or 'OWNER'" },
                { status: 400 }
            );
        }

        // Get or create thread
        let thread;
        if (threadId) {
            thread = await prisma.chatThread.findUnique({
                where: { id: threadId },
            });
        } else if (interactionId) {
            // Create thread for this interaction if it doesn't exist
            thread = await prisma.chatThread.upsert({
                where: { interactionId },
                update: {},
                create: { interactionId },
            });
        }

        if (!thread) {
            return NextResponse.json(
                { error: "Thread not found. Provide threadId or interactionId." },
                { status: 404 }
            );
        }

        // Create message
        const message = await prisma.chatMessage.create({
            data: {
                threadId: thread.id,
                sender,
                text: text.slice(0, 500), // Limit message length
            },
        });

        return NextResponse.json({
            success: true,
            threadId: thread.id,
            message: {
                id: message.id,
                sender: message.sender,
                text: message.text,
                createdAt: message.createdAt,
            },
        });
    } catch (error) {
        console.error("Error sending chat message:", error);
        return NextResponse.json(
            { error: "Failed to send message" },
            { status: 500 }
        );
    }
}
