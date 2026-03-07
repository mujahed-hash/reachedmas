import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;

    try {
        const tag = await prisma.tag.findUnique({
            where: { shortCode: code },
            include: {
                asset: {
                    select: {
                        publicId: true,
                        type: true,
                        name: true,
                        isActive: true,
                    },
                },
            },
        });

        if (!tag || tag.status !== "ACTIVE") {
            return NextResponse.json(
                { error: "Tag not found or inactive" },
                { status: 404 }
            );
        }

        if (!tag.asset.isActive) {
            return NextResponse.json(
                { error: "Asset is currently not accepting messages" },
                { status: 403 }
            );
        }

        // Log the scan interaction
        await prisma.interaction.create({
            data: {
                tagId: tag.id,
                actionType: "SCAN_VIEW",
                ipHash: null, // Hash the IP in production
                userAgent: request.headers.get("user-agent") || null,
            },
        });

        // Return public asset info (NEVER expose internal IDs)
        return NextResponse.json({
            tag: {
                publicId: tag.publicId,
                shortCode: tag.shortCode,
            },
            asset: {
                publicId: tag.asset.publicId,
                type: tag.asset.type,
                name: tag.asset.name,
            },
        });
    } catch (error) {
        console.error("Error fetching tag:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
