import * as admin from "firebase-admin";
import Expo, { ExpoPushMessage } from "expo-server-sdk";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

const expo = new Expo();

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FCM_SERVICE_ACCOUNT_PATH ||
    path.join(process.cwd(), "fcm-service-account.json");

if (fs.existsSync(serviceAccountPath)) {
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))),
        });
        console.log("Firebase Admin SDK initialized");
    }
} else {
    console.warn("FCM service account file not found at:", serviceAccountPath);
}

/**
 * Send push notifications to all of a user's registered devices.
 * Uses both Firebase (FCM) and Expo Push API.
 */
export async function sendPushToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
) {
    try {
        const tokens = await prisma.pushToken.findMany({
            where: { userId },
            select: { token: true },
        });

        if (tokens.length === 0) return;

        const expoMessages: ExpoPushMessage[] = [];
        const fcmTokens: string[] = [];

        for (const { token } of tokens) {
            const isUrgent = ["EMERGENCY", "TOW_ALERT", "CALL"].includes((data?.type as string) || "");
            const soundFile = isUrgent ? "alert-urgent.wav" : "alert-soft.wav";

            if (Expo.isExpoPushToken(token)) {
                expoMessages.push({
                    to: token,
                    sound: "default", // Expo handles this, but custom requires mapping in app.json if non-default
                    title,
                    body,
                    data: data || {},
                    priority: "high",
                    badge: 1,
                });
            } else {
                // Assume anything else is a native FCM token
                fcmTokens.push(token);
            }
        }

        // 1. Send via Firebase FCM
        if (fcmTokens.length > 0 && admin.apps.length > 0) {
            try {
                const response = await admin.messaging().sendEachForMulticast({
                    tokens: fcmTokens,
                    notification: { title, body },
                    data: (data as any) || {},
                    android: {
                        priority: "high",
                        notification: { sound: "default" },
                    },
                    apns: {
                        payload: { aps: { sound: "default" } },
                    },
                });

                // Clean up invalid tokens
                if (response.failureCount > 0) {
                    const tokensToRemove: string[] = [];
                    response.responses.forEach((res, idx) => {
                        if (!res.success && res.error) {
                            if (
                                res.error.code === "messaging/registration-token-not-registered" ||
                                res.error.code === "messaging/invalid-registration-token"
                            ) {
                                tokensToRemove.push(fcmTokens[idx]);
                            }
                        }
                    });

                    if (tokensToRemove.length > 0) {
                        await prisma.pushToken.deleteMany({
                            where: { token: { in: tokensToRemove } },
                        });
                    }
                }
            } catch (err) {
                console.error("Error sending FCM push:", err);
            }
        }

        // 2. Send via Expo Push API
        if (expoMessages.length > 0) {
            const chunks = expo.chunkPushNotifications(expoMessages);
            for (const chunk of chunks) {
                try {
                    const receipts = await expo.sendPushNotificationsAsync(chunk);
                    for (let i = 0; i < receipts.length; i++) {
                        const receipt = receipts[i];
                        if (receipt.status === "error") {
                            if (receipt.details?.error === "DeviceNotRegistered") {
                                await prisma.pushToken.deleteMany({
                                    where: { token: (chunk[i] as ExpoPushMessage).to as string },
                                });
                            }
                            console.error("Expo Push error:", receipt.message);
                        }
                    }
                } catch (err) {
                    console.error("Error sending Expo push chunk:", err);
                }
            }
        }
    } catch (err) {
        console.error("Error in sendPushToUser:", err);
    }
}
