import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchSettings, updateProfile } from "../api";
import { useAppTheme } from "../ThemeProvider";

export default function FamilyScreen() {
    const { theme, isDark } = useAppTheme();
    const [familyMembers, setFamilyMembers] = useState<any[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetchSettings();
            // In our multi-asset branch, settings.familyMembers should exist
            setFamilyMembers(res.familyMembers || []);
        } catch (err) {
            console.error("Family load error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const handleInvite = async () => {
        if (!inviteEmail) return;
        setSubmitting(true);
        try {
            const res = await updateProfile({ action: "inviteFamily", email: inviteEmail });
            if (res.success) {
                Alert.alert("Success", "Invitation sent!");
                setInviteEmail("");
                load();
            } else {
                Alert.alert("Error", res.message || "Failed to invite");
            }
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to invite");
        } finally {
            setSubmitting(false);
        }
    };

    const s = createStyles(theme, isDark);

    return (
        <SafeAreaView style={s.container} edges={["left", "right"]}>
            <ScrollView
                contentContainerStyle={s.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                <View style={s.header}>
                    <Text style={s.title}>Family Hub</Text>
                    <Text style={s.subtitle}>Shared assets send alerts to all family members.</Text>
                </View>

                {/* Invite Section */}
                <View style={s.card}>
                    <Text style={s.cardTitle}>Invite Member</Text>
                    <View style={s.inviteRow}>
                        <TextInput
                            style={s.input}
                            value={inviteEmail}
                            onChangeText={setInviteEmail}
                            placeholder="email@example.com"
                            placeholderTextColor={theme.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={[s.inviteBtn, (!inviteEmail || submitting) && { opacity: 0.5 }]}
                            onPress={handleInvite}
                            disabled={!inviteEmail || submitting}
                        >
                            {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.inviteBtnText}>Invite</Text>}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Members List */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Family Members</Text>
                    {familyMembers.length === 0 ? (
                        <View style={s.emptyBox}>
                            <Text style={s.emptyText}>No family members added yet.</Text>
                        </View>
                    ) : (
                        familyMembers.map((m) => (
                            <View key={m.id} style={s.memberCard}>
                                <View style={s.avatar}>
                                    <Text style={s.avatarText}>{m.email[0].toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.memberName}>{m.name || m.email.split('@')[0]}</Text>
                                    <Text style={s.memberEmail}>{m.email}</Text>
                                </View>
                                <View style={[s.statusBadge, { backgroundColor: m.status === 'ACCEPTED' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)' }]}>
                                    <Text style={[s.statusText, { color: m.status === 'ACCEPTED' ? '#22C55E' : '#EAB308' }]}>
                                        {m.status}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (theme: any, isDark: boolean) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        scrollContent: { padding: 20 },
        header: { marginBottom: 24 },
        title: { fontSize: 24, fontWeight: "800", color: theme.text },
        subtitle: { fontSize: 14, color: theme.textMuted, marginTop: 4 },

        card: {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: theme.border,
            marginBottom: 24,
        },
        cardTitle: { fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 12 },
        inviteRow: { flexDirection: "row", gap: 10 },
        input: {
            flex: 1,
            backgroundColor: isDark ? "rgba(15,23,42,0.5)" : "#F1F5F9",
            borderRadius: 10,
            padding: 12,
            color: theme.text,
            borderWidth: 1,
            borderColor: theme.border,
        },
        inviteBtn: {
            backgroundColor: theme.primary,
            borderRadius: 10,
            paddingHorizontal: 20,
            justifyContent: "center",
        },
        inviteBtnText: { color: "#fff", fontWeight: "700" },

        section: { marginBottom: 20 },
        sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 16 },
        memberCard: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 16,
            padding: 16,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: theme.border,
        },
        avatar: {
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.primary + "20",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
        },
        avatarText: { color: theme.primary, fontWeight: "700", fontSize: 18 },
        memberName: { fontSize: 16, fontWeight: "600", color: theme.text },
        memberEmail: { fontSize: 13, color: theme.textMuted },
        statusBadge: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
        },
        statusText: { fontSize: 10, fontWeight: "800" },
        emptyBox: { padding: 40, alignItems: "center" },
        emptyText: { color: theme.textMuted },
    });
