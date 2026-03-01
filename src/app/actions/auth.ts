"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptPhone } from "@/lib/crypto";
import bcrypt from "bcryptjs";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function login(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard",
        });
    } catch (error) {
        // IMPORTANT: NextAuth throws a special redirect "error" on success.
        // We must re-throw it so Next.js can execute the redirect.
        if (isRedirectError(error)) throw error;
        return { error: "Invalid email or password" };
    }
}

export async function register(formData: FormData) {
    const name = (formData.get("name") as string)?.trim() || null;
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const phone = (formData.get("phone") as string)?.trim();

    // --- Validation ---
    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    if (password !== confirmPassword) {
        return { error: "Passwords do not match" };
    }

    if (password.length < 8) {
        return { error: "Password must be at least 8 characters" };
    }

    if (!phone || phone.length < 10) {
        return { error: "Please enter a valid phone number" };
    }

    // --- Check for existing account ---
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { error: "An account with this email already exists" };
    }

    // --- Create user ---
    const passwordHash = await bcrypt.hash(password, 12);
    const phoneEncrypted = encryptPhone(phone);

    await prisma.user.create({
        data: {
            name,
            email,
            passwordHash,
            phoneEncrypted,
            role: "OWNER",
        },
    });

    // --- Sign in the new user ---
    // signIn() throws a NEXT_REDIRECT on success — this must always be re-thrown.
    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/dashboard",
        });
    } catch (error) {
        if (isRedirectError(error)) throw error;
        // Account was created but auto-login failed — send them to login page
        return {
            error: "Account created! Please sign in to continue.",
        };
    }
}

export async function logout() {
    await signOut({ redirectTo: "/" });
}
