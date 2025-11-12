import { ThemedBackground } from "@/components/ThemedBackground";
import ThemedDropDown from "@/components/ThemedDropDown";
import { ThemedText } from "@/components/ThemedText";
import CommonButton from "@/components/ui/CommonButton";
import { letters, numbers } from "@/constants/LettersAndNumbers";
import { db } from "@/firebaseConfig";
import {
  loadProfileBackgroundColor,
  loadProfileLetterColor,
} from "@/helper/asyncStorageHelper";
import { pvpSquareGenerator } from "@/helper/pvpSquareGenerator";
import { useUser } from "@/hooks/useFirebaseUser";
import { router } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { RadioButtonProps, RadioGroup } from "react-native-radio-buttons-group";
import uuid from "react-native-uuid";

export const boardSizePVPConfig = {
  small: 81,
  medium: 121,
  large: 169,
  xlarge: 225,
};

const boardSizeOptions = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
  { label: "Extra Large", value: "xlarge" },
];

const boardTypeOptions = [
  { label: "Random", value: "random" },
  { label: "Mirrored", value: "mirror" },
  { label: "Partial Mirror", value: "partmirror" },
];

export type LobbyType = "public" | "private";
export type PVPBoardSize = "small" | "medium" | "large" | "xlarge";
export type PVPBoardType = "random" | "mirror" | "partmirror";
export type PlayerType = "owner" | "opponent";

export default function CreateGame() {
  const user = useUser();
  const fogRadioButtons: RadioButtonProps[] = useMemo(
    () => [
      {
        id: "1", // acts as primary key, should be unique and non-empty string
        label: "On",
        value: "on",
        color: "#2c78ceff",
      },
      {
        id: "2",
        label: "Off",
        value: "off",
        color: "#2c78ceff",
      },
    ],
    []
  );

  const lobbyTypeRadioButtons: RadioButtonProps[] = useMemo(
    () => [
      {
        id: "1", // acts as primary key, should be unique and non-empty string
        label: "Public",
        value: "public",
        color: "#2c78ceff",
      },
      {
        id: "2",
        label: "Private",
        value: "private",
        color: "#2c78ceff",
      },
    ],
    []
  );
  const [selectedFogId, setSelectedFogId] = useState<string | undefined>("2");
  const [selectedLobbyTypeId, setSelectedLobbyTypeId] = useState<
    string | undefined
  >("1");

  const [boardSize, setBoardSize] = useState<PVPBoardSize>("small");
  const [boardType, setBoardType] = useState<PVPBoardType>("random");
  const [fogOfWar, setFogOfWar] = useState(false);
  const [lobbyType, setLobbyType] = useState<LobbyType>("public");

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
        opponentName: null,
        opponentUid: null,
        turn: turnNumber === 0 ? "owner" : "opponent",
        fog: fogOfWar,
        winner: null,
        loser: null,
        ownerProfileBackground:
          (await loadProfileBackgroundColor()) ?? "313131ff",
        ownerProfileLetter: (await loadProfileLetterColor()) ?? "#ffffff",
        opponentProfileBackground: "",
        opponentProfileLetter: "",
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

  const handlePressFogButton = (e: string) => {
    console.log("e", e);
    const matchingItem = fogRadioButtons.find((x) => x.id === e);
    if (matchingItem?.value === "on") {
      setFogOfWar(true);
    }
    if (matchingItem?.value === "off") {
      setFogOfWar(false);
    }
    setSelectedFogId(e);
  };

  const handlePressLobbyButton = (e: string) => {
    const matchingItem = lobbyTypeRadioButtons.find((x) => x.id === e);
    if (matchingItem?.value === "public") setLobbyType("public");
    if (matchingItem?.value === "private") setLobbyType("private");
    setSelectedLobbyTypeId(e);
  };

  return (
    <ThemedBackground style={styles.container}>
      <View style={{ height: "90%", gap: 20 }}>
        <ThemedText
          style={{ textAlign: "center", marginBottom: 20 }}
          type="title"
        >
          Game Options
        </ThemedText>
        <View style={styles.optionCard}>
          <ThemedText style={styles.optionTitle}>Board Size</ThemedText>
          <ThemedDropDown
            options={boardSizeOptions}
            value={boardSize}
            onSetValue={setBoardSize}
            placeholder="Board Size"
          />
        </View>
        <View style={styles.optionCard}>
          <ThemedText style={styles.optionTitle}>Board Type</ThemedText>
          <ThemedDropDown
            options={boardTypeOptions}
            value={boardType}
            onSetValue={setBoardType}
            placeholder="Board Type"
          />
        </View>
        <View style={styles.optionCard}>
          <ThemedText style={styles.optionTitle}>Fog of War</ThemedText>
          <RadioGroup
            radioButtons={fogRadioButtons}
            onPress={handlePressFogButton}
            selectedId={selectedFogId}
            labelStyle={{ color: "white", fontSize: 16 }}
            layout="row"
          />
        </View>
        <View style={styles.optionCard}>
          <ThemedText style={styles.optionTitle}>Lobby Type</ThemedText>
          <RadioGroup
            radioButtons={lobbyTypeRadioButtons}
            onPress={handlePressLobbyButton}
            selectedId={selectedLobbyTypeId}
            labelStyle={{ color: "white", fontSize: 16 }}
            layout="row"
          />
        </View>
      </View>
      <View style={{ height: "10%" }}>
        <CommonButton
          title="Create Game"
          size={300}
          handlePress={() => handleCreateGame()}
        />
      </View>
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  optionCard: {
    borderRadius: 16,
    padding: 16,
    width: "90%",
    alignSelf: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    backgroundColor: "#141414ff",
    minWidth: 250,
    alignItems: "center",
    borderColor: "#2c78ceff",
    borderWidth: 1,
  },
  optionTitle: {
    textAlign: "center",
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "600",
  },
  dropdown: {
    width: 200,
    backgroundColor: "#222222",
    padding: 10,
    borderRadius: 5,
  },
  radioButton: {
    backgroundColor: "#222222",
  },
  dropdownItemContainerStyle: {
    backgroundColor: "#222222",
  },
  dropdownContainerStyle: {
    borderColor: "black",
  },
  dropdownItemTextStyle: {
    color: "gray",
  },
});
