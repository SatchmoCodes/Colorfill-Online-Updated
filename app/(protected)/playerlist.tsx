import Avatar from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { db } from "@/firebaseConfig";
import { useUser } from "@/hooks/useFirebaseUser";
import { PlayerList, useOnlinePlayerList } from "@/hooks/useOnlinePlayerList";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function Playerlist() {
  const playerList = useOnlinePlayerList();

  // 👇 Track which player's popover is open
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);

  return (
    <ThemedView style={styles.list}>
      <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
        Players Online: {playerList?.length}
      </ThemedText>

      {playerList?.map((player: PlayerList) => (
        <PlayerCard
          key={player.id}
          player={player}
          isOpen={openPlayerId === player.id}
          onToggle={() =>
            setOpenPlayerId(openPlayerId === player.id ? null : player.id)
          }
        />
      ))}
    </ThemedView>
  );
}

const PlayerCard = ({
  player,
  isOpen,
  onToggle,
}: {
  player: PlayerList;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const [pressed, setPressed] = useState(false);
  const user = useUser();

  const handleInvite = async () => {
    await addDoc(collection(db, "invites"), {
      recipientUid: player.id,
      senderName: user.displayName,
    });
  };

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        transform: [{ scale: pressed ? 0.97 : 1 }],
        position: "relative",
        zIndex: isOpen ? 100 : 1,
        ...(Platform.OS === "web" && { minWidth: 350 }),
      }}
      onPress={onToggle}
    >
      {isOpen && (
        <ThemedView style={styles.optionsPopover}>
          <TouchableOpacity
            onPress={() => handleInvite()}
            style={styles.popoverButton}
          >
            <ThemedText style={{ color: "gray" }}>Invite to Game</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.popoverButton}>
            <ThemedText>Add Friend</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.popoverButton}
            onPress={() =>
              router.push({
                pathname: "/(protected)/viewprofile",
                params: { player: JSON.stringify(player) },
              })
            }
          >
            <ThemedText>View Profile</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}
      <LinearGradient
        colors={["#077b9bff", "#080808ff"]}
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
    </Pressable>
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
    zIndex: 1,
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
  optionsPopover: {
    position: "absolute",
    zIndex: 2,
    right: 0,
    top: 80,
    width: 160,
    height: 150,
    borderColor: "black",
    borderWidth: 1,
  },
  popoverButton: {
    flexGrow: 1,
    alignItems: "center",
    width: "100%",
    padding: 10,
    zIndex: 2,
    position: "relative",
  },
});
