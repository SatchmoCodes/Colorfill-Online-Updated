import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { colorPaletteOptions } from "@/constants/ColorPaletteOptions";
import { auth, db } from "@/firebaseConfig";
import { squareGenerator } from "@/helper/squareGenerator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { User } from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PaletteObj } from "./settings";

export interface Square {
  color: ColorKey;
  captured: boolean;
  defaultColor: ColorKey;
  landLocked: boolean;
  size: number;
  x: number;
  y: number;
}

export type ColorKey = 0 | 1 | 2 | 3 | 4;
type BoardOfTheDaySize = "xSmall" | "Small" | "Medium" | "Large" | "xLarge";
type LoadingState = "loading" | "loaded" | "complete" | "error";

interface GameBoardProps {
  boardState: Square[][];
  selectedColorPalette: PaletteObj;
  boardSize: BoardOfTheDaySize;
  calculateSquareSize: (x: number) => number;
}

interface GameEffectButtonProps {
  resetBoardProcess: () => void;
}

interface ColorRowButtons {
  activeColor: number;
  selectedColorPalette: PaletteObj;
  handleColorChange: (color: ColorKey) => void;
}

interface BoardCompleteProps {
  score: number;
  setShowBoardCompleteModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleScoreSubmission: () => void;
  resetBoardProcess: () => void;
}

const boardConfig = {
  xSmall: 25,
  Small: 64,
  Medium: 100,
  Large: 144,
  xLarge: 225,
};

export default function BoardoftheDay() {
  const [boardSize, setBoardSize] = useState<BoardOfTheDaySize>("Small");
  const [boardState, setBoardState] = useState<Square[][]>([]);
  const [activeColor, setActiveColor] = useState(boardState[0]?.[0]?.color);
  const [score, setScore] = useState(0);
  const [showBoardCompleteModal, setShowBoardCompleteModal] = useState(false);
  const [selectedColorPalette, setSelectedColorPalette] = useState(
    colorPaletteOptions[0]
  );
  const [user, setUser] = useState<User | null>();
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [boardId, setBoardId] = useState("");

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
      }
    });
    return unsubscribe;
  }, [auth]);

  useEffect(() => {
    if (user) {
      getBoardoftheDay();
    }
  }, [user]);

  const handleColorChange = (color: ColorKey) => {
    const visited = new Set<string>();
    let remainingSquares = false;
    const currentBoardState = boardState.map((row) =>
      row.map((square) => ({ ...square }))
    );
    currentBoardState.forEach((row) => {
      row.forEach((square) => {
        if (square.captured) {
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
        } else {
          remainingSquares = true;
        }
      });
    });
    setBoardState(currentBoardState);
    setActiveColor(color);
    const updatedScore = score + 1;
    setScore(updatedScore);
    if (!remainingSquares) {
      setShowBoardCompleteModal(true);
    }
  };

  function checkAdjacentSquares(
    currentSquare: Square,
    board: Square[][],
    color: ColorKey,
    visited: Set<string>
  ) {
    const key = `${currentSquare.x},${currentSquare.y}`;
    if (visited.has(key)) return;
    visited.add(key);

    const neighbors = getAdjacentSquares(currentSquare, board);
    for (const neighbor of neighbors) {
      if (neighbor && !neighbor.captured && neighbor.color === color) {
        neighbor.captured = true;
        neighbor.color = color;
        checkAdjacentSquares(neighbor, board, color, visited);
      }
    }
  }

  function getAdjacentSquares(
    square: Square,
    board: Square[][]
  ): (Square | undefined)[] {
    const x = square.x - 1;
    const y = square.y - 1;
    return [
      board[y]?.[x + 1], // right
      board[y]?.[x - 1], // left
      board[y - 1]?.[x], // down
      board[y + 1]?.[x], // up
    ];
  }

  const resetBoardProcess = () => {
    const resetBoard = boardState.map((row) =>
      row.map((square) => ({
        ...square,
        color: square.defaultColor,
        captured: false,
        landLocked: false,
      }))
    );

    resetBoard[0][0].captured = true;

    // Re-capture starting square
    checkAdjacentSquares(
      resetBoard[0][0],
      resetBoard,
      resetBoard[0][0].color,
      new Set()
    );

    setBoardState(resetBoard);
    setActiveColor(resetBoard[0][0].color);
    setScore(0);
  };

  function calculateSquareSize(squareCount: number) {
    const screenWidth =
      Platform.OS === "web"
        ? Dimensions.get("window").width * 0.32
        : Dimensions.get("window").width - 40;

    const columns = Math.sqrt(squareCount);

    // Optional: add some padding or margin
    const padding = 0;

    console.log("width", screenWidth);
    console.log("square size", Math.floor((screenWidth - padding) / columns));

    return Math.floor((screenWidth - padding) / columns);
  }

  async function handleScoreSubmission() {
    try {
      const boardData = boardState.flatMap((row) =>
        row.map((x) => x.defaultColor)
      );
      await addDoc(collection(db, "scores"), {
        boardId: boardId,
        score: score,
        size: boardSize,
        boardData: boardData,
        createdBy: user?.displayName,
        uid: user?.uid,
        gamemode: "boardoftheday",
        highScore: true,
        createdAt: serverTimestamp(),
      });
      setLoadingState("complete");
    } catch (error) {
      console.log("error submitting score", error);
    }
  }

  async function getBoardoftheDay() {
    try {
      const q = query(
        collection(db, "boards"),
        orderBy("generatedAt", "desc"),
        limit(1)
      );

      const docSnap = await getDocs(q);
      if (!docSnap.empty) {
        const boardId = docSnap.docs[0].id;
        const userHasBOTDScoreQuery = query(
          collection(db, "scores"),
          where("uid", "==", user?.uid),
          where("boardId", "==", boardId)
        );
        const existingScore = await getDocs(userHasBOTDScoreQuery);
        if (!existingScore.empty) {
          setLoadingState("complete");
        } else {
          const boardData = docSnap.docs[0].data().boardData;
          const boardSize = docSnap.docs[0].data().size;

          const board = squareGenerator(
            boardData.length,
            calculateSquareSize(boardData.length),
            boardData
          );
          setBoardState(board);
          setActiveColor(board[0][0].defaultColor);
          setBoardSize(boardSize);
          setBoardId(boardId);
          setLoadingState("loaded");
        }
      }
    } catch (error) {
      console.log("error getting board of the day", error);
      setLoadingState("error");
    }
  }

  return (
    <ThemedView style={styles.container}>
      {loadingState === "loading" && (
        <>
          <ThemedText type="subtitle">Fetching todays board...</ThemedText>
          <ActivityIndicator size={"large"} color={"blue"} />
        </>
      )}
      {loadingState === "loaded" && (
        <>
          <ThemedText style={styles.score}>Moves: {score}</ThemedText>
          <GameBoard
            boardState={boardState}
            selectedColorPalette={selectedColorPalette}
            boardSize={boardSize}
            calculateSquareSize={calculateSquareSize}
          />
          <GameEffectButtons resetBoardProcess={resetBoardProcess} />
          <ColorRowButtons
            activeColor={activeColor}
            selectedColorPalette={selectedColorPalette}
            handleColorChange={handleColorChange}
          />
        </>
      )}
      {loadingState === "complete" && (
        <>
          <ThemedText type="subtitle" style={{ textAlign: "center" }}>
            You completed todays board! Check back tomorrow for the next one!
          </ThemedText>
        </>
      )}
      {loadingState === "error" && (
        <>
          <ThemedText type="subtitle">
            Error retrieving todays board...
          </ThemedText>
        </>
      )}
      {showBoardCompleteModal && (
        <BoardCompleteModal
          score={score}
          setShowBoardCompleteModal={setShowBoardCompleteModal}
          handleScoreSubmission={handleScoreSubmission}
          resetBoardProcess={resetBoardProcess}
        />
      )}
    </ThemedView>
  );
}

