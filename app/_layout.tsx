import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { ActivityIndicator, useColorScheme, View } from "react-native";

export default function RootLayout() {
  const { user, loading } = useFirebaseUser();

  const [loaded] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
  });
  const colorScheme = useColorScheme();

  if (!loaded) return null;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider
      value={{
        ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
        colors: {
          ...(colorScheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
          background: "transparent", // 👈 override here
        },
      }}
    >
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
    </ThemeProvider>
  );
}
