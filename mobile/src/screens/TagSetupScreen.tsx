import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Switch,
    Alert,
} from "react-native";
import { 
    QrCode, 
    Link, 
    Settings, 
    Check, 
    Copy, 
    Car, 
    Dog, 
    Home, 
    User, 
    Package,
    Smartphone,
    PenTool,
    MapPin,
    ShieldCheck
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { updateTagStatus, toggleTowPrevention, fetchAssetDetail } from "../api";
import { useAppTheme } from "../ThemeProvider";

export default function TagSetupScreen({ route, navigation }: any) {
    const { tagId, shortCode, assetName, assetType } = route.params;
    const { theme, isDark } = useAppTheme();
    const [tagStatus, setTagStatus] = useState<"ACTIVE" | "DISABLED">("ACTIVE");
    const [towMode, setTowMode] = useState(false);
    const [assetId, setAssetId] = useState<string | null>(null);
    const [totalScans, setTotalScans] = useState(0);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const tagURL = `https://reachmasked.com/t/${shortCode}`;
    const nfcPayload = tagURL;

    useEffect(() => {
        // Load asset detail to get tag status and tow mode
        (async () => {
            try {
                // We need to find the assetId from the tag
                // The dashboard data should have this, but we can search
                const res = await fetchAssetDetail(route.params.assetId || "");
                if (res?.asset) {
                    setAssetId(res.asset.id);
                    setTowMode(res.asset.towPreventionMode || false);
                    const tag = res.asset.tags?.find((t: any) => t.id === tagId);
                    if (tag) setTagStatus(tag.status);
                    setTotalScans(res.interactions?.length || 0);
                }
            } catch (err) {
                console.error("Tag setup load error:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [tagId]);

    const handleCopy = async (text: string) => {
        await Clipboard.setStringAsync(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToggleTag = async () => {
        const newStatus = tagStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
        try {
            await updateTagStatus(tagId, newStatus);
            setTagStatus(newStatus);
        } catch (err) {
            Alert.alert("Error", "Failed to update tag status");
        }
    };

    const handleToggleTow = async () => {
        if (!assetId) return;
        const newVal = !towMode;
        try {
            await toggleTowPrevention(assetId, newVal);
            setTowMode(newVal);
        } catch (err) {
            Alert.alert("Error", "Failed to update tow prevention");
        }
    };

    const s = createStyles(theme, isDark);

    if (loading) {
        return (
            <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const getTypeIcon = (type: string, size = 24, color?: string) => {
        switch (type) {
            case "CAR": return <Car size={size} color={color} />;
            case "PET": return <Dog size={size} color={color} />;
            case "HOME": return <Home size={size} color={color} />;
            case "PERSON": return <User size={size} color={color} />;
            default: return <Package size={size} color={color} />;
        }
    };

    return (
        <SafeAreaView style={s.container} edges={["left", "right", "bottom"]}>
            <ScrollView contentContainerStyle={s.scrollContent}>
                {/* Asset Info */}
                <View style={s.assetHeader}>
                    <View style={s.assetIconBox}>
                        {getTypeIcon(assetType, 24, theme.primary)}
                    </View>
                    <View>
                        <Text style={s.assetName}>{assetName || "Asset"}</Text>
                        <Text style={s.assetMeta}>Tag Code: {shortCode}</Text>
                    </View>
                </View>

                {/* QR Code Card */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <QrCode size={20} color={theme.text} />
                        <Text style={s.cardTitle}>QR Code</Text>
                    </View>
                    <View style={s.qrContainer}>
                        <QRCode
                            value={tagURL}
                            size={180}
                            backgroundColor="white"
                            color="black"
                        />
                    </View>
                    <Text style={s.qrHint}>Print this QR code and place it on your asset</Text>
                </View>

                {/* URL & NFC Card */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Link size={20} color={theme.text} />
                        <Text style={s.cardTitle}>NFC & URL</Text>
                    </View>

                    <Text style={s.fieldLabel}>Tag URL</Text>
                    <View style={s.codeRow}>
                        <Text style={s.codeText} numberOfLines={1}>{tagURL}</Text>
                        <TouchableOpacity style={s.copyBtn} onPress={() => handleCopy(tagURL)}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                {copied ? <Check size={14} color="#fff" /> : <Copy size={14} color="#fff" />}
                                <Text style={s.copyBtnText}>{copied ? "Copied" : "Copy"}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <Text style={[s.fieldLabel, { marginTop: 16 }]}>NFC Payload</Text>
                    <View style={s.codeBlock}>
                        <Text style={s.codeText}>{nfcPayload}</Text>
                    </View>
                    <Text style={s.hint}>
                        Program this URL onto an NTAG213/215 NFC tag. No encrypted data needed.
                    </Text>

                    <View style={s.statRow}>
                        <Text style={s.statLabel}>Total Scans</Text>
                        <Text style={s.statValue}>{totalScans}</Text>
                    </View>
                </View>

                {/* Tag Controls */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Settings size={20} color={theme.text} />
                        <Text style={s.cardTitle}>Tag Controls</Text>
                    </View>
                    <View style={s.controlRow}>
                        <View>
                            <Text style={s.controlLabel}>Tag Status</Text>
                            <Text style={s.controlHint}>
                                {tagStatus === "ACTIVE" ? "Tag is active and scannable" : "Tag is disabled — shows 'Not Found'"}
                            </Text>
                        </View>
                        <Switch
                            value={tagStatus === "ACTIVE"}
                            onValueChange={handleToggleTag}
                            trackColor={{ false: theme.border, true: theme.success }}
                            thumbColor="#fff"
                        />
                    </View>
                    <View style={[s.controlRow, { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 14 }]}>
                        <View>
                            <Text style={s.controlLabel}>Tow Prevention</Text>
                            <Text style={s.controlHint}>
                                {towMode ? "Urgent call + SMS if tow operator scans" : "Standard notifications only"}
                            </Text>
                        </View>
                        <Switch
                            value={towMode}
                            onValueChange={handleToggleTow}
                            trackColor={{ false: theme.border, true: theme.warning }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* NFC Setup Steps */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Smartphone size={20} color={theme.text} />
                        <Text style={s.cardTitle}>NFC Setup Guide</Text>
                    </View>
                    
                    <View style={s.stepCard}>
                        <View style={s.stepIconBox}>
                            <Package size={20} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.stepTitle}>1. Get your Tag</Text>
                            <Text style={s.stepDesc}>Use NTAG213 or NTAG215 stickers, keyfobs, or cards.</Text>
                        </View>
                    </View>

                    <View style={s.stepCard}>
                        <View style={s.stepIconBox}>
                            <Smartphone size={20} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.stepTitle}>2. Use NFC App</Text>
                            <Text style={s.stepDesc}>Download "NFC Tools" (Free) on iOS or Android.</Text>
                        </View>
                    </View>

                    <View style={s.stepCard}>
                        <View style={s.stepIconBox}>
                            <PenTool size={20} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.stepTitle}>3. Write URL</Text>
                            <Text style={s.stepDesc}>Select "Write" &rarr; "Add Record" &rarr; "URL" &rarr; Paste the Tag URL.</Text>
                        </View>
                    </View>

                    <View style={s.stepCard}>
                        <View style={s.stepIconBox}>
                            <MapPin size={20} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.stepTitle}>4. Place on Asset</Text>
                            <Text style={s.stepDesc}>Stick the tag on your dashboard, door, or pet collar.</Text>
                        </View>
                    </View>

                    <View style={s.privacyPill}>
                        <ShieldCheck size={16} color={theme.success} />
                        <Text style={s.privacyText}>
                            Privacy Safe: No personal data is stored on the tag chip.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (theme: any, isDark: boolean) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        scrollContent: { padding: 16, paddingBottom: 40 },

        assetHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
        assetIconBox: {
            width: 48, height: 48, borderRadius: 12,
            backgroundColor: "rgba(99,102,241,0.1)",
            justifyContent: "center", alignItems: "center",
        },
        assetName: { fontSize: 20, fontWeight: "700", color: theme.text },
        assetMeta: { fontSize: 13, color: theme.textMuted, marginTop: 2 },

        card: {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 14, borderWidth: 1, borderColor: theme.border,
            padding: 20, marginBottom: 16,
        },
        cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
        cardTitle: { fontSize: 17, fontWeight: "700", color: theme.text },

        qrContainer: {
            alignItems: "center", padding: 16,
            backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 12,
        },
        qrHint: { fontSize: 13, color: theme.textMuted, textAlign: "center" },

        fieldLabel: { fontSize: 13, fontWeight: "600", color: theme.text, marginBottom: 6 },
        codeRow: {
            flexDirection: "row", alignItems: "center",
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
            borderRadius: 10, padding: 12,
        },
        codeBlock: {
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
            borderRadius: 10, padding: 12,
        },
        codeText: { fontSize: 13, color: theme.text, flex: 1 },
        copyBtn: {
            backgroundColor: theme.primary, borderRadius: 6,
            paddingHorizontal: 12, paddingVertical: 6, marginLeft: 8,
        },
        copyBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
        hint: { fontSize: 12, color: theme.textMuted, marginTop: 8 },

        statRow: {
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border,
        },
        statLabel: { fontSize: 13, color: theme.textMuted },
        statValue: { fontSize: 20, fontWeight: "800", color: theme.text },

        controlRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
        controlLabel: { fontSize: 14, fontWeight: "600", color: theme.text },
        controlHint: { fontSize: 12, color: theme.textMuted, marginTop: 2, maxWidth: 240 },

        instructionRow: { flexDirection: "row", gap: 16, marginTop: 12 },
        instructionHeading: { fontSize: 13, fontWeight: "700", color: theme.text, marginBottom: 4 },
        instructionText: { fontSize: 12, color: theme.textMuted, lineHeight: 18 },

        privacyPill: {
            marginTop: 20,
            padding: 12,
            borderRadius: 12,
            backgroundColor: isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.05)",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderWidth: 1,
            borderColor: "rgba(16,185,129,0.2)",
        },
        privacyText: { fontSize: 13, color: isDark ? "#A7F3D0" : "#065F46", fontWeight: "600" },
        stepCard: {
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
        },
        stepIconBox: {
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)",
            justifyContent: "center",
            alignItems: "center",
        },
        stepTitle: { fontSize: 14, fontWeight: "700", color: theme.text, marginBottom: 2 },
        stepDesc: { fontSize: 12, color: theme.textMuted, lineHeight: 18 },
    });
