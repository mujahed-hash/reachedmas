import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Alert,
} from "react-native";
import { useAuth } from "../auth";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await login(email.trim(), password);
        } catch (err: any) {
            console.log("Login Error Component:", err.message);
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };



    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.headerAbsolute}>
                <View style={styles.logoRow}>
                    <Text style={styles.shieldIcon}>🛡️</Text>
                    <Text style={styles.logoText}>ReachMasked</Text>
                </View>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.title}>Welcome back</Text>
                    <Text style={styles.subtitle}>
                        Enter your credentials to access your dashboard
                    </Text>
                </View>

                <View style={styles.form}>
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="m@example.com"
                            placeholderTextColor="#64748B"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            placeholderTextColor="#64748B"
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.registerLink}>
                        <Text style={styles.registerText}>
                            Don't have an account? <Text style={styles.link}>Sign up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B1120", // Web Deep Navy
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    headerAbsolute: {
        position: "absolute",
        top: Platform.OS === "ios" ? 60 : 40,
        left: 24,
    },
    logoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    shieldIcon: {
        fontSize: 24,
    },
    logoText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#F8FAFC",
        letterSpacing: -0.5,
    },
    card: {
        backgroundColor: "rgba(255, 255, 255, 0.05)", // Guardian Glass
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    cardHeader: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#F8FAFC",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#94A3B8", // Web Muted Foreground
        lineHeight: 20,
    },
    form: {
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: "#F8FAFC",
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 2,
    },
    input: {
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        color: "#F8FAFC",
        fontSize: 16,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    button: {
        backgroundColor: "#6366F1", // Web Primary
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 8,
        // Web Indigo Glow
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    errorContainer: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    errorText: {
        color: "#EF4444",
        fontSize: 13,
        textAlign: "center",
        fontWeight: "500",
    },
    registerLink: {
        alignItems: "center",
        marginTop: 4,
    },
    registerText: {
        color: "#94A3B8",
        fontSize: 14,
    },
    link: {
        color: "#6366F1",
        fontWeight: "600",
    },
    troubleshoot: {
        position: "absolute",
        bottom: 50,
        alignSelf: "center",
        padding: 10,
    },
    troubleshootText: {
        color: "#475569",
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1,
    }
});
