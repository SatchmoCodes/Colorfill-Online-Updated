import { View, StyleSheet, Pressable, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { ThemedText } from "@/components/ThemedText";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import { DocumentData } from "@google-cloud/firestore";
import {
  collection,
  DocumentReference,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";
import {
  LobbyType,
  PlayerType,
  PVPBoardSize,
  PVPBoardType,
} from "./creategame";
import { User } from "firebase/auth";

type GameState = "waiting" | "playing" | "deleting";

interface PVPGame {
  id: string;
  docRef: DocumentReference;
  boardId: string;
  boardData: string;
  status: GameState;
  size: PVPBoardSize;
  boardType: PVPBoardType;
  lobbyType: LobbyType;
  code: string;
  ownerSelectedColor: number;
  opponentSelectedColor: number;
  ownerScore: number;
  opponentScore: number;
  ownerName: string;
  opponentName: string;
  ownerUid: string;
  opponentUid: string;
  turn: PlayerType;
  fog: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PvpMenu = () => {
  const [gameList, setGameList] = useState<PVPGame[]>([]);
  const [user, setUser] = useState<User | null>();

  useEffect(() => {
    const cutOffTime = new Date();
    cutOffTime.setMinutes(cutOffTime.getMinutes() - 10);

    const q = query(
      collection(db, "games"),
      where("lobbyType", "==", "public"),
      where("status", "==", "waiting"),
      where("createdAt", ">=", cutOffTime),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (querySnapshot) => {
      const games = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, docRef: doc.ref, ...doc.data() } as PVPGame)
      );
      setGameList(games);
    });

    return () => unsub(); // unsubscribe when component unmounts or navigates away
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      }
    });
    return unsubscribe;
  }, [auth]);

  const handleJoinGame = async (docRef: DocumentReference) => {
    await updateDoc(docRef, {
      opponentName: user?.displayName,
      opponentUid: user?.uid,
    });
    const gameId = docRef.id;
    router.push({
      pathname: "/pvplobby",
      params: { gameId },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={{ height: "90%" }}>
        <ThemedText style={{ textAlign: "center" }} type="title">
          Game List
        </ThemedText>
        {gameList.map((game) => {
          return (
            <GameCard
              game={game}
              handleJoinGame={handleJoinGame}
              key={game.id}
            />
          );
        })}
      </ThemedView>
      <ThemedView style={{ alignItems: "center", height: "10%" }}>
        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.8}
          onPress={() => router.push("/creategame")}
        >
          <LinearGradient
            colors={["#ff7e5f", "#feb47b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createButtonBackground}
          >
            <ThemedText style={styles.createButtonText}>Create Game</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
};

const GameCard = ({
  game,
  handleJoinGame,
}: {
  game: PVPGame;
  handleJoinGame: (docRef: DocumentReference) => void;
}) => {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => handleJoinGame(game.docRef)}
      style={{ transform: [{ scale: pressed ? 0.97 : 1 }] }}
    >
      <LinearGradient
        colors={["#0a3d91", "#051937"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.row}>
          {/* Left side: Game Info */}
          <View style={{ justifyContent: "space-between" }}>
            <ThemedText style={styles.status}>
              Game Status: {game.status[0].toUpperCase() + game.status.slice(1)}
            </ThemedText>
            <ThemedText style={styles.secondary}>
              Board Type:{" "}
              {game.boardType[0].toUpperCase() + game.boardType.slice(1)}
            </ThemedText>
          </View>

          {/* Right side: Players */}
          <View style={styles.playerBox}>
            <ThemedText style={styles.playerHeader}>
              Players ({game.opponentName ? "2/2" : "1/2"})
            </ThemedText>
            <View style={styles.playerRow}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>
                  {game.ownerName[0].toUpperCase()}
                </ThemedText>
              </View>
              {game.opponentName && (
                <View style={styles.avatar}>
                  <ThemedText style={styles.avatarText}>
                    {game.opponentName[0].toUpperCase()}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

export default PvpMenu;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: "center",
    width: "100%",
    padding: 10,
  },
  card: {
    height: 120,
    borderRadius: 16,
    padding: 15,
    marginVertical: 10,

    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Android shadow
    elevation: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: "100%",
  },
  status: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#FFD700", // gold highlight for "waiting"
  },
  secondary: {
    fontSize: 14,
    opacity: 0.85,
    color: "#ffffff",
  },
  playerBox: {
    alignItems: "center",
  },
  playerHeader: {
    fontWeight: "600",
    marginBottom: 6,
    color: "#fff",
  },
  playerRow: {
    flexDirection: "row",
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },
  createButton: {
    width: "80%",
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // Android shadow
  },
  createButtonBackground: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});
