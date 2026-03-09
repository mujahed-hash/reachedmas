"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Helper to verify admin access
async function verifyAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { isAdmin: false };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    return { isAdmin: user?.role === "ADMIN", userId: session.user.id };
}

// ========== USER ACTIONS ==========

export async function promoteToAdmin(userEmail: string): Promise<{ success: boolean; error?: string }> {
    const { isAdmin, userId } = await verifyAdmin();

    // Check if current user is admin OR if there are no admins yet
    const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
    });

    if (adminCount > 0 && !isAdmin) {
        return { success: false, error: "Only admins can promote users" };
    }

    try {
        await prisma.user.update({
            where: { email: userEmail },
            data: { role: "ADMIN" },
        });

        revalidatePath("/admin");
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Error promoting user:", error);
        return { success: false, error: "User not found" };
    }
}

export async function demoteFromAdmin(userEmail: string): Promise<{ success: boolean; error?: string }> {
    const { isAdmin, userId } = await verifyAdmin();

    if (!isAdmin) {
        return { success: false, error: "Only admins can demote users" };
    }

    // Get current user's email
    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (currentUser?.email === userEmail) {
        return { success: false, error: "Cannot demote yourself" };
    }

    try {
        await prisma.user.update({
            where: { email: userEmail },
            data: { role: "OWNER" },
        });

        revalidatePath("/admin");
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Error demoting user:", error);
        return { success: false, error: "User not found" };
    }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    const { isAdmin, userId: adminId } = await verifyAdmin();

    if (!isAdmin) {
        return { success: false, error: "Only admins can delete users" };
    }

    if (userId === adminId) {
        return { success: false, error: "Cannot delete yourself" };
    }

    try {
        // Delete user (cascades to assets, tags, notifications)
        await prisma.user.delete({
            where: { id: userId },
        });

        revalidatePath("/admin");
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, error: "Failed to delete user" };
    }
}

export async function updateUserPlan(
    userId: string,
    plan: "FREE" | "PREMIUM"
): Promise<{ success: boolean; error?: string }> {
    const { isAdmin } = await verifyAdmin();

    if (!isAdmin) {
        return { success: false, error: "Only admins can update user plans" };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { plan },
        });

        revalidatePath("/admin");
        revalidatePath("/admin/users");
        revalidatePath(`/admin/users/${userId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating user plan:", error);
        return { success: false, error: "Failed to update user plan" };
    }
}

// ========== TAG ACTIONS ==========

export async function updateTagStatus(
    tagId: string,
    status: "ACTIVE" | "DISABLED" | "FLAGGED"
): Promise<{ success: boolean; error?: string }> {
    const { isAdmin } = await verifyAdmin();

    if (!isAdmin) {
        return { success: false, error: "Only admins can update tag status" };
    }

    try {
        await prisma.tag.update({
            where: { id: tagId },
            data: { status },
        });

        revalidatePath("/admin");
        revalidatePath("/admin/tags");
        return { success: true };
    } catch (error) {
        console.error("Error updating tag status:", error);
        return { success: false, error: "Failed to update tag" };
    }
}

export async function deleteTag(tagId: string): Promise<{ success: boolean; error?: string }> {
    const { isAdmin } = await verifyAdmin();

    if (!isAdmin) {
        return { success: false, error: "Only admins can delete tags" };
    }

    try {
        await prisma.tag.delete({
            where: { id: tagId },
        });

        revalidatePath("/admin");
        revalidatePath("/admin/tags");
        return { success: true };
    } catch (error) {
        console.error("Error deleting tag:", error);
        return { success: false, error: "Failed to delete tag" };
    }
}

// ========== ASSET ACTIONS ==========

export async function deleteAssetAdmin(assetId: string): Promise<{ success: boolean; error?: string }> {
    const { isAdmin } = await verifyAdmin();

    if (!isAdmin) {
        return { success: false, error: "Only admins can delete assets" };
    }

    try {
        await prisma.asset.delete({
            where: { id: assetId },
        });

        revalidatePath("/admin");
        revalidatePath("/admin/tags");
        return { success: true };
    } catch (error) {
        console.error("Error deleting asset:", error);
        return { success: false, error: "Failed to delete asset" };
    }
}

export async function toggleVehicleActive(vehicleId: string): Promise<{ success: boolean; error?: string }> {
    const { isAdmin } = await verifyAdmin();

    if (!isAdmin) {
        return { success: false, error: "Only admins can toggle asset status" };
    }

    try {
        const asset = await prisma.asset.findUnique({
            where: { id: vehicleId },
        });

        if (!asset) {
            return { success: false, error: "Asset not found" };
        }

        await prisma.asset.update({
            where: { id: vehicleId },
            data: { isActive: !asset.isActive },
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Error toggling asset:", error);
        return { success: false, error: "Failed to update asset" };
    }
}

// ========== NOTIFICATION ACTIONS ==========

export async function deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    const { isAdmin } = await verifyAdmin();

    if (!isAdmin) {
        return { success: false, error: "Only admins can delete notifications" };
    }

    try {
        await prisma.notification.delete({
            where: { id: notificationId },
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Error deleting notification:", error);
        return { success: false, error: "Failed to delete notification" };
    }
}

export async function clearAllNotifications(userId: string): Promise<{ success: boolean; error?: string }> {
    const { isAdmin } = await verifyAdmin();

    if (!isAdmin) {
        return { success: false, error: "Only admins can clear notifications" };
    }

    try {
        await prisma.notification.deleteMany({
            where: { userId },
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        console.error("Error clearing notifications:", error);
        return { success: false, error: "Failed to clear notifications" };
    }
}
