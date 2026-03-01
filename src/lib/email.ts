import { Resend } from "resend";

// Create Resend client - will use mock mode if API key not set
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

// From address - must be verified in Resend dashboard
// Free tier can use onboarding@resend.dev for testing
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send an email notification via Resend
 * Falls back to mock mode if API key not configured
 */
export async function sendEmail({
    to,
    subject,
    html,
    text,
}: SendEmailParams): Promise<EmailResult> {
    if (!resend) {
        console.log("📧 [MOCK] Email would be sent to:", to);
        console.log("📧 [MOCK] Subject:", subject);
        return {
            success: true,
            messageId: `mock_email_${Date.now()}`,
        };
    }

    try {
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html,
            text,
        });

        if (result.error) {
            console.error("Resend error:", result.error);
            return {
                success: false,
                error: result.error.message,
            };
        }

        return {
            success: true,
            messageId: result.data?.id,
        };
    } catch (error) {
        console.error("Email send error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Generate HTML email for vehicle alerts
 */
export function getAlertEmailHTML(
    action: string,
    vehicleDescription: string,
    tagCode: string
): { subject: string; html: string; text: string } {
    const actionTitles: Record<string, string> = {
        blocking_driveway: "🚗 Blocked Driveway Alert",
        parking_meter: "⏰ Parking Meter Expiring",
        lights_on: "💡 Lights Left On",
        emergency: "🚨 URGENT: Emergency Alert",
    };

    const actionMessages: Record<string, string> = {
        blocking_driveway: `Someone reported that your <strong>${vehicleDescription}</strong> is blocking a driveway. Please move your vehicle as soon as possible.`,
        parking_meter: `Someone noticed that the parking meter for your <strong>${vehicleDescription}</strong> may be expiring soon.`,
        lights_on: `Someone noticed that the lights are on in your <strong>${vehicleDescription}</strong>.`,
        emergency: `<strong>URGENT:</strong> Someone reported an emergency situation involving your <strong>${vehicleDescription}</strong>. Please check immediately!`,
    };

    const subject = actionTitles[action] || "ReachMasked Alert";
    const message =
        actionMessages[action] ||
        `Someone is trying to reach you about your ${vehicleDescription}.`;

    const isEmergency = action === "emergency";

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="background: ${isEmergency ? "#ef4444" : "#6366f1"}; border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">
            ${subject}
        </h1>
    </div>
    
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <p style="font-size: 16px; margin-bottom: 16px;">
            ${message}
        </p>
        
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">
                <strong>Vehicle:</strong> ${vehicleDescription}<br>
                <strong>Tag Code:</strong> ${tagCode}
            </p>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
            This alert was sent via ReachMasked. Your phone number was not shared with the person who reported this.
        </p>
    </div>
    
    <div style="text-align: center; padding: 16px; color: #94a3b8; font-size: 12px;">
        <p>© ${new Date().getFullYear()} ReachMasked • Privacy-first vehicle alerts</p>
    </div>
    
</body>
</html>`;

    const text = `${subject}\n\n${message.replace(/<[^>]*>/g, "")}\n\nVehicle: ${vehicleDescription}\nTag Code: ${tagCode}\n\nThis alert was sent via ReachMasked.`;

    return { subject, html, text };
}
