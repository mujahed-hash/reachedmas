import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Notifications from "expo-notifications";
import EventSource from "react-native-sse";
import { getToken } from "./api";

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
        await setAudioModeAsync({
            allowsRecording: false,
            playsInSilentMode: true,
        });
    } catch (err) {
        console.warn("[REALTIME] Audio mode setup failed:", err);
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
            trigger: null,
        });
    } catch (err) {
        try {
            await Notifications.scheduleNotificationAsync({
                content: { title, body, sound: "default" },
                trigger: null,
            });
        } catch (_) {
            console.warn("[REALTIME] Local notification failed:", err);
        }
    }
}

export function useNotificationRealtime(onNewNotification?: (n: any) => void) {
    const esRef = useRef<EventSource | null>(null);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    const urgentPlayer = useAudioPlayer(require("../assets/alert-urgent.wav"));
    const softPlayer = useAudioPlayer(require("../assets/alert-soft.wav"));

    const connect = useCallback(() => {
        const token = getToken();
        if (!token) return;

        if (esRef.current) {
            esRef.current.close();
        }

        console.log("[REALTIME] Connecting to notification stream...");
        const es = new EventSource("https://reachmasked.com/api/mobile/notifications/stream", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        es.addEventListener("open", () => {
            console.log("[REALTIME] Connection opened");
        });

        es.addEventListener("message", async (event) => {
            if (!event.data) return;
            try {
                const data = JSON.parse(event.data);
                
                // Skip initial unread dump (we fetch those manually on UI load)
                if (data.type === "initial") return;

                console.log("[REALTIME] New notification received:", data.title);

                const icon = TYPE_ICONS[data.type] || "🔔";
                const title = `${icon} ${data.title}`;

                // 1. Play sound
                const isUrgent = ["EMERGENCY", "TOW_ALERT", "CALL"].includes(data.type);
                await setupAudioMode();
                console.log(`[REALTIME] Playing ${isUrgent ? "urgent" : "soft"} alert sound...`);
                if (isUrgent) {
                    urgentPlayer.play();
                } else {
                    softPlayer.play();
                }

                // 2. Show banner
                await showLocalNotification(title, data.body, isUrgent);

                // 3. Update UI
                onNewNotification?.(data);
            } catch (err) {
                console.error("[REALTIME] Message parse error:", err);
            }
        });

        es.addEventListener("error", (event: any) => {
            console.warn("[REALTIME] Connection error:", event?.message || "Unknown SSE error");
            es.close();
            // Reconnect logic is handled by react-native-sse automatically or via retry interval
        });

        esRef.current = es;
    }, [onNewNotification, urgentPlayer, softPlayer]);

    useEffect(() => {
        connect();

        const sub = AppState.addEventListener("change", (nextState: AppStateStatus) => {
            if (
                appStateRef.current.match(/inactive|background/) &&
                nextState === "active"
            ) {
                // Return to foreground — reconnect to ensure stream is fresh
                connect();
            } else if (nextState.match(/inactive|background/)) {
                // App went to background — close connection to save battery/data
                esRef.current?.close();
            }
            appStateRef.current = nextState;
        });

        return () => {
            esRef.current?.close();
            sub.remove();
        };
    }, [connect]);
}
