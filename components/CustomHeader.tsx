// components/CustomHeader.tsx
import { useNavigation } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { IconSymbol } from "./ui/IconSymbol";

interface CustomHeaderProps {
  title: string;
  onIconPress: () => void;
  isGearIconHidden: boolean;
  // Add other props you might need, like iconName, iconColor, etc.
}

export default function CustomHeader({
  title,
  onIconPress,
  isGearIconHidden,
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
      {!isGearIconHidden && (
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
    height: 90,
    paddingTop: 40,
    backgroundColor: "#0e0e0eff",
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
