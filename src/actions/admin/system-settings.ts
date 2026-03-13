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

export async function updateSetting(key: string, value: string) {
    await requireAdmin();
    await prisma.systemSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
    });
    revalidatePath("/admin/settings");
    return { success: true };
}

export async function getSettings(): Promise<Record<string, string>> {
    const settings = await prisma.systemSettings.findMany();
    return Object.fromEntries(settings.map(s => [s.key, s.value]));
}

export async function getSetting(key: string): Promise<string | null> {
    const s = await prisma.systemSettings.findUnique({ where: { key } });
    return s?.value ?? null;
}

/** Default settings to use when not yet configured */
export const SETTING_DEFAULTS: Record<string, string> = {
    // Free tag defaults
    "free_tag.default_trial_days": "30",
    "free_tag.default_grace_days": "5",
    "free_tag.globally_enabled": "true",
    // Scan behavior
    "scan.captcha_enabled": "true",
    "scan.anonymous_messages_enabled": "true",
    "scan.require_message": "false",
    // Notifications
    "notif.email_enabled": "true",
    "notif.sms_enabled": "true",
    "notif.push_enabled": "true",
    // Tag behavior
    "tag.auto_lock_on_trial_expiry": "true",
    "tag.grace_period_enforcement": "true",
    // Platform limits (FREE plan)
    "limits.free_max_assets": "1",
    "limits.free_max_tags_per_asset": "1",
    "limits.premium_max_assets": "20",
    // Platform features
    "feature.family_sharing": "true",
    "feature.chat_threads": "true",
    "feature.auto_replies": "true",
    "feature.vehicle_history": "true",
    "feature.nfc_programming_guide": "true",
    // Security
    "security.block_new_registrations": "false",
    "security.maintenance_mode": "false",
    "security.read_only_mode": "false",
};

export function getSettingValue(settings: Record<string, string>, key: string): string {
    return settings[key] ?? SETTING_DEFAULTS[key] ?? "";
}
