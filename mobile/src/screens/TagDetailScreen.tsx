import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { fetchPaymentIntent, fetchDashboard } from "../api";
import { useAppTheme } from "../ThemeProvider";
import { QrCode, Shield, Truck, Settings } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Vehicle {
    id: string;
    model: string;
    color: string;
    isActive: boolean;
    towPreventionMode: boolean;
    tags: { id: string; shortCode: string; label: string | null; status: string }[];
}

export default function TagDetailScreen({ route, navigation }: any) {
    const { vehicle } = route.params as { vehicle: Vehicle };
    const { theme, isDark } = useAppTheme();
    const tag = vehicle.tags[0];

    const [tagActive, setTagActive] = useState(tag?.status === "ACTIVE");
    const [towMode, setTowMode] = useState(vehicle.towPreventionMode);
    const [loading, setLoading] = useState(false);
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const handleReportLost = () => {
        Alert.alert(
            "Replace Lost Tag?",
            `A new tag will be generated for $10.00. The old tag (${tag?.shortCode}) will be permanently disabled.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Pay $10 & Replace", onPress: processReplacement },
            ]
        );
    };

    const processReplacement = async () => {
        setLoading(true);
        try {
            const {
                paymentIntent,
                ephemeralKey,
                customer,
            } = await fetchPaymentIntent({ type: "REPLACEMENT", assetId: vehicle.id });

            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: "ReachMasked",
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                allowsDelayedPaymentMethods: false,
                appearance: {
                    colors: {
                        primary: theme.primary,
                        background: theme.background,
                    }
                }
            });

            if (initError) throw new Error(initError.message);

            const { error: presentError } = await presentPaymentSheet();

            if (presentError) {
                if (presentError.code !== "Canceled") {
                    Alert.alert("Error", presentError.message);
                }
            } else {
                Alert.alert("Success", "Tag replacement initiated. Your new tag is ready!");
                // Refresh dashboard to get updated shortCode
                await fetchDashboard();
                navigation.goBack();
            }
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to initialize payment");
        } finally {
            setLoading(false);
        }
    };

    const handleTagToggle = (value: boolean) => {
        Alert.alert(
            value ? "Enable Tag" : "Disable Tag",
            value
                ? "Scanners will be able to contact you through this tag."
                : "Scanners will see 'Tag Not Found'. You can re-enable anytime.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Confirm", onPress: () => setTagActive(value) },
            ]
        );
    };

    const s = createStyles(theme, isDark);

    return (
        <SafeAreaView style={s.container} edges={["left", "right"]}>
            <View style={s.header}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Shield size={24} color={theme.primary} />
                    <Text style={s.vehicleName}>
                        {vehicle.color} {vehicle.model}
                    </Text>
                </View>
            </View>

            {tag && (
                <View style={s.codeCard}>
                    <QrCode size={40} color={theme.primary} style={{ marginBottom: 12 }} />
                    <Text style={s.codeLabel}>Tag Code</Text>
                    <Text style={s.codeValue}>{tag.shortCode}</Text>
                    <Text style={s.codeUrl}>reachmasked.com/t/{tag.shortCode}</Text>
                </View>
            )}

            <View style={s.section}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Settings size={14} color={theme.textMuted} />
                    <Text style={s.sectionTitle}>Tag Controls</Text>
                </View>
                <View style={s.controlCard}>
                    <View style={s.controlRow}>
                        <View style={s.controlInfo}>
                            <Text style={s.controlLabel}>Tag Active</Text>
                            <Text style={s.controlHint}>
                                {tagActive ? "Scanners can reach you" : "Tag appears inactive"}
                            </Text>
                        </View>
                        <Switch
                            value={tagActive}
                            onValueChange={handleTagToggle}
                            trackColor={{ false: theme.border, true: theme.primary + "80" }}
                            thumbColor={tagActive ? theme.primary : "#64748B"}
                        />
                    </View>
                    <View style={s.separator} />
                    <View style={s.controlRow}>
                        <View style={s.controlInfo}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Truck size={14} color={towMode ? "#F59E0B" : theme.textMuted} />
                                <Text style={s.controlLabel}>Tow Prevention</Text>
                            </View>
                            <Text style={s.controlHint}>
                                {towMode ? "Urgent alerts active" : "Standard notifications"}
                            </Text>
                        </View>
                        <Switch
                            value={towMode}
                            onValueChange={setTowMode}
                            trackColor={{ false: theme.border, true: "rgba(245,158,11,0.4)" }}
                            thumbColor={towMode ? "#F59E0B" : "#64748B"}
                        />
                    </View>
                </View>

                {/* Lost Tag Section */}
                <View style={{ marginTop: 24, padding: 20, backgroundColor: isDark ? "rgba(239, 68, 68, 0.05)" : "#FEF2F2", borderRadius: 16, borderWidth: 1, borderColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2" }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#EF4444", marginBottom: 4 }}>Report Lost Tag</Text>
                    <Text style={{ fontSize: 13, color: theme.textMuted, lineHeight: 18, marginBottom: 16 }}>
                        Lost your tag? Get a replacement for <Text style={{ fontWeight: "700", color: theme.text }}>$10.00</Text>. 
                        The old tag <Text style={{ fontWeight: "700" }}>{tag?.shortCode}</Text> will be deactivated immediately.
                    </Text>
                    <TouchableOpacity 
                        style={{ 
                            backgroundColor: "#EF4444", 
                            paddingVertical: 12, 
                            borderRadius: 12, 
                            alignItems: "center",
                            opacity: loading ? 0.7 : 1
                        }}
                        onPress={handleReportLost}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Pay $10 for Replacement</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const createStyles = (theme: any, isDark: boolean) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background, padding: 16 },
        header: { marginBottom: 20 },
        vehicleName: { fontSize: 22, fontWeight: "800", color: theme.text },
        codeCard: {
            backgroundColor: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)",
            borderRadius: 16,
            padding: 24,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(99,102,241,0.2)",
            marginBottom: 24,
        },
        codeLabel: { color: theme.textMuted, fontSize: 12, fontWeight: "600", marginBottom: 8 },
        codeValue: { color: theme.primary, fontSize: 32, fontWeight: "800", letterSpacing: 3 },
        codeUrl: { color: theme.textMuted, fontSize: 13, marginTop: 8 },
        section: { marginBottom: 24 },
        sectionTitle: { color: theme.textMuted, fontSize: 13, fontWeight: "600", textTransform: "uppercase" },
        controlCard: { 
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF", 
            borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.border 
        },
        controlRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        controlInfo: { flex: 1 },
        controlLabel: { color: theme.text, fontSize: 15, fontWeight: "600" },
        controlHint: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
        separator: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
    });
