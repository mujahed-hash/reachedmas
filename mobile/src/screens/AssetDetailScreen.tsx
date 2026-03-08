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
    TextInput,
} from "react-native";
import { 
    Search, 
    MessageSquare, 
    Phone, 
    Truck, 
    AlertTriangle, 
    Package, 
    Dog, 
    Home, 
    User,
    CheckCircle2,
    History,
    Plus,
    Trash2,
    Calendar,
    MapPin
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    fetchAssetDetail,
    addAutoReply,
    toggleAutoReply as apiToggleAutoReply,
    deleteAutoReply as apiDeleteAutoReply,
} from "../api";
import { useAppTheme } from "../ThemeProvider";

const getNotificationIcon = (type: string, size = 18, color?: string) => {
    switch (type) {
        case "SCAN_VIEW": return <Search size={size} color={color} />;
        case "CONTACT_SMS": return <MessageSquare size={size} color={color} />;
        case "CONTACT_CALL": return <Phone size={size} color={color} />;
        case "TOW_ALERT": return <Truck size={size} color={color} />;
        case "EMERGENCY": return <AlertTriangle size={size} color={color} />;
        case "DELIVERY_KNOCK": return <Package size={size} color={color} />;
        case "FOUND_REPORT": return <Search size={size} color={color} />;
        default: return <Search size={size} color={color} />;
    }
};

const actionLabels: Record<string, string> = {
    SCAN_VIEW: "Tag Scanned",
    CONTACT_SMS: "Message Sent",
    CONTACT_CALL: "Call Initiated",
    TOW_ALERT: "Tow Alert",
    EMERGENCY: "Emergency",
    DELIVERY_KNOCK: "Delivery / Knock",
    FOUND_REPORT: "Found Report",
};

const getTypeIcon = (type: string, size = 22, color?: string) => {
    switch (type) {
        case "CAR": return <Search size={size} color={color} />; // Keeping it simple, can use more specific later
        case "PET": return <Dog size={size} color={color} />;
        case "HOME": return <Home size={size} color={color} />;
        case "PERSON": return <User size={size} color={color} />;
        default: return <Package size={size} color={color} />;
    }
};

