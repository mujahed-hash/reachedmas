import { NextRequest } from "next/server";
import { decode } from "@auth/core/jwt";
import { auth } from "@/lib/auth";

const SESSION_TOKEN_SALT =
    process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token";

/**
 * Extract session from a request.
 * 1. Check for Authorization: Bearer <token> (mobile app)
 * 2. Fall back to auth() cookie-based session (browser)
 */
export async function getSessionFromRequest(req: NextRequest) {
    // 1. Try Bearer token (mobile app)
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const secret = process.env.AUTH_SECRET;
        if (!secret) return null;

        try {
            const decoded = await decode({
                token,
                secret,
                salt: SESSION_TOKEN_SALT,
            });

            if (decoded?.id || decoded?.sub) {
                return {
                    user: {
                        id: (decoded.id as string) || (decoded.sub as string),
                        email: decoded.email as string,
                        name: decoded.name as string,
                        role: decoded.role as string,
                    },
                };
            }
        } catch (err) {
            console.error("[mobile-auth] Failed to decode Bearer token:", err);
        }
    }

    // 2. Fall back to cookie-based auth (browser)
    const session = await auth();
    return session;
}
