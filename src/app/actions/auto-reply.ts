"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ──────────────────────────────────────
// Get auto-replies for an asset
// ──────────────────────────────────────
export async function getAutoReplies(assetId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const replies = await prisma.autoReply.findMany({
        where: {
            assetId,
            asset: { ownerId: session.user.id },
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

    const assetId = formData.get("assetId") as string;
    const label = (formData.get("label") as string)?.trim();
    const message = (formData.get("message") as string)?.trim();

    if (!label || !message) {
        return { success: false, message: "Label and message are required" };
    }

    if (message.length > 200) {
        return { success: false, message: "Message must be under 200 characters" };
    }

    try {
        const asset = await prisma.asset.findFirst({
            where: { id: assetId, ownerId: session.user.id },
        });
        if (!asset) return { success: false, message: "Asset not found" };

        const count = await prisma.autoReply.count({ where: { assetId } });
        if (count >= 5) {
            return { success: false, message: "Maximum 5 auto-replies per asset" };
        }

        await prisma.autoReply.create({
            data: { assetId, label, message },
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
            where: { id: replyId, asset: { ownerId: session.user.id } },
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
            where: { id: replyId, asset: { ownerId: session.user.id } },
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
// Get the active auto-reply for an asset (used by scan page)
// ──────────────────────────────────────
export async function getActiveAutoReplyForAsset(assetId: string) {
    const reply = await prisma.autoReply.findFirst({
        where: { assetId, isActive: true },
        select: { message: true },
    });
    return reply?.message ?? null;
}
