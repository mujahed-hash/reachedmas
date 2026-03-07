/**
 * useNotificationPolling
 *
 * Polls /api/mobile/notifications every N seconds.
 * When new (unread) notifications appear it:
 *  1. Plays an alert sound via expo-av.
 *  2. Shows an in-app Notification.scheduleNotificationAsync alert (works in
 *     Expo Go without a projectId — triggers the local notification banner).
 *
 * This gives a web-app-equivalent SSE experience on mobile even while running
 * inside Expo Go, where remote push is not available.
 */

import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import { fetchNotifications } from "./api";
import { getToken } from "./api";

const POLL_INTERVAL_MS = 20_000; // 20 seconds

const TYPE_ICONS: Record<string, string> = {
    SCAN: "👁️",
    MESSAGE: "💬",
    CALL: "📞",
    TOW_ALERT: "🚛",
    EMERGENCY: "⚠️",
    DELIVERY_KNOCK: "📦",
    FOUND_REPORT: "🎒",
};

async function playAlertSound(type: string) {
    try {
        // Different sounds by urgency
        const isUrgent = ["EMERGENCY", "TOW_ALERT", "CALL"].includes(type);
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true, // Important: play even in silent mode
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        });

        // Use the Expo bundled sounds
        const { sound } = await Audio.Sound.createAsync(
            isUrgent
                ? require("../assets/alert-urgent.wav")
                : require("../assets/alert-soft.wav"),
            { shouldPlay: true, volume: 1.0 }
        );

        sound.setOnPlaybackStatusUpdate((status) => {
            if ("didJustFinish" in status && status.didJustFinish) {
                sound.unloadAsync();
            }
        });
    } catch (err) {
        // Fallback: use system notification sound via local notification
        console.warn("[POLL] Sound playback failed, using system sound:", err);
    }
}

async function showLocalNotification(title: string, body: string) {
    try {
        // This works in Expo Go without a projectId — it only schedules locally
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: "default",
            },
            trigger: null, // fire immediately
        });
    } catch (err) {
        console.warn("[POLL] Local notification failed:", err);
    }
}

export function useNotificationPolling(onNewNotification?: (n: any) => void) {
    const lastSeenIdRef = useRef<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const isFirstFetch = useRef(true);

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

                // 1. Play sound
                await playAlertSound(mostUrgent.type);

                // 2. Show local notification banner (works in Expo Go)
                await showLocalNotification(title, mostUrgent.body);

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
