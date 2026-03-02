import React from "react";
import { StatusBar, ActivityIndicator, View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthProvider, useAuth } from "./src/auth";
import { usePushNotifications } from "./src/notifications";

import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import TagDetailScreen from "./src/screens/TagDetailScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  usePushNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: "#0B1120",
          borderTopColor: "rgba(255,255,255,0.1)",
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#6366F1",
        tabBarInactiveTintColor: "#64748B",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: "#0B1120" },
        headerTintColor: "#F8FAFC",
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        tabBarIcon: ({ focused }) => {
          const icons: Record<string, string> = {
            Dashboard: "🏠",
            Notifications: "🔔",
            Settings: "⚙️",
          };
          return (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
              {icons[route.name] || "📱"}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Dashboard", tabBarLabel: "Home" }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Alerts", tabBarLabel: "Alerts" }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings", tabBarLabel: "Settings" }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0B1120" }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="TagDetail"
            component={TagDetailScreen}
            options={{
              headerShown: true,
              title: "Tag Details",
              headerStyle: { backgroundColor: "#0B1120" },
              headerTintColor: "#F8FAFC",
              headerShadowVisible: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
