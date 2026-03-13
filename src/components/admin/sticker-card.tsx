"use client";

import { useRef } from "react";
import { Shield, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StickerCardProps {
    shortCode: string;
    assetName: string;
    assetType: string;
    tagUrl: string;
}

export function StickerCard({ shortCode, assetName, assetType, tagUrl }: StickerCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    async function handleDownload() {
        const { default: html2canvas } = await import("html2canvas");
        if (!cardRef.current) return;
        const canvas = await html2canvas(cardRef.current, {
            scale: 4,
            backgroundColor: null,
            useCORS: true,
        });
        const link = document.createElement("a");
        link.download = `reachmasked-sticker-${shortCode}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    }

    // QR code via Google Charts API (free, no key needed)
    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(tagUrl)}&chs=300x300&chco=1a2a4a&chf=bg,s,FFFFFF00`;

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Sticker Preview */}
            <div
                ref={cardRef}
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
                        background: "#0f2044",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "24px",
                        position: "relative",
                    }}
                >
                    {/* Teal corner brackets */}
                    <div style={{ position: "absolute", top: "14px", left: "14px", width: "22px", height: "22px", borderTop: "3px solid #00D4B4", borderLeft: "3px solid #00D4B4" }} />
                    <div style={{ position: "absolute", top: "14px", right: "14px", width: "22px", height: "22px", borderTop: "3px solid #00D4B4", borderRight: "3px solid #00D4B4" }} />
                    <div style={{ position: "absolute", bottom: "14px", left: "14px", width: "22px", height: "22px", borderBottom: "3px solid #00D4B4", borderLeft: "3px solid #00D4B4" }} />
                    <div style={{ position: "absolute", bottom: "14px", right: "14px", width: "22px", height: "22px", borderBottom: "3px solid #00D4B4", borderRight: "3px solid #00D4B4" }} />
                    {/* QR Code */}
                    <img
                        src={qrUrl}
                        alt="QR Code"
                        style={{ width: "164px", height: "164px", imageRendering: "pixelated" }}
                        crossOrigin="anonymous"
                    />
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
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: "7px" }}>
                            <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" fill="#0f2044" />
                            <path d="M10 17L7 14L8.41 12.59L10 14.17L15.59 8.58L17 10L10 17Z" fill="#00D4B4" />
                        </svg>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f2044" }}>
                            ReachMasked.com
                        </span>
                    </div>

                    {/* Middle: Call to action */}
                    <div>
                        <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f2044", lineHeight: "24px", marginBottom: "8px" }}>
                            Scan or Tap to<br />reach the owner
                        </div>
                        {/* Teal accent bar */}
                        <div style={{ width: "48px", height: "3px", background: "#00D4B4", borderRadius: "2px", marginBottom: "12px" }} />
                        {/* Badges */}
                        <div style={{ display: "flex", flexWrap: "wrap" }}>
                            {["Anonymous", "Private", "No App"].map((label) => (
                                <span
                                    key={label}
                                    style={{
                                        background: "#00D4B4",
                                        color: "#0a1a2e",
                                        fontSize: "11px",
                                        fontWeight: 700,
                                        padding: "4px 10px",
                                        borderRadius: "20px",
                                        marginRight: "6px",
                                        marginBottom: "6px",
                                    }}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Bottom: Tag code + URL */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                            <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "2px", fontWeight: 600 }}>
                                {assetType} · {assetName}
                            </div>
                            <code style={{ fontSize: "12px", color: "#0f2044", fontWeight: 700, fontFamily: "monospace" }}>
                                {shortCode}
                            </code>
                        </div>
                        <div
                            style={{
                                background: "#0f2044",
                                color: "#fff",
                                fontSize: "10px",
                                fontWeight: 600,
                                padding: "4px 10px",
                                borderRadius: "6px",
                            }}
                        >
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
