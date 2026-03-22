import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    ActivityIndicator,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth";
import { useAppTheme } from "../ThemeProvider";
import {
    fetchSettings,
    updateProfile,
    updatePhone,
    updateNotificationPrefs,
    changePassword,
} from "../api";
import { Sun, Moon, Monitor, User, Phone, Bell, Lock, Palette, LogOut, Droplets } from "lucide-react-native";

type Section = "profile" | "phone" | "notifs" | "password" | null;

export default function SettingsScreen() {
    const { logout } = useAuth();
    const { theme, isDark, mode, setMode, darkAccent, setDarkAccent } = useAppTheme();
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Section>(null);
    const [feedback, setFeedback] = useState<{ section: Section; msg: string; ok: boolean } | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [emailNotif, setEmailNotif] = useState(true);
    const [smsNotif, setSmsNotif] = useState(true);
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");

    const load = useCallback(async () => {
        try {
            const res = await fetchSettings();
            if (res?.settings) {
                setSettings(res.settings);
                setName(res.settings.name || "");
                setEmail(res.settings.email || "");
                setEmailNotif(res.settings.emailNotif ?? true);
                setSmsNotif(res.settings.smsNotif ?? true);
            }
        } catch (err) {
            console.error("Settings load error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const showFeedback = (section: Section, msg: string, ok: boolean) => {
        setFeedback({ section, msg, ok });
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleUpdateProfile = async () => {
        setSaving("profile");
        try {
            const res = await updateProfile({ name, email });
            showFeedback("profile", res.message, res.success);
        } catch (err) {
            showFeedback("profile", "Failed to update", false);
        } finally {
            setSaving(null);
        }
    };

    const handleUpdatePhone = async () => {
        if (!phone || phone.length < 10) {
            showFeedback("phone", "Valid phone required", false);
            return;
        }
        setSaving("phone");
        try {
            const res = await updatePhone({ phone });
            showFeedback("phone", res.message, res.success);
            if (res.success) { setPhone(""); load(); }
        } catch (err) {
            showFeedback("phone", "Failed to update", false);
        } finally {
            setSaving(null);
        }
    };

    const handleUpdateNotifs = async () => {
        setSaving("notifs");
        try {
            const res = await updateNotificationPrefs({ emailNotif, smsNotif });
            showFeedback("notifs", res.message, res.success);
        } catch (err) {
            showFeedback("notifs", "Failed to update", false);
        } finally {
            setSaving(null);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPw || !newPw || !confirmPw) {
            showFeedback("password", "All fields required", false);
            return;
        }
        setSaving("password");
        try {
            const res = await changePassword({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw });
            showFeedback("password", res.message, res.success);
            if (res.success) { setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
        } catch (err) {
            showFeedback("password", "Failed to change", false);
        } finally {
            setSaving(null);
        }
    };

    const handleLogout = () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: logout },
        ]);
    };

    const s = createStyles(theme, isDark);

    if (loading) {
        return (
            <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={theme.primaryOnSurface} />
            </View>
        );
    }

    const FeedbackBadge = ({ section }: { section: Section }) => {
        if (!feedback || feedback.section !== section) return null;
        return (
            <View style={[s.feedbackBox, { backgroundColor: feedback.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }]}>
                <Text style={{ color: feedback.ok ? theme.success : theme.error, fontSize: 13 }}>{feedback.msg}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={s.container} edges={["left", "right"]}>
            <ScrollView contentContainerStyle={s.scrollContent}>
                {/* Profile */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <User size={18} color={theme.primaryOnSurface} />
                        <Text style={s.cardTitle}>Profile</Text>
                    </View>
                    <FeedbackBadge section="profile" />
                    <View style={s.field}>
                        <Text style={s.label}>Full Name</Text>
                        <TextInput style={s.input} value={name} onChangeText={setName} placeholderTextColor={theme.textMuted} placeholder="Your name" />
                    </View>
                    <View style={s.field}>
                        <Text style={s.label}>Email</Text>
                        <TextInput style={s.input} value={email} onChangeText={setEmail} placeholderTextColor={theme.textMuted} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />
                    </View>
                    <TouchableOpacity style={[s.saveBtn, saving === "profile" && { opacity: 0.6 }]} onPress={handleUpdateProfile} disabled={saving === "profile"}>
                        {saving === "profile" ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Save Profile</Text>}
                    </TouchableOpacity>
                </View>

                {/* Phone */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Phone size={18} color={theme.primaryOnSurface} />
                        <Text style={s.cardTitle}>Phone Number</Text>
                    </View>
                    <FeedbackBadge section="phone" />
                    {settings?.phoneMasked && (
                        <Text style={s.maskedPhone}>Current: {settings.phoneMasked}</Text>
                    )}
                    <View style={s.field}>
                        <Text style={s.label}>New Phone Number</Text>
                        <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholderTextColor={theme.textMuted} placeholder="+1 (555) 123-4567" keyboardType="phone-pad" />
                    </View>
                    <TouchableOpacity style={[s.saveBtn, saving === "phone" && { opacity: 0.6 }]} onPress={handleUpdatePhone} disabled={saving === "phone"}>
                        {saving === "phone" ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Update Phone</Text>}
                    </TouchableOpacity>
                </View>

                {/* Notification Prefs */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Bell size={18} color={theme.primaryOnSurface} />
                        <Text style={s.cardTitle}>Notification Preferences</Text>
                    </View>
                    <FeedbackBadge section="notifs" />
                    <View style={s.switchRow}>
                        <Text style={s.switchLabel}>Email Notifications</Text>
                        <Switch
                            value={emailNotif}
                            onValueChange={(v) => setEmailNotif(v)}
                            trackColor={{ false: theme.border, true: theme.success }}
                            thumbColor="#fff"
                        />
                    </View>
                    <View style={s.switchRow}>
                        <Text style={s.switchLabel}>SMS Notifications</Text>
                        <Switch
                            value={smsNotif}
                            onValueChange={(v) => setSmsNotif(v)}
                            trackColor={{ false: theme.border, true: theme.success }}
                            thumbColor="#fff"
                        />
                    </View>
                    <TouchableOpacity style={[s.saveBtn, saving === "notifs" && { opacity: 0.6 }]} onPress={handleUpdateNotifs} disabled={saving === "notifs"}>
                        {saving === "notifs" ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Save Preferences</Text>}
                    </TouchableOpacity>
                </View>

                {/* Theme */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Palette size={18} color={theme.primaryOnSurface} />
                        <Text style={s.cardTitle}>Appearance</Text>
                    </View>
                    <View style={s.themeRow}>
                        {(["system", "light", "dark"] as const).map((m) => (
                            <TouchableOpacity
                                key={m}
                                style={[s.themeOption, mode === m && s.themeOptionActive]}
                                onPress={() => setMode(m)}
                            >
                                {m === "system" ? <Monitor size={18} color={mode === m ? theme.primaryOnSurface : theme.textMuted} /> :
                                 m === "light" ? <Sun size={18} color={mode === m ? theme.primaryOnSurface : theme.textMuted} /> :
                                 <Moon size={18} color={mode === m ? theme.primaryOnSurface : theme.textMuted} />}
                                <Text style={[s.themeOptionText, mode === m && s.themeOptionTextActive, { marginTop: 4 }]}>
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Dark mode accent (sky vs deep blue) */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Droplets size={18} color={theme.primaryOnSurface} />
                        <Text style={s.cardTitle}>Dark theme color</Text>
                    </View>
                    <Text style={s.themeAccentHint}>
                        For dark mode only — buttons and highlights. Light theme keeps the app brand blue.
                    </Text>
                    <View style={s.themeRow}>
                        <TouchableOpacity
                            style={[s.themeOption, darkAccent === "sky" && s.themeOptionActive]}
                            onPress={() => setDarkAccent("sky")}
                            activeOpacity={0.75}
                        >
                            <Text style={[s.themeOptionText, darkAccent === "sky" && s.themeOptionTextActive, { marginTop: 2 }]}>
                                Sky
                            </Text>
                            <Text style={s.themeAccentDesc}>Fresh sky blue</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[s.themeOption, darkAccent === "deepBlue" && s.themeOptionActive]}
                            onPress={() => setDarkAccent("deepBlue")}
                            activeOpacity={0.75}
                        >
                            <Text style={[s.themeOptionText, darkAccent === "deepBlue" && s.themeOptionTextActive, { marginTop: 2 }]}>
                                Deep blue
                            </Text>
                            <Text style={s.themeAccentDesc}>Deeper blue, not light purple</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Password */}
                <View style={s.card}>
                    <View style={s.cardHeader}>
                        <Lock size={18} color={theme.primaryOnSurface} />
                        <Text style={s.cardTitle}>Change Password</Text>
                    </View>
                    <FeedbackBadge section="password" />
                    <View style={s.field}>
                        <Text style={s.label}>Current Password</Text>
                        <TextInput style={s.input} value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholderTextColor={theme.textMuted} placeholder="Current password" />
                    </View>
                    <View style={s.field}>
                        <Text style={s.label}>New Password</Text>
                        <TextInput style={s.input} value={newPw} onChangeText={setNewPw} secureTextEntry placeholderTextColor={theme.textMuted} placeholder="New password" />
                    </View>
                    <View style={s.field}>
                        <Text style={s.label}>Confirm New Password</Text>
                        <TextInput style={s.input} value={confirmPw} onChangeText={setConfirmPw} secureTextEntry placeholderTextColor={theme.textMuted} placeholder="Confirm" />
                    </View>
                    <TouchableOpacity style={[s.saveBtn, saving === "password" && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={saving === "password"}>
                        {saving === "password" ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Change Password</Text>}
                    </TouchableOpacity>
                </View>

                {/* Sign Out */}
                <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
                    <LogOut size={18} color={theme.error} style={{ marginRight: 8 }} />
                    <Text style={s.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={s.versionText}>ReachMasked v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (theme: any, isDark: boolean) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        scrollContent: { padding: 16, paddingBottom: 60 },

        card: {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 14, borderWidth: 1, borderColor: theme.border,
            padding: 20, marginBottom: 16,
        },
        cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
        cardTitle: { fontSize: 17, fontWeight: "700", color: theme.text },

        feedbackBox: { borderRadius: 10, padding: 10, marginBottom: 12 },

        field: { marginBottom: 14 },
        label: { fontSize: 13, fontWeight: "600", color: theme.text, marginBottom: 6 },
        input: {
            backgroundColor: isDark ? "rgba(15,23,42,0.5)" : "#F1F5F9",
            borderRadius: 10, borderWidth: 1, borderColor: theme.border,
            padding: 12, fontSize: 15, color: theme.text,
        },

        maskedPhone: {
            fontSize: 14, color: theme.textMuted, marginBottom: 12,
            fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        },

        switchRow: {
            flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            paddingVertical: 10,
        },
        switchLabel: { fontSize: 14, color: theme.text },

        themeRow: { flexDirection: "row", gap: 8, marginTop: 4 },
        themeOption: {
            flex: 1, borderRadius: 10, borderWidth: 1, borderColor: theme.border,
            paddingVertical: 12, alignItems: "center",
        },
        themeOptionActive: {
            borderColor: theme.primaryOnSurface,
            backgroundColor: theme.primaryMutedBg,
        },
        themeOptionText: { fontSize: 13, color: theme.textMuted, fontWeight: "600" },
        themeOptionTextActive: { color: theme.primaryOnSurface },

        themeAccentHint: {
            fontSize: 13,
            color: theme.textMuted,
            marginBottom: 12,
            lineHeight: 18,
        },
        themeAccentDesc: {
            fontSize: 11,
            color: theme.textMuted,
            marginTop: 4,
            textAlign: "center",
            lineHeight: 14,
        },

        saveBtn: {
            backgroundColor: theme.primarySoft, borderRadius: 10, paddingVertical: 12,
            alignItems: "center", marginTop: 4,
        },
        saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

        logoutBtn: {
            backgroundColor: "rgba(239,68,68,0.1)",
            borderRadius: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
            paddingVertical: 14, alignItems: "center", marginTop: 8,
            flexDirection: "row", justifyContent: "center",
        },
        logoutText: { color: theme.error, fontWeight: "700", fontSize: 15 },

        versionText: {
            textAlign: "center", fontSize: 12, color: theme.textMuted, marginTop: 20,
        },
    });
