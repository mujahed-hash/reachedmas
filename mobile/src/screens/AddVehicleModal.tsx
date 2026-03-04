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
import { SafeAreaView } from "react-native-safe-area-context";
import { addVehicle } from "../api";
import { useAppTheme } from "../ThemeProvider";

export default function AddVehicleModal({ navigation }: any) {
    const { theme, isDark } = useAppTheme();
    const [model, setModel] = useState("");
    const [color, setColor] = useState("");
    const [licensePlate, setLicensePlate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async () => {
        if (!model || !color) {
            setError("Model and color are required");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const result = await addVehicle({ model, color, licensePlate });
            if (result.success) {
                setSuccess(result.message || "Vehicle added!");
                setTimeout(() => navigation.goBack(), 1500);
            } else {
                setError(result.message || "Failed to add vehicle");
            }
        } catch (err: any) {
            setError(err.message || "Failed to add vehicle");
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
                    {success ? (
                        <View style={s.successBox}>
                            <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
                            <Text style={s.successText}>{success}</Text>
                        </View>
                    ) : (
                        <>
                            <View style={s.headerRow}>
                                <Text style={{ fontSize: 22 }}>🚗</Text>
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={s.title}>Add New Vehicle</Text>
                                    <Text style={s.subtitle}>Add a vehicle to generate a ReachMasked tag code.</Text>
                                </View>
                            </View>

                            {error ? (
                                <View style={s.errorBox}>
                                    <Text style={s.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <View style={s.field}>
                                <Text style={s.label}>Vehicle Model *</Text>
                                <TextInput
                                    style={s.input}
                                    value={model}
                                    onChangeText={setModel}
                                    placeholder="e.g. Toyota Camry, Honda Civic"
                                    placeholderTextColor={theme.textMuted}
                                />
                            </View>

                            <View style={s.field}>
                                <Text style={s.label}>Color *</Text>
                                <TextInput
                                    style={s.input}
                                    value={color}
                                    onChangeText={setColor}
                                    placeholder="e.g. Silver, Black, White"
                                    placeholderTextColor={theme.textMuted}
                                />
                            </View>

                            <View style={s.field}>
                                <Text style={s.label}>License Plate (Optional)</Text>
                                <TextInput
                                    style={s.input}
                                    value={licensePlate}
                                    onChangeText={setLicensePlate}
                                    placeholder="ABC 1234"
                                    placeholderTextColor={theme.textMuted}
                                    autoCapitalize="characters"
                                />
                                <Text style={s.helpText}>Stored encrypted. Only visible to you.</Text>
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
                                        <Text style={s.submitText}>Add Vehicle</Text>
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
        field: { marginBottom: 16 },
        label: { fontSize: 13, fontWeight: "600", color: theme.text, marginBottom: 6 },
        input: {
            backgroundColor: isDark ? "rgba(15,23,42,0.5)" : "#F1F5F9",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 14,
            fontSize: 15,
            color: theme.text,
        },
        helpText: { fontSize: 12, color: theme.textMuted, marginTop: 6 },
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
    });
