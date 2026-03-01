"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ──────────────────────────────────────
// Get auto-replies for a vehicle
// ──────────────────────────────────────
export async function getAutoReplies(vehicleId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const replies = await prisma.autoReply.findMany({
        where: {
            vehicleId,
            vehicle: { ownerId: session.user.id },
        },
        orderBy: { createdAt: "desc" },
    });

    return replies;
}

// ──────────────────────────────────────
// Add a new auto-reply
// ──────────────────────────────────────
export async function addAutoReply(
    formData: FormData
): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Not authenticated" };

    const vehicleId = formData.get("vehicleId") as string;
    const label = (formData.get("label") as string)?.trim();
    const message = (formData.get("message") as string)?.trim();

    if (!label || !message) {
        return { success: false, message: "Label and message are required" };
    }

    if (message.length > 200) {
        return { success: false, message: "Message must be under 200 characters" };
    }

    try {
        // Verify ownership
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: vehicleId, ownerId: session.user.id },
        });
        if (!vehicle) return { success: false, message: "Vehicle not found" };

        // Max 5 auto-replies per vehicle
        const count = await prisma.autoReply.count({ where: { vehicleId } });
        if (count >= 5) {
            return { success: false, message: "Maximum 5 auto-replies per vehicle" };
        }

        await prisma.autoReply.create({
            data: { vehicleId, label, message },
        });

        revalidatePath(`/dashboard`);
        return { success: true, message: "Auto-reply added" };
    } catch {
        return { success: false, message: "Failed to add auto-reply" };
    }
}

// ──────────────────────────────────────
// Toggle active state
// ──────────────────────────────────────
export async function toggleAutoReply(
    replyId: string,
    isActive: boolean
): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Not authenticated" };

    try {
        const reply = await prisma.autoReply.findFirst({
            where: { id: replyId, vehicle: { ownerId: session.user.id } },
        });
        if (!reply) return { success: false, message: "Reply not found" };

        await prisma.autoReply.update({
            where: { id: replyId },
            data: { isActive },
        });

        revalidatePath(`/dashboard`);
        return { success: true, message: isActive ? "Auto-reply enabled" : "Auto-reply disabled" };
    } catch {
        return { success: false, message: "Failed to update auto-reply" };
    }
}

// ──────────────────────────────────────
// Delete an auto-reply
// ──────────────────────────────────────
export async function deleteAutoReply(
    replyId: string
): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Not authenticated" };

    try {
        const reply = await prisma.autoReply.findFirst({
            where: { id: replyId, vehicle: { ownerId: session.user.id } },
        });
        if (!reply) return { success: false, message: "Reply not found" };

        await prisma.autoReply.delete({ where: { id: replyId } });

        revalidatePath(`/dashboard`);
        return { success: true, message: "Auto-reply deleted" };
    } catch {
        return { success: false, message: "Failed to delete auto-reply" };
    }
}

// ──────────────────────────────────────
// Get the active auto-reply for a vehicle (used by scan page)
// ──────────────────────────────────────
export async function getActiveAutoReplyForVehicle(vehicleId: string) {
    const reply = await prisma.autoReply.findFirst({
        where: { vehicleId, isActive: true },
        select: { message: true },
    });
    return reply?.message ?? null;
}
