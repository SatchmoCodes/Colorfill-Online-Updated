import CustomHeader from "@/components/CustomHeader";
import { UserContext, useRequiredUser } from "@/hooks/useFirebaseUser";
import { Stack, router } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function ProtectedLayout() {
  const { user, loading } = useRequiredUser();

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
              onIconPress={() => router.push("/settings")}
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
