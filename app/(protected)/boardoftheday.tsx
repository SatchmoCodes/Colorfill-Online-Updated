import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { db } from "@/firebaseConfig";
import {
  loadColorIndex,
  loadColorPaletteOptions,
  loadIsColorPaletteStale,
} from "@/helper/asyncStorageHelper";
import { calculateSquareSize } from "@/helper/calculateSquareSize";
import { getColorPaletteOptions } from "@/helper/getColorPaletteOptions";
import { squareGenerator } from "@/helper/squareGenerator";
import { useUser } from "@/hooks/useFirebaseUser";
import { useFocusEffect } from "@react-navigation/native";
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
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { PaletteObj } from "./settings";

export interface Square {
  color: ColorKey;
  captured: boolean;
  defaultColor: ColorKey;
  landLocked: boolean;
  size: number;
  depth: number;
  x: number;
  y: number;
}

export type ColorKey = 0 | 1 | 2 | 3 | 4;
type BoardOfTheDaySize = "small" | "medium" | "large" | "xlarge";
type LoadingState = "loading" | "loaded" | "complete" | "error";

interface GameBoardProps {
  boardState: Square[][];
  selectedColorPalette: PaletteObj;
  boardSize: BoardOfTheDaySize;
  calculateSquareSize: (x: number) => number;
}

interface SquareViewProps {
  square: Square;
  color: string;
  squareSize: number;
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
  small: 64,
  medium: 100,
  large: 144,
  xlarge: 225,
};

const screenSize = Dimensions.get("window").width;

export default function BoardoftheDay() {
  const user = useUser();
  const [boardSize, setBoardSize] = useState<BoardOfTheDaySize>("small");
  const [boardState, setBoardState] = useState<Square[][]>([]);
  const [activeColor, setActiveColor] = useState(boardState[0]?.[0]?.color);
  const [score, setScore] = useState(0);
  const [showBoardCompleteModal, setShowBoardCompleteModal] = useState(false);
  const [colorPaletteOptions, setColorPaletteOptions] = useState<
    PaletteObj[] | []
  >([]);
  const [selectedColorPalette, setSelectedColorPalette] = useState(
    colorPaletteOptions[0]
  );
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [boardId, setBoardId] = useState("");

  useFocusEffect(
    useCallback(() => {
      const loadPalette = async () => {
        try {
          const savedIndex = (await loadColorIndex()) ?? 0;
          const isColorPaletteStale = await loadIsColorPaletteStale();
          if (colorPaletteOptions.length === 0) {
            if (isColorPaletteStale) {
              const colorOptions = await getColorPaletteOptions(user);
              setSelectedColorPalette(
                colorOptions[savedIndex] ?? colorOptions[0]
              );
              setColorPaletteOptions(colorOptions);
            } else {
              let colorOptions = await loadColorPaletteOptions();
              if (!colorOptions) {
                colorOptions = await getColorPaletteOptions(user);
              }
              setSelectedColorPalette(
                colorOptions[savedIndex] ?? colorOptions[0]
              );
              setColorPaletteOptions(colorOptions);
            }
          } else {
            setSelectedColorPalette(colorPaletteOptions[savedIndex]);
          }
        } catch (error) {
          console.log("error setting initial settings", error);
        }
      };
      loadPalette();
    }, [])
  );

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
    visited: Set<string>,
    depth: number = 0
  ) {
    const key = `${currentSquare.x},${currentSquare.y}`;
    if (visited.has(key)) return;
    visited.add(key);

    const neighbors = getAdjacentSquares(currentSquare, board);
    for (const neighbor of neighbors) {
      if (neighbor && !neighbor.captured && neighbor.color === color) {
        neighbor.captured = true;
        neighbor.color = color;
        neighbor.depth = depth + 1;
        checkAdjacentSquares(neighbor, board, color, visited, depth + 1);
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
          checkAdjacentSquares(
            board[0][0],
            board,
            board[0][0].color,
            new Set()
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
          <ThemedText style={styles.score}>{score}</ThemedText>
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

const GameBoard = ({
  boardState,
  selectedColorPalette,
  boardSize,
}: GameBoardProps) => {
  let windowWidth =
    Platform.OS === "web"
      ? useWindowDimensions().width * 0.33
      : useWindowDimensions().width;
  console.log("boardConfig", boardConfig, boardSize);
  const columns = Math.sqrt(boardConfig[boardSize]);
  console.log("cols", columns);

  const parentHorizontalPadding = 20;
  const maxBoardWidth = Math.min(windowWidth - parentHorizontalPadding, 700);
  const rawTile = Math.floor(maxBoardWidth / columns);
  const tileSize = PixelRatio.roundToNearestPixel(rawTile);

  return (
    <View
      style={[
        styles.squareGrid,
        {
          width: maxBoardWidth,
        },
      ]}
    >
      {boardState.map((row) => {
        return row.map((square: Square) => {
          return (
            <Square
              square={square}
              color={selectedColorPalette[square.color]}
              squareSize={tileSize}
              key={`${square.x}-${square.y}`}
            />
          );
        });
      })}
    </View>
  );
};

const Square = (props: SquareViewProps) => {
  const { square, color, squareSize } = props;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (square.captured && square.depth !== undefined) {
      Animated.sequence([
        Animated.delay(square.depth * 80), // ripple by depth
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 120,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 120,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [square.captured]);

  return (
    <Animated.View
      style={[
        styles.square,
        square.captured && { zIndex: 2 },
        {
          backgroundColor: color,
          width: squareSize,
          height: squareSize,
          transform: [{ scale }],
        },
      ]}
    />
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
    fontSize: 20,
    marginBottom: 10,
  },
  squareGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: screenSize,
  },
  square: {
    // borderColor: "black",
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