export default function AssetDetailScreen({ route, navigation }: any) {
    const { assetId } = route.params;
    const { theme, isDark } = useAppTheme();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [showAddReply, setShowAddReply] = useState(false);
    const [replyLabel, setReplyLabel] = useState("");
    const [replyMessage, setReplyMessage] = useState("");
    const [addingReply, setAddingReply] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetchAssetDetail(assetId);
            setData(res);
            if (res.asset) {
                navigation.setOptions({
                    title: res.asset.name,
                });
            }
        } catch (err) {
            console.error("Asset detail load error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [assetId]);

    useEffect(() => { load(); }, [load]);

    const handleAddAutoReply = async () => {
        if (!replyLabel.trim() || !replyMessage.trim()) {
            Alert.alert("Error", "Label and message are required");
            return;
        }
        setAddingReply(true);
        try {
            await addAutoReply(assetId, replyLabel.trim(), replyMessage.trim());
            setReplyLabel("");
            setReplyMessage("");
            setShowAddReply(false);
            load();
        } catch (err) {
            Alert.alert("Error", "Failed to add auto-reply");
        } finally {
            setAddingReply(false);
        }
    };

    const handleToggleReply = async (replyId: string, isActive: boolean) => {
        try {
            await apiToggleAutoReply(replyId, !isActive);
            load();
        } catch (err) {
            Alert.alert("Error", "Failed to toggle auto-reply");
        }
    };

    const handleDeleteReply = (replyId: string) => {
        Alert.alert("Delete Auto-Reply", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await apiDeleteAutoReply(replyId);
                        load();
                    } catch (err) {
                        Alert.alert("Error", "Failed to delete");
                    }
                },
            },
        ]);
    };

    const s = createStyles(theme, isDark);

    if (loading) {
        return (
            <View style={[s.container, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const asset = data?.asset;
    const autoReplies = data?.autoReplies || [];
    const interactions = data?.interactions || [];

    return (
        <SafeAreaView style={s.container} edges={["left", "right", "bottom"]}>
            <ScrollView
                contentContainerStyle={s.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.primary} />}
            >
                {/* Asset Header */}
                <View style={s.assetHeader}>
                    <View style={s.assetIconBox}>
                        {getTypeIcon(asset?.type, 24, theme.primary)}
                    </View>
                    <View>
                        <Text style={s.assetName}>{asset?.name}</Text>
                        <Text style={s.assetMeta}>
                            {asset?.tags?.length || 0} tag(s) · {interactions.length} interaction(s)
                        </Text>
                    </View>
                </View>

                {/* Auto-Replies */}
                <View style={s.section}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>Auto-Replies</Text>
                        <TouchableOpacity onPress={() => setShowAddReply(!showAddReply)}>
                            <Text style={{ color: theme.primary, fontWeight: "600", fontSize: 14 }}>
                                {showAddReply ? "Cancel" : "+ Add"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showAddReply && (
                        <View style={s.addReplyCard}>
                            <TextInput
                                style={s.input}
                                value={replyLabel}
                                onChangeText={setReplyLabel}
                                placeholder="Label (e.g. Away, Parked)"
                                placeholderTextColor={theme.textMuted}
                            />
                            <TextInput
                                style={[s.input, { height: 70, textAlignVertical: "top" }]}
                                value={replyMessage}
                                onChangeText={setReplyMessage}
                                placeholder="Message shown to scanner..."
                                placeholderTextColor={theme.textMuted}
                                multiline
                                maxLength={200}
                            />
                            <TouchableOpacity
                                style={[s.primaryBtn, addingReply && { opacity: 0.6 }]}
                                onPress={handleAddAutoReply}
                                disabled={addingReply}
                            >
                                {addingReply ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={s.primaryBtnText}>Save Auto-Reply</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {autoReplies.length === 0 && !showAddReply ? (
                        <View style={s.emptyCard}>
                            <Text style={s.emptyText}>
                                No auto-replies set. When you add one, scanners will see it after contacting you.
                            </Text>
                        </View>
                    ) : (
                        autoReplies.map((reply: any) => (
                            <View
                                key={reply.id}
                                style={[
                                    s.replyCard,
                                    reply.isActive && { borderColor: "rgba(99,102,241,0.3)", backgroundColor: isDark ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.05)" },
                                ]}
                            >
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                    <Text style={s.replyLabel}>{reply.label}</Text>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <View style={[s.badge, reply.isActive ? s.badgeActive : s.badgeInactive]}>
                                            <Text style={[s.badgeText, reply.isActive ? s.badgeTextActive : s.badgeTextInactive]}>
                                                {reply.isActive ? "Active" : "Inactive"}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleToggleReply(reply.id, reply.isActive)}>
                                            <Text style={{ color: theme.primary, fontSize: 13 }}>
                                                {reply.isActive ? "Disable" : "Enable"}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteReply(reply.id)}>
                                            <Text style={{ color: theme.error, fontSize: 13 }}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <Text style={s.replyMessage}>"{reply.message}"</Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Contact History */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>Contact History</Text>
                    {interactions.length === 0 ? (
                        <View style={s.emptyCard}>
                            <Search size={40} color={theme.textMuted} style={{ marginBottom: 16, opacity: 0.5 }} />
                            <Text style={s.emptyText}>
                                No interactions yet. Share your tag to start receiving contacts!
                            </Text>
                        </View>
                    ) : (
                        interactions.map((interaction: any) => {
                            const iconBg = getActionColor(interaction.actionType, isDark);
                            return (
                                <View key={interaction.id} style={s.interactionCard}>
                                    <View style={[s.interactionIcon, { backgroundColor: iconBg }]}>
                                        {getNotificationIcon(interaction.actionType, 18, theme.text)}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                            <Text style={s.interactionLabel}>
                                                {actionLabels[interaction.actionType] || interaction.actionType}
                                            </Text>
                                            <Text style={s.interactionTagCode}>via {interaction.tag?.shortCode}</Text>
                                        </View>
                                        {interaction.message && (
                                            <Text style={s.interactionMessage}>"{interaction.message}"</Text>
                                        )}
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                                <Calendar size={12} color={theme.textMuted} />
                                                <Text style={s.interactionTime}>
                                                    {new Date(interaction.timestamp).toLocaleString()}
                                                </Text>
                                            </View>
                                            {interaction.cityGuess && (
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                                    <MapPin size={12} color={theme.textMuted} />
                                                    <Text style={s.interactionTime}>{interaction.cityGuess}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function getActionColor(type: string, isDark: boolean) {
    const colors: Record<string, string> = {
        SCAN_VIEW: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
        CONTACT_SMS: "rgba(99,102,241,0.1)",
        CONTACT_CALL: "rgba(129,140,248,0.1)",
        TOW_ALERT: "rgba(245,158,11,0.1)",
        EMERGENCY: "rgba(239,68,68,0.1)",
        DELIVERY_KNOCK: "rgba(99,102,241,0.1)",
        FOUND_REPORT: "rgba(16,185,129,0.1)",
    };
    return colors[type] || (isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9");
}

const createStyles = (theme: any, isDark: boolean) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        scrollContent: { padding: 16, paddingBottom: 40 },

        assetHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
        assetIconBox: {
            width: 50, height: 50, borderRadius: 14,
            backgroundColor: "rgba(99,102,241,0.1)",
            justifyContent: "center", alignItems: "center",
        },
        assetName: { fontSize: 20, fontWeight: "700", color: theme.text },
        assetMeta: { fontSize: 13, color: theme.textMuted, marginTop: 2 },

        section: { marginBottom: 24 },
        sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
        sectionTitle: { fontSize: 17, fontWeight: "700", color: theme.text, marginBottom: 10 },

        emptyCard: {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 14, borderWidth: 1, borderColor: theme.border,
            padding: 24, alignItems: "center",
        },
        emptyText: { color: theme.textMuted, fontSize: 13, textAlign: "center" },

        addReplyCard: {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 14, borderWidth: 1, borderColor: theme.border,
            padding: 16, marginBottom: 12, gap: 10,
        },
        input: {
            backgroundColor: isDark ? "rgba(15,23,42,0.5)" : "#F1F5F9",
            borderRadius: 10, borderWidth: 1, borderColor: theme.border,
            padding: 12, fontSize: 14, color: theme.text,
        },
        primaryBtn: {
            backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center",
        },
        primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

        replyCard: {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 12, borderWidth: 1, borderColor: theme.border,
            padding: 14, marginBottom: 8,
        },
        replyLabel: { fontSize: 14, fontWeight: "600", color: theme.text },
        replyMessage: { fontSize: 13, color: theme.textMuted, fontStyle: "italic" },

        badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
        badgeActive: { backgroundColor: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.2)" },
        badgeInactive: { backgroundColor: "transparent", borderColor: theme.border },
        badgeText: { fontSize: 11, fontWeight: "600" },
        badgeTextActive: { color: "#10B981" },
        badgeTextInactive: { color: theme.textMuted },

        interactionCard: {
            flexDirection: "row", gap: 12,
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            borderRadius: 14, borderWidth: 1, borderColor: theme.border,
            padding: 14, marginBottom: 8,
        },
        interactionIcon: {
            width: 36, height: 36, borderRadius: 10,
            justifyContent: "center", alignItems: "center",
        },
        interactionLabel: { fontSize: 14, fontWeight: "600", color: theme.text },
        interactionTagCode: { fontSize: 12, color: theme.textMuted },
        interactionMessage: { fontSize: 13, color: theme.textMuted, fontStyle: "italic", marginTop: 2 },
        interactionTime: { fontSize: 11, color: theme.textMuted },
    });
