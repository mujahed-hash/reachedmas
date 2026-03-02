import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    Alert,
} from "react-native";

interface Vehicle {
    id: string;
    model: string;
    color: string;
    isActive: boolean;
    towPreventionMode: boolean;
    tags: { id: string; shortCode: string; label: string | null; status: string }[];
}

export default function TagDetailScreen({ route }: any) {
    const { vehicle } = route.params as { vehicle: Vehicle };
    const tag = vehicle.tags[0];

    const [tagActive, setTagActive] = useState(tag?.status === "ACTIVE");
    const [towMode, setTowMode] = useState(vehicle.towPreventionMode);

    const handleTagToggle = (value: boolean) => {
        Alert.alert(
            value ? "Enable Tag" : "Disable Tag",
            value
                ? "Scanners will be able to contact you through this tag."
                : "Scanners will see 'Tag Not Found'. You can re-enable anytime.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Confirm", onPress: () => setTagActive(value) },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.vehicleName}>
                    {vehicle.color} {vehicle.model}
                </Text>
            </View>

            {tag && (
                <View style={styles.codeCard}>
                    <Text style={styles.codeLabel}>Tag Code</Text>
                    <Text style={styles.codeValue}>{tag.shortCode}</Text>
                    <Text style={styles.codeUrl}>reachmasked.com/t/{tag.shortCode}</Text>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tag Controls</Text>
                <View style={styles.controlCard}>
                    <View style={styles.controlRow}>
                        <View style={styles.controlInfo}>
                            <Text style={styles.controlLabel}>Tag Active</Text>
                            <Text style={styles.controlHint}>
                                {tagActive ? "Scanners can reach you" : "Tag appears inactive"}
                            </Text>
                        </View>
                        <Switch
                            value={tagActive}
                            onValueChange={handleTagToggle}
                            trackColor={{ false: "#1E293B", true: "rgba(99,102,241,0.4)" }}
                            thumbColor={tagActive ? "#6366F1" : "#64748B"}
                        />
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.controlRow}>
                        <View style={styles.controlInfo}>
                            <Text style={styles.controlLabel}>Tow Prevention</Text>
                            <Text style={styles.controlHint}>
                                {towMode ? "Urgent alerts active" : "Standard notifications"}
                            </Text>
                        </View>
                        <Switch
                            value={towMode}
                            onValueChange={setTowMode}
                            trackColor={{ false: "#1E293B", true: "rgba(245,158,11,0.4)" }}
                            thumbColor={towMode ? "#F59E0B" : "#64748B"}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0B1120", padding: 16 },
    header: { marginBottom: 20 },
    vehicleName: { fontSize: 22, fontWeight: "800", color: "#F8FAFC" },
    codeCard: {
        backgroundColor: "rgba(99,102,241,0.08)",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(99,102,241,0.2)",
        marginBottom: 24,
    },
    codeLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "600", marginBottom: 8 },
    codeValue: { color: "#A5B4FC", fontSize: 32, fontWeight: "800", letterSpacing: 3 },
    codeUrl: { color: "#64748B", fontSize: 13, marginTop: 8 },
    section: { marginBottom: 24 },
    sectionTitle: { color: "#94A3B8", fontSize: 13, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" },
    controlCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
    controlRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    controlInfo: { flex: 1 },
    controlLabel: { color: "#F8FAFC", fontSize: 15, fontWeight: "600" },
    controlHint: { color: "#64748B", fontSize: 12, marginTop: 2 },
    separator: { height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginVertical: 12 },
});
