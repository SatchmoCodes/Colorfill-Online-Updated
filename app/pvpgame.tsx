import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { colorPaletteOptions } from "@/constants/ColorPaletteOptions";
import { auth, db } from "@/firebaseConfig";
import { calculateSquareSize } from "@/helper/calculateSquareSize";
import { PVPSquare } from "@/helper/pvpSquareGenerator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { User } from "firebase/auth";
import {
  doc,
  DocumentReference,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { boardSizePVPConfig, PlayerType, PVPBoardSize } from "./creategame";
import { ColorKey } from "./freeplay";
import { PaletteObj } from "./settings";

interface PVPGameBoard {
  boardState: PVPSquare[][];
  boardSize: PVPBoardSize;
  selectedColorPalette: PaletteObj;
  ownerName: string;
  user: User;
}

interface ColorRowProps {
  selectedColorPalette: PaletteObj;
  activeColor: number;
  handleColorChange: (color: ColorKey) => void;
  turn: PlayerType | null;
  currentUserType: PlayerType;
}

interface FakeColorRowProps {
  selectedColorPalette: PaletteObj;
  activeColor: number;
  turn: PlayerType | null;
  currentUserType: PlayerType;
}

export default function PvpGame() {
  const { gameId } = useLocalSearchParams();

  const [user, setUser] = useState<User | null>();

  const [ownerName, setOwnerName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [ownerSelectedColor, setOwnerSelectedColor] = useState(0);
  const [opponentSelectedColor, setOpponentSelectedColor] = useState(0);
  const [turn, setTurn] = useState<PlayerType | null>(null);
  const [boardState, setBoardState] = useState<PVPSquare[][]>([]);
  const [squareSize, setSquareSize] = useState(0);
  const [boardSize, setBoardSize] = useState<PVPBoardSize>("small");
  const [selectedColorPalette, setSelectedColorPalette] = useState(
    colorPaletteOptions[0]
  );

  const [boardLoaded, setBoardLoaded] = useState(false);
  const [docRef, setDocRef] = useState<DocumentReference | null>(null);
  const userRef = useRef<User | null>(null);

  useFocusEffect(
    useCallback(() => {
      console.log("focusing");
      const loadPalette = async () => {
        try {
          const colorIndexString =
            (await AsyncStorage.getItem("color-index")) ?? 0;
          const colorIndex = Number(colorIndexString);
          if (Number.isInteger(colorIndex)) {
            setSelectedColorPalette(colorPaletteOptions[colorIndex]);
          }
        } catch (error) {
          console.log("error setting initial settings", error);
        }
      };
      loadPalette();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        userRef.current = user;
      }
    });
    return unsubscribe;
  }, [auth]);

  useEffect(() => {
    if (!gameId) return;
    const id = gameId as string;

    const gameRef = doc(db, "games", id);
    getGameData(gameRef);
  }, [gameId]);

  //snapshot useEffect

  useEffect(() => {
    if (!gameId) return;
    const id = gameId as string;
    const unsubscribe = onSnapshot(doc(db, "games", id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();

        const currentUser = userRef.current?.displayName;
        const currentUserType =
          currentUser === data.ownerName ? "owner" : "opponent";

        if (currentUserType === data.turn) {
          // opponent must have just moved
          const updatedBoardData = JSON.parse(data.boardData);
          setBoardState(updatedBoardData);
        }

        setTurn(data.turn);
        setOwnerName(data.ownerName);
        setOpponentName(data.opponentName);
        setOwnerSelectedColor(data.ownerSelectedColor);
        setOpponentSelectedColor(data.opponentSelectedColor);
        setBoardSize(data.size);
      }
    });
    return unsubscribe;
  }, [gameId]);

  const handleColorChange = async (color: ColorKey) => {
    const visited = new Set<string>();
    const currentBoardState = boardState.map((row) =>
      row.map((square) => ({ ...square }))
    );
    currentBoardState.forEach((row) => {
      row.forEach((square) => {
        if (square.captured && square.squareOwner === turn) {
          square.color = color;
          if (!square.landLocked) {
            checkAdjacentSquares(square, currentBoardState, color, visited);
          }
        }
      });
    });
    currentBoardState.forEach((row) => {
      row.forEach((square) => {
        if (square.captured) {
          if (!square.landLocked) {
            const neighbors = getAdjacentSquares(square, currentBoardState);
            const allNeighborsCaptured = neighbors.every(
              (n) => !n || n.captured
            );
            if (allNeighborsCaptured) {
              square.landLocked = true;
            }
          }
        }
      });
    });
    setBoardState(currentBoardState);
    let updatedData = {};
    if (turn === "owner") {
      setOwnerSelectedColor(color);
      updatedData = { ownerSelectedColor: color, turn: "opponent" };
    } else {
      setOpponentSelectedColor(color);
      updatedData = { opponentSelectedColor: color, turn: "owner" };
    }
    if (docRef) {
      try {
        await updateDoc(docRef, {
          boardData: JSON.stringify(currentBoardState),
          ...updatedData,
        });
      } catch (error) {
        console.log("dumb", error);
      }
    }
  };

  function checkAdjacentSquares(
    currentSquare: PVPSquare,
    board: PVPSquare[][],
    color: ColorKey,
    visited: Set<string>
  ) {
    const key = `${currentSquare.x},${currentSquare.y}`;
    if (visited.has(key)) return;
    visited.add(key);
    const squareOwner = user?.displayName === ownerName ? "owner" : "opponent";
    const neighbors = getAdjacentSquares(currentSquare, board);
    for (const neighbor of neighbors) {
      if (neighbor && !neighbor.captured && neighbor.color === color) {
        neighbor.captured = true;
        neighbor.color = color;
        neighbor.squareOwner = squareOwner;
        checkAdjacentSquares(neighbor, board, color, visited);
      }
    }
  }

  function getAdjacentSquares(
    square: PVPSquare,
    board: PVPSquare[][]
  ): (PVPSquare | undefined)[] {
    const x = square.x - 1;
    const y = square.y - 1;
    return [
      board[y]?.[x + 1], // right
      board[y]?.[x - 1], // left
      board[y - 1]?.[x], // down
      board[y + 1]?.[x], // up
    ];
  }

  async function getGameData(gameRef: DocumentReference) {
    const gameData = await getDoc(gameRef);
    if (gameData.exists()) {
      const data = gameData.data();
      const boardData = JSON.parse(data.boardData);
      console.log("boarddata", boardData[0][1]);
      setBoardState(boardData);
      setOwnerName(data.ownerName);
      setOpponentName(data.opponentName);
      setOwnerSelectedColor(boardData[0][0].color);
      setOpponentSelectedColor(
        boardData[boardData.length - 1][boardData.length - 1].color
      );
      setTurn(data.turn);
      setSquareSize(calculateSquareSize(Math.pow(boardData.length, 2)));
      setBoardSize(data.size);
      setDocRef(gameData.ref);
      setBoardLoaded(true);
    }
  }

  if (user) {
    const currentUser = user.displayName;
    const currentUserType = currentUser === ownerName ? "owner" : "opponent";

    return (
      <ThemedView style={styles.container}>
        <>
          <FakeColorRowButtons
            selectedColorPalette={selectedColorPalette}
            activeColor={
              user.displayName === ownerName
                ? opponentSelectedColor
                : ownerSelectedColor
            }
            turn={turn}
            currentUserType={currentUserType}
          />
          <GameBoard
            boardState={boardState}
            boardSize={boardSize}
            selectedColorPalette={selectedColorPalette}
            ownerName={ownerName}
            user={user}
          />
          <ColorRowButtons
            selectedColorPalette={selectedColorPalette}
            activeColor={
              user.displayName === ownerName
                ? ownerSelectedColor
                : opponentSelectedColor
            }
            turn={turn}
            handleColorChange={handleColorChange}
            currentUserType={currentUserType}
          />
        </>
      </ThemedView>
    );
  }

  return <ThemedText>loading...</ThemedText>;
}

