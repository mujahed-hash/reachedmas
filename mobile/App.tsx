import React, { useState } from "react";
import { StatusBar, ActivityIndicator, View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AuthProvider, useAuth } from "./src/auth";
import { LayoutDashboard, Users, Bell, Settings as SettingsIcon } from "lucide-react-native";
import { usePushNotifications } from "./src/notifications";
import { useNotificationRealtime } from "./src/useNotificationRealtime";
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
  const [unreadCount, setUnreadCount] = useState(0);

  useNotificationRealtime(() => {
    setUnreadCount((prev) => prev + 1);
  });

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
        tabBarIcon: ({ focused, color, size }) => {
          const isNotifications = route.name === "Notifications";
          let IconComponent;

          switch (route.name) {
            case "Dashboard": IconComponent = LayoutDashboard; break;
            case "Family": IconComponent = Users; break;
            case "Notifications": IconComponent = Bell; break;
            case "Settings": IconComponent = SettingsIcon; break;
            default: IconComponent = LayoutDashboard;
          }

          return (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <IconComponent 
                size={22} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
              />
              {isNotifications && unreadCount > 0 && (
                <View style={{
                  position: "absolute",
                  top: -5,
                  right: -8,
                  backgroundColor: "#EF4444",
                  borderRadius: 10,
                  minWidth: 16,
                  height: 16,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 2,
                  borderWidth: 1.5,
                  borderColor: theme.background,
                }}>
                  <Text style={{ color: "#fff", fontSize: 9, fontWeight: "900" }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: "ReachMasked", tabBarLabel: "Home" }} />
      <Tab.Screen name="Family" component={FamilyScreen} options={{ title: "Family Hub", tabBarLabel: "Family" }} />
      <Tab.Screen
        name="Notifications"
        options={{ title: "Alerts", tabBarLabel: "Alerts" }}
      >
        {(props) => (
          <NotificationsScreen
            {...props}
            onRead={() => setUnreadCount(0)}
          />
        )}
      </Tab.Screen>
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
