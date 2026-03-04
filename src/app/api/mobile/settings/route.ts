import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/mobile-auth";
import { encryptPhone, decryptPhone } from "@/lib/crypto";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let phoneMasked: string | null = null;
        if (user.phoneEncrypted) {
            const decrypted = decryptPhone(user.phoneEncrypted);
            if (decrypted && decrypted.length >= 4) {
                phoneMasked = "•••• •••• " + decrypted.slice(-4);
            }
        }

        return NextResponse.json({
            success: true,
            settings: {
                name: user.name,
                email: user.email,
                phoneMasked,
                hasPhone: !!user.phoneEncrypted,
                emailNotif: user.emailNotif,
                smsNotif: user.smsNotif,
            },
        });
    } catch (error) {
        console.error("[mobile-settings] GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSessionFromRequest(req);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action } = body;

        switch (action) {
            case "updateProfile": {
                const name = body.name?.trim() || null;
                const email = body.email?.trim().toLowerCase();
                if (!email) return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });

                const conflict = await prisma.user.findFirst({
                    where: { email, NOT: { id: session.user.id } },
                });
                if (conflict) return NextResponse.json({ success: false, message: "Email already in use" }, { status: 400 });

                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { name, email },
                });
                return NextResponse.json({ success: true, message: "Profile updated successfully" });
            }

            case "updatePhone": {
                const phone = body.phone?.trim();
                if (!phone || phone.length < 10) return NextResponse.json({ success: false, message: "Valid phone required" }, { status: 400 });

                const phoneEncrypted = encryptPhone(phone);
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { phoneEncrypted },
                });
                return NextResponse.json({ success: true, message: "Phone number updated" });
            }

            case "updateNotificationPrefs": {
                const { emailNotif, smsNotif } = body;
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { emailNotif, smsNotif },
                });
                return NextResponse.json({ success: true, message: "Notification preferences saved" });
            }

            case "changePassword": {
                const { currentPassword, newPassword, confirmPassword } = body;
                if (!currentPassword || !newPassword || !confirmPassword) return NextResponse.json({ success: false, message: "All password fields required" }, { status: 400 });
                if (newPassword.length < 8) return NextResponse.json({ success: false, message: "Password must be >= 8 chars" }, { status: 400 });
                if (newPassword !== confirmPassword) return NextResponse.json({ success: false, message: "Passwords do not match" }, { status: 400 });

                const user = await prisma.user.findUnique({ where: { id: session.user.id } });
                if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

                const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
                if (!isValid) return NextResponse.json({ success: false, message: "Current password incorrect" }, { status: 400 });

                const passwordHash = await bcrypt.hash(newPassword, 12);
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { passwordHash },
                });
                return NextResponse.json({ success: true, message: "Password changed successfully" });
            }

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("[mobile-settings] PUT Error:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
