import { PlayerList, useOnlinePlayerList } from "@/hooks/useOnlinePlayerList";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Modal, StyleSheet, TouchableOpacity } from "react-native";
import Avatar from "./Avatar";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export default function OnlinePlayerList() {
  const playerList = useOnlinePlayerList();

  console.log("playerCount", playerList);
  const [isPlayerListOpen, setIsPlayerListOpen] = useState(false);
  return (
    <ThemedView
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
        Players Online: {playerList?.length}
      </ThemedText>
      <TouchableOpacity onPress={() => setIsPlayerListOpen(!isPlayerListOpen)}>
        <ThemedText>View</ThemedText>
      </TouchableOpacity>
      {isPlayerListOpen && (
        <Modal
          backdropColor={"rgb(135,123,341)"}
          visible={isPlayerListOpen}
          onRequestClose={() => setIsPlayerListOpen(false)}
        >
          <ThemedView style={styles.list}>
            <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
              Players Online: {playerList?.length}
            </ThemedText>
            {playerList?.map((player) => {
              return <PlayerCard key={player.id} player={player} />;
            })}
          </ThemedView>
        </Modal>
      )}
    </ThemedView>
  );
}

const PlayerCard = ({ player }: { player: PlayerList }) => {
  return (
    <LinearGradient
      colors={["#e0d9d9ff", "#000000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Avatar
        profileBackground={player.profileBackground}
        profileLetter={player.profileLetter}
        username={player.displayName}
        size={"medium"}
      />
      <ThemedText type="subtitle">{player.displayName}</ThemedText>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 50,
    padding: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 30,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 20,
  },
  centeredView: {
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
    borderRadius: 20,
    padding: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
