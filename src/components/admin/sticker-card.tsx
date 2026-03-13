"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StickerCardProps {
    shortCode: string;
    assetName: string;
    assetType: string;
    tagUrl: string;
    /** Base64 PNG data URL generated server-side — no CORS issues on canvas */
    qrDataUrl: string;
}

// ─── Canvas constants ────────────────────────────────────────────────────────
const W = 1040;  // 520px × 2
const H = 592;   // 296px × 2
const LEFT_W = 480; // 240px × 2 – navy QR panel
const PAD  = 44;
const NAVY = "#0f2044";
const TEAL = "#00D4B4";

// Draw a rounded-rect clipping / fill helper
function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

export function StickerCard({ shortCode, assetName, assetType, tagUrl, qrDataUrl }: StickerCardProps) {
    const previewRef = useRef<HTMLDivElement>(null);

    async function handleDownload() {
        // Load QR image from base64 data URL — no CORS, always works
        const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = qrDataUrl;
        });

        const canvas = document.createElement("canvas");
        canvas.width  = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d")!;

        // ── Card background with rounded corners ──────────────────────────────
        ctx.save();
        roundRect(ctx, 0, 0, W, H, 24);
        ctx.clip();

        // Shadow (approximate, drawn as a blurred outer ring – not needed in png but we fake border)
        // Full white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);

        // ── LEFT: Navy QR panel ───────────────────────────────────────────────
        ctx.fillStyle = NAVY;
        ctx.fillRect(0, 0, LEFT_W, H);

        // Corner brackets
        const BK = 44; // bracket arm length
        const BT = 6;  // bracket thickness
        const BO = 28; // bracket offset from corner
        ctx.strokeStyle = TEAL;
        ctx.lineWidth = BT;
        ctx.lineCap = "square";
        // top-left
        ctx.beginPath(); ctx.moveTo(BO, BO + BK); ctx.lineTo(BO, BO); ctx.lineTo(BO + BK, BO); ctx.stroke();
        // top-right
        ctx.beginPath(); ctx.moveTo(LEFT_W - BO - BK, BO); ctx.lineTo(LEFT_W - BO, BO); ctx.lineTo(LEFT_W - BO, BO + BK); ctx.stroke();
        // bottom-left
        ctx.beginPath(); ctx.moveTo(BO, H - BO - BK); ctx.lineTo(BO, H - BO); ctx.lineTo(BO + BK, H - BO); ctx.stroke();
        // bottom-right
        ctx.beginPath(); ctx.moveTo(LEFT_W - BO - BK, H - BO); ctx.lineTo(LEFT_W - BO, H - BO); ctx.lineTo(LEFT_W - BO, H - BO - BK); ctx.stroke();

        // QR image centred in left panel
        const QR = 328; // size on canvas
        const qx = (LEFT_W - QR) / 2;
        const qy = (H - QR) / 2;
        // Small white background behind QR so the transparent areas show as white
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(qx - 6, qy - 6, QR + 12, QR + 12);
        ctx.drawImage(qrImg, qx, qy, QR, QR);

        // ── RIGHT: White info panel ───────────────────────────────────────────
        const rx = LEFT_W; // right panel starts here
        const rw = W - LEFT_W;

        // Brand row
        // Mini shield SVG – draw manually
        const shieldX = rx + PAD;
        const shieldY = PAD + 4;
        const shieldSize = 36;
        // shield body (navy)
        ctx.fillStyle = NAVY;
        ctx.beginPath();
        ctx.moveTo(shieldX + shieldSize / 2, shieldY);
        ctx.bezierCurveTo(shieldX, shieldY + 8, shieldX, shieldY + 20, shieldX + shieldSize / 2, shieldY + shieldSize);
        ctx.bezierCurveTo(shieldX + shieldSize, shieldY + 20, shieldX + shieldSize, shieldY + 8, shieldX + shieldSize / 2, shieldY);
        ctx.fill();
        // checkmark (teal)
        ctx.strokeStyle = TEAL;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        // rough checkmark scaled to shield
        ctx.moveTo(shieldX + 10, shieldY + 18);
        ctx.lineTo(shieldX + 16, shieldY + 24);
        ctx.lineTo(shieldX + 26, shieldY + 12);
        ctx.stroke();

        ctx.fillStyle = NAVY;
        ctx.font = `bold 28px 'Helvetica Neue', Arial, sans-serif`;
        ctx.textBaseline = "middle";
        ctx.fillText("ReachMasked.com", shieldX + shieldSize + 14, shieldY + shieldSize / 2);

        // ── Hero text ─────────────────────────────────────────────────────────
        const heroY = PAD + 80;
        ctx.fillStyle = NAVY;
        ctx.font = `800 42px 'Helvetica Neue', Arial, sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText("Scan or Tap to", rx + PAD, heroY);
        ctx.fillText("reach the owner", rx + PAD, heroY + 50);

        // Teal accent bar
        ctx.fillStyle = TEAL;
        ctx.beginPath();
        ctx.roundRect(rx + PAD, heroY + 108, 96, 6, 3);
        ctx.fill();

        // ── Badges ────────────────────────────────────────────────────────────
        const badges = ["Anonymous", "Private", "No App"];
        ctx.font = `bold 22px 'Helvetica Neue', Arial, sans-serif`;
        ctx.textBaseline = "middle";
        let bx = rx + PAD;
        const by = heroY + 136;
        const bh = 46;
        const bPadV = 6;
        const bPadH = 20;
        const bRadius = 23;
        for (const badge of badges) {
            const tw = ctx.measureText(badge).width;
            const bw = tw + bPadH * 2;
            ctx.fillStyle = TEAL;
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, bRadius);
            ctx.fill();
            ctx.fillStyle = "#0a1a2e";
            ctx.fillText(badge, bx + bPadH, by + bh / 2 + bPadV / 2);
            bx += bw + 12;
        }

        // ── Bottom strip ──────────────────────────────────────────────────────
        const bottomY = H - PAD - 44;

        // Asset label
        ctx.fillStyle = "#94a3b8";
        ctx.font = `600 18px 'Helvetica Neue', Arial, sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText(`${assetType.toUpperCase()} · ${assetName}`, rx + PAD, bottomY);

        // Short code
        ctx.fillStyle = NAVY;
        ctx.font = `bold 26px 'Courier New', Courier, monospace`;
        ctx.fillText(shortCode, rx + PAD, bottomY + 26);

        // "100% private contact" pill (right-aligned)
        const pillText = "100% private contact";
        ctx.font = `600 20px 'Helvetica Neue', Arial, sans-serif`;
        const pillTw = ctx.measureText(pillText).width;
        const pillPH = 16;
        const pillPV = 10;
        const pillW = pillTw + pillPH * 2;
        const pillH = 40;
        const pillX = rx + rw - PAD - pillW;
        const pillY = bottomY + 8;
        ctx.fillStyle = NAVY;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 12);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";
        ctx.fillText(pillText, pillX + pillPH, pillY + pillH / 2);

        // ── Outer border ──────────────────────────────────────────────────────
        ctx.restore(); // end rounded-clip
        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 2;
        roundRect(ctx, 1, 1, W - 2, H - 2, 24);
        ctx.stroke();

        // ── Export ────────────────────────────────────────────────────────────
        const link = document.createElement("a");
        link.download = `reachmasked-sticker-${shortCode}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    }

    // ── Small in-page preview (keep the styled HTML card) ────────────────────

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Sticker Preview */}
            <div
                ref={previewRef}
                style={{
                    width: "520px",
                    height: "296px",
                    display: "flex",
                    flexDirection: "row",
                    borderRadius: "12px",
                    overflow: "hidden",
                    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                }}
            >
                {/* LEFT: Dark navy QR zone */}
                <div
                    style={{
                        width: "240px",
                        minWidth: "240px",
                        background: NAVY,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "24px",
                        position: "relative",
                    }}
                >
                    {/* Teal corner brackets */}
                    <div style={{ position: "absolute", top: 14, left: 14,   width: 22, height: 22, borderTop:    `3px solid ${TEAL}`, borderLeft:  `3px solid ${TEAL}` }} />
                    <div style={{ position: "absolute", top: 14, right: 14,  width: 22, height: 22, borderTop:    `3px solid ${TEAL}`, borderRight: `3px solid ${TEAL}` }} />
                    <div style={{ position: "absolute", bottom: 14, left: 14, width: 22, height: 22, borderBottom: `3px solid ${TEAL}`, borderLeft:  `3px solid ${TEAL}` }} />
                    <div style={{ position: "absolute", bottom: 14, right: 14,width: 22, height: 22, borderBottom: `3px solid ${TEAL}`, borderRight: `3px solid ${TEAL}` }} />
                    {/* QR Code – white bg so it's readable */}
                    <div style={{ background: "#ffffff", padding: "8px", borderRadius: "8px" }}>
                        <img
                            src={qrDataUrl}
                            alt="QR Code"
                            style={{ width: "148px", height: "148px", display: "block" }}
                        />
                    </div>
                </div>

                {/* RIGHT: White info zone */}
                <div
                    style={{
                        flex: 1,
                        background: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "20px 22px",
                    }}
                >
                    {/* Top: Brand */}
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 7, flexShrink: 0 }}>
                            <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" fill={NAVY} />
                            <path d="M10 17L7 14L8.41 12.59L10 14.17L15.59 8.58L17 10L10 17Z" fill={TEAL} />
                        </svg>
                        <span style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>ReachMasked.com</span>
                    </div>

                    {/* Middle: Call to action */}
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: NAVY, lineHeight: "24px", marginBottom: 8 }}>
                            Scan or Tap to<br />reach the owner
                        </div>
                        <div style={{ width: 48, height: 3, background: TEAL, borderRadius: 2, marginBottom: 12 }} />
                        <div style={{ display: "flex", flexWrap: "wrap" }}>
                            {["Anonymous", "Private", "No App"].map((label) => (
                                <span
                                    key={label}
                                    style={{
                                        background: TEAL,
                                        color: "#0a1a2e",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: "4px 10px",
                                        borderRadius: 20,
                                        marginRight: 6,
                                        marginBottom: 4,
                                    }}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Bottom: Tag code + pill */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600, marginBottom: 2 }}>
                                {assetType} · {assetName}
                            </div>
                            <code style={{ fontSize: 12, color: NAVY, fontWeight: 700, fontFamily: "monospace" }}>
                                {shortCode}
                            </code>
                        </div>
                        <div style={{ background: NAVY, color: "#fff", fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 6 }}>
                            100% private contact
                        </div>
                    </div>
                </div>
            </div>

            {/* Download Button */}
            <Button
                onClick={handleDownload}
                className="gap-2 bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold"
                size="sm"
            >
                <Download className="h-4 w-4" />
                Download Sticker PNG
            </Button>
        </div>
    );
}
