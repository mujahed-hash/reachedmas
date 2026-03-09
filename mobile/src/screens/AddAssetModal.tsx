import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { 
    Car, 
    Dog, 
    Home, 
    User, 
    Package, 
    ShieldCheck, 
    CircleCheck,
    CreditCard,
    ArrowLeft
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addAsset } from "../api";
import { useAppTheme } from "../ThemeProvider";

const ASSET_TYPES = [
    { id: "CAR", label: "Vehicle", icon: Car },
    { id: "PET", label: "Pet", icon: Dog },
    { id: "HOME", label: "Home", icon: Home },
    { id: "PERSON", label: "Person", icon: User },
    { id: "ASSET", label: "Other Asset", icon: Package },
];

export default function AddAssetModal({ navigation, route }: any) {
    const { theme, isDark } = useAppTheme();
    const plan = route.params?.plan || "FREE";
    const isFree = plan === "FREE";

    const [name, setName] = useState("");
    const [type, setType] = useState("CAR");
    const [subtitle, setSubtitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async () => {
        if (!name) {
            setError("Name is required");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const result = await addAsset({ name, type, subtitle });
            if (result.success) {
                setSuccess(result.message || "Asset added!");
                setTimeout(() => navigation.goBack(), 1500);
            } else {
                setError(result.message || "Failed to add asset");
            }
        } catch (err: any) {
            setError(err.message || "Failed to add asset");
        } finally {
            setLoading(false);
        }
    };

    const s = createStyles(theme, isDark);

    return (
        <SafeAreaView style={s.container} edges={["bottom"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
                    {isFree ? (
                        <View style={s.purchasePrompt}>
                            <View style={s.premiumBadge}>
                                <CreditCard size={48} color={theme.primary} />
                            </View>
                            <Text style={s.purchaseTitle}>Subscription Required</Text>
                            <Text style={s.purchaseDesc}>
                                To activate your first asset tag, you need to subscribe to the Standard Plan ($24.99/year).
                            </Text>
                            <TouchableOpacity 
                                style={s.upgradeBtn}
                                onPress={() => {
                                    navigation.goBack();
                                    navigation.navigate("Purchase");
                                }}
                            >
                                <Text style={s.upgradeText}>Activate Protection ($24.99)</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
                                <Text style={s.backText}>Maybe Later</Text>
                            </TouchableOpacity>
                        </View>
                    ) : success ? (
                        <View style={s.successBox}>
                            <CircleCheck size={64} color={theme.success} style={{ marginBottom: 16 }} />
                            <Text style={s.successText}>{success}</Text>
                        </View>
                    ) : (
                        <>
                            <View style={s.headerRow}>
                                <ShieldCheck size={28} color={theme.primary} />
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={s.title}>Add New Asset</Text>
                                    <Text style={s.subtitle}>Protect what matters. Select a type and give it a name.</Text>
                                </View>
                            </View>

                            {error ? (
                                <View style={s.errorBox}>
                                    <Text style={s.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <Text style={s.label}>Asset Type</Text>
                            <View style={s.typeGrid}>
                                {ASSET_TYPES.map((t) => (
                                    <TouchableOpacity
                                        key={t.id}
                                        style={[
                                            s.typeCard,
                                            type === t.id && s.typeCardActive
                                        ]}
                                        onPress={() => setType(t.id)}
                                    >
                                        <t.icon 
                                            size={24} 
                                            color={type === t.id ? theme.primary : theme.textMuted} 
                                            strokeWidth={type === t.id ? 2.5 : 2}
                                        />
                                        <Text style={[s.typeCardText, type === t.id && s.typeCardTextActive]}>
                                            {t.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={s.field}>
                                <Text style={s.label}>Name *</Text>
                                <TextInput
                                    style={s.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder={type === "CAR" ? "e.g. My Toyota Camry" : "e.g. Buddy, Front Door, My Laptop"}
                                    placeholderTextColor={theme.textMuted}
                                />
                            </View>

                            <View style={s.field}>
                                <Text style={s.label}>Subtitle / Description (Optional)</Text>
                                <TextInput
                                    style={s.input}
                                    value={subtitle}
                                    onChangeText={setSubtitle}
                                    placeholder="e.g. Silver sedan, Golden Retriever, Blue backpack"
                                    placeholderTextColor={theme.textMuted}
                                />
                            </View>

                            <View style={s.buttonRow}>
                                <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
                                    <Text style={s.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.submitBtn, loading && { opacity: 0.6 }]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={s.submitText}>Add Asset</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (theme: any, isDark: boolean) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        scrollContent: { padding: 24, flexGrow: 1 },
        headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
        title: { fontSize: 20, fontWeight: "700", color: theme.text },
        subtitle: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
        errorBox: {
            backgroundColor: "rgba(239,68,68,0.1)",
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
        },
        errorText: { color: theme.error, fontSize: 13 },
        label: { fontSize: 13, fontWeight: "600", color: theme.text, marginBottom: 8 },

        typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
        typeCard: {
            width: "31%",
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#F1F5F9",
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "transparent",
        },
        typeCardActive: {
            borderColor: theme.primary,
            backgroundColor: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.05)",
        },
        typeCardText: { fontSize: 11, color: theme.textMuted, marginTop: 4, fontWeight: "500" },
        typeCardTextActive: { color: theme.primary, fontWeight: "700" },

        field: { marginBottom: 16 },
        input: {
            backgroundColor: isDark ? "rgba(15,23,42,0.5)" : "#F1F5F9",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 14,
            fontSize: 15,
            color: theme.text,
        },
        buttonRow: { flexDirection: "row", gap: 12, marginTop: 8 },
        cancelBtn: {
            flex: 1,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.border,
            paddingVertical: 14,
            alignItems: "center",
        },
        cancelText: { color: theme.text, fontWeight: "600" },
        submitBtn: {
            flex: 1,
            backgroundColor: theme.primary,
            borderRadius: 10,
            paddingVertical: 14,
            alignItems: "center",
        },
        submitText: { color: "#fff", fontWeight: "700" },
        successBox: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 40,
        },
        successText: { fontSize: 16, fontWeight: "600", color: theme.text },

        // Purchase Prompt
        purchasePrompt: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingVertical: 40,
        },
        premiumBadge: {
            width: 90,
            height: 90,
            borderRadius: 45,
            backgroundColor: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.05)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
        },
        purchaseTitle: { fontSize: 24, fontWeight: "800", color: theme.text, marginBottom: 12, textAlign: "center" },
        purchaseDesc: { fontSize: 15, color: theme.textMuted, textAlign: "center", marginBottom: 32, lineHeight: 22 },
        upgradeBtn: {
            width: "100%",
            backgroundColor: theme.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 12,
        },
        upgradeText: { color: "#fff", fontSize: 16, fontWeight: "700" },
        backBtn: { padding: 12 },
        backText: { color: theme.textMuted, fontSize: 14, fontWeight: "600" },
    });
