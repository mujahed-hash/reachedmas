import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { useNotificationRealtime } from "../useNotificationRealtime";
import { 
    Bell, 
    MessageSquare, 
    Phone, 
    Truck, 
    AlertTriangle, 
    Package, 
    Search,
    CheckCircle2
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../api";
import { useAppTheme } from "../ThemeProvider";

const getNotificationIcon = (type: string, size = 18, color?: string) => {
    switch (type) {
        case "SCAN": return <Search size={size} color={color} />;
        case "MESSAGE": return <MessageSquare size={size} color={color} />;
        case "CALL": return <Phone size={size} color={color} />;
        case "TOW_ALERT": return <Truck size={size} color={color} />;
        case "EMERGENCY": return <AlertTriangle size={size} color={color} />;
        case "DELIVERY_KNOCK": return <Package size={size} color={color} />;
        case "FOUND_REPORT": return <Search size={size} color={color} />;
        default: return <Bell size={size} color={color} />;
    }
};

const getAssetIcon = (type: string, size = 12, color?: string) => {
    switch (type) {
        case "CAR": return <Search size={size} color={color} />; // We can use more specific ones if needed, but keeping it simple
        default: return <Package size={size} color={color} />;
    }
};

export default function NotificationsScreen({ navigation, onRead }: any) {
    const { theme, isDark } = useAppTheme();

    const typeColors: Record<string, { bg: string; text: string }> = useMemo(() => {
        const R = (o: number) => `rgba(${theme.accentTint},${o})`;
        return {
            SCAN: { bg: "rgba(148,163,184,0.1)", text: "#94A3B8" },
            MESSAGE: { bg: R(0.14), text: theme.primarySoft },
            CALL: { bg: R(0.14), text: theme.primaryOnSurface },
            TOW_ALERT: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B" },
            EMERGENCY: { bg: "rgba(239,68,68,0.1)", text: "#EF4444" },
            DELIVERY_KNOCK: { bg: R(0.14), text: theme.primarySoft },
            FOUND_REPORT: { bg: "rgba(16,185,129,0.1)", text: "#10B981" },
        };
    }, [theme]);
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
    
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            load();
        });
        return unsubscribe;
    }, [navigation, load]);

    // Refresh when a new notification arrives via SSE
    const handleNewNotification = useCallback(() => {
        load();
    }, [load]);

    useNotificationRealtime(handleNewNotification);

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
        const icon = getNotificationIcon(type, 18, colors.text);

        // Use generic asset name and type-aware icon
        const assetName = item.asset?.name;

        return (
            <TouchableOpacity
                style={[s.notifCard, !item.isRead && s.notifUnread]}
                onPress={() => !item.isRead && handleMarkRead(item.id)}
                activeOpacity={0.7}
            >
                {!item.isRead && <View style={s.unreadAccent} />}
                <View style={[s.notifIcon, { backgroundColor: colors.bg }]}>
                    {icon}
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2, paddingRight: 40 }}>
                        <Text style={s.notifTitle}>{item.title}</Text>
                        <View style={[s.typeBadge, { backgroundColor: colors.bg }]}>
                            <Text style={[s.typeBadgeText, { color: colors.text }]}>{type.replace('_', ' ')}</Text>
                        </View>
                    </View>
                    <Text style={s.notifBody} numberOfLines={2}>{item.body}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                        {assetName ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Package size={12} color={theme.textMuted} />
                                <Text style={s.notifMeta}>{assetName}</Text>
                            </View>
                        ) : null}
                        <Text style={s.notifMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
                    </View>
                </View>
                {!item.isRead && (
                    <View style={s.newPill}>
                        <Text style={s.newPillText}>NEW</Text>
                    </View>
                )}
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
                        <Bell size={48} color={theme.textMuted} style={{ marginBottom: 16, opacity: 0.5 }} />
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
            backgroundColor: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)",
            borderColor: "rgba(99,102,241,0.3)",
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 4,
        },
        unreadAccent: {
            position: "absolute",
            left: 0,
            top: "25%",
            height: "50%",
            width: 4,
            backgroundColor: theme.primary,
            borderTopRightRadius: 4,
            borderBottomRightRadius: 4,
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

        newPill: {
            position: "absolute",
            top: 10,
            right: 10,
            backgroundColor: theme.primary,
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
        },
        newPillText: {
            color: "#FFFFFF",
            fontSize: 8,
            fontWeight: "900",
            letterSpacing: 0.5,
        },

        emptyContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingTop: 80,
        },
        emptyText: { fontSize: 15, color: theme.textMuted },
    });
