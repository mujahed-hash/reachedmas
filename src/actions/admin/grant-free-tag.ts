"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (user?.role !== "ADMIN") throw new Error("Forbidden");
}

export async function grantFreeTag(userId: string, trialDays = 30, graceDays = 5) {
    await requireAdmin();
    await prisma.user.update({
        where: { id: userId },
        data: {
            freeTagGranted: true,
            freeTagGrantedAt: new Date(),
            freeTagTrialDays: trialDays,
            freeTagGraceDays: graceDays,
        },
    });
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, message: `Free tag granted for ${trialDays} days with ${graceDays} days grace.` };
}

export async function revokeFreeTag(userId: string) {
    await requireAdmin();

    // Also unlock any TRIAL_EXPIRED tags
    const assets = await prisma.asset.findMany({
        where: { ownerId: userId },
        include: { tags: { where: { lockedReason: "TRIAL_EXPIRED" } } },
    });
    await Promise.all(
        assets.flatMap(a =>
            a.tags.map(tag =>
                prisma.tag.update({
                    where: { id: tag.id },
                    data: { status: "ACTIVE", lockedReason: null, lockedAt: null },
                })
            )
        )
    );

    await prisma.user.update({
        where: { id: userId },
        data: {
            freeTagGranted: false,
            freeTagGrantedAt: null,
        },
    });
    revalidatePath(`/admin/users/${userId}`);
    return { success: true, message: "Free tag grant revoked." };
}

export async function updateFreeTagSettings(userId: string, trialDays: number, graceDays: number) {
    await requireAdmin();
    await prisma.user.update({
        where: { id: userId },
        data: { freeTagTrialDays: trialDays, freeTagGraceDays: graceDays },
    });
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
}

export async function adminForceLockTag(userId: string) {
    await requireAdmin();
    const assets = await prisma.asset.findMany({
        where: { ownerId: userId },
        include: { tags: { where: { status: "ACTIVE" } } },
    });
    const now = new Date();
    await Promise.all(
        assets.flatMap(a =>
            a.tags.map(tag =>
                prisma.tag.update({
                    where: { id: tag.id },
                    data: { status: "LOCKED", lockedReason: "TRIAL_EXPIRED", lockedAt: now },
                })
            )
        )
    );
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
}

export async function adminForceUnlockTag(userId: string) {
    await requireAdmin();
    const assets = await prisma.asset.findMany({
        where: { ownerId: userId },
        include: { tags: { where: { lockedReason: "TRIAL_EXPIRED" } } },
    });
    await Promise.all(
        assets.flatMap(a =>
            a.tags.map(tag =>
                prisma.tag.update({
                    where: { id: tag.id },
                    data: { status: "ACTIVE", lockedReason: null, lockedAt: null },
                })
            )
        )
    );
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
}
