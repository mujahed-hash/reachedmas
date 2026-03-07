import { AppState, AppStateStatus } from "react-native";
import { setAudioModeAsync } from "expo-audio";
import * as Notifications from "expo-notifications";
import EventSource from "react-native-sse";
import { getToken } from "./api";

// We'll keep these internal here
const TYPE_ICONS: Record<string, string> = {
    SCAN: "👁️",
    MESSAGE: "💬",
    CALL: "📞",
    TOW_ALERT: "🚛",
    EMERGENCY: "⚠️",
    DELIVERY_KNOCK: "📦",
    FOUND_REPORT: "🎒",
};

class RealtimeService {
    private es: EventSource | null = null;
    private listeners: Set<(data: any) => void> = new Set();
    private appState: AppStateStatus = AppState.currentState;
    private audioModeSetup = false;

    constructor() {
        AppState.addEventListener("change", this.handleAppStateChange);
    }

    private handleAppStateChange = (nextState: AppStateStatus) => {
        if (this.appState.match(/inactive|background/) && nextState === "active") {
            this.connect();
        } else if (nextState.match(/inactive|background/)) {
            this.disconnect();
        }
        this.appState = nextState;
    };

    private disconnectTimer: any = null;

    public subscribe(listener: (data: any) => void) {
        if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
            this.disconnectTimer = null;
        }
        
        this.listeners.add(listener);
        if (!this.es && getToken()) {
            this.connect();
        }
        return () => {
            this.listeners.delete(listener);
            if (this.listeners.size === 0) {
                // Wait a bit before disconnecting to handle rapid re-renders
                this.disconnectTimer = setTimeout(() => {
                    if (this.listeners.size === 0) {
                        this.disconnect();
                    }
                }, 2000);
            }
        };
    }

    private async setupAudio() {
        if (this.audioModeSetup) return;
        try {
            await setAudioModeAsync({
                allowsRecording: false,
                playsInSilentMode: true,
            });
            this.audioModeSetup = true;
        } catch (err) {
            console.warn("[REALTIME_SERVICE] Audio mode setup failed:", err);
        }
    }

    private async showNotification(data: any) {
        const icon = TYPE_ICONS[data.type] || "🔔";
        const title = `${icon} ${data.title}`;
        const isUrgent = ["EMERGENCY", "TOW_ALERT", "CALL"].includes(data.type);

        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body: data.body,
                    sound: isUrgent ? "alert-urgent.wav" : "alert-soft.wav",
                    priority: isUrgent
                        ? Notifications.AndroidNotificationPriority.MAX
                        : Notifications.AndroidNotificationPriority.DEFAULT,
                },
                trigger: null,
            });
        } catch (err) {
            console.warn("[REALTIME_SERVICE] Notification failed:", err);
        }
    }

    public async connect() {
        const token = getToken();
        if (!token) return;

        if (this.es) {
            this.es.close();
        }

        console.log("[REALTIME_SERVICE] Connecting to stream...");
        this.es = new EventSource("https://reachmasked.com/api/mobile/notifications/stream", {
            headers: { Authorization: `Bearer ${token}` },
        });

        this.es.addEventListener("open", () => {
            console.log("[REALTIME_SERVICE] Connection opened");
        });

        this.es.addEventListener("message", async (event) => {
            if (!event.data) return;
            try {
                const data = JSON.parse(event.data);
                if (data.type === "initial") return;

                console.log("[REALTIME_SERVICE] Notification received:", data.title);
                
                await this.setupAudio();
                await this.showNotification(data);

                // Notify all listeners
                this.listeners.forEach(l => l(data));
            } catch (err) {
                console.error("[REALTIME_SERVICE] Parse error:", err);
            }
        });

        this.es.addEventListener("error", (event: any) => {
            console.warn("[REALTIME_SERVICE] SSE error:", event?.message);
            this.disconnect();
        });
    }

    public disconnect() {
        if (this.es) {
            this.es.close();
            this.es = null;
            console.log("[REALTIME_SERVICE] Disconnected");
        }
    }
}

export const realtimeService = new RealtimeService();
