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
                vehicle: {
                    select: {
                        publicId: true,
                        model: true,
                        color: true,
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

        if (!tag.vehicle.isActive) {
            return NextResponse.json(
                { error: "Vehicle is currently not accepting messages" },
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

        // Return public vehicle info (NEVER expose internal IDs)
        return NextResponse.json({
            tag: {
                publicId: tag.publicId,
                shortCode: tag.shortCode,
            },
            vehicle: {
                publicId: tag.vehicle.publicId,
                alias: `${tag.vehicle.color} ${tag.vehicle.model}`,
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
