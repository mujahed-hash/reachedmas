"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false };
    }

    try {
        await prisma.notification.update({
            where: {
                id: notificationId,
                userId: session.user.id, // Ensure ownership
            },
            data: { isRead: true },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return { success: false };
    }
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false };
    }

    try {
        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                isRead: false,
            },
            data: { isRead: true },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return { success: false };
    }
}
