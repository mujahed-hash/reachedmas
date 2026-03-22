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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth";
import { useAppTheme } from "../ThemeProvider";
import { SignalLogo } from "../components/SignalLogo";

export default function LoginScreen({ navigation }: any) {
    const { login } = useAuth();
    const { theme, isDark } = useAppTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        if (!email || !password) {
            setError("Please enter email and password");
            return;
        }
        setError("");
        setLoading(true);
        try {
            await login(email.trim(), password);
        } catch (err: any) {
            setError(err.message || "Login failed");
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
                        <SignalLogo size={36} color={theme.primary} />
                        <Text style={[s.logoText, { marginLeft: 10 }]}>ReachMasked</Text>
                    </View>

                    {/* Card */}
                    <View style={s.card}>
                        <Text style={s.title}>Welcome back</Text>
                        <Text style={s.subtitle}>Enter your credentials to access your dashboard</Text>

                        {error ? (
                            <View style={s.errorBox}>
                                <Text style={s.errorText}>{error}</Text>
                            </View>
                        ) : null}

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

                        <TouchableOpacity
                            style={[s.button, loading && s.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={s.buttonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate("Register")} style={s.linkRow}>
                            <Text style={s.linkText}>
                                Don't have an account?{" "}
                                <Text style={s.linkHighlight}>Sign up</Text>
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
            backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "#FFFFFF",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.05)" : theme.border,
            padding: 24,
        },
        title: {
            fontSize: 26,
            fontWeight: "800",
            color: theme.text,
            marginBottom: 6,
            letterSpacing: -0.5,
        },
        subtitle: {
            fontSize: 15,
            color: theme.textMuted,
            marginBottom: 24,
            lineHeight: 22,
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
        input: {
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F1F5F9",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.05)" : theme.border,
            padding: 16,
            fontSize: 15,
            color: theme.text,
        },
        button: {
            backgroundColor: theme.primary,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginTop: 12,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 30,
            elevation: 15,
        },
        buttonDisabled: {
            opacity: 0.6,
        },
        buttonText: {
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "800",
            letterSpacing: -0.3,
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
