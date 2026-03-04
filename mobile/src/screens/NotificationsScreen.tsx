import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchNotifications } from "../api";

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await fetchNotifications();
            setNotifications(data.notifications || []);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    }, []);

    useEffect(() => {
        load();
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, [load]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "EMERGENCY": return "🚨";
            case "TOW_ALERT": return "⚠️";
            default: return "✉️";
        }
    };

    const timeAgo = (dateStr: string) => {
        const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (seconds < 60) return "just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.card, !item.isRead && styles.unreadCard]}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.iconText}>{getTypeIcon(item.type)}</Text>
                <View style={styles.cardContent}>
                    <View style={styles.titleRow}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                        {!item.isRead && (
                            <View style={styles.unreadDot} />
                        )}
                    </View>
                    <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
                </View>
            </View>
            <Text style={styles.cardBody} numberOfLines={2}>
                {item.body}
            </Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Alerts</Text>
                        <Text style={styles.headerSubtitle}>Real-time protection updates</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyEmoji}>🔔</Text>
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B1120"
    },
    header: {
        marginBottom: 24,
        marginTop: 8,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: "700",
        color: "#F8FAFC",
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 16,
        color: "#94A3B8",
        marginTop: 4,
    },
    list: {
        padding: 16,
        paddingBottom: 40
    },
    card: {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    unreadCard: {
        borderColor: "rgba(99, 102, 241, 0.3)",
        backgroundColor: "rgba(99, 102, 241, 0.05)",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    iconText: {
        fontSize: 20,
        marginRight: 12,
    },
    cardContent: {
        flex: 1
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    cardTitle: {
        color: "#F8FAFC",
        fontSize: 16,
        fontWeight: "600",
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#6366F1",
    },
    cardTime: {
        color: "#64748B",
        fontSize: 12,
        marginTop: 2,
    },
    cardBody: {
        color: "#94A3B8",
        fontSize: 14,
        lineHeight: 20,
    },
    empty: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        color: "#F8FAFC",
        fontSize: 18,
        fontWeight: "600"
    }
});
