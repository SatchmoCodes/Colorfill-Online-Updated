import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import CustomHeader from "@/components/CustomHeader";
import { router } from "expo-router";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={({ route }) => ({
          header: ({ options, route }) => (
            <CustomHeader
              title={options.title || route.name}
              // Pass a function to handle the icon press
              onIconPress={() => {
                router.push("/settings");
              }}
            />
          ),
        })}
      >
        <Stack.Screen name="login" options={{ title: "Login" }} />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: true, title: "Home" }}
        />
        <Stack.Screen name="freeplay" options={{ title: "Free Play" }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="pvpmenu" options={{ title: "PVP Menu" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
