import { ThemedText } from "@/components/ThemedText";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

export default function HowtoPlay() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="subtitle">How to Play</ThemedText>
      <ThemedText>
        Welcome to Colorfill Online! The goal of the game is simple: fill the
        board with 1 color in as few turns as possible.
      </ThemedText>
      <ThemedText>
        You will always start at the top left square in the board.
      </ThemedText>
      <ThemedText type="subtitle">Game Modes</ThemedText>
      <View>
        <ThemedText>Free Play</ThemedText>
        <ThemedText>
          Choose between 4 different board sizes, and try to get the lowest
          score possible.
        </ThemedText>
      </View>
      <View>
        <ThemedText>Board of the Day</ThemedText>
        <ThemedText>
          Play on a daily generated board, and try to get the best score of the
          day. You can only submit 1 score for each board each day.
        </ThemedText>
      </View>
      <View>
        <ThemedText>Player vs PLayer</ThemedText>
        <ThemedText>
          Face off against other players on the same board to see who can
          capture half the board first.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 30,
  },
});
