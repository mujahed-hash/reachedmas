import { NextRequest, NextResponse } from "next/server";
import { encode } from "@auth/core/jwt";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Must match Auth.js session token cookie name for JWT salt (HTTPS uses __Secure- prefix)
const SESSION_TOKEN_SALT =
    process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token";

/**
 * Mobile login API - bypasses cookie-based Auth.js flow.
 * Returns session token in JSON body for React Native (no cookie persistence).
 * Token format matches Auth.js so existing API routes work unchanged.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const email = (body.email as string)?.trim()?.toLowerCase();
        const password = body.password as string;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        const secret = process.env.AUTH_SECRET;
        if (!secret) {
            console.error("[mobile-login] AUTH_SECRET not set");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const token = await encode({
            token: {
                sub: user.id,
                email: user.email,
                name: user.publicId,
                id: user.id,
                role: user.role,
            },
            secret,
            salt: SESSION_TOKEN_SALT,
        });

        return NextResponse.json({ token });
    } catch (error) {
        console.error("[mobile-login] Error:", error);
        return NextResponse.json(
            { error: "Login failed" },
            { status: 500 }
        );
    }
}
