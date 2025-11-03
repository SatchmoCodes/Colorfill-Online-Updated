import { ThemedBackground } from "@/components/ThemedBackground";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const { user, loading } = useFirebaseUser();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemedBackground>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          <Stack.Screen name="(protected)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
      </Stack>
    </ThemedBackground>
  );
}
