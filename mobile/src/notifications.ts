import { useEffect, useRef } from "react";
import { Platform, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { registerPushToken } from "./api";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        // Modern properties for SDK 52+
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export function usePushNotifications() {
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    useEffect(() => {
        registerForPushNotifications();

        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
            console.log("Notification received:", notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;
            console.log("Notification tapped:", data);
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);
}

async function registerForPushNotifications() {
    if (!Device.isDevice) {
        console.log("[PUSH] Push notifications require a physical device");
        return;
    }

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== "granted") {
            console.log("[PUSH] Permission not granted for push notifications");
            return;
        }

        // Get project ID from app config
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
            console.warn("[PUSH] No projectId configured in app.json. Skipping push registration.");
            return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        const token = tokenData.data;
        console.log("[PUSH] Token obtained:", token);

        const platform = Platform.OS as "ios" | "android";
        await registerPushToken(token, platform);
        console.log("[PUSH] Token registered with server");

        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
                name: "ReachMasked Alerts",
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#6366F1",
                sound: "default",
            });
        }
    } catch (error: any) {
        const msg = error?.message || "";
        // Gracefully handle common development limitations
        if (
            msg.includes("projectId") || 
            msg.includes("not supported") || 
            msg.includes("entitlement") || 
            msg.includes("aps-environment")
        ) {
            console.log("[PUSH] Push notifications unavailable in this build (likely missing entitlements for development). Realtime alerts will still work via SSE.");
        } else {
            console.error("[PUSH] Error registering for push notifications:", error);
        }
    }
}
