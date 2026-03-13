/**
 * Free Tag Grant utility functions.
 * Determines the status of a user's free tag grant and handles auto-locking.
 */

import { prisma } from "@/lib/db";

export type FreeTagStatus = "ACTIVE" | "GRACE" | "LOCKED" | "NONE";

export interface FreeTagInfo {
    status: FreeTagStatus;
    daysRemaining: number;   // positive = days left in trial, negative = days into grace
    graceDaysRemaining: number;
    trialEndsAt: Date | null;
    lockedAt: Date | null;
}

export function getFreeTagStatus(user: {
    freeTagGranted: boolean;
    freeTagGrantedAt: Date | null;
    freeTagTrialDays: number;
    freeTagGraceDays: number;
    plan: string;
}): FreeTagInfo {
    // If user is already premium or free tag not granted
    if (!user.freeTagGranted || !user.freeTagGrantedAt) {
        return { status: "NONE", daysRemaining: 0, graceDaysRemaining: 0, trialEndsAt: null, lockedAt: null };
    }

    // If user subscribed, free tag grant is moot
    if (user.plan === "PREMIUM") {
        return { status: "ACTIVE", daysRemaining: 999, graceDaysRemaining: 0, trialEndsAt: null, lockedAt: null };
    }

    const now = new Date();
    const grantedAt = new Date(user.freeTagGrantedAt);
    const trialEnd = new Date(grantedAt.getTime() + user.freeTagTrialDays * 24 * 60 * 60 * 1000);
    const graceEnd = new Date(trialEnd.getTime() + user.freeTagGraceDays * 24 * 60 * 60 * 1000);

    const msPerDay = 24 * 60 * 60 * 1000;
    const daysUntilTrialEnd = Math.ceil((trialEnd.getTime() - now.getTime()) / msPerDay);
    const daysUntilGraceEnd = Math.ceil((graceEnd.getTime() - now.getTime()) / msPerDay);

    if (now < trialEnd) {
        return {
            status: "ACTIVE",
            daysRemaining: daysUntilTrialEnd,
            graceDaysRemaining: user.freeTagGraceDays,
            trialEndsAt: trialEnd,
            lockedAt: null,
        };
    } else if (now < graceEnd) {
        return {
            status: "GRACE",
            daysRemaining: 0,
            graceDaysRemaining: daysUntilGraceEnd,
            trialEndsAt: trialEnd,
            lockedAt: graceEnd,
        };
    } else {
        return {
            status: "LOCKED",
            daysRemaining: 0,
            graceDaysRemaining: 0,
            trialEndsAt: trialEnd,
            lockedAt: graceEnd,
        };
    }
}

/**
 * Checks a user's free tag status and auto-locks their tags if the grace period has expired.
 * Should be called on dashboard load.
 */
export async function checkAndLockExpiredTags(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            freeTagGranted: true,
            freeTagGrantedAt: true,
            freeTagTrialDays: true,
            freeTagGraceDays: true,
            plan: true,
            assets: { include: { tags: true } },
        },
    });

    if (!user || !user.freeTagGranted || user.plan === "PREMIUM") return;

    const info = getFreeTagStatus(user);
    if (info.status !== "LOCKED") return;

    // Lock all tags that aren't already locked with TRIAL_EXPIRED
    const now = new Date();
    for (const asset of user.assets) {
        for (const tag of asset.tags) {
            if (tag.lockedReason !== "TRIAL_EXPIRED" && tag.status === "ACTIVE") {
                await prisma.tag.update({
                    where: { id: tag.id },
                    data: {
                        status: "LOCKED",
                        lockedReason: "TRIAL_EXPIRED",
                        lockedAt: now,
                    },
                });
            }
        }
    }
}

/**
 * Unlocks free-tag-expired tags when a user upgrades to PREMIUM.
 */
export async function unlockTagsAfterPayment(userId: string) {
    const assets = await prisma.asset.findMany({
        where: { ownerId: userId },
        include: { tags: true },
    });

    for (const asset of assets) {
        for (const tag of asset.tags) {
            if (tag.lockedReason === "TRIAL_EXPIRED") {
                await prisma.tag.update({
                    where: { id: tag.id },
                    data: {
                        status: "ACTIVE",
                        lockedReason: null,
                        lockedAt: null,
                    },
                });
            }
        }
    }
}
