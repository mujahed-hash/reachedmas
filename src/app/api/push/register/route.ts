import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/push/register — Save device push token
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { token, platform } = await req.json();

        if (!token || !platform) {
            return NextResponse.json(
                { error: "token and platform are required" },
                { status: 400 }
            );
        }

        if (!["ios", "android"].includes(platform)) {
            return NextResponse.json(
                { error: "platform must be 'ios' or 'android'" },
                { status: 400 }
            );
        }

        // Upsert: update userId if token already exists, or create new
        await prisma.pushToken.upsert({
            where: { token },
            update: { userId: session.user.id, platform },
            create: {
                userId: session.user.id,
                token,
                platform,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error registering push token:", error);
        return NextResponse.json(
            { error: "Failed to register push token" },
            { status: 500 }
        );
    }
}
