import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encryptPhone } from "@/lib/crypto";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password, confirmPassword, phone } = body;

        if (!email || !password || !confirmPassword || !phone) {
            return NextResponse.json({ success: false, message: "All required fields must be filled" }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ success: false, message: "Password must be at least 8 characters" }, { status: 400 });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ success: false, message: "Passwords do not match" }, { status: 400 });
        }

        if (phone.length < 10) {
            return NextResponse.json({ success: false, message: "Please enter a valid phone number" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return NextResponse.json({ success: false, message: "An account with this email already exists" }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const phoneEncrypted = encryptPhone(phone);

        const user = await prisma.user.create({
            data: {
                name: name || null,
                email: email.toLowerCase(),
                passwordHash,
                phoneEncrypted,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Account created successfully",
            userId: user.id
        });
    } catch (error) {
        console.error("[mobile-register] POST Error:", error);
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }
}
