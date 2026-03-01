import QRCode from "qrcode";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://reachmasked.com";

/**
 * Generate a QR code as a data URL (base64 PNG)
 */
export async function generateQRDataURL(shortCode: string): Promise<string> {
    const url = `${BASE_URL}/t/${shortCode}`;

    return QRCode.toDataURL(url, {
        errorCorrectionLevel: "H",
        type: "image/png",
        width: 300,
        margin: 2,
        color: {
            dark: "#0F172A", // Slate 900
            light: "#FFFFFF",
        },
    });
}

/**
 * Generate a QR code as an SVG string
 */
export async function generateQRSVG(shortCode: string): Promise<string> {
    const url = `${BASE_URL}/t/${shortCode}`;

    return QRCode.toString(url, {
        errorCorrectionLevel: "H",
        type: "svg",
        width: 300,
        margin: 2,
        color: {
            dark: "#0F172A",
            light: "#FFFFFF",
        },
    });
}

/**
 * Get the full ReachMasked URL for a tag
 */
export function getTagURL(shortCode: string): string {
    return `${BASE_URL}/t/${shortCode}`;
}

/**
 * NFC payload is just the URL - no encrypted data
 * This ensures patent safety and privacy
 */
export function getNFCPayload(shortCode: string): string {
    return getTagURL(shortCode);
}
