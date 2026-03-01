"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ──────────────────────────────────────
// Toggle tag status (ACTIVE ↔ DISABLED)
// ──────────────────────────────────────
export async function updateTagStatus(
    tagId: string,
    status: "ACTIVE" | "DISABLED"
): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Not authenticated" };

    try {
        // Verify the tag belongs to this owner via vehicle
        const tag = await prisma.tag.findFirst({
            where: {
                id: tagId,
                vehicle: { ownerId: session.user.id },
            },
        });

        if (!tag) return { success: false, message: "Tag not found" };

        await prisma.tag.update({
            where: { id: tagId },
            data: { status },
        });

        revalidatePath("/dashboard");
        return {
            success: true,
            message: status === "ACTIVE" ? "Tag activated" : "Tag disabled",
        };
    } catch {
        return { success: false, message: "Failed to update tag status" };
    }
}

// ──────────────────────────────────────
// Update tag label
// ──────────────────────────────────────
export async function updateTagLabel(
    tagId: string,
    label: string
): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Not authenticated" };

    try {
        const tag = await prisma.tag.findFirst({
            where: {
                id: tagId,
                vehicle: { ownerId: session.user.id },
            },
        });

        if (!tag) return { success: false, message: "Tag not found" };

        await prisma.tag.update({
            where: { id: tagId },
            data: { label: label.trim() || null },
        });

        revalidatePath("/dashboard");
        return { success: true, message: "Tag label updated" };
    } catch {
        return { success: false, message: "Failed to update tag label" };
    }
}

// ──────────────────────────────────────
// Toggle vehicle tow-prevention mode
// ──────────────────────────────────────
export async function toggleTowPrevention(
    vehicleId: string,
    enabled: boolean
): Promise<{ success: boolean; message: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Not authenticated" };

    try {
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: vehicleId, ownerId: session.user.id },
        });

        if (!vehicle) return { success: false, message: "Vehicle not found" };

        await prisma.vehicle.update({
            where: { id: vehicleId },
            data: { towPreventionMode: enabled },
        });

        revalidatePath("/dashboard");
        return {
            success: true,
            message: enabled ? "Tow-prevention mode enabled" : "Tow-prevention mode disabled",
        };
    } catch {
        return { success: false, message: "Failed to update tow-prevention mode" };
    }
}

// ──────────────────────────────────────
// Mark notifications as read
// ──────────────────────────────────────
export async function markNotificationRead(
    notificationId: string
): Promise<{ success: boolean }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    try {
        await prisma.notification.updateMany({
            where: { id: notificationId, userId: session.user.id },
            data: { isRead: true },
        });
        revalidatePath("/notifications");
        revalidatePath("/dashboard");
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    try {
        await prisma.notification.updateMany({
            where: { userId: session.user.id, isRead: false },
            data: { isRead: true },
        });
        revalidatePath("/notifications");
        revalidatePath("/dashboard");
        return { success: true };
    } catch {
        return { success: false };
    }
}
