/**
 * useNotificationPolling
 *
 * Polls /api/mobile/notifications every N seconds.
 * When new (unread) notifications appear it:
 *  1. Plays an alert sound via expo-audio.
 *  2. Shows an in-app Notification.scheduleNotificationAsync alert (works in
 *     Expo Go without a projectId — triggers the local notification banner).
 *
 * This gives a web-app-equivalent SSE experience on mobile even while running
 * inside Expo Go, where remote push is not available.
 */

import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Notifications from "expo-notifications";
import { fetchNotifications } from "./api";
import { getToken } from "./api";

const POLL_INTERVAL_MS = 10_000; // 10 seconds for more "realtime" feel

const TYPE_ICONS: Record<string, string> = {
    SCAN: "👁️",
    MESSAGE: "💬",
    CALL: "📞",
    TOW_ALERT: "🚛",
    EMERGENCY: "⚠️",
    DELIVERY_KNOCK: "📦",
    FOUND_REPORT: "🎒",
};

async function setupAudioMode() {
    try {
        // Allow audio to play even when iOS is in silent mode
        await setAudioModeAsync({
            allowsRecording: false,
            playsInSilentMode: true,
        });
    } catch (err) {
        console.warn("[POLL] Audio mode setup failed:", err);
    }
}

async function showLocalNotification(title: string, body: string, isUrgent: boolean) {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: isUrgent ? "alert-urgent.wav" : "alert-soft.wav",
                priority: isUrgent
                    ? Notifications.AndroidNotificationPriority.MAX
                    : Notifications.AndroidNotificationPriority.DEFAULT,
            },
            trigger: null, // fire immediately
        });
    } catch (err) {
        // Fallback to default sound
        try {
            await Notifications.scheduleNotificationAsync({
                content: { title, body, sound: "default" },
                trigger: null,
            });
        } catch (_) {
            console.warn("[POLL] Local notification failed:", err);
        }
    }
}


export function useNotificationPolling(onNewNotification?: (n: any) => void) {
    const lastSeenIdRef = useRef<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const isFirstFetch = useRef(true);

    const urgentPlayer = useAudioPlayer(require("../assets/alert-urgent.wav"));
    const softPlayer = useAudioPlayer(require("../assets/alert-soft.wav"));

    const poll = useCallback(async () => {
        const token = getToken();
        if (!token) return; // Not logged in yet

        try {
            const res = await fetchNotifications();
            const notifications: any[] = res.notifications || [];
            if (notifications.length === 0) {
                isFirstFetch.current = false;
                return;
            }

            const newestId = notifications[0]?.id;

            if (isFirstFetch.current) {
                // On first load just track the latest ID, don't alert
                lastSeenIdRef.current = newestId;
                isFirstFetch.current = false;
                return;
            }

            // Find notifications that are newer than our last seen ID
            const newNotifications: any[] = [];
            for (const n of notifications) {
                if (n.id === lastSeenIdRef.current) break;
                if (!n.isRead) newNotifications.push(n);
            }

            if (newNotifications.length > 0) {
                lastSeenIdRef.current = newestId;
                const mostUrgent = newNotifications[0];
                const icon = TYPE_ICONS[mostUrgent.type] || "🔔";
                const title = `${icon} ${mostUrgent.title}`;

                // 1. Set up audio mode & play sound
                const isUrgent = ["EMERGENCY", "TOW_ALERT", "CALL"].includes(mostUrgent.type);
                await setupAudioMode();
                console.log(`[POLL] Playing ${isUrgent ? "urgent" : "soft"} alert sound...`);
                if (isUrgent) {
                    urgentPlayer.play();
                } else {
                    softPlayer.play();
                }

                // 2. Show local notification banner with sound (works in Expo Go + native)
                await showLocalNotification(title, mostUrgent.body, isUrgent);

                // 3. Callback for in-app badge updates
                onNewNotification?.(mostUrgent);

                console.log(`[POLL] ${newNotifications.length} new notification(s) — played alert`);
            }
        } catch (err: any) {
            // Silently ignore — we'll retry on next poll
            console.warn("[POLL] Notification poll failed:", err?.message);
        }
    }, [onNewNotification]);

    useEffect(() => {
        // Start polling immediately
        poll();
        intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

        // Pause polling when app is in background, resume on foreground
        const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
            if (
                appStateRef.current.match(/inactive|background/) &&
                nextState === "active"
            ) {
                // App came to foreground — poll immediately
                poll();
            }
            appStateRef.current = nextState;
        });

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            sub.remove();
        };
    }, [poll]);
}
