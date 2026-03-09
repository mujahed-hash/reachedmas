import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

const API_BASE = "https://reachmasked.com";
let authToken: string | null = null;

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
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> || {}),
    };

    if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
    }

    const fullUrl = `${API_BASE}${path}`;
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

// ── Auth ──
export async function login(email: string, password: string) {
    try {
        console.log(`[AUTH] Starting login at ${API_BASE}...`);
        const res = await fetch(`${API_BASE}/api/auth/mobile-login`, {
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
        if (!token) throw new Error("Login failed: No token in response");

        await saveToken(token);
        console.log("[AUTH] Login Successful, token saved.");
        return token;
    } catch (err: any) {
        console.error(`[AUTH] Detailed Error:`, err);
        throw err;
    }
}

export async function registerAccount(data: any) {
    return apiFetch("/api/auth/mobile-register", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// ── Assets & Tags ──
export async function fetchDashboard() {
    return apiFetch("/api/mobile/dashboard");
}

export async function fetchAssetDetail(assetId: string) {
    return apiFetch(`/api/mobile/vehicles/${assetId}`);
}

export async function addAsset(data: { name: string; type: string; subtitle?: string; metadata?: any }) {
    return apiFetch("/api/mobile/vehicles", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function fetchPurchaseSession() {
    return apiFetch("/api/mobile/purchase-session", {
        method: "POST",
    });
}

export async function deleteAsset(assetId: string) {
    return apiFetch(`/api/mobile/vehicles/${assetId}`, { method: "DELETE" });
}

export async function updateTagStatus(tagId: string, status: "ACTIVE" | "DISABLED", label?: string) {
    return apiFetch("/api/mobile/tags", {
        method: "POST",
        body: JSON.stringify({ tagId, status, label }),
    });
}

export async function toggleTowPrevention(assetId: string, enabled: boolean) {
    return apiFetch("/api/mobile/vehicles/tow-prevention", {
        method: "POST",
        body: JSON.stringify({ vehicleId: assetId, enabled }),
    });
}

// ── Notifications ──
export async function fetchNotifications() {
    return apiFetch("/api/mobile/notifications");
}

export async function markNotificationRead(notificationId: string) {
    return apiFetch("/api/mobile/notifications", {
        method: "POST",
        body: JSON.stringify({ notificationId }),
    });
}

export async function markAllNotificationsRead() {
    return apiFetch("/api/mobile/notifications", {
        method: "POST",
        body: JSON.stringify({ markAll: true }),
    });
}

// ── Settings & Profile ──
export async function fetchSettings() {
    return apiFetch("/api/mobile/settings");
}

export async function updateProfile(data: any) {
    return apiFetch("/api/mobile/settings", {
        method: "PUT",
        body: JSON.stringify({ action: "updateProfile", ...data }),
    });
}

export async function updatePhone(data: any) {
    return apiFetch("/api/mobile/settings", {
        method: "PUT",
        body: JSON.stringify({ action: "updatePhone", ...data }),
    });
}

export async function updateNotificationPrefs(data: any) {
    return apiFetch("/api/mobile/settings", {
        method: "PUT",
        body: JSON.stringify({ action: "updateNotificationPrefs", ...data }),
    });
}

export async function changePassword(data: any) {
    return apiFetch("/api/mobile/settings", {
        method: "PUT",
        body: JSON.stringify({ action: "changePassword", ...data }),
    });
}

// ── Auto-Replies ──
export async function addAutoReply(assetId: string, label: string, message: string) {
    return apiFetch("/api/mobile/auto-replies", {
        method: "POST",
        body: JSON.stringify({ assetId, label, message }),
    });
}

export async function toggleAutoReply(replyId: string, isActive: boolean) {
    return apiFetch("/api/mobile/auto-replies", {
        method: "PUT",
        body: JSON.stringify({ replyId, isActive }),
    });
}

export async function deleteAutoReply(replyId: string) {
    return apiFetch("/api/mobile/auto-replies", {
        method: "DELETE",
        body: JSON.stringify({ replyId }),
    });
}

// ── Push Notifications ──
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

// ── Chat (Legacy Mobile feature?) ──
// Keeping these just in case they are used somewhere deeper
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
