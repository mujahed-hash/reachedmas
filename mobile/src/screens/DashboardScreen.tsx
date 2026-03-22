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
import { LinearGradient } from "expo-linear-gradient";
import { useNotificationRealtime } from "../useNotificationRealtime";
import {
    Car,
    Dog,
    Home,
    User,
    Package,
    Trash2,
    QrCode,
    MessageCircle,
    Tag,
    Users,
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

interface RecentActivityItem {
    id: string;
    actionType: string;
    timestamp: string;
    tag?: { asset?: { name: string | null } | null } | null;
}

interface DashboardData {
    assets: Asset[];
    stats: { totalScans: number; activeTags: number; assetCount: number };
    recentNotifications: any[];
    recentActivity?: RecentActivityItem[];
    plan: string;
}

const getTypeIcon = (type: string, size = 22, color?: string) => {
    switch (type) {
        case "CAR":
            return <Car size={size} color={color} />;
        case "PET":
            return <Dog size={size} color={color} />;
        case "HOME":
            return <Home size={size} color={color} />;
        case "PERSON":
            return <User size={size} color={color} />;
        default:
            return <Package size={size} color={color} />;
    }
};

function formatActionLabel(actionType: string) {
    return actionType.toLowerCase().replace(/_/g, " ");
}

export default function DashboardScreen({ navigation }: any) {
    const { theme, isDark } = useAppTheme();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const accentHighlight = theme.primaryOnSurface;
    const accentIcon = theme.primaryOnSurface;

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

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const unsubscribeFocus = navigation.addListener("focus", load);
        return unsubscribeFocus;
    }, [navigation, load]);

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

    const s = createStyles(theme, isDark, accentHighlight, accentIcon);

    if (loading) {
        return (
            <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={theme.primarySoft} />
            </View>
        );
    }

    const stats = data?.stats || { totalScans: 0, activeTags: 0, assetCount: 0 };
    const assets = data?.assets || [];
    const notifications = data?.recentNotifications || [];
    const recentActivity = data?.recentActivity || [];

    return (
        <SafeAreaView style={s.container} edges={["left", "right"]}>
            <ScrollView
                contentContainerStyle={s.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primarySoft} />
                }
            >
                {/* Web parity: title row + Family + Add */}
                <View style={s.titleRow}>
                    <View style={s.titleLeft}>
                        <Text style={s.pageTitle}>My Tags</Text>
                        <View style={s.titleBadge}>
                            <Text style={s.titleBadgeText}>{assets.length}</Text>
                        </View>
                    </View>
                    <View style={s.titleActions}>
                        <TouchableOpacity
                            style={s.familyBtn}
                            onPress={() => navigation.navigate("Family")}
                            activeOpacity={0.7}
                        >
                            <Users size={16} color={theme.textMuted} />
                            <Text style={s.familyBtnText}>Family</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={s.addBtn}
                            onPress={() => navigation.navigate("AddAssetModal", { plan: data?.plan || "FREE" })}
                            activeOpacity={0.85}
                        >
                            <Text style={s.addBtnText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={s.pageSubtitle}>Manage your assets and tags</Text>

                {/* Stat cards: 2 + 1 full width (matches web grid) */}
                <View style={s.statsGrid}>
                    <View style={s.statsRowTwo}>
                        <StatCard
                            s={s}
                            label="Total Assets"
                            value={String(stats.assetCount)}
                            icon={<Package size={22} color={isDark ? "rgba(248,250,252,0.8)" : "rgba(15,23,42,0.8)"} />}
                            highlight={false}
                            isDark={isDark}
                            accentTint={theme.accentTint}
                        />
                        <StatCard
                            s={s}
                            label="Total Scans"
                            value={String(stats.totalScans)}
                            icon={<QrCode size={22} color={isDark ? "rgba(248,250,252,0.8)" : "rgba(15,23,42,0.8)"} />}
                            highlight={false}
                            isDark={isDark}
                            accentTint={theme.accentTint}
                        />
                    </View>
                    <StatCard
                        s={s}
                        label="Active Tags"
                        value={String(stats.activeTags)}
                        icon={<Tag size={24} color={accentIcon} />}
                        highlight
                        isDark={isDark}
                        accentTint={theme.accentTint}
                    />
                </View>

                {/* Assets grouped by type — web single column */}
                <View style={s.assetsBlock}>
                    {assets.length === 0 ? (
                        <View style={s.emptyCard}>
                            <View style={s.emptyIconCircle}>
                                <Package size={32} color={accentIcon} />
                            </View>
                            <Text style={s.emptyTitle}>No tags active</Text>
                            <Text style={s.emptyDesc}>
                                Add your first asset to generate a secure, anonymous contact code.
                            </Text>
                            <TouchableOpacity
                                style={s.addBtnLarge}
                                onPress={() => navigation.navigate("AddAssetModal", { plan: data?.plan || "FREE" })}
                            >
                                <Text style={s.addBtnText}>Add asset</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        Object.entries(
                            assets.reduce((acc: Record<string, Asset[]>, asset) => {
                                const t = asset.type || "CAR";
                                if (!acc[t]) acc[t] = [];
                                acc[t].push(asset);
                                return acc;
                            }, {})
                        ).map(([type, typeAssets]) => {
                            const typeLabels: Record<string, string> = {
                                CAR: "Vehicles",
                                PET: "Pets",
                                HOME: "Homes",
                                PERSON: "People",
                                ASSET: "Assets",
                            };
                            return (
                                <View key={type} style={s.typeGroup}>
                                    <View style={s.typeHeader}>
                                        {getTypeIcon(type, 16, theme.textMuted)}
                                        <Text style={s.typeHeaderText}>{typeLabels[type] || type}</Text>
                                    </View>
                                    {(typeAssets as Asset[]).map((a) => {
                                        const assetName = a.name;
                                        const firstTag = a.tags[0];
                                        return (
                                            <View key={a.id} style={s.assetCard}>
                                                <View style={s.assetTop}>
                                                    <View style={{ flex: 1 }}>
                                                        <View style={s.assetTitleRow}>
                                                            <Text style={s.assetName}>{assetName}</Text>
                                                            {firstTag ? (
                                                                <View style={s.activePill}>
                                                                    <View style={s.activeDot} />
                                                                    <Text style={s.activePillText}>Active</Text>
                                                                </View>
                                                            ) : (
                                                                <View style={s.noTagPill}>
                                                                    <Text style={s.noTagPillText}>No Tag</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                        <Text style={s.assetMeta}>
                                                            {a.subtitle ? `${a.subtitle} · ` : ""}
                                                            {(a.type || "ASSET").charAt(0) +
                                                                (a.type || "asset").slice(1).toLowerCase()}
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
                                                    <View style={s.qrRow}>
                                                        <View style={s.qrIconBox}>
                                                            {isDark && (
                                                                <LinearGradient colors={[`rgba(${theme.accentTint},0.55)`, "transparent"]} style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />
                                                            )}
                                                            <QrCode size={28} color={accentIcon} />
                                                        </View>
                                                        <View>
                                                            <Text style={s.tagCodeLabel}>Tag Code</Text>
                                                            <Text style={s.tagCodeValue}>{firstTag.shortCode}</Text>
                                                        </View>
                                                    </View>
                                                )}

                                                <View style={s.assetFooter}>
                                                    <TouchableOpacity
                                                        onPress={() => navigation.navigate("AssetDetail", { assetId: a.id })}
                                                    >
                                                        <Text style={s.footerLink}>View History</Text>
                                                    </TouchableOpacity>
                                                    <View style={s.footerBtns}>
                                                        <TouchableOpacity
                                                            style={s.previewBtn}
                                                            onPress={() => handlePreview(firstTag!.shortCode)}
                                                        >
                                                            <Text style={s.previewBtnText}>Preview</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={s.setupBtn}
                                                            onPress={() =>
                                                                navigation.navigate("TagSetup", {
                                                                    tagId: firstTag!.id,
                                                                    shortCode: firstTag!.shortCode,
                                                                    assetId: a.id,
                                                                    assetName,
                                                                    assetType: a.type,
                                                                })
                                                            }
                                                        >
                                                            <Text style={s.setupBtnText}>Options →</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            );
                        })
                    )}
                </View>

                {/* Messages & Alerts — web: always visible, border-t section */}
                <View style={s.dividerSection}>
                    <Text style={s.sectionHeading}>Messages & Alerts</Text>
                    <View style={s.cardShell}>
                        {notifications.length === 0 ? (
                            <View style={s.emptyMessages}>
                                <MessageCircle size={32} color={theme.textMuted} style={{ opacity: 0.5 }} />
                                <Text style={s.emptyMessagesTitle}>No messages yet</Text>
                                <Text style={s.emptyMessagesSub}>
                                    When someone contacts you about your asset, you’ll see it here.
                                </Text>
                            </View>
                        ) : (
                            notifications.map((n: any) => (
                                <TouchableOpacity
                                    key={n.id}
                                    style={[s.notifRow, !n.isRead && s.notifUnread]}
                                    onPress={() => navigation.navigate("Notifications")}
                                    activeOpacity={0.75}
                                >
                                    <View style={s.notifTop}>
                                        <View style={s.notifTitleWrap}>
                                            {!n.isRead && <View style={s.unreadDot} />}
                                            <Text
                                                style={[s.notifTitle, !n.isRead && { color: accentHighlight }]}
                                                numberOfLines={2}
                                            >
                                                {n.title}
                                            </Text>
                                        </View>
                                        <Text style={s.notifDate}>
                                            {new Date(n.createdAt).toLocaleString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Text>
                                    </View>
                                    <Text style={s.notifBody} numberOfLines={2}>
                                        {n.body}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </View>

                    <Text style={[s.sectionHeading, s.scanHeading]}>Scan History</Text>
                    <View style={s.cardShell}>
                        {recentActivity.length === 0 ? (
                            <Text style={s.scanEmpty}>No activity yet</Text>
                        ) : (
                            recentActivity.map((activity) => (
                                <View key={activity.id} style={s.scanRow}>
                                    <View style={s.scanBarWrap}>
                                        <View style={s.scanBarTrack}>
                                            <View style={s.scanBarFill} />
                                        </View>
                                    </View>
                                    <View style={s.scanMid}>
                                        <Text style={s.scanAction}>
                                            {formatActionLabel(activity.actionType)}
                                        </Text>
                                        <Text style={s.scanAsset} numberOfLines={1}>
                                            {activity.tag?.asset?.name || "—"}
                                        </Text>
                                    </View>
                                    <View style={s.scanRight}>
                                        <Text style={s.scanDate}>
                                            {new Date(activity.timestamp).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </Text>
                                        <Text style={s.scanTime}>
                                            {new Date(activity.timestamp).toLocaleTimeString(undefined, {
                                                hour: "numeric",
                                                minute: "2-digit",
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function StatCard({
    s,
    label,
    value,
    icon,
    highlight,
    isDark,
    accentTint,
}: {
    s: ReturnType<typeof createStyles>;
    label: string;
    value: string;
    icon: React.ReactNode;
    highlight: boolean;
    isDark: boolean;
    accentTint: string;
}) {
    return (
        <View style={[s.statCard, highlight && s.statCardHighlight]}>
            <View style={s.statCardLeft}>
                <Text style={[s.statLabel, highlight && s.statLabelHighlight]}>{label}</Text>
                <Text style={s.statValue}>{value}</Text>
            </View>
            <View style={[s.statIconBox, highlight && s.statIconBoxHighlight]}>
                {highlight && isDark && (
                    <LinearGradient colors={[`rgba(${accentTint},0.55)`, "transparent"]} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} />
                )}
                {icon}
            </View>
        </View>
    );
}

const createStyles = (theme: any, isDark: boolean, accentHighlight: string, accentIcon: string) => {
    const R = (opacity: number) => `rgba(${theme.accentTint},${opacity})`;
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48, maxWidth: 672 },

        titleRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
            marginTop: 8,
        },
        titleLeft: { flexDirection: "row", alignItems: "center", flexShrink: 1 },
        pageTitle: { fontSize: 30, fontWeight: "800", color: theme.text, letterSpacing: -0.8 },
        titleBadge: {
            backgroundColor: isDark ? R(0.24) : R(0.12),
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 4,
            marginLeft: 12,
        },
        titleBadgeText: { color: accentHighlight, fontSize: 14, fontWeight: "800" },
        titleActions: { flexDirection: "row", alignItems: "center", gap: 8 },
        familyBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 8,
            paddingVertical: 6,
        },
        familyBtnText: { fontSize: 13, fontWeight: "600", color: theme.textMuted },
        addBtn: {
            // Darker blue (primarySoft), not the lighter header accent — still crisp with edge + shadow
            backgroundColor: theme.primarySoft,
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 9,
            borderWidth: isDark ? 1 : 0,
            borderColor: isDark ? "rgba(0,0,0,0.35)" : "transparent",
            shadowColor: theme.primarySoft,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.55 : 0.28,
            shadowRadius: 10,
            elevation: isDark ? 8 : 4,
        },
        addBtnLarge: {
            backgroundColor: theme.primarySoft,
            borderRadius: 10,
            paddingHorizontal: 22,
            paddingVertical: 13,
            marginTop: 4,
            borderWidth: isDark ? 1 : 0,
            borderColor: isDark ? "rgba(0,0,0,0.35)" : "transparent",
            shadowColor: theme.primarySoft,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: isDark ? 0.5 : 0.25,
            shadowRadius: 12,
            elevation: isDark ? 10 : 5,
        },
        addBtnText: { color: "#fff", fontSize: 14, fontWeight: "800", letterSpacing: 0.2 },

        pageSubtitle: {
            fontSize: 15,
            fontWeight: "600",
            color: theme.textMuted,
            marginBottom: 24,
            paddingHorizontal: 2,
        },

        statsGrid: { marginBottom: 32, gap: 12 },
        statsRowTwo: { flexDirection: "row", gap: 12 },
        statCard: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isDark ? "rgba(255,255,255,0.02)" : theme.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.05)" : theme.border,
            paddingVertical: 18,
            paddingHorizontal: 20,
            minHeight: 88,
        },
        statCardHighlight: {
            width: "100%",
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
            borderColor: isDark ? R(0.35) : R(0.2),
            shadowColor: theme.primarySoft,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.35 : 0.2,
            shadowRadius: 30,
            elevation: 12,
        },
        statCardLeft: { flex: 1 },
        statLabel: {
            fontSize: 10,
            fontWeight: "800",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: theme.textMuted,
            marginBottom: 4,
        },
        statLabelHighlight: { 
            color: accentHighlight,
            textShadowColor: isDark ? R(0.55) : "transparent",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8
        },
        statValue: { fontSize: 32, fontWeight: "800", color: theme.text, letterSpacing: -0.5 },
        statIconBox: {
            width: 48,
            height: 48,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(241,245,249,1)",
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.1)" : theme.border,
        },
        statIconBoxHighlight: {
            backgroundColor: isDark ? R(0.12) : R(0.1),
            borderColor: isDark ? R(0.45) : R(0.25),
            overflow: "hidden"
        },

        assetsBlock: { gap: 32, marginBottom: 8 },
        typeGroup: { marginBottom: 8 },
        typeHeader: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            paddingHorizontal: 4,
        },
        typeHeaderText: {
            fontSize: 13,
            fontWeight: "600",
            color: theme.textMuted,
            textTransform: "uppercase",
            letterSpacing: 1.5,
        },

        emptyCard: {
            borderRadius: 32,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : theme.border,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.85)",
            padding: 40,
            alignItems: "center",
        },
        emptyIconCircle: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: isDark ? R(0.18) : R(0.1),
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
        },
        emptyTitle: { fontSize: 18, fontWeight: "600", color: theme.text, marginBottom: 8 },
        emptyDesc: {
            fontSize: 14,
            color: theme.textMuted,
            textAlign: "center",
            maxWidth: 280,
            lineHeight: 20,
            marginBottom: 24,
        },

        assetCard: {
            borderRadius: 32,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : theme.border,
            backgroundColor: isDark ? "rgba(8,9,10,0.5)" : theme.card,
            padding: 32,
            marginBottom: 16,
        },
        assetTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
        assetTitleRow: {
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 6,
        },
        assetName: { fontSize: 20, fontWeight: "700", color: theme.text, letterSpacing: 0.2 },
        activePill: {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: "rgba(16,185,129,0.15)",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
        },
        activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
        activePillText: { fontSize: 11, fontWeight: "800", color: "#10B981", letterSpacing: 0.5 },
        noTagPill: {
            backgroundColor: "rgba(239,68,68,0.15)",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
        },
        noTagPillText: { fontSize: 11, fontWeight: "800", color: theme.error },
        assetMeta: { fontSize: 15, color: theme.textMuted },

        qrRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            marginTop: 20,
            marginBottom: 8,
        },
        qrIconBox: {
            width: 64,
            height: 64,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? R(0.1) : R(0.12),
            borderWidth: 1,
            borderColor: isDark ? R(0.45) : R(0.2),
            overflow: "hidden"
        },
        tagCodeLabel: {
            fontSize: 12,
            color: theme.textMuted,
            textTransform: "uppercase",
            letterSpacing: 2,
            marginBottom: 4,
            fontWeight: "600",
        },
        tagCodeValue: { fontSize: 18, fontWeight: "700", color: theme.text, letterSpacing: 0.5 },

        assetFooter: {
            marginTop: 20,
            paddingTop: 18,
            borderTopWidth: 1,
            borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
        },
        footerLink: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, color: theme.textMuted },
        footerBtns: { flexDirection: "row", alignItems: "center", gap: 10 },
        previewBtn: {
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(241,245,249,1)",
        },
        previewBtnText: { fontSize: 13, fontWeight: "600", color: theme.text },
        setupBtn: {
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 12,
            backgroundColor: isDark ? R(0.2) : R(0.1),
        },
        setupBtnText: { fontSize: 13, fontWeight: "800", color: accentHighlight },

        dividerSection: {
            marginTop: 8,
            paddingTop: 28,
            borderTopWidth: 1,
            borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            gap: 16,
        },
        sectionHeading: { fontSize: 18, fontWeight: "800", color: theme.text, paddingHorizontal: 4, marginBottom: 4 },
        scanHeading: { marginTop: 20, fontSize: 20, letterSpacing: -0.3 },
        cardShell: {
            borderRadius: 32,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : theme.border,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)",
            padding: 22,
        },
        emptyMessages: { alignItems: "center", paddingVertical: 20 },
        emptyMessagesTitle: { marginTop: 8, fontSize: 14, fontWeight: "600", color: theme.textMuted },
        emptyMessagesSub: {
            marginTop: 6,
            fontSize: 12,
            color: theme.textMuted,
            textAlign: "center",
            maxWidth: 220,
            lineHeight: 18,
        },

        notifRow: {
            padding: 18,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(248,250,252,1)",
            marginBottom: 12,
        },
        notifUnread: {
            backgroundColor: isDark ? R(0.14) : R(0.06),
            borderColor: isDark ? R(0.4) : R(0.2),
        },
        notifTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
        notifTitleWrap: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 8 },
        unreadDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.primarySoft,
            marginTop: 5,
            shadowColor: theme.primarySoft,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 8,
        },
        notifTitle: { flex: 1, fontSize: 14, fontWeight: "800", color: theme.text, letterSpacing: 0.3 },
        notifDate: { fontSize: 10, fontWeight: "800", color: theme.textMuted, opacity: 0.7, letterSpacing: 0.5 },
        notifBody: { fontSize: 12, color: theme.textMuted, lineHeight: 18, marginTop: 8 },

        scanEmpty: {
            textAlign: "center",
            fontSize: 14,
            fontWeight: "600",
            color: theme.textMuted,
            opacity: 0.5,
            paddingVertical: 20,
        },
        scanRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            paddingVertical: 14,
            paddingHorizontal: 8,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        },
        scanBarWrap: { alignItems: "center", justifyContent: "center" },
        scanBarTrack: {
            width: 6,
            height: 40,
            borderRadius: 3,
            backgroundColor: isDark ? R(0.28) : R(0.15),
            overflow: "hidden",
            justifyContent: "flex-end",
        },
        scanBarFill: {
            width: "100%",
            height: 20,
            backgroundColor: theme.primarySoft,
        },
        scanMid: { flex: 1, minWidth: 0 },
        scanAction: { fontSize: 14, fontWeight: "800", color: theme.text, textTransform: "capitalize" },
        scanAsset: { fontSize: 12, color: theme.textMuted, marginTop: 4, fontWeight: "600" },
        scanRight: { alignItems: "flex-end" },
        scanDate: { fontSize: 10, fontWeight: "800", color: theme.textMuted, letterSpacing: 1 },
        scanTime: { fontSize: 9, color: theme.textMuted, opacity: 0.6, marginTop: 4, fontWeight: "600" },
    });
};
