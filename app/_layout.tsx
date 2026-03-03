//@ts-ignore
import { loadSounds } from "@/helper/audio/soundManager";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, useColorScheme, View } from "react-native";
import Toast, { BaseToast, ToastProps } from "react-native-toast-message";

const toastConfig = {
  success: (props: ToastProps) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "green", backgroundColor: "#323333ff" }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: "400",
        color: "white",
      }}
    />
  ),
};

export default function RootLayout() {
  const { user, loading } = useFirebaseUser();

  const [loaded] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
    ...MaterialIcons.font,
  });
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadSounds();
  }, []);

  if (!loaded) return null;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#151718",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#151718" }}>
      <ThemeProvider
        value={{
          ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
          colors: {
            ...(colorScheme === "dark"
              ? DarkTheme.colors
              : DefaultTheme.colors),
            background: "transparent",
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
        <Toast config={toastConfig} />
      </ThemeProvider>
    </View>
  );
}