const GameBoard = (props: PVPGameBoard) => {
  const { boardState, boardSize, selectedColorPalette, ownerName, user } =
    props;

  const columns = Math.sqrt(boardSizePVPConfig[boardSize]);
  const squareSize = calculateSquareSize(boardSizePVPConfig[boardSize]);
  const containerSize = columns * squareSize;

  if (user.displayName === ownerName) {
    return (
      <View
        style={[
          styles.squareGrid,
          {
            width: containerSize,
          },
        ]}
      >
        {boardState.map((row) => {
          return row.map((square: PVPSquare) => {
            return (
              <TouchableOpacity
                key={`${square.x}-${square.y}`}
                onPress={() => console.log("square", square)}
                style={[
                  styles.square,
                  {
                    backgroundColor: selectedColorPalette[square.color],
                    width: squareSize,
                    height: squareSize,
                  },
                ]}
              />
            );
          });
        })}
      </View>
    );
  }
  return (
    <View
      style={[
        styles.squareGrid,
        { width: containerSize, transform: [{ rotate: "180deg" }] },
      ]}
    >
      {boardState.map((row) =>
        row.map((square) => (
          <View
            key={`${square.x}-${square.y}`}
            style={[
              styles.square,
              {
                backgroundColor: selectedColorPalette[square.color],
                width: squareSize,
                height: squareSize,
                transform: [{ rotate: "180deg" }], // flip squares back upright
              },
            ]}
          />
        ))
      )}
    </View>
  );
};

