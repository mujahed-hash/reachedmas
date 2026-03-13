"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
export { SETTING_DEFAULTS, getSettingValue } from "@/lib/settings-constants";

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
