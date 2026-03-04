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
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { fetchDashboard, deleteVehicle as apiDeleteVehicle } from "../api";
import { useAppTheme } from "../ThemeProvider";

interface Vehicle {
    id: string;
    model: string;
    color: string;
    towPreventionMode?: boolean;
    tags: { id: string; shortCode: string; status: string }[];
}

interface DashboardData {
    vehicles: Vehicle[];
    stats: { totalScans: number; activeTags: number; vehicleCount: number };
    recentNotifications: any[];
}

export default function DashboardScreen({ navigation }: any) {
    const { theme, isDark } = useAppTheme();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetchDashboard();
            setData(res);
        } catch (err) {
            console.error("Dashboard load error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            load();
        });
        return unsubscribe;
    }, [navigation, load]);

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const handleDeleteVehicle = (vehicleId: string, vehicleName: string) => {
        Alert.alert(
            "Delete Vehicle",
            `Are you sure you want to delete "${vehicleName}"? This will also delete all associated tags and history.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await apiDeleteVehicle(vehicleId);
                            load();
                        } catch (err) {
                            Alert.alert("Error", "Failed to delete vehicle");
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

    const stats = data?.stats || { totalScans: 0, activeTags: 0, vehicleCount: 0 };
    const vehicles = data?.vehicles || [];
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
                        <Text style={s.statIcon}>🚗</Text>
                        <Text style={s.statValue}>{stats.vehicleCount}</Text>
                        <Text style={s.statLabel}>Vehicles</Text>
                    </View>
                    <View style={s.statCard}>
                        <Text style={s.statIcon}>👁️</Text>
                        <Text style={s.statValue}>{stats.totalScans}</Text>
                        <Text style={s.statLabel}>Total Scans</Text>
                    </View>
                    <View style={s.statCard}>
                        <Text style={s.statIcon}>📎</Text>
                        <Text style={s.statValue}>{stats.activeTags}</Text>
                        <Text style={s.statLabel}>Active Tags</Text>
                    </View>
                </View>

                {/* Vehicles Section */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>Your Vehicles</Text>
                        <TouchableOpacity
                            style={s.addButton}
                            onPress={() => navigation.navigate("AddVehicleModal")}
                        >
                            <Text style={s.addButtonText}>+ Add Vehicle</Text>
                        </TouchableOpacity>
                    </View>

                    {vehicles.length === 0 ? (
                        <View style={s.emptyCard}>
                            <Text style={s.emptyIcon}>🚗</Text>
                            <Text style={s.emptyText}>No vehicles yet. Add your first vehicle to get started.</Text>
                        </View>
                    ) : (
                        vehicles.map((v) => {
                            const vehicleName = `${v.color} ${v.model}`;
                            const firstTag = v.tags[0];
                            return (
                                <View key={v.id} style={s.vehicleCard}>
                                    <View style={s.vehicleRow}>
                                        <View style={s.vehicleIconBox}>
                                            <Text style={{ fontSize: 22 }}>🚗</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.vehicleName}>{vehicleName}</Text>
                                            <Text style={s.vehicleMeta}>
                                                {v.tags.length} tag{v.tags.length !== 1 ? "s" : ""}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => handleDeleteVehicle(v.id, vehicleName)}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <Text style={{ fontSize: 18, color: theme.error }}>🗑️</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {firstTag && (
                                        <View style={s.tagSection}>
                                            <Text style={s.tagCode}>Tag: {firstTag.shortCode}</Text>
                                            <View style={s.tagActions}>
                                                <TouchableOpacity
                                                    style={s.tagActionBtn}
                                                    onPress={() =>
                                                        navigation.navigate("VehicleDetail", { vehicleId: v.id })
                                                    }
                                                >
                                                    <Text style={s.tagActionText}>History</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={s.tagActionBtn}
                                                    onPress={() =>
                                                        navigation.navigate("TagSetup", {
                                                            tagId: firstTag.id,
                                                            shortCode: firstTag.shortCode,
                                                            vehicleName,
                                                        })
                                                    }
                                                >
                                                    <Text style={s.tagActionText}>📱 QR Code</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[s.tagActionBtn, { backgroundColor: "transparent" }]}
                                                    onPress={() => handlePreview(firstTag.shortCode)}
                                                >
                                                    <Text style={[s.tagActionText, { color: theme.textMuted }]}>Preview</Text>
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
                            <View key={n.id || i} style={[s.notifCard, !n.isRead && s.notifUnread]}>
                                <Text style={s.notifTitle}>{n.title}</Text>
                                <Text style={s.notifBody}>{n.body}</Text>
                                <Text style={s.notifTime}>
                                    {new Date(n.createdAt).toLocaleString()}
                                </Text>
                            </View>
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

        // Vehicle Card
        vehicleCard: {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            marginBottom: 10,
        },
        vehicleRow: { flexDirection: "row", alignItems: "center" },
        vehicleIconBox: {
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
        },
        vehicleName: { fontSize: 16, fontWeight: "600", color: theme.text },
        vehicleMeta: { fontSize: 13, color: theme.textMuted, marginTop: 2 },

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
            borderLeftWidth: 3,
            borderLeftColor: theme.primary,
        },
        notifTitle: { fontSize: 14, fontWeight: "600", color: theme.text, marginBottom: 2 },
        notifBody: { fontSize: 13, color: theme.textMuted, marginBottom: 4 },
        notifTime: { fontSize: 11, color: theme.textMuted },

        unreadBadge: {
            backgroundColor: theme.error,
            borderRadius: 10,
            width: 22,
            height: 22,
            justifyContent: "center",
            alignItems: "center",
        },
        unreadBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
    });