const GameBoard = (props: GameBoardProps) => {
  const { boardState, selectedColorPalette, boardSize, calculateSquareSize } =
    props;

  const columns = Math.sqrt(boardConfig[boardSize]);
  const squareSize = calculateSquareSize(boardConfig[boardSize]);
  const containerSize = columns * squareSize;

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
        return row.map((square: Square) => {
          console.log("size hedre", square.size);
          return (
            <View
              key={`${square.x}-${square.y}`}
              style={[
                styles.square,
                {
                  backgroundColor: selectedColorPalette[square.color],
                  width: square.size,
                  height: square.size,
                },
              ]}
            />
          );
        });
      })}
    </View>
  );
};

const GameEffectButtons = (props: GameEffectButtonProps) => {
  const { resetBoardProcess } = props;
  return (
    <View style={styles.colorRow}>
      <TouchableOpacity
        style={[styles.extraButton, { backgroundColor: "rgba(46, 46, 46, 1)" }]}
        onPress={() => resetBoardProcess()}
      >
        <Text style={styles.extraText}>Reset Board</Text>
      </TouchableOpacity>
    </View>
  );
};

const ColorRowButtons = (props: ColorRowButtons) => {
  const { activeColor, selectedColorPalette, handleColorChange } = props;
  return (
    <View style={styles.colorRow}>
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor:
              activeColor === 0 ? "white" : selectedColorPalette[0],
            opacity: activeColor === 0 ? 0.05 : 1,
          },
        ]}
        onPress={() => activeColor !== 0 && handleColorChange(0)}
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
        onPress={() => activeColor !== 1 && handleColorChange(1)}
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
        onPress={() => activeColor !== 2 && handleColorChange(2)}
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
        onPress={() => activeColor !== 3 && handleColorChange(3)}
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
        onPress={() => activeColor !== 4 && handleColorChange(4)}
      />
    </View>
  );
};

const BoardCompleteModal = (props: BoardCompleteProps) => {
  const {
    score,
    setShowBoardCompleteModal,
    handleScoreSubmission,
    resetBoardProcess,
  } = props;
  return (
    <Modal
      transparent
      onRequestClose={() => setShowBoardCompleteModal(false)}
      animationType="slide"
    >
      <ThemedView style={styles.centeredView}>
        <ThemedText
          style={{ textAlign: "center", marginBottom: 10 }}
          type="subtitle"
        >
          You completed the board in {score} turns!
        </ThemedText>
        <ThemedText style={{ textAlign: "center", marginBottom: 10 }}>
          Would you like to submit this score or retry the board?
        </ThemedText>
        <ThemedView style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={[styles.submissionButtons, { backgroundColor: "green" }]}
            onPress={() => {
              handleScoreSubmission();
              setShowBoardCompleteModal(false);
            }}
          >
            <ThemedText style={{ textAlign: "center" }}>Submit</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submissionButtons, { backgroundColor: "red" }]}
            onPress={() => {
              resetBoardProcess();
              setShowBoardCompleteModal(false);
            }}
          >
            <ThemedText style={{ textAlign: "center" }}>Retry</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  score: {
    fontSize: 16,
    marginBottom: 10,
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
  extraButton: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    borderColor: "black",
    borderWidth: 1,
    width: 60,
    height: 60,
  },
  extraText: {
    color: "white",
    textAlign: "center",
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
  submissionButtons: {
    borderRadius: 30,
    padding: 10,
    width: 80,
    backgroundColor: "rgba(63, 63, 63, 1)",
  },
});
