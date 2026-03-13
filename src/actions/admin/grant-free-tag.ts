"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendPushToUser } from "@/lib/push";
import { emitNotification } from "@/lib/notification-emitter";

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

    const notifTitle = "Free Tag Granted!";
    const notifBody = `Congratulations! You have been granted a Free Tag Trial for ${trialDays} days. Add an asset to activate.`;
    const dbNotif = await prisma.notification.create({
        data: {
            userId,
            type: "SYSTEM_ALERT",
            title: notifTitle,
            body: notifBody,
        },
    });
    emitNotification(userId, {
        id: dbNotif.id, type: dbNotif.type, title: notifTitle, body: notifBody, createdAt: dbNotif.createdAt.toISOString(), asset: "System", tagCode: ""
    });
    await sendPushToUser(userId, notifTitle, notifBody, { type: "SYSTEM_ALERT" });

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

    const notifTitle = "Free Tag Revoked";
    const notifBody = `Your Free Tag Trial has been revoked.`;
    const dbNotif = await prisma.notification.create({
        data: { userId, type: "SYSTEM_ALERT", title: notifTitle, body: notifBody },
    });
    emitNotification(userId, { id: dbNotif.id, type: dbNotif.type, title: notifTitle, body: notifBody, createdAt: dbNotif.createdAt.toISOString(), asset: "System", tagCode: "" });
    await sendPushToUser(userId, notifTitle, notifBody, { type: "SYSTEM_ALERT" });

    revalidatePath(`/admin/users/${userId}`);
    return { success: true, message: "Free tag grant revoked." };
}

export async function updateFreeTagSettings(userId: string, trialDays: number, graceDays: number) {
    await requireAdmin();
    await prisma.user.update({
        where: { id: userId },
        data: { freeTagTrialDays: trialDays, freeTagGraceDays: graceDays },
    });

    const notifTitle = "Free Tag Trial Updated";
    const notifBody = `Your Free Tag Trial settings have been updated to ${trialDays} days.`;
    const dbNotif = await prisma.notification.create({
        data: { userId, type: "SYSTEM_ALERT", title: notifTitle, body: notifBody },
    });
    emitNotification(userId, { id: dbNotif.id, type: dbNotif.type, title: notifTitle, body: notifBody, createdAt: dbNotif.createdAt.toISOString(), asset: "System", tagCode: "" });

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

    const notifTitle = "⚠️ Tags Locked";
    const notifBody = "Your tags have been locked because your trial expired.";
    const dbNotif = await prisma.notification.create({
        data: { userId, type: "SYSTEM_ALERT", title: notifTitle, body: notifBody },
    });
    emitNotification(userId, { id: dbNotif.id, type: dbNotif.type, title: notifTitle, body: notifBody, createdAt: dbNotif.createdAt.toISOString(), asset: "System", tagCode: "" });
    await sendPushToUser(userId, notifTitle, notifBody, { type: "SYSTEM_ALERT" });

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

    const notifTitle = "Tags Unlocked!";
    const notifBody = "Your tags have been unlocked. Thank you for subscribing!";
    const dbNotif = await prisma.notification.create({
        data: { userId, type: "SYSTEM_ALERT", title: notifTitle, body: notifBody },
    });
    emitNotification(userId, { id: dbNotif.id, type: dbNotif.type, title: notifTitle, body: notifBody, createdAt: dbNotif.createdAt.toISOString(), asset: "System", tagCode: "" });
    await sendPushToUser(userId, notifTitle, notifBody, { type: "SYSTEM_ALERT" });

    return { success: true };
}
