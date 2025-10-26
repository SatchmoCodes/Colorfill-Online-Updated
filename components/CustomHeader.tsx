// components/CustomHeader.tsx
import { router, useNavigation } from "expo-router";
import { DocumentReference } from "firebase/firestore";
import React from "react";
import { StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { IconSymbol } from "./ui/IconSymbol";

interface CustomHeaderProps {
  title: string;
  routeName: string;
  docRef?: DocumentReference | null;
  // Add other props you might need, like iconName, iconColor, etc.
}

export default function CustomHeader({
  title,
  routeName,
  docRef = null,
}: CustomHeaderProps) {
  const navigation = useNavigation();
  const theme = useColorScheme() ?? "light";
  const isGearIconHidden = ["settings", "playerlist"].includes(routeName);
  const isPlayerIconHidden = ["settings", "playerlist"].includes(routeName);

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

      {!isPlayerIconHidden && (
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() =>
            router.push({
              pathname: "/(protected)/playerlist",
              params: { docRef: JSON.stringify(docRef) },
            })
          }
        >
          <IconSymbol name="person" size={24} color="white" />
        </TouchableOpacity>
      )}

      {/* Settings Icon */}
      {!isGearIconHidden && (
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => router.push("/(protected)/settings")}
        >
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
