import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

// Use the production domain as default
const API_BASE = "https://reachmasked.com";
// Fallback for debugging when SSL/DNS isn't fully ready
const FALLBACK_IP = "http://3.148.188.194";

let authToken: string | null = null;
let useIPFallback = false;

export function setFallbackMode(enabled: boolean) {
    useIPFallback = enabled;
}

export function getFallbackMode() {
    return useIPFallback;
}

const getBaseUrl = () => useIPFallback ? FALLBACK_IP : API_BASE;

export async function loadToken() {
    authToken = await SecureStore.getItemAsync("auth_token");
}

export async function saveToken(token: string) {
    authToken = token;
    await SecureStore.setItemAsync("auth_token", token);
}

export async function clearToken() {
    authToken = null;
    await SecureStore.deleteItemAsync("auth_token");
}

export function getToken() {
    return authToken;
}

async function apiFetch(path: string, options: RequestInit = {}) {
    const baseUrl = getBaseUrl();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> || {}),
    };

    if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
        headers["Cookie"] = `${getSessionCookieName()}=${authToken}`;
    }

    const fullUrl = `${baseUrl}${path}`;
    console.log(`[API] Fetching: ${fullUrl}`);

    try {
        const res = await fetch(fullUrl, {
            ...options,
            headers,
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`[API] Error ${res.status}: ${text}`);
            throw new Error(`API ${res.status}: ${text}`);
        }

        return res.json();
    } catch (err: any) {
        console.error(`[API] Fetch failed for ${fullUrl}:`, err.message);
        throw err;
    }
}

// Cookie name for session token (HTTPS uses __Secure- prefix)
const getSessionCookieName = () =>
    getBaseUrl().startsWith("https") ? "__Secure-authjs.session-token" : "authjs.session-token";

// ── Auth ──
// Uses dedicated mobile-login API (returns token in JSON) - no cookie/CSRF flow needed
export async function login(email: string, password: string) {
    const baseUrl = getBaseUrl();

    try {
        console.log(`[AUTH] Starting login at ${baseUrl}...`);

        const res = await fetch(`${baseUrl}/api/auth/mobile-login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "ReachMasked-Mobile/1.0",
            },
            body: JSON.stringify({ email: email.trim(), password }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.error || `Login failed: ${res.status}`);
        }

        const token = data.token;
        if (!token) {
            throw new Error("Login failed: No token in response");
        }

        await saveToken(token);
        console.log("[AUTH] Login Successful, token saved.");
        return token;
    } catch (err: any) {
        console.error(`[AUTH] Detailed Error:`, err);

        if (err.message.includes("Network request failed")) {
            const msg = `Network failure at ${baseUrl}.\n\n` +
                `Possible causes:\n` +
                `1. SSL Certificate not trusted by device.\n` +
                `2. DNS is still propagating.\n` +
                `3. Server is blocked by firewall/network.\n\n` +
                `Check Expo logs for more details.`;
            throw new Error(msg);
        }
        throw err;
    }
}

export async function fetchDashboard() {
    return apiFetch("/api/mobile/dashboard");
}

export async function fetchNotifications() {
    return apiFetch("/api/notifications/poll");
}

export async function registerPushToken(token: string, platform: string) {
    return apiFetch("/api/push/register", {
        method: "POST",
        body: JSON.stringify({ token, platform }),
    });
}

export async function unregisterPushToken(token: string) {
    return apiFetch("/api/push/unregister", {
        method: "POST",
        body: JSON.stringify({ token }),
    });
}

export async function sendChatMessage(threadId: string, sender: string, text: string) {
    return apiFetch("/api/chat/send", {
        method: "POST",
        body: JSON.stringify({ threadId, sender, text }),
    });
}

export async function pollChat(threadId: string, after?: string) {
    const params = after ? `?after=${encodeURIComponent(after)}` : "";
    return apiFetch(`/api/chat/${threadId}/poll${params}`);
}

export async function updateTagStatus(tagId: string, status: "ACTIVE" | "DISABLED") {
    return apiFetch("/api/mobile/dashboard", {
        method: "POST",
        body: JSON.stringify({ action: "updateTagStatus", tagId, status }),
    });
}
