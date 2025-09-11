import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { letters, numbers } from "@/constants/LettersAndNumbers";
import { auth, db } from "@/firebaseConfig";
import { pvpSquareGenerator } from "@/helper/pvpSquareGenerator";
import { router } from "expo-router";
import { User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { RadioButton } from "react-native-paper";
import uuid from "react-native-uuid";

export const boardSizePVPConfig = {
  small: 81,
  medium: 121,
  large: 169,
};

const boardSizeOptions = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

const boardTypeOptions = [
  { label: "Random", value: "random" },
  { label: "Mirrored", value: "mirror" },
  { label: "Partial Mirror", value: "partmirror" },
];

export type LobbyType = "public" | "private";
export type PVPBoardSize = "small" | "medium" | "large";
export type PVPBoardType = "random" | "mirror" | "partmirror";
export type PlayerType = "owner" | "opponent";

export default function CreateGame() {
  const [boardSize, setBoardSize] = useState<PVPBoardSize>("small");
  const [boardType, setBoardType] = useState<PVPBoardType>("random");
  const [fogOfWar, setFogOfWar] = useState(false);
  const [lobbyType, setLobbyType] = useState<LobbyType>("public");
  const [user, setUser] = useState<User | null>();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      }
    });
    return unsubscribe;
  }, [auth]);

  const handleCreateGame = async () => {
    const numberOfSquares = boardSizePVPConfig[boardSize];
    const boardData = pvpSquareGenerator(numberOfSquares, boardType, fogOfWar);

    const randomLetterIndexArr = [];
    const randomNumberIndexArr = [];

    for (let x = 0; x < 3; x++) {
      const randomLetterIndex = Math.floor(Math.random() * 26);
      const randomNumberIndex = Math.floor(Math.random() * 10);
      randomLetterIndexArr.push(randomLetterIndex);
      randomNumberIndexArr.push(randomNumberIndex);
    }

    const code = [...randomLetterIndexArr, ...randomNumberIndexArr]
      .map((item, i) => {
        if (i < 3) return letters[item];
        return numbers[item];
      })
      .join("");

    const turnNumber = Math.floor(Math.random() * 2);
    try {
      const game = await addDoc(collection(db, "games"), {
        boardId: uuid.v4(),
        boardData: JSON.stringify(boardData),
        status: "waiting",
        size: boardSize,
        boardType,
        lobbyType,
        code,
        ownerSelectedColor: boardData[0][0].color,
        opponentSelectedColor:
          boardData[boardData.length - 1][boardData.length - 1].color,
        ownerScore: 1,
        opponentScore: 1,
        ownerName: user?.displayName,
        ownerUid: user?.uid,
        opponentName: "",
        opponentUid: "",
        turn: turnNumber === 0 ? "owner" : "opponent",
        fog: fogOfWar,
        winner: null,
        loser: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const gameId = game.id;
      router.replace({
        pathname: "/pvplobby",
        params: { gameId },
      });
    } catch (error) {
      console.log("error creating game ", error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText
        style={{ textAlign: "center", marginBottom: 20 }}
        type="title"
      >
        Create Game
      </ThemedText>
      <ThemedView>
        <ThemedText style={{ textAlign: "center" }} type="subtitle">
          Board Size
        </ThemedText>
        <Dropdown
          data={boardSizeOptions}
          labelField="label"
          valueField="value"
          placeholderStyle={{ color: "white" }}
          selectedTextStyle={{ color: "white" }}
          value={boardSize}
          onChange={(item) => setBoardSize(item.value)}
          style={{ width: 200, marginTop: 10, marginBottom: 20 }}
        />
        <ThemedText style={{ textAlign: "center" }} type="subtitle">
          Board Type
        </ThemedText>
        <Dropdown
          data={boardTypeOptions}
          labelField="label"
          valueField="value"
          placeholderStyle={{ color: "white" }}
          selectedTextStyle={{ color: "white" }}
          value={boardType}
          onChange={(item) => setBoardType(item.value)}
          style={{ width: 200, marginTop: 10, marginBottom: 20 }}
        />
        <ThemedText style={{ textAlign: "center" }} type="subtitle">
          Fog of War
        </ThemedText>
        <RadioButton.Group
          onValueChange={(value) => {
            if (value === "on") setFogOfWar(true);
            if (value === "off") setFogOfWar(false);
          }}
          value={fogOfWar ? "on" : "off"}
        >
          <ThemedView
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <RadioButton value="on"></RadioButton>
            <ThemedText style={{ marginTop: 5 }}>On</ThemedText>
            <RadioButton value="off"></RadioButton>
            <ThemedText style={{ marginTop: 5 }}>Off</ThemedText>
          </ThemedView>
        </RadioButton.Group>
        <ThemedText style={{ textAlign: "center" }} type="subtitle">
          Lobby Type
        </ThemedText>
        <RadioButton.Group
          onValueChange={(value) => setLobbyType(value as LobbyType)}
          value={lobbyType}
        >
          <ThemedView
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <RadioButton value="public"></RadioButton>
            <ThemedText style={{ marginTop: 5 }}>Public</ThemedText>
            <RadioButton value="private"></RadioButton>
            <ThemedText style={{ marginTop: 5 }}>Private</ThemedText>
          </ThemedView>
        </RadioButton.Group>
      </ThemedView>
      <TouchableOpacity onPress={() => handleCreateGame()}>
        <ThemedText>Create Game</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
});
