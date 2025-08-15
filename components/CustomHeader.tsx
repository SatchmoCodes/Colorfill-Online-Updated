// components/CustomHeader.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor"; // Assuming you have this
import { IconSymbol } from "./ui/IconSymbol";
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { useNavigation } from "expo-router";
import { Colors } from "@/constants/Colors";

interface CustomHeaderProps {
  title: string;
  onIconPress?: () => void;
  // Add other props you might need, like iconName, iconColor, etc.
}

export default function CustomHeader({
  title,
  onIconPress,
}: CustomHeaderProps) {
  const navigation = useNavigation();
  const theme = useColorScheme() ?? "light";

  return (
    <ThemedView style={styles.headerContainer}>
      {/* Back button */}
      {navigation.canGoBack() && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <IconSymbol name="backward" size={24} color="white" />
        </TouchableOpacity>
      )}

      {/* Title */}
      <ThemedText style={[styles.headerTitle]}>{title}</ThemedText>

      {/* Settings Icon */}
      {onIconPress && (
        <TouchableOpacity style={styles.iconContainer} onPress={onIconPress}>
          <IconSymbol name="gear" size={24} color="white" />
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // spread back, title, settings
    paddingHorizontal: 16,
    height: 70,
    paddingTop: 20,
    backgroundColor: "#161616ff",
  },
  headerTitle: {
    fontSize: 20,
    // fontWeight: "bold",
    flex: 1,
    // textAlign: "center",
    paddingLeft: 10,
  },
  backButton: {
    padding: 8,
  },
  iconContainer: {
    padding: 8,
  },
});
