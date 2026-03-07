import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../api";
import { useAppTheme } from "../ThemeProvider";

const typeIcons: Record<string, string> = {
    SCAN: "👁️",
    MESSAGE: "💬",
    CALL: "📞",
    TOW_ALERT: "🚛",
    EMERGENCY: "⚠️",
    DELIVERY_KNOCK: "📦",
    FOUND_REPORT: "🎒",
};

const typeColors: Record<string, { bg: string; text: string }> = {
    SCAN: { bg: "rgba(148,163,184,0.1)", text: "#94A3B8" },
    MESSAGE: { bg: "rgba(99,102,241,0.1)", text: "#6366F1" },
    CALL: { bg: "rgba(129,140,248,0.1)", text: "#818CF8" },
    TOW_ALERT: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B" },
    EMERGENCY: { bg: "rgba(239,68,68,0.1)", text: "#EF4444" },
    DELIVERY_KNOCK: { bg: "rgba(99,102,241,0.1)", text: "#6366F1" },
    FOUND_REPORT: { bg: "rgba(16,185,129,0.1)", text: "#10B981" },
};

const getAssetIcon = (type: string) => {
    switch (type) {
        case "CAR": return "🚗";
        case "PET": return "🐶";
        case "HOME": return "🏠";
        case "PERSON": return "🎒";
        default: return "📦";
    }
};

export default function NotificationsScreen({ onRead }: { onRead?: () => void } = {}) {
    const { theme, isDark } = useAppTheme();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetchNotifications();
            setNotifications(res.notifications || []);
        } catch (err) {
            console.error("Notifications load error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleMarkRead = async (id: string) => {
        try {
            await markNotificationRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
        } catch (err) {
            console.error("Mark read error:", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            onRead?.();
        } catch (err) {
            console.error("Mark all read error:", err);
        }
    };

    const s = createStyles(theme, isDark);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    if (loading) {
        return (
            <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const renderItem = ({ item }: { item: any }) => {
        const type = item.type || "SCAN";
        const colors = typeColors[type] || typeColors.SCAN;
        const icon = typeIcons[type] || "🔔";

        // Use generic asset name and type-aware icon
        const assetName = item.asset?.name;
        const assetIcon = getAssetIcon(item.asset?.type);

        return (
            <TouchableOpacity
                style={[s.notifCard, !item.isRead && s.notifUnread]}
                onPress={() => !item.isRead && handleMarkRead(item.id)}
                activeOpacity={0.7}
            >
                <View style={[s.notifIcon, { backgroundColor: colors.bg }]}>
                    <Text style={{ fontSize: 18 }}>{icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <Text style={s.notifTitle}>{item.title}</Text>
                        <View style={[s.typeBadge, { backgroundColor: colors.bg }]}>
                            <Text style={[s.typeBadgeText, { color: colors.text }]}>{type.replace('_', ' ')}</Text>
                        </View>
                    </View>
                    <Text style={s.notifBody} numberOfLines={2}>{item.body}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                        {assetName ? <Text style={s.notifMeta}>{assetIcon} {assetName}</Text> : null}
                        <Text style={s.notifMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
                    </View>
                </View>
                {!item.isRead && <View style={s.unreadDot} />}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={s.container} edges={["left", "right"]}>
            {unreadCount > 0 && (
                <TouchableOpacity style={s.markAllBtn} onPress={handleMarkAllRead}>
                    <Text style={s.markAllText}>Mark all read ({unreadCount})</Text>
                </TouchableOpacity>
            )}
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={s.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); load(); }}
                        tintColor={theme.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={s.emptyContainer}>
                        <Text style={{ fontSize: 36, marginBottom: 12 }}>🔔</Text>
                        <Text style={s.emptyText}>No notifications yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const createStyles = (theme: any, isDark: boolean) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        listContent: { padding: 16, paddingBottom: 40 },

        markAllBtn: {
            alignSelf: "flex-end",
            marginRight: 16,
            marginTop: 8,
            backgroundColor: theme.primary,
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
        },
        markAllText: { color: "#fff", fontSize: 13, fontWeight: "600" },

        notifCard: {
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 14,
            marginBottom: 8,
        },
        notifUnread: {
            borderLeftWidth: 3,
            borderLeftColor: theme.primary,
        },
        notifIcon: {
            width: 40,
            height: 40,
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
        },
        notifTitle: { fontSize: 14, fontWeight: "600", color: theme.text },
        notifBody: { fontSize: 13, color: theme.textMuted },
        notifMeta: { fontSize: 11, color: theme.textMuted },

        typeBadge: {
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
        },
        typeBadgeText: { fontSize: 10, fontWeight: "700" },

        unreadDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.primary,
            position: "absolute",
            top: 8,
            right: 8,
        },

        emptyContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingTop: 80,
        },
        emptyText: { fontSize: 15, color: theme.textMuted },
    });
