"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptPhone, decryptPhone } from "@/lib/crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export interface SettingsResult {
    success: boolean;
    message: string;
}

// ──────────────────────────────────────
// Update profile (name + email)
// ──────────────────────────────────────
export async function updateProfile(formData: FormData): Promise<SettingsResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Not authenticated" };

    const name = (formData.get("name") as string)?.trim() || null;
    const email = (formData.get("email") as string)?.trim().toLowerCase();

    if (!email) return { success: false, message: "Email is required" };

    try {
        // Check if new email conflicts with another account
        const conflict = await prisma.user.findFirst({
            where: { email, NOT: { id: session.user.id } },
        });
        if (conflict) return { success: false, message: "That email is already in use" };

        await prisma.user.update({
            where: { id: session.user.id },
            data: { name, email },
        });

        revalidatePath("/settings");
        return { success: true, message: "Profile updated successfully" };
    } catch {
        return { success: false, message: "Failed to update profile" };
    }
}

// ──────────────────────────────────────
// Update phone number (with encryption)
// ──────────────────────────────────────
export async function updatePhone(formData: FormData): Promise<SettingsResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Not authenticated" };

    const phone = (formData.get("phone") as string)?.trim();

    if (!phone || phone.length < 10) {
        return { success: false, message: "Please enter a valid phone number" };
    }

    try {
        const phoneEncrypted = encryptPhone(phone);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { phoneEncrypted },
        });

        revalidatePath("/settings");
        return { success: true, message: "Phone number updated and encrypted" };
    } catch {
        return { success: false, message: "Failed to update phone number" };
    }
}

// ──────────────────────────────────────
// Update notification preferences
// ──────────────────────────────────────
export async function updateNotificationPrefs(formData: FormData): Promise<SettingsResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Not authenticated" };

    const emailNotif = formData.get("emailNotif") === "on";
    const smsNotif = formData.get("smsNotif") === "on";

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { emailNotif, smsNotif },
        });

        revalidatePath("/settings");
        return { success: true, message: "Notification preferences saved" };
    } catch {
        return { success: false, message: "Failed to update preferences" };
    }
}

// ──────────────────────────────────────
// Change password
// ──────────────────────────────────────
export async function changePassword(formData: FormData): Promise<SettingsResult> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, message: "Not authenticated" };

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { success: false, message: "All password fields are required" };
    }

    if (newPassword.length < 8) {
        return { success: false, message: "New password must be at least 8 characters" };
    }

    if (newPassword !== confirmPassword) {
        return { success: false, message: "New passwords do not match" };
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) return { success: false, message: "User not found" };

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) return { success: false, message: "Current password is incorrect" };

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { passwordHash },
        });

        return { success: true, message: "Password changed successfully" };
    } catch {
        return { success: false, message: "Failed to change password" };
    }
}

// ──────────────────────────────────────
// Get settings data (server-side)
// ──────────────────────────────────────
export async function getSettingsData() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            phoneEncrypted: true,
            emailNotif: true,
            smsNotif: true,
        },
    });

    if (!user) return null;

    // Safely decrypt phone for display (masked)
    let phoneMasked: string | null = null;
    if (user.phoneEncrypted) {
        const decrypted = decryptPhone(user.phoneEncrypted);
        if (decrypted && decrypted.length >= 4) {
            phoneMasked = "•••• •••• " + decrypted.slice(-4);
        }
    }

    return {
        name: user.name,
        email: user.email,
        phoneMasked,
        hasPhone: !!user.phoneEncrypted,
        emailNotif: user.emailNotif,
        smsNotif: user.smsNotif,
    };
}
