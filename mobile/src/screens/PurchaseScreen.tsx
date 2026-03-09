import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import { 
    Shield, 
    Check, 
    Zap, 
    Bell, 
    Truck, 
    History,
    ArrowRight
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStripe } from "@stripe/stripe-react-native";
import { fetchPaymentIntent, fetchDashboard } from "../api";
import { useAppTheme } from "../ThemeProvider";

export default function PurchaseScreen({ navigation }: any) {
    const { theme, isDark } = useAppTheme();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);

    const initializePaymentSheet = async () => {
        const {
            paymentIntent,
            ephemeralKey,
            customer,
            publishableKey,
        } = await fetchPaymentIntent();

        const { error } = await initPaymentSheet({
            merchantDisplayName: "ReachMasked",
            customerId: customer,
            customerEphemeralKeySecret: ephemeralKey,
            paymentIntentClientSecret: paymentIntent,
            allowsDelayedPaymentMethods: false,
            defaultBillingDetails: {
                name: "User",
            },
            appearance: {
                colors: {
                    primary: theme.primary,
                    background: theme.background,
                    componentBackground: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC",
                    componentBorder: theme.border,
                    componentDivider: theme.border,
                    primaryText: theme.text,
                    secondaryText: theme.textMuted,
                    placeholderText: theme.textMuted,
                    icon: theme.primary,
                },
                shapes: {
                    borderRadius: 12,
                }
            }
        });

        if (error) {
            console.error("Payment Sheet init error:", error);
            return false;
        }
        return true;
    };

    const handlePurchase = async () => {
        setLoading(true);
        try {
            const ready = await initializePaymentSheet();
            if (!ready) {
                setLoading(false);
                return;
            }

            const { error } = await presentPaymentSheet();

            if (error) {
                if (error.code === "Canceled") {
                    // Handled gracefully
                } else {
                    console.error("Payment error:", error.message);
                }
            } else {
                // Success!
                // Refresh dashboard to reflect PREMIUM status
                await fetchDashboard();
                navigation.goBack();
            }
        } catch (err) {
            console.error("Purchase error:", err);
        } finally {
            setLoading(false);
        }
    };

    const s = createStyles(theme, isDark);

    const features = [
        "1 Premium Asset Tag",
        "Real-time Personal Alerts",
        "Unlimited Interaction History",
        "Tow Prevention Mode",
        "Custom Auto-Replies",
        "Detailed NFC Programming Guide",
    ];

    return (
        <SafeAreaView style={s.container}>
            <ScrollView contentContainerStyle={s.content}>
                <View style={s.header}>
                    <View style={s.iconBadge}>
                        <Shield size={40} color={theme.primary} />
                    </View>
                    <Text style={s.title}>Standard Plan</Text>
                    <Text style={s.tagline}>Everything you need for total peace of mind.</Text>
                </View>

                <View style={s.pricingCard}>
                    <Text style={s.priceLabel}>Annual Subscription</Text>
                    <View style={s.priceRow}>
                        <Text style={s.currency}>$</Text>
                        <Text style={s.price}>24.99</Text>
                        <Text style={s.period}>/year</Text>
                    </View>
                    <Text style={s.renewalInfo}>Then $4.99/mo starting the second year.</Text>
                </View>

                <View style={s.featuresList}>
                    {features.map((f, i) => (
                        <View key={i} style={s.featureRow}>
                            <View style={s.checkCircle}>
                                <Check size={14} color={theme.primary} strokeWidth={3} />
                            </View>
                            <Text style={s.featureText}>{f}</Text>
                        </View>
                    ))}
                </View>

                {/* NFC Instructions Section */}
                <View style={s.nfcSection}>
                    <View style={s.nfcHeader}>
                        <Zap size={20} color={theme.primary} />
                        <Text style={s.nfcTitle}>NFC Setup Instructions</Text>
                    </View>
                    
                    <View style={s.nfcInfoCard}>
                        <Text style={s.nfcSubheader}>Recommended Tags</Text>
                        <Text style={s.nfcText}>• NTAG213 or NTAG215{"\n"}• Weatherproof sticker or keyfob{"\n"}• No special app required</Text>

                        <Text style={[s.nfcSubheader, { marginTop: 12 }]}>How to Program</Text>
                        <Text style={s.nfcText}>1. Use any NFC writer app (NFC Tools, etc.){"\n"}2. Write your Tag URL as an NDEF record{"\n"}3. Place tag on your asset</Text>
                        
                        <View style={s.privacyNote}>
                            <Shield size={12} color={theme.textMuted} />
                            <Text style={s.privacyText}>The NFC tag only stores a URL. No personal data is stored on the chip.</Text>
                        </View>
                    </View>
                </View>

                <View style={s.bottomActions}>
                    <TouchableOpacity 
                        style={[s.buyBtn, loading && { opacity: 0.8 }]} 
                        onPress={handlePurchase}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={s.buyBtnText}>Unlock Premium Protection</Text>
                                <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                            </>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
                        <Text style={s.cancelText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (theme: any, isDark: boolean) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        content: { padding: 24, paddingBottom: 60, alignItems: "center" },
        header: { alignItems: "center", marginBottom: 32 },
        iconBadge: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.05)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
        },
        title: { fontSize: 28, fontWeight: "800", color: theme.text, marginBottom: 8 },
        tagline: { fontSize: 15, color: theme.textMuted, textAlign: "center" },

        pricingCard: {
            width: "100%",
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 20,
            padding: 24,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: "center",
            marginBottom: 32,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 5,
        },
        priceLabel: { fontSize: 12, fontWeight: "700", color: theme.primary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
        priceRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 8 },
        currency: { fontSize: 24, fontWeight: "700", color: theme.text, marginRight: 2, marginBottom: 12 },
        price: { fontSize: 56, fontWeight: "900", color: theme.text },
        period: { fontSize: 18, color: theme.textMuted, fontWeight: "600" },
        renewalInfo: { fontSize: 13, color: theme.textMuted },

        featuresList: { width: "100%", marginBottom: 32 },
        featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
        checkCircle: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)",
            justifyContent: "center",
            alignItems: "center",
        },
        featureText: { fontSize: 15, color: theme.text, fontWeight: "500" },

        // NFC Section
        nfcSection: { width: "100%", marginBottom: 40 },
        nfcHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
        nfcTitle: { fontSize: 18, fontWeight: "700", color: theme.text },
        nfcInfoCard: {
            backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC",
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: theme.border,
        },
        nfcSubheader: { fontSize: 13, fontWeight: "700", color: theme.text, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
        nfcText: { fontSize: 14, color: theme.textMuted, lineHeight: 22 },
        privacyNote: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border },
        privacyText: { fontSize: 11, color: theme.textMuted, flex: 1 },

        bottomActions: { width: "100%", gap: 12 },
        buyBtn: {
            width: "100%",
            backgroundColor: theme.primary,
            borderRadius: 16,
            paddingVertical: 18,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
        },
        buyBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
        cancelBtn: { padding: 12, alignItems: "center" },
        cancelText: { color: theme.textMuted, fontSize: 14, fontWeight: "600" },
    });
