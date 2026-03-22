"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Full Signal Tag mark (shield + goggles + QR + lock + NFC from public/nfc.svg) — same SVG as logo-signal-tag.html */
export function SignalTagLogo({
    className,
    size = 32,
    "aria-label": ariaLabel = "ReachMasked",
}: {
    className?: string;
    /** Width in px; height is 1.5× (120×180 viewBox) */
    size?: number;
    "aria-label"?: string;
}) {
    const uid = useId().replace(/:/g, "");
    const G1 = `sig-g1-${uid}`;
    const nfcStroke = `sig-nfc-stroke-${uid}`;
    const shieldFill = `sig-shield-${uid}`;
    const gRim = `sig-rim-${uid}`;
    const gLens = `sig-lens-${uid}`;

    const h = Math.round(size * 1.5);

    return (
        <svg
            role="img"
            aria-label={ariaLabel}
            width={size}
            height={h}
            viewBox="0 0 120 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            overflow="visible"
            shapeRendering="geometricPrecision"
            className={cn("shrink-0 text-transparent", className)}
        >
            <defs>
                <linearGradient id={G1} x1="0" y1="0" x2="120" y2="180" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#95C8FF" />
                    <stop offset="100%" stopColor="#2113FF" />
                </linearGradient>
                {/* NFC: darker than G1 — less “lit”, reads heavier on the tag */}
                <linearGradient id={nfcStroke} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#15102a" />
                    <stop offset="55%" stopColor="#1e1a4a" />
                    <stop offset="100%" stopColor="#2113FF" />
                </linearGradient>
                <linearGradient id={shieldFill} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="45%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#1E3A8A" />
                </linearGradient>
                <linearGradient id={gRim} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="25%" stopColor="#1e293b" />
                    <stop offset="50%" stopColor="#0f172a" />
                    <stop offset="75%" stopColor="#020617" />
                    <stop offset="100%" stopColor="#000000" />
                </linearGradient>
                <linearGradient id={gLens} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#020617" />
                    <stop offset="100%" stopColor="#083344" />
                </linearGradient>
            </defs>

            {/* Less top padding — was translate(0,10) */}
            <g transform="translate(0, 2)">
                <g transform="translate(6, 42.5) scale(4.5)">
                    <path
                        d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
                        fill={`url(#${shieldFill})`}
                        opacity={0.98}
                    />
                    <path
                        d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
                        fill="none"
                        stroke="rgba(255,255,255,0.22)"
                        strokeWidth="0.35"
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                    />
                </g>

                <g transform="translate(0, -7)">
                    <ellipse cx="43" cy="85" rx="13" ry="9" fill="#030406" opacity="0.6" />
                    <ellipse cx="77" cy="85" rx="13" ry="9" fill="#030406" opacity="0.6" />
                    <rect x="53" y="83" width="14" height="6" rx="3" fill="#030406" opacity="0.6" />
                    <ellipse cx="43" cy="83" rx="13" ry="9" fill={`url(#${gRim})`} />
                    <ellipse cx="77" cy="83" rx="13" ry="9" fill={`url(#${gRim})`} />
                    <rect x="53" y="81" width="14" height="6" rx="3" fill={`url(#${gRim})`} />
                    <ellipse cx="43" cy="83" rx="10" ry="7" fill="#000000" />
                    <ellipse cx="77" cy="83" rx="10" ry="7" fill="#000000" />
                    <ellipse cx="43" cy="83" rx="8.5" ry="5.5" fill={`url(#${gLens})`} />
                    <ellipse cx="77" cy="83" rx="8.5" ry="5.5" fill={`url(#${gLens})`} />
                    <path
                        d="M 37 80.5 Q 43 78 49 80.5"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <path
                        d="M 71 80.5 Q 77 78 83 80.5"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <rect x="41" y="99" width="9" height="9" rx="2.5" fill="#ffffff" opacity="0.95" />
                    <rect x="55" y="99" width="10" height="9" rx="2.5" fill="#ffffff" opacity="0.95" />
                    <rect x="70" y="99" width="9" height="9" rx="2.5" fill="#ffffff" opacity="0.95" />
                    <rect x="41" y="112" width="9" height="9" rx="2.5" fill="#ffffff" opacity="0.95" />
                    <rect x="55" y="112" width="10" height="9" rx="2.5" fill="#ffffff" opacity="0.95" />
                    <rect x="57" y="114" width="6" height="5" rx="1.5" fill="#2113FF" />
                    <rect x="70" y="112" width="9" height="9" rx="2.5" fill="#ffffff" opacity="0.95" />
                    <rect x="41" y="125" width="9" height="9" rx="2.5" fill="#ffffff" opacity="0.95" />
                    <rect x="70" y="125" width="9" height="9" rx="2.5" fill="#ffffff" opacity="0.95" />
                    <g transform="translate(0, 17)">
                        <rect x="51" y="108" width="18" height="13" rx="3" fill="#1DE9B6" />
                        <path
                            d="M54.5 108 V 104 A 5.5 5.5 0 0 1 65.5 104 V 108"
                            fill="none"
                            stroke="#1DE9B6"
                            strokeWidth="2.5"
                        />
                        <circle cx="60" cy="113" r="1.5" fill="#1509a8" />
                        <path d="M59 113 L58.5 117 L61.5 117 L61 113" fill="#1509a8" />
                    </g>
                </g>

                {/* NFC: no blur filter — glow + feGaussianBlur scales into mush when zoomed; crisp vector stroke only */}
                <g className="nfc-contactless" transform="translate(22, 6)">
                    <g transform="translate(91, 46.6) scale(2.120875) translate(-12, -12) rotate(-45 12 12)">
                        <path
                            d="M16.3 19.5002C17.4 17.2002 18 14.7002 18 12.0002C18 9.30024 17.4 6.70024 16.3 4.50024M12.7 17.8003C13.5 16.0003 14 14.0003 14 12.0003C14 10.0003 13.5 7.90034 12.7 6.10034M9.1001 16.1001C9.7001 14.8001 10.0001 13.4001 10.0001 12.0001C10.0001 10.6001 9.7001 9.10015 9.1001 7.90015M5.5 14.3003C5.8 13.6003 6 12.8003 6 12.0003C6 11.2003 5.8 10.3003 5.5 9.60034"
                            stroke={`url(#${nfcStroke})`}
                            strokeWidth="2.064"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                            opacity={0.98}
                        />
                    </g>
                </g>
            </g>
        </svg>
    );
}
