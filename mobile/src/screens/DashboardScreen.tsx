import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useNotificationRealtime } from "../useNotificationRealtime";
import { 
    Shield, 
    Eye, 
    Paperclip, 
    Car, 
    Dog, 
    Home, 
    User, 
    Package, 
    Trash2, 
    History, 
    QrCode, 
    ExternalLink 
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { fetchDashboard, deleteAsset as apiDeleteAsset } from "../api";
import { useAppTheme } from "../ThemeProvider";

interface Asset {
    id: string;
    name: string;
    type: string;
    subtitle?: string;
    towPreventionMode?: boolean;
    tags: { id: string; shortCode: string; status: string }[];
}

interface DashboardData {
    assets: Asset[];
    stats: { totalScans: number; activeTags: number; assetCount: number };
    recentNotifications: any[];
}

const getTypeIcon = (type: string, size = 22, color?: string) => {
    switch (type) {
        case "CAR": return <Car size={size} color={color} />;
        case "PET": return <Dog size={size} color={color} />;
        case "HOME": return <Home size={size} color={color} />;
        case "PERSON": return <User size={size} color={color} />;
        default: return <Package size={size} color={color} />;
    }
};

export default function DashboardScreen({ navigation }: any) {
    const { theme, isDark } = useAppTheme();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetchDashboard();
            setData(res);
        } catch (err: any) {
            console.error("Dashboard load error:", err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);
 
    useEffect(() => {
        const unsubscribeFocus = navigation.addListener("focus", load);
        return unsubscribeFocus;
    }, [navigation, load]);

    // Refresh when a new notification arrives via SSE
    const handleNewNotification = useCallback(() => {
        load();
    }, [load]);

    useNotificationRealtime(handleNewNotification);

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const handleDeleteAsset = (assetId: string, assetName: string) => {
        Alert.alert(
            "Delete Asset",
            `Are you sure you want to delete "${assetName}"? This will also delete all associated tags and history.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await apiDeleteAsset(assetId);
                            load();
                        } catch (err) {
                            Alert.alert("Error", "Failed to delete asset");
                        }
                    },
                },
            ]
        );
    };

    const handlePreview = (shortCode: string) => {
        WebBrowser.openBrowserAsync(`https://reachmasked.com/t/${shortCode}`);
    };

    const s = createStyles(theme, isDark);

    if (loading) {
        return (
            <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const stats = data?.stats || { totalScans: 0, activeTags: 0, assetCount: 0 };
    const assets = data?.assets || [];
    const notifications = data?.recentNotifications || [];
    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return (
        <SafeAreaView style={s.container} edges={["left", "right"]}>
            <ScrollView
                contentContainerStyle={s.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                {/* Stats Grid */}
                <View style={s.statsRow}>
                    <View style={s.statCard}>
                        <Shield size={20} color={theme.primary} style={{ marginBottom: 6 }} />
                        <Text style={s.statValue}>{stats.assetCount}</Text>
                        <Text style={s.statLabel}>Assets</Text>
                    </View>
                    <View style={s.statCard}>
                        <Eye size={20} color={theme.primary} style={{ marginBottom: 6 }} />
                        <Text style={s.statValue}>{stats.totalScans}</Text>
                        <Text style={s.statLabel}>Total Scans</Text>
                    </View>
                    <View style={s.statCard}>
                        <Paperclip size={20} color={theme.primary} style={{ marginBottom: 6 }} />
                        <Text style={s.statValue}>{stats.activeTags}</Text>
                        <Text style={s.statLabel}>Active Tags</Text>
                    </View>
                </View>

                {/* Assets Section */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>Your Assets</Text>
                        <TouchableOpacity
                            style={s.addButton}
                            onPress={() => navigation.navigate("AddAssetModal")}
                        >
                            <Text style={s.addButtonText}>+ Add Asset</Text>
                        </TouchableOpacity>
                    </View>

                    {assets.length === 0 ? (
                        <View style={s.emptyCard}>
                            <Shield size={40} color={theme.textMuted} style={{ marginBottom: 16 }} />
                            <Text style={s.emptyText}>No assets yet. Add your first asset to get started.</Text>
                        </View>
                    ) : (
                        assets.map((a) => {
                            const assetName = a.name;
                            const firstTag = a.tags[0];
                            return (
                                <View key={a.id} style={s.assetCard}>
                                    <View style={s.assetRow}>
                                        <View style={s.assetIconBox}>
                                            {getTypeIcon(a.type, 24, theme.primary)}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.assetName}>{assetName}</Text>
                                            <Text style={s.assetMeta}>
                                                {a.subtitle || `${a.tags.length} tag${a.tags.length !== 1 ? "s" : ""}`}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => handleDeleteAsset(a.id, assetName)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Trash2 size={20} color={theme.error} />
                                        </TouchableOpacity>
                                    </View>

                                    {firstTag && (
                                        <View style={s.tagSection}>
                                            <Text style={s.tagCode}>Tag: {firstTag.shortCode}</Text>
                                            <View style={s.tagActions}>
                                                <TouchableOpacity
                                                    style={s.tagActionBtn}
                                                    onPress={() =>
                                                        navigation.navigate("AssetDetail", { assetId: a.id })
                                                    }
                                                >
                                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                                        <History size={14} color={theme.text} />
                                                        <Text style={s.tagActionText}>History</Text>
                                                    </View>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={s.tagActionBtn}
                                                    onPress={() =>
                                                        navigation.navigate("TagSetup", {
                                                            tagId: firstTag.id,
                                                            shortCode: firstTag.shortCode,
                                                            assetId: a.id,
                                                            assetName,
                                                            assetType: a.type
                                                        })
                                                    }
                                                >
                                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                                        <QrCode size={14} color={theme.text} />
                                                        <Text style={s.tagActionText}>Setup</Text>
                                                    </View>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[s.tagActionBtn, { backgroundColor: "transparent" }]}
                                                    onPress={() => handlePreview(firstTag.shortCode)}
                                                >
                                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                                        <ExternalLink size={14} color={theme.textMuted} />
                                                        <Text style={[s.tagActionText, { color: theme.textMuted }]}>Preview</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Recent Notifications */}
                {notifications.length > 0 && (
                    <View style={s.section}>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>Recent Alerts</Text>
                            {unreadCount > 0 && (
                                <View style={s.unreadBadge}>
                                    <Text style={s.unreadBadgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </View>
                        {notifications.slice(0, 5).map((n: any, i: number) => (
                            <TouchableOpacity 
                                key={n.id || i} 
                                style={[s.notifCard, !n.isRead && s.notifUnread]}
                                onPress={() => navigation.navigate("Alerts")}
                                activeOpacity={0.7}
                            >
                                {!n.isRead && <View style={s.unreadAccent} />}
                                <View style={{ flex: 1, paddingRight: !n.isRead ? 40 : 0 }}>
                                    <Text style={s.notifTitle}>{n.title}</Text>
                                    <Text style={s.notifBody} numberOfLines={2}>{n.body}</Text>
                                    <Text style={s.notifTime}>
                                        {new Date(n.createdAt).toLocaleString()}
                                    </Text>
                                </View>
                                {!n.isRead && (
                                    <View style={s.newPill}>
                                        <Text style={s.newPillText}>NEW</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (theme: any, isDark: boolean) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        scrollContent: { padding: 16, paddingBottom: 40 },

        // Stats
        statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
        statCard: {
            flex: 1,
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            alignItems: "center",
        },
        statIcon: { fontSize: 24, marginBottom: 6 },
        statValue: { fontSize: 22, fontWeight: "800", color: theme.text },
        statLabel: { fontSize: 11, color: theme.textMuted, marginTop: 2 },

        // Sections
        section: { marginBottom: 24 },
        sectionHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
        },
        sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.text },

        addButton: {
            backgroundColor: theme.primary,
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
        },
        addButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },

        // Empty
        emptyCard: {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 32,
            alignItems: "center",
        },
        emptyIcon: { fontSize: 36, marginBottom: 12 },
        emptyText: { color: theme.textMuted, fontSize: 14, textAlign: "center" },

        // Asset Card
        assetCard: {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            marginBottom: 10,
        },
        assetRow: { flexDirection: "row", alignItems: "center" },
        assetIconBox: {
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
        },
        assetName: { fontSize: 16, fontWeight: "600", color: theme.text },
        assetMeta: { fontSize: 13, color: theme.textMuted, marginTop: 2 },

        // Tag Section
        tagSection: {
            marginTop: 14,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        tagCode: { fontSize: 12, color: theme.textMuted },
        tagActions: { flexDirection: "row", gap: 6 },
        tagActionBtn: {
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: theme.border,
        },
        tagActionText: { fontSize: 12, color: theme.text, fontWeight: "500" },

        // Notifications
        notifCard: {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 12,
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
        notifTitle: { fontSize: 14, fontWeight: "600", color: theme.text, marginBottom: 2 },
        notifBody: { fontSize: 13, color: theme.textMuted, marginBottom: 4 },
        notifTime: { fontSize: 11, color: theme.textMuted },

        unreadBadge: {
            backgroundColor: theme.error,
            borderRadius: 10,
            width: 20,
            height: 20,
            justifyContent: "center",
            alignItems: "center",
        },
        unreadBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
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
    });