const ColorRowButtons = (props: ColorRowProps) => {
  const {
    activeColor,
    selectedColorPalette,
    turn,
    currentUserType,
    handleColorChange,
  } = props;

  return (
    <View
      style={[styles.colorRow, { opacity: turn === currentUserType ? 1 : 0.2 }]}
    >
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor:
              activeColor === 0 ? "white" : selectedColorPalette[0],
            opacity: activeColor === 0 ? 0.05 : 1,
          },
        ]}
        onPress={() =>
          activeColor !== 0 && currentUserType === turn && handleColorChange(0)
        }
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor:
              activeColor === 1 ? "white" : selectedColorPalette[1],
            opacity: activeColor === 1 ? 0.05 : 1,
          },
        ]}
        onPress={() =>
          activeColor !== 1 && currentUserType === turn && handleColorChange(1)
        }
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor:
              activeColor === 2 ? "white" : selectedColorPalette[2],
            opacity: activeColor === 2 ? 0.05 : 1,
          },
        ]}
        onPress={() =>
          activeColor !== 2 && currentUserType === turn && handleColorChange(2)
        }
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor:
              activeColor === 3 ? "white" : selectedColorPalette[3],
            opacity: activeColor === 3 ? 0.05 : 1,
          },
        ]}
        onPress={() =>
          activeColor !== 3 && currentUserType === turn && handleColorChange(3)
        }
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor:
              activeColor === 4 ? "white" : selectedColorPalette[4],
            opacity: activeColor === 4 ? 0.05 : 1,
          },
        ]}
        onPress={() =>
          activeColor !== 4 && currentUserType === turn && handleColorChange(4)
        }
      />
    </View>
  );
};

const FakeColorRowButtons = (props: FakeColorRowProps) => {
  const { activeColor, selectedColorPalette, currentUserType, turn } = props;

  return (
    <View
      style={[
        styles.colorRow,
        { marginBottom: 20, opacity: turn === currentUserType ? 0.2 : 1 },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor:
              activeColor === 0 ? "white" : selectedColorPalette[0],
            opacity: activeColor === 0 ? 0.05 : 1,
          },
        ]}
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor:
              activeColor === 1 ? "white" : selectedColorPalette[1],
            opacity: activeColor === 1 ? 0.05 : 1,
          },
        ]}
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor:
              activeColor === 2 ? "white" : selectedColorPalette[2],
            opacity: activeColor === 2 ? 0.05 : 1,
          },
        ]}
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor:
              activeColor === 3 ? "white" : selectedColorPalette[3],
            opacity: activeColor === 3 ? 0.05 : 1,
          },
        ]}
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor:
              activeColor === 4 ? "white" : selectedColorPalette[4],
            opacity: activeColor === 4 ? 0.05 : 1,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    justifyContent: "center",
  },
  squareGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  square: {
    borderColor: "black",
    borderWidth: 1,
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  colorButton: {
    borderRadius: 30,
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "black",
  },
});
