import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

export default function ViewScore() {
  const { boardId, boardData, bestScore } = useLocalSearchParams();

  if (!boardId) {
    return (
      <ThemedView>
        <ThemedText>No board found...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/freeplay",
            params: { boardId, boardData, bestScore },
          })
        }
      >
        <ThemedText>Play board</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
