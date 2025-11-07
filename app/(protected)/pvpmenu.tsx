import Avatar from "@/components/Avatar";
import OnlinePlayerList from "@/components/OnlinePlayerList";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { db } from "@/firebaseConfig";
import { handleJoinGame } from "@/helper/handleJoinGame";
import { useUser } from "@/hooks/useFirebaseUser";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { User } from "firebase/auth";
import {
  collection,
  DocumentReference,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-paper";
import {
  LobbyType,
  PlayerType,
  PVPBoardSize,
  PVPBoardType,
} from "./creategame";

export type GameState = "waiting" | "playing" | "deleting";

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
  ownerProfileBackground: string;
  ownerProfileLetter: string;
  opponentProfileBackground: string;
  opponentProfileLetter: string;
  createdAt: Date;
  updatedAt: Date;
}

const boardTypeMap = {
  random: "Random",
  partmirror: "Partial Mirror",
  mirror: "Mirror",
};

const PvpMenu = () => {
  const user = useUser();
  const [gameList, setGameList] = useState<PVPGame[]>([]);
  const [openJoinGameModal, setOpenJoinGameModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
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
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={{ height: "90%", width: "100%" }}>
        <ThemedText
          style={{ textAlign: "center", marginBottom: 10 }}
          type="title"
        >
          Game List
        </ThemedText>
        <OnlinePlayerList />

        {gameList.map((game) => {
          return (
            <GameCard
              game={game}
              user={user}
              handleJoinGame={handleJoinGame}
              key={game.id}
            />
          );
        })}
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          height: "10%",
        }}
      >
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
        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.8}
          onPress={() => setOpenJoinGameModal(true)}
        >
          <LinearGradient
            colors={["#ff7e5f", "#feb47b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createButtonBackground}
          >
            <ThemedText style={styles.createButtonText}>Join Game</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {openJoinGameModal && (
        <JoinGameModal
          user={user}
          setOpenJoinGameModal={setOpenJoinGameModal}
        />
      )}
    </View>
  );
};

const GameCard = ({
  game,
  user,
  handleJoinGame,
}: {
  game: PVPGame;
  user: User;
  handleJoinGame: (docRef: DocumentReference, user: User) => void;
}) => {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => {
        handleJoinGame(game.docRef, user);
      }}
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
          <View style={{ gap: 5 }}>
            <ThemedText style={styles.status}>
              Game Status: {game.status[0].toUpperCase() + game.status.slice(1)}
            </ThemedText>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <ThemedText style={styles.secondary}>
                Board Type: {boardTypeMap[game.boardType]}
              </ThemedText>
              {game.fog ? (
                <IconSymbol size={20} name="icloud.fill" color={"white"} />
              ) : (
                <IconSymbol size={20} name="icloud.slash" color={"white"} />
              )}
            </View>

            {/* <ThemedText style={styles.secondary}>
              Fog of War: {game.fog ? "On" : "Off"}
            </ThemedText> */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <ThemedText
                style={{
                  opacity: game.size === "small" ? 1 : 0.25,
                  fontWeight: game.size === "small" ? "bold" : 300,
                }}
              >
                S
              </ThemedText>
              <ThemedText
                style={{
                  opacity: game.size === "medium" ? 1 : 0.25,
                  fontWeight: game.size === "medium" ? "bold" : 300,
                }}
              >
                M
              </ThemedText>
              <ThemedText
                style={{
                  opacity: game.size === "large" ? 1 : 0.25,
                  fontWeight: game.size === "large" ? "bold" : 300,
                }}
              >
                L
              </ThemedText>
              <ThemedText
                style={{
                  opacity: game.size === "xlarge" ? 1 : 0.25,
                  fontWeight: game.size === "xlarge" ? "bold" : 300,
                }}
              >
                XL
              </ThemedText>
            </View>
          </View>

          {/* Right side: Players */}
          <View style={styles.playerBox}>
            <ThemedText style={styles.playerHeader}>
              Players ({game.opponentName ? "2/2" : "1/2"})
            </ThemedText>
            <View style={styles.playerRow}>
              <Avatar
                profileBackground={game.ownerProfileBackground}
                profileLetter={game.ownerProfileLetter}
                username={game.ownerName}
                size="medium"
                handleAvatarClick={() => console.log("hi")}
              />
              {game.opponentName && (
                <Avatar
                  profileBackground={game.opponentProfileBackground}
                  profileLetter={game.opponentProfileLetter}
                  username={game.opponentName}
                  size="medium"
                />
              )}
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const JoinGameModal = ({
  user,
  setOpenJoinGameModal,
}: {
  user: User;
  setOpenJoinGameModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [code, setCode] = useState("");

  async function verifyCode() {
    const q = query(
      collection(db, "games"),
      where("code", "==", code.toUpperCase())
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      setOpenJoinGameModal(false);
      handleJoinGame(docRef, user);
    } else {
      alert("Game not found");
    }
  }
  return (
    <Modal
      transparent
      onRequestClose={() => setOpenJoinGameModal(false)}
      animationType="slide"
    >
      <ThemedView style={styles.centeredView}>
        <TouchableOpacity
          style={{ position: "absolute", top: 5, right: 5 }}
          onPress={() => setOpenJoinGameModal(false)}
        >
          <IconSymbol size={28} name="clear.fill" color={"white"} />
        </TouchableOpacity>
        <ThemedText type="subtitle">Enter Code</ThemedText>
        <TextInput
          value={code}
          maxLength={6}
          onChangeText={(text) => setCode(text)}
          autoCapitalize="characters"
          style={styles.input}
        />
        <TouchableOpacity
          onPress={() => code.length === 6 && verifyCode()}
          style={styles.createButton}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#ff7e5f", "#feb47b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.createButtonBackground,
              { opacity: code.length < 6 ? 0.5 : 1 },
            ]}
          >
            <ThemedText style={styles.createButtonText}>Join</ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </ThemedView>
    </Modal>
  );
};

export default PvpMenu;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    width: "100%",
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 10,
    paddingRight: 10,
    position: "relative",
    zIndex: 1,
  },
  card: {
    height: 140,
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
    width: "100%",
    maxWidth: 500,
    margin: "auto",
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
    justifyContent: "center",
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
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  avatarText: {
    fontWeight: "bold",
  },
  createButton: {
    width: "45%",
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
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    // paddingVertical: 10,
    borderRadius: 10,
    marginTop: 5,
    borderWidth: 1,
    width: "50%",
    maxWidth: 600,
    minWidth: 300,
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: 10,
  },
});
