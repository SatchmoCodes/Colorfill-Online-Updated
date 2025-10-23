import Avatar from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { ActivityIndicator } from "react-native-paper";

export default function ViewProfile() {
  const { player } = useLocalSearchParams<{ player: string }>();
  console.log("player here", player);
  const profile = JSON.parse(player);

  console.log("profile", profile);

  if (!profile) return <ActivityIndicator />;

  return (
    <ThemedView style={styles.container}>
      <Avatar
        profileBackground={profile.profileBackground}
        profileLetter={profile.profileLetter}
        username={profile.displayName}
        size="large"
      />
      <ThemedText>hi</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
