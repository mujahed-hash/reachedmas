import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { tagId, status, label } = body;

        if (!tagId) {
            return NextResponse.json({ error: "Missing tagId" }, { status: 400 });
        }

        const tag = await prisma.tag.findFirst({
            where: {
                id: tagId,
                asset: { ownerId: session.user.id },
            },
        });

        if (!tag) {
            return NextResponse.json({ error: "Tag not found" }, { status: 404 });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (label !== undefined) updateData.label = label.trim() || null;

        await prisma.tag.update({
            where: { id: tagId },
            data: updateData,
        });

        return NextResponse.json({ success: true, message: "Tag updated" });
    } catch (error) {
        console.error("[mobile-tags] POST Error:", error);
        return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
    }
}
