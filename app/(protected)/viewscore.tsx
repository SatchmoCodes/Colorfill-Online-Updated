import { ThemedText } from "@/components/ThemedText";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function ViewScore() {
  const { boardId, boardData } = useLocalSearchParams();

  if (!boardId) {
    return (
      <View>
        <ThemedText>No board found...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/freeplay",
            params: { boardId, boardData },
          })
        }
      >
        <ThemedText>Play board</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
