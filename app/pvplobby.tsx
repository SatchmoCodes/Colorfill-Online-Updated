import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { auth, db } from "@/firebaseConfig";
import { router, useLocalSearchParams } from "expo-router";
import { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

export default function PvpLobby() {
  const { gameId } = useLocalSearchParams();

  const [user, setUser] = useState<User | null>();
  const [ownerName, setOwnerName] = useState("");
  const [opponentName, setOpponentName] = useState("");

  useEffect(() => {
    if (!gameId) return;
    const id = gameId as string;

    const gameRef = doc(db, "games", id);
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // console.log("Game data:", docSnap.data());
        setOwnerName(data.ownerName);
        setOpponentName(data.opponentName);
      } else {
        console.log("No such game!");
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      }
    });

    // Clean up the subscription when the component unmounts
    return unsubscribe;
  }, [auth]);

  async function handleGameStart() {
    router.push({
      pathname: "/pvpgame",
      params: { gameId },
    });
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText>pvplobby</ThemedText>
      <ThemedView style={{ flexDirection: "row", gap: 20 }}>
        <ThemedText>{ownerName}</ThemedText>
        <ThemedText>Vs</ThemedText>
        <ThemedText>{opponentName}</ThemedText>
      </ThemedView>
      <ThemedView>
        <TouchableOpacity onPress={() => handleGameStart()}>
          <ThemedText>Start Game</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
});
