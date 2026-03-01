"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { sendSMS, initiateCall, getAlertMessage } from "@/lib/twilio";
import { sendEmail, getAlertEmailHTML } from "@/lib/email";
import { checkRateLimit, hashIP, rateLimitConfigs } from "@/lib/rate-limit";
import { decryptPhone } from "@/lib/crypto";

export type ContactAction =
    | "blocking_driveway"
    | "parking_meter"
    | "lights_on"
    | "tow_alert"
    | "emergency";

interface ContactResult {
    success: boolean;
    message: string;
    autoReply?: string | null;
    rateLimited?: boolean;
    showCaptcha?: boolean;
}

const actionTitles: Record<ContactAction, string> = {
    blocking_driveway: "Blocked Driveway Alert",
    parking_meter: "Parking Meter Expiring",
    lights_on: "Lights Left On",
    tow_alert: "⚠️ Tow Alert",
    emergency: "🚨 Emergency Alert",
};

const notifyType: Record<ContactAction, string> = {
    blocking_driveway: "SMS_RECEIVED",
    parking_meter: "SMS_RECEIVED",
    lights_on: "SMS_RECEIVED",
    tow_alert: "TOW_ALERT",
    emergency: "EMERGENCY",
};

const actionTypeMap: Record<ContactAction, string> = {
    blocking_driveway: "CONTACT_SMS",
    parking_meter: "CONTACT_SMS",
    lights_on: "CONTACT_SMS",
    tow_alert: "TOW_ALERT",
    emergency: "CONTACT_CALL",
};

export async function initiateContact(
    tagPublicId: string,
    action: ContactAction,
    scannerMessage?: string,
    turnstileToken?: string
): Promise<ContactResult> {
    try {
        // Verify Turnstile Token if configured
        if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY) {
            if (!turnstileToken) {
                return { success: false, message: "Security check failed. Please refresh the page.", showCaptcha: true };
            }

            const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`,
            });
            const data = await res.json();
            if (!data.success) {
                console.error("Turnstile verification failed:", data);
                return { success: false, message: "Security check failed. Please try again.", showCaptcha: true };
            }
        }

        // Get IP for rate limiting
        const headersList = await headers();
        const ip =
            headersList.get("x-forwarded-for") || headersList.get("x-real-ip");
        const ipHash = hashIP(ip);
        const userAgent = headersList.get("user-agent") || undefined;

        // Emergency and tow alerts bypass rate limiting
        const bypassRateLimit = action === "emergency" || action === "tow_alert";

        if (!bypassRateLimit) {
            const rateLimit = checkRateLimit(
                `contact:${ipHash}:${tagPublicId}`,
                rateLimitConfigs.contact
            );

            if (rateLimit.limited) {
                return {
                    success: false,
                    message: "Too many contact attempts. Please try again later.",
                    rateLimited: true,
                };
            }
        }

        // Find the tag by public ID with owner + vehicle info
        const tag = await prisma.tag.findFirst({
            where: { publicId: tagPublicId },
            include: {
                vehicle: {
                    include: {
                        owner: {
                            select: {
                                id: true,
                                email: true,
                                phoneEncrypted: true,
                                smsNotif: true,
                            },
                        },
                        autoReplies: {
                            where: { isActive: true },
                            take: 1,
                        },
                    },
                },
            },
        });

        if (!tag || tag.status !== "ACTIVE") {
            return { success: false, message: "Tag not found or inactive" };
        }

        const vehicle = tag.vehicle;
        const vehicleDescription = `${vehicle.color} ${vehicle.model}`;
        const owner = vehicle.owner;

        // Check tow-prevention mode
        const isTowAlert = action === "tow_alert";
        if (isTowAlert && vehicle.towPreventionMode) {
            // Tow-prevention is ON — send highest priority dual-channel alert
            // (handled the same way, but we note it in the notification)
        }

        // Build the alert message
        const smsBody = getAlertMessage(action, vehicleDescription);
        const fullMessage = scannerMessage
            ? `${smsBody}\n\nMessage from person nearby: "${scannerMessage.slice(0, 200)}"`
            : smsBody;

        // ── Log interaction ──
        const interaction = await prisma.interaction.create({
            data: {
                tagId: tag.id,
                actionType: actionTypeMap[action],
                ipHash,
                userAgent,
                message: scannerMessage?.slice(0, 200) || null,
            },
        });

        // ── Create notification ──
        const towExtra =
            isTowAlert && vehicle.towPreventionMode
                ? " [TOW PREVENTION MODE ACTIVE]"
                : "";

        await prisma.notification.create({
            data: {
                userId: owner.id,
                interactionId: interaction.id,
                type: notifyType[action],
                title: actionTitles[action] + towExtra,
                body: fullMessage,
            },
        });

        // ── Send email ──
        const emailContent = getAlertEmailHTML(
            action,
            vehicleDescription,
            tag.shortCode
        );
        const emailResult = await sendEmail({
            to: owner.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
        });
        if (!emailResult.success) {
            console.error("Failed to send email:", emailResult.error);
        }

        // ── Send SMS (decrypt phone, check preference) ──
        const ownerPhone = owner.phoneEncrypted
            ? decryptPhone(owner.phoneEncrypted)
            : null;

        if (ownerPhone && owner.smsNotif) {
            await sendSMS({ to: ownerPhone, message: fullMessage });
        }

        // ── For emergencies and tow alerts, also try voice call ──
        if (
            (action === "emergency" || (isTowAlert && vehicle.towPreventionMode)) &&
            ownerPhone
        ) {
            await initiateCall(ownerPhone);
        }

        // ── Build success response ──
        const autoReply = vehicle.autoReplies[0]?.message ?? null;

        const actionMessages: Record<ContactAction, string> = {
            blocking_driveway:
                "The owner has been notified about the blocked driveway.",
            parking_meter: "The owner has been alerted about the parking meter.",
            lights_on: "The owner has been notified about the lights.",
            tow_alert:
                "The vehicle owner has been urgently notified about the tow risk.",
            emergency:
                "Emergency alert sent. The owner is being contacted urgently.",
        };

        return {
            success: true,
            message: actionMessages[action] || "Owner has been notified.",
            autoReply,
        };
    } catch (error) {
        console.error("Error initiating contact:", error);
        return {
            success: false,
            message: "Failed to contact owner. Please try again.",
        };
    }
}
