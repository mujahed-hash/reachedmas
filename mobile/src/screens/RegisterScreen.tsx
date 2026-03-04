import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth";
import { useAppTheme } from "../ThemeProvider";
import { registerAccount, login as apiLogin, saveToken } from "../api";

export default function RegisterScreen({ navigation }: any) {
    const { login } = useAuth();
    const { theme, isDark } = useAppTheme();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword || !phone) {
            setError("All required fields must be filled");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (phone.length < 10) {
            setError("Please enter a valid phone number");
            return;
        }

        setError("");
        setLoading(true);
        try {
            const result = await registerAccount({ name, email, password, confirmPassword, phone });
            if (result.success) {
                // Auto-login after registration
                await login(email.trim(), password);
            } else {
                setError(result.message || "Registration failed");
            }
        } catch (err: any) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const s = createStyles(theme, isDark);

    return (
        <SafeAreaView style={s.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
                    {/* Logo */}
                    <View style={s.logoRow}>
                        <Text style={s.logoIcon}>🛡️</Text>
                        <Text style={s.logoText}>ReachMasked</Text>
                    </View>

                    {/* Card */}
                    <View style={s.card}>
                        <Text style={s.title}>Create an account</Text>
                        <Text style={s.subtitle}>Get your vehicle tags and start protecting your privacy</Text>

                        {error ? (
                            <View style={s.errorBox}>
                                <Text style={s.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={s.field}>
                            <Text style={s.label}>Full Name <Text style={s.optional}>(optional)</Text></Text>
                            <TextInput
                                style={s.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="John Smith"
                                placeholderTextColor={theme.textMuted}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={s.field}>
                            <Text style={s.label}>Email</Text>
                            <TextInput
                                style={s.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="m@example.com"
                                placeholderTextColor={theme.textMuted}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={s.field}>
                            <Text style={s.label}>Password</Text>
                            <TextInput
                                style={s.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                placeholderTextColor={theme.textMuted}
                                secureTextEntry
                            />
                        </View>

                        <View style={s.field}>
                            <Text style={s.label}>Confirm Password</Text>
                            <TextInput
                                style={s.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="••••••••"
                                placeholderTextColor={theme.textMuted}
                                secureTextEntry
                            />
                        </View>

                        <View style={s.field}>
                            <Text style={s.label}>Phone Number</Text>
                            <TextInput
                                style={s.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+1 (555) 123-4567"
                                placeholderTextColor={theme.textMuted}
                                keyboardType="phone-pad"
                            />
                            <Text style={s.helpText}>
                                We'll alert you when someone contacts you about your vehicle. Your number is fully encrypted.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[s.button, loading && s.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={s.buttonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.goBack()} style={s.linkRow}>
                            <Text style={s.linkText}>
                                Already have an account?{" "}
                                <Text style={s.linkHighlight}>Sign in</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const createStyles = (theme: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        scrollContent: {
            flexGrow: 1,
            justifyContent: "center",
            padding: 24,
        },
        logoRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
        },
        logoIcon: { fontSize: 28, marginRight: 8 },
        logoText: {
            fontSize: 22,
            fontWeight: "800",
            color: theme.text,
            letterSpacing: -0.5,
        },
        card: {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 24,
        },
        title: {
            fontSize: 24,
            fontWeight: "700",
            color: theme.text,
            marginBottom: 4,
        },
        subtitle: {
            fontSize: 14,
            color: theme.textMuted,
            marginBottom: 20,
        },
        errorBox: {
            backgroundColor: "rgba(239,68,68,0.1)",
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
        },
        errorText: {
            color: theme.error,
            fontSize: 13,
        },
        field: {
            marginBottom: 16,
        },
        label: {
            fontSize: 13,
            fontWeight: "600",
            color: theme.text,
            marginBottom: 6,
        },
        optional: {
            fontWeight: "400",
            color: theme.textMuted,
        },
        input: {
            backgroundColor: isDark ? "rgba(15,23,42,0.5)" : "#F1F5F9",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 14,
            fontSize: 15,
            color: theme.text,
        },
        helpText: {
            fontSize: 12,
            color: theme.textMuted,
            marginTop: 6,
        },
        button: {
            backgroundColor: theme.primary,
            borderRadius: 10,
            paddingVertical: 14,
            alignItems: "center",
            marginTop: 8,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
        },
        buttonDisabled: {
            opacity: 0.6,
        },
        buttonText: {
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "700",
        },
        linkRow: {
            marginTop: 20,
            alignItems: "center",
        },
        linkText: {
            fontSize: 14,
            color: theme.textMuted,
        },
        linkHighlight: {
            color: theme.primary,
            fontWeight: "600",
        },
    });
