import CustomHeader from "@/components/CustomHeader";
import { UserContext, useRequiredUser } from "@/hooks/useFirebaseUser";
import { useNotificationResponse } from "@/hooks/useNotificationResponse";
import { useUserPresence } from "@/hooks/useUserPresence";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: false,
  }),
});

export default function ProtectedLayout() {
  const { user, loading } = useRequiredUser();

  useUserPresence(user);
  useNotificationResponse(user);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📩 Notification received:", notification);
      }
    );

    return () => subscription.remove();
  }, []);

  // This controls how notifications are shown when app is running

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    // Redirect will already fire in useFirebaseUser
    return null;
  }

  return (
    <UserContext.Provider value={user}>
      <Stack
        screenOptions={{
          header: ({ route, options }) => (
            <CustomHeader
              title={options.title ?? route.name}
              routeName={route.name}
            />
          ),
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: true, title: "Home" }}
        />
        <Stack.Screen name="freeplay" options={{ title: "Free Play" }} />
        <Stack.Screen name="pvpmenu" options={{ title: "PVP Menu" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
    </UserContext.Provider>
  );
}
