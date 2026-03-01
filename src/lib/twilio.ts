import twilio from "twilio";

// Create Twilio client - will throw if env vars are not set
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

// Only create client if credentials are available
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SendSMSParams {
    to: string;
    message: string;
}

export interface TwilioResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send an SMS via Twilio
 * In production, the "to" phone number would be decrypted from the database
 */
export async function sendSMS({ to, message }: SendSMSParams): Promise<TwilioResult> {
    if (!client || !twilioPhone) {
        console.warn("Twilio not configured - running in mock mode");
        return {
            success: true,
            messageId: `mock_${Date.now()}`,
        };
    }

    try {
        const result = await client.messages.create({
            body: message,
            from: twilioPhone,
            to,
        });

        return {
            success: true,
            messageId: result.sid,
        };
    } catch (error) {
        console.error("Twilio SMS error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Initiate a masked voice call via Twilio
 * This would use TwiML in production for proper call flow
 */
export async function initiateCall(to: string): Promise<TwilioResult> {
    if (!client || !twilioPhone) {
        console.warn("Twilio not configured - running in mock mode");
        return {
            success: true,
            messageId: `mock_call_${Date.now()}`,
        };
    }

    try {
        const twiml = `
            <Response>
                <Say voice="alice">Urgent ReachMasked Alert.</Say>
                <Pause length="1"/>
                <Say voice="alice">Someone is trying to reach you about your vehicle. This is an urgent notification.</Say>
                <Pause length="1"/>
                <Say voice="alice">Please check your ReachMasked SMS or email for details.</Say>
                <Pause length="2"/>
                <Say voice="alice">Repeating: Urgent ReachMasked Alert. Please check your messages concerning your vehicle immediately.</Say>
                <Pause length="1"/>
            </Response>
        `;

        const call = await client.calls.create({
            to,
            from: twilioPhone,
            twiml,
        });

        return {
            success: true,
            messageId: call.sid,
        };
    } catch (error) {
        console.error("Twilio call error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Get alert message based on action type
 */
export function getAlertMessage(
    action: string,
    vehicleDescription: string
): string {
    const messages: Record<string, string> = {
        blocking_driveway: `ReachMasked Alert: Someone reported your ${vehicleDescription} is blocking a driveway. Please move your vehicle.`,
        parking_meter: `ReachMasked Alert: Someone noticed your ${vehicleDescription}'s parking meter may be expiring soon.`,
        lights_on: `ReachMasked Alert: Someone noticed the lights are on in your ${vehicleDescription}.`,
        emergency: `URGENT ReachMasked Alert: Someone reported an emergency situation involving your ${vehicleDescription}. Please check immediately.`,
    };

    return messages[action] || `ReachMasked Alert: Someone is trying to reach you about your ${vehicleDescription}.`;
}
