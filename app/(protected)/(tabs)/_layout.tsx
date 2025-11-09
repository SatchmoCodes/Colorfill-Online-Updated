import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { ThemedBackground } from "@/components/ThemedBackground";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemedBackground>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors["dark"].tint,
          sceneStyle: { backgroundColor: "transparent" },
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,

          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              backgroundColor: Colors["dark"].background,
              borderColor: "rgb(39, 39, 41)",
              position: "absolute",
            },
            default: {
              backgroundColor: Colors["dark"].background,
              borderColor: "rgb(39, 39, 41)",
            },
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            animation: "fade",
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: "Leaderboard",
            animation: "fade",
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="chart.bar.xaxis.ascending"
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </ThemedBackground>
  );
}
