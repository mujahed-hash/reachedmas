import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Platform,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchDashboard } from "../api";

interface Vehicle {
    id: string;
    model: string;
    color: string;
    isActive: boolean;
    towPreventionMode: boolean;
    tags: { id: string; shortCode: string; label: string | null; status: string }[];
}

interface DashboardData {
    vehicles: Vehicle[];
    unreadCount: number;
    stats: { totalScans: number; totalVehicles: number };
}

export default function DashboardScreen({ navigation }: any) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        try {
            setError("");
            const result = await fetchDashboard();
            setData(result);
        } catch (err: any) {
            setError(err.message || "Failed to load dashboard");
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    if (!data && !error) {
        return (
            <View style={styles.center}>
                <View style={styles.loaderContainer}>
                    <Text style={styles.loadingEmoji}>🚗</Text>
                    <Text style={styles.loadingText}>Syncing Fleet...</Text>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
                }
            >
                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.error}>{error}</Text>
                    </View>
                ) : null}

                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>Dashboard</Text>
                    <Text style={styles.subGreeting}>Manage your vehicles and tags</Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Text style={styles.statIcon}>🚗</Text>
                        </View>
                        <View>
                            <Text style={styles.statLabel}>Vehicles</Text>
                            <Text style={styles.statNumber}>{data?.stats.totalVehicles || 0}</Text>
                        </View>
                    </View>

                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Text style={styles.statIcon}>📊</Text>
                        </View>
                        <View>
                            <Text style={styles.statLabel}>Total Scans</Text>
                            <Text style={styles.statNumber}>{data?.stats.totalScans || 0}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your Vehicles</Text>
                </View>

                {data?.vehicles.map((v) => (
                    <TouchableOpacity
                        key={v.id}
                        activeOpacity={0.9}
                        style={styles.vehicleCard}
                        onPress={() => navigation.navigate("TagDetail", { vehicle: v })}
                    >
                        <View style={styles.vehicleHeader}>
                            <Text style={styles.vehicleName}>
                                {v.color} {v.model}
                            </Text>
                            <View style={styles.chevron}>
                                <Text style={styles.chevronText}>›</Text>
                            </View>
                        </View>

                        <View style={styles.tagSection}>
                            {v.tags.map((tag) => (
                                <View key={tag.id} style={styles.tagItem}>
                                    <View style={styles.tagInfo}>
                                        <Text style={styles.tagIconText}>🏷️</Text>
                                        <Text style={styles.tagCode}>{tag.shortCode}</Text>
                                    </View>
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>{tag.status}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {v.towPreventionMode && (
                            <View style={styles.towIndicator}>
                                <Text style={styles.towText}>⚠️ Tow Prevention Mode ON</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}

                {(!data?.vehicles || data.vehicles.length === 0) && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}>🚗</Text>
                        <Text style={styles.emptyText}>No vehicles yet</Text>
                        <Text style={styles.emptySubtext}>
                            Add your first vehicle to get started with ReachMasked
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B1120", // Web Deep Navy
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0B1120",
    },
    loaderContainer: {
        alignItems: "center",
        gap: 12,
    },
    loadingEmoji: {
        fontSize: 48,
    },
    loadingText: {
        color: "#94A3B8",
        fontSize: 16,
        fontWeight: "600",
    },
    header: {
        marginBottom: 32,
        marginTop: 8,
    },
    greeting: {
        fontSize: 30,
        fontWeight: "700",
        color: "#F8FAFC",
        letterSpacing: -0.5,
    },
    subGreeting: {
        fontSize: 16,
        color: "#94A3B8",
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: "column",
        gap: 16,
        marginBottom: 32,
    },
    statCard: {
        backgroundColor: "rgba(255, 255, 255, 0.05)", // Web Card Glass
        borderRadius: 12,
        padding: 24,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    statIconContainer: {
        padding: 12,
        borderRadius: 10,
        backgroundColor: "rgba(99, 102, 241, 0.1)",
    },
    statIcon: {
        fontSize: 20,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "700",
        color: "#F8FAFC",
    },
    statLabel: {
        fontSize: 14,
        color: "#94A3B8",
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#F8FAFC",
    },
    vehicleCard: {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        marginBottom: 16,
    },
    vehicleHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    vehicleName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#F8FAFC",
    },
    chevron: {
        padding: 4,
    },
    chevronText: {
        fontSize: 24,
        color: "#475569",
        fontWeight: "300",
    },
    tagSection: {
        gap: 12,
    },
    tagItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.05)",
    },
    tagInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    tagIconText: {
        fontSize: 14,
    },
    tagCode: {
        fontSize: 15,
        color: "#F8FAFC",
        fontWeight: "500",
    },
    badge: {
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 12,
        color: "#818CF8",
        fontWeight: "600",
        textTransform: "uppercase",
    },
    towIndicator: {
        marginTop: 16,
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        borderRadius: 8,
        padding: 10,
        alignItems: "center",
    },
    towText: {
        color: "#F59E0B",
        fontSize: 13,
        fontWeight: "600",
    },
    errorContainer: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    error: {
        color: "#EF4444",
        fontSize: 14,
        textAlign: "center",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    emptyEmoji: {
        fontSize: 40,
        marginBottom: 16,
    },
    emptyText: {
        color: "#F8FAFC",
        fontSize: 18,
        fontWeight: "600",
    },
    emptySubtext: {
        color: "#64748B",
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
        paddingHorizontal: 40,
        lineHeight: 20,
    },
});
