"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

function generateShortCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid ambiguous chars
    let code = "";
    for (let i = 0; i < 7; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

interface AddVehicleResult {
    success: boolean;
    message: string;
    vehicleId?: string;
}

export async function addVehicle(formData: FormData): Promise<AddVehicleResult> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, message: "Not authenticated" };
    }

    const model = formData.get("model") as string;
    const color = formData.get("color") as string;
    const licensePlate = formData.get("licensePlate") as string;

    if (!model || !color) {
        return { success: false, message: "Model and color are required" };
    }

    try {
        // Generate unique short code for tag
        let shortCode = generateShortCode();
        let attempts = 0;

        while (attempts < 10) {
            const existing = await prisma.tag.findUnique({ where: { shortCode } });
            if (!existing) break;
            shortCode = generateShortCode();
            attempts++;
        }

        // Create vehicle with tag
        const vehicle = await prisma.vehicle.create({
            data: {
                ownerId: session.user.id,
                model,
                color,
                licensePlateHash: licensePlate || null,
                tags: {
                    create: {
                        shortCode,
                        status: "ACTIVE",
                    },
                },
            },
            include: {
                tags: true,
            },
        });

        revalidatePath("/dashboard");

        return {
            success: true,
            message: `Vehicle added with tag code: ${shortCode}`,
            vehicleId: vehicle.id,
        };
    } catch (error) {
        console.error("Error adding vehicle:", error);
        return { success: false, message: "Failed to add vehicle" };
    }
}

export async function deleteVehicle(vehicleId: string): Promise<{ success: boolean; message: string }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, message: "Not authenticated" };
    }

    try {
        // Verify ownership
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                id: vehicleId,
                ownerId: session.user.id,
            },
        });

        if (!vehicle) {
            return { success: false, message: "Vehicle not found" };
        }

        // Delete vehicle (cascade deletes tags and interactions via Prisma)
        await prisma.vehicle.delete({
            where: { id: vehicleId },
        });

        revalidatePath("/dashboard");

        return { success: true, message: "Vehicle deleted" };
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        return { success: false, message: "Failed to delete vehicle" };
    }
}
