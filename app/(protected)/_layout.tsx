import CustomHeader from "@/components/CustomHeader";
import { ThemedBackground } from "@/components/ThemedBackground";
import { UserContext, useRequiredUser } from "@/hooks/useFirebaseUser";
import { useNotificationResponse } from "@/hooks/useNotificationResponse";
import { useUserPresence } from "@/hooks/useUserPresence";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { ActivityIndicator, Platform, View } from "react-native";

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
      <ThemedBackground>
        <Stack
          screenOptions={{
            header: ({ route, options }) => (
              <CustomHeader
                title={options.title ?? route.name}
                routeName={route.name}
              />
            ),
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: true, title: "Home" }}
          />
          <Stack.Screen
            name="freeplay"
            options={{
              title: "Free Play",
              animation: Platform.OS === "ios" ? "slide_from_right" : "fade",
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
          <Stack.Screen
            name="pvpmenu"
            options={{
              title: "PVP Menu",
              animation: Platform.OS === "ios" ? "slide_from_right" : "fade",
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: "Settings",
              animation: Platform.OS === "ios" ? "default" : "fade",
            }}
          />
          <Stack.Screen
            name="viewprofile"
            options={{
              title: "View Profile",
              animation: Platform.OS === "ios" ? "default" : "fade",
            }}
          />
          <Stack.Screen
            name="playerlist"
            options={{
              title: "Player List",
              animation: Platform.OS === "ios" ? "default" : "fade",
            }}
          />
          <Stack.Screen
            name="viewscore"
            options={{
              title: "View Score",
              animation: Platform.OS === "ios" ? "slide_from_right" : "fade",
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
          <Stack.Screen
            name="creategame"
            options={{
              title: "PVP Create Game",
              animation: Platform.OS === "ios" ? "slide_from_right" : "fade",
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
          <Stack.Screen
            name="pvpgame"
            options={{
              title: "PVP Game",
              animation: Platform.OS === "ios" ? "slide_from_right" : "fade",
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
          <Stack.Screen
            name="boardoftheday"
            options={{
              title: "Board of the Day",
              animation: Platform.OS === "ios" ? "slide_from_right" : "fade",
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
        </Stack>
      </ThemedBackground>
    </UserContext.Provider>
  );
}
