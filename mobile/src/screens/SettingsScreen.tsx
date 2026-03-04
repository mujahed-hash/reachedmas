import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth";

export default function SettingsScreen() {
    const { logout } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Sign Out", onPress: logout, style: "destructive" }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.row}>
                            <Text style={styles.rowLabel}>Notification Preferences</Text>
                            <Text style={styles.rowChevron}>›</Text>
                        </TouchableOpacity>
                        <View style={styles.separator} />
                        <TouchableOpacity style={styles.row}>
                            <Text style={styles.rowLabel}>Privacy & Security</Text>
                            <Text style={styles.rowChevron}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>ReachMasked v1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B1120" // Web Deep Navy
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
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
    section: {
        marginBottom: 32
    },
    sectionTitle: {
        color: "#94A3B8",
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginLeft: 4,
    },
    card: {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        overflow: "hidden",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    rowLabel: {
        color: "#F8FAFC",
        fontSize: 16,
        fontWeight: "500",
    },
    rowChevron: {
        color: "#475569",
        fontSize: 22,
        fontWeight: "300",
    },
    separator: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        marginHorizontal: 16,
    },
    logoutButton: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginTop: 8,
        borderWidth: 1,
        borderColor: "rgba(239, 68, 68, 0.2)",
    },
    logoutText: {
        color: "#F87171",
        fontSize: 16,
        fontWeight: "600"
    },
    footer: {
        marginTop: 40,
        alignItems: "center",
    },
    versionText: {
        color: "#475569",
        fontSize: 12,
        fontWeight: "500",
    },
});
