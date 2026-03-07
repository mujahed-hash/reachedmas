import React from "react";
import { StatusBar, ActivityIndicator, View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthProvider, useAuth } from "./src/auth";
import { usePushNotifications } from "./src/notifications";
import { ThemeProvider, useAppTheme } from "./src/ThemeProvider";

import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import FamilyScreen from "./src/screens/FamilyScreen";
import AssetDetailScreen from "./src/screens/AssetDetailScreen";
import TagSetupScreen from "./src/screens/TagSetupScreen";
import AddAssetModal from "./src/screens/AddAssetModal";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  usePushNotifications();
  const { theme, isDark } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        tabBarIcon: ({ focused }) => {
          const icons: Record<string, string> = {
            Dashboard: "🏠",
            Family: "👨‍👩‍👧",
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: "ReachMasked", tabBarLabel: "Home" }} />
      <Tab.Screen name="Family" component={FamilyScreen} options={{ title: "Family Hub", tabBarLabel: "Family" }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Alerts", tabBarLabel: "Alerts" }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings", tabBarLabel: "Settings" }} />
    </Tab.Navigator>
  );
}

function MainStack() {
  const { theme } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="AssetDetail" component={AssetDetailScreen} options={{ title: "Interaction History" }} />
      <Stack.Screen name="TagSetup" component={TagSetupScreen} options={{ title: "Tag Setup" }} />
      <Stack.Screen
        name="AddAssetModal"
        component={AddAssetModal}
        options={{ presentation: 'modal', title: "Add New Asset" }}
      />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, isDark } = useAppTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      <NavigationContainer>
        {!isAuthenticated ? <AuthStack /> : <MainStack />}
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
