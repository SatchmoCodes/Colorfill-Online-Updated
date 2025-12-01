import Avatar from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useUser } from "@/hooks/useFirebaseUser";
import React from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";

export default function HowtoPlay() {
  const user = useUser();
  return (
    <ScrollView
      style={{
        marginBottom: 30,
      }}
      contentContainerStyle={styles.container}
    >
      <ThemedText
        style={{ textAlign: "center", marginBottom: 10 }}
        type="subtitle"
      >
        How to Play
      </ThemedText>
      <ThemedText
        style={{
          textAlign: "center",
          marginBottom: 10,
          maxWidth: 400,
          fontSize: 18,
        }}
      >
        Welcome to Colorfill Online! The goal of the game is simple: fill the
        board with 1 color in as few turns as possible.
      </ThemedText>
      <Image
        source={require("@/assets/images/demo.gif")}
        style={{ marginBottom: 10 }}
      />
      <ThemedText
        style={{
          textAlign: "center",
          marginBottom: 10,
          maxWidth: 400,
          fontSize: 18,
        }}
      >
        You will always start at the top left of the board. Simply press any of
        the 5 colored circles at the bottom to capture squares of that color
        adjacent to previously captured squares.
      </ThemedText>
      <View style={styles.card}>
        <ThemedText
          style={{ marginBottom: 10, textAlign: "center" }}
          type="subtitle"
        >
          Game Modes
        </ThemedText>
        <View style={{ marginBottom: 10 }}>
          <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
            Free Play
          </ThemedText>
          <ThemedText style={{ textAlign: "center" }}>
            Try to get the lowest score possible. Choose between 4 different
            board sizes.
          </ThemedText>
        </View>

        <View style={{ marginBottom: 10 }}>
          <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
            Board of the Day
          </ThemedText>
          <ThemedText style={{ textAlign: "center" }}>
            Play on a daily generated board, and try to get the best score of
            the day. You can only submit 1 score for each board each day.
          </ThemedText>
        </View>
        <View style={{ marginBottom: 10 }}>
          <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
            Player vs Player
          </ThemedText>
          <ThemedText style={{ textAlign: "center" }}>
            Face off against other players on the same board to see who can
            capture half the board first.
          </ThemedText>
        </View>
      </View>

      <View style={styles.card}>
        <ThemedText type="subtitle" style={{ textAlign: "center" }}>
          Leaderboard
        </ThemedText>
        <ThemedText style={{ textAlign: "center" }}>
          View all of the best scores from players all around the world. Free
          Play scores can be clicked on to play that board and try to beat the
          score. Only the highest score for each board will be shown on the
          leaderboard.
        </ThemedText>
      </View>
      <View style={styles.card}>
        <ThemedText type="subtitle" style={{ textAlign: "center" }}>
          Header Buttons
        </ThemedText>
        <View style={{ marginBottom: 10, marginTop: 10 }}>
          <View style={{ alignItems: "center" }}>
            <IconSymbol name="person" size={24} color="white" />
          </View>
          <ThemedText style={{ textAlign: "center" }}>
            Click to view the player list. Online players are shown by default,
            however, you can also show offline players. You can click on a
            players card to view their profile, or invite them to a Player vs
            Player match (if you have created a game).
          </ThemedText>
        </View>
        <View style={{ marginBottom: 10, marginTop: 10 }}>
          <View style={{ alignItems: "center" }}>
            <IconSymbol name="gear" size={24} color="white" />
          </View>
          <ThemedText style={{ textAlign: "center" }}>
            Adjust any settings you wish to configure in the game. You can also
            view all the unlockable items in the game and track your progress
            towards them.{" "}
          </ThemedText>
        </View>
        <View style={{ marginBottom: 10, marginTop: 10 }}>
          <View style={{ alignItems: "center" }}>
            <Avatar
              username={"?"}
              profileBackground={"green"}
              profileLetter={"white"}
              size="small"
            />
          </View>
          <ThemedText style={{ textAlign: "center" }}>
            View your personal stats. You can also adjust your profile color.
          </ThemedText>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 30,
  },
  card: {
    backgroundColor: "#161616ff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    maxWidth: 400,
  },
});
