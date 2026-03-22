import React from "react";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop, G } from "react-native-svg";
import { useAppTheme } from "../ThemeProvider";

/** ViewBox scale for 120×180 mark embedded in 32×32 icon */
const S = 0.22;

export function SignalLogo({ size = 36, color }: { size?: number; color?: string }) {
    const { theme, isDark, darkAccent } = useAppTheme();
    const highlightColor = color || theme.primary;

    const shieldGrad = !isDark
        ? { top: "#93C5FD", mid: "#2113FF", bottom: "#312E81" }
        : darkAccent === "deepBlue"
          ? { top: theme.primaryOnSurface, mid: theme.primarySoft, bottom: "#1E3A8A" }
          : { top: theme.primaryOnSurface, mid: theme.primarySoft, bottom: "#075985" };
    const wifiStart = !isDark ? "#93C5FD" : theme.primaryOnSurface;

    return (
        <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
            <Defs>
                <SvgLinearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={shieldGrad.top} />
                    <Stop offset="45%" stopColor={shieldGrad.mid} />
                    <Stop offset="100%" stopColor={shieldGrad.bottom} />
                </SvgLinearGradient>
                <SvgLinearGradient id="wifiGrad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor={wifiStart} />
                    <Stop offset="100%" stopColor={highlightColor} />
                </SvgLinearGradient>
                <SvgLinearGradient id="nfcStroke" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor="#15102a" />
                    <Stop offset="55%" stopColor="#1e1a4a" />
                    <Stop offset="100%" stopColor={highlightColor} />
                </SvgLinearGradient>
            </Defs>

            <G transform="translate(4, 9)">
                <Path
                    d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
                    fill="url(#shieldGrad)"
                    opacity={0.98}
                />
                <Path
                    d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
                    fill="none"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth={0.8}
                    strokeLinejoin="round"
                />
            </G>

            <G transform="translate(3, 7.5)">
                <G transform={`scale(${S})`}>
                    <G transform="translate(22, 6)">
                        <G transform="translate(91, 46.6) scale(2.120875) translate(-12, -12) rotate(-45 12 12)">
                            <Path
                                d="M16.3 19.5002C17.4 17.2002 18 14.7002 18 12.0002C18 9.30024 17.4 6.70024 16.3 4.50024M12.7 17.8003C13.5 16.0003 14 14.0003 14 12.0003C14 10.0003 13.5 7.90034 12.7 6.10034M9.1001 16.1001C9.7001 14.8001 10.0001 13.4001 10.0001 12.0001C10.0001 10.6001 9.7001 9.10015 9.1001 7.90015M5.5 14.3003C5.8 13.6003 6 12.8003 6 12.0003C6 11.2003 5.8 10.3003 5.5 9.60034"
                                stroke="url(#nfcStroke)"
                                strokeWidth={2.064}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                                opacity={0.98}
                            />
                        </G>
                    </G>
                </G>
            </G>
        </Svg>
    );
}
