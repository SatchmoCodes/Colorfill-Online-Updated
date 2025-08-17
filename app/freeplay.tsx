import BoardSizeModal from "@/components/BoardSizeModal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import BoardCompleteModal from "@/components/ui/BoardCompleteModal";
import { colorPaletteOptions } from "@/constants/ColorPaletteOptions";
import { auth } from "@/firebaseConfig";
import { squareGenerator } from "@/helper/squareGenerator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
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
export type BoardSize = "Small" | "Medium" | "Large";

interface GameBoardProps {
  boardState: Square[][];
  selectedColorPalette: PaletteObj;
  boardSize: BoardSize;
  calculateSquareSize: (x: number) => number;
}

interface GameEffectButtonProps {
  newBoardProcess: (x: BoardSize) => void;
  resetBoardProcess: () => void;
  setShowBoardSizeModal: React.Dispatch<React.SetStateAction<boolean>>;
  boardSize: BoardSize;
}

interface ColorRowButtons {
  activeColor: number;
  selectedColorPalette: PaletteObj;
  handleColorChange: (color: ColorKey) => void;
}

const boardConfig = {
  Small: 64,
  Medium: 100,
  Large: 144,
};

export default function Freeplay() {
  const [boardSize, setBoardSize] = useState<BoardSize>("Small");
  const [boardState, setBoardState] = useState(() => {
    const boardData = squareGenerator(
      64,
      calculateSquareSize(boardConfig[boardSize])
    );
    checkAdjacentSquares(
      boardData[0][0],
      boardData,
      boardData[0][0].color,
      new Set()
    );
    return boardData;
  });
  const [activeColor, setActiveColor] = useState(boardState[0][0].color);
  const [score, setScore] = useState(0);
  const [showBoardSizeModal, setShowBoardSizeModal] = useState(false);
  const [showBoardCompleteModal, setShowBoardCompleteModal] = useState(false);
  const [selectedColorPalette, setSelectedColorPalette] = useState(
    colorPaletteOptions[0]
  );
  const [uid, setUid] = useState<String | null>(null);

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
      // The user object will be null if not logged in or a user object if logged in
      if (user) {
        setUid(user.uid);
        console.log("uid ", user);
      }
    });

    // Clean up the subscription when the component unmounts
    return unsubscribe;
  }, [auth]);

  async function loadInitialSettings() {
    const color = (await AsyncStorage.getItem("color-index")) ?? 0;
    setSelectedColorPalette(colorPaletteOptions[color as number]);
  }

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
    setScore((prev) => prev + 1);
    if (!remainingSquares) {
      console.log("no remaining squares!");
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

  const newBoardProcess = (size: BoardSize) => {
    const squareSize = calculateSquareSize(boardConfig[size]);
    const boardData = squareGenerator(boardConfig[size], squareSize);
    checkAdjacentSquares(
      boardData[0][0],
      boardData,
      boardData[0][0].color,
      new Set()
    );
    setBoardState(boardData);
    setScore(0);
    setActiveColor(boardData[0][0].color);
    setShowBoardSizeModal(false);
  };

  function calculateSquareSize(squareCount: number) {
    const screenWidth =
      Platform.OS === "web"
        ? Dimensions.get("window").width * 0.32
        : Dimensions.get("window").width;

    const columns = Math.sqrt(squareCount);

    // Optional: add some padding or margin
    const padding = 24;

    return Math.floor((screenWidth - padding) / columns);
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.score}>Moves: {score}</ThemedText>
      <GameBoard
        boardState={boardState}
        selectedColorPalette={selectedColorPalette}
        boardSize={boardSize}
        calculateSquareSize={calculateSquareSize}
      />
      <GameEffectButtons
        newBoardProcess={newBoardProcess}
        resetBoardProcess={resetBoardProcess}
        setShowBoardSizeModal={setShowBoardSizeModal}
        boardSize={boardSize}
      />
      <ColorRowButtons
        activeColor={activeColor}
        selectedColorPalette={selectedColorPalette}
        handleColorChange={handleColorChange}
      />
      {showBoardSizeModal && (
        <BoardSizeModal
          boardSize={boardSize}
          setShowBoardSizeModal={setShowBoardSizeModal}
          setBoardSize={setBoardSize}
          newBoardProcess={newBoardProcess}
        />
      )}
      {showBoardCompleteModal && (
        <BoardCompleteModal
          setShowBoardCompleteModal={setShowBoardCompleteModal}
          newBoardProcess={newBoardProcess}
          resetBoardProcess={resetBoardProcess}
          boardSize={boardSize}
          score={score}
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
  console.log("size", squareSize);

  return (
    <View
      style={[
        styles.squareGrid,
        {
          width: containerSize,
          height: containerSize,
        },
      ]}
    >
      {boardState.map((row) => {
        return row.map((square: Square) => {
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
  const {
    newBoardProcess,
    resetBoardProcess,
    setShowBoardSizeModal,
    boardSize,
  } = props;
  return (
    <View style={styles.colorRow}>
      <TouchableOpacity
        style={[styles.extraButton, { backgroundColor: "rgba(46, 46, 46, 1)" }]}
        onPress={() => newBoardProcess(boardSize)}
      >
        <Text style={styles.extraText}>New Board</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.extraButton, { backgroundColor: "rgba(46, 46, 46, 1)" }]}
        onPress={() => resetBoardProcess()}
      >
        <Text style={styles.extraText}>Reset Board</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.extraButton, { backgroundColor: "rgba(46, 46, 46, 1)" }]}
        onPress={() => setShowBoardSizeModal(true)}
      >
        <Text style={styles.extraText}>Board Size</Text>
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
});
