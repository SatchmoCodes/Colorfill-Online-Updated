import BoardSizeModal from "@/components/BoardSizeModal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import BoardCompleteModal from "@/components/ui/BoardCompleteModal";
import { db } from "@/firebaseConfig";
import {
  loadColorIndex,
  loadColorPaletteOptions,
  loadIsMosaicMode,
  saveColorPaletteOptions,
  saveCriteriaMap,
} from "@/helper/asyncStorageHelper";
import { calculateSquareSize } from "@/helper/calculateSquareSize";
import { getUser } from "@/helper/commonQueries";
import { getColorPaletteOptions } from "@/helper/getColorPaletteOptions";
import { squareGenerator } from "@/helper/squareGenerator";
import { Unlockables, updateCriteriaMap } from "@/helper/updateCriteriaMap";
import { useUser } from "@/hooks/useFirebaseUser";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  PixelRatio,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import uuid from "react-native-uuid";
import { PaletteObj } from "./settings";

export interface Square {
  color: ColorKey;
  captured: boolean;
  defaultColor: ColorKey;
  landLocked: boolean;
  size: number;
  x: number;
  y: number;
  depth: number;
}

export type ColorKey = 0 | 1 | 2 | 3 | 4;
export type BoardSize = "small" | "medium" | "large" | "xlarge";

interface GameBoardProps {
  boardState: Square[][];
  selectedColorPalette: PaletteObj;
  boardSize: BoardSize;
  calculateSquareSize: (x: number) => number;
  boardVersion: number;
  isMosaic: boolean;
}

interface SquareViewProps {
  square: Square;
  color: string;
  // squareSize: number;
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
  small: 64,
  medium: 144,
  large: 256,
  xlarge: 400,
};

export default function Freeplay() {
  const user = useUser();
  const { boardId, boardData: colorData } = useLocalSearchParams();

  const [boardSize, setBoardSize] = useState<BoardSize>("small");
  const [boardState, setBoardState] = useState(() => {
    let boardData = null;
    if (boardId && colorData) {
      const colorDataArr = [...colorData]
        .filter((x) => x !== ",")
        .map((x) => parseInt(x));
      boardData = squareGenerator(
        colorDataArr.length,
        calculateSquareSize(boardConfig[boardSize]),
        colorDataArr
      );
    } else {
      boardData = squareGenerator(
        64,
        calculateSquareSize(boardConfig[boardSize])
      );
    }
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
  const [colorPaletteOptions, setColorPaletteOptions] = useState<
    PaletteObj[] | []
  >([]);
  const [selectedColorPalette, setSelectedColorPalette] =
    useState<PaletteObj | null>(null);
  const [boardVersion, setBoardVersion] = useState(1);
  const [isMosaic, setIsMosaic] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadPalette = async () => {
        try {
          const savedIndex = (await loadColorIndex()) ?? 0;
          let colorOptions = await loadColorPaletteOptions();
          if (!colorOptions) {
            colorOptions = await getColorPaletteOptions({});
          }
          setSelectedColorPalette(colorOptions[savedIndex] ?? colorOptions[0]);
          setColorPaletteOptions(colorOptions);
        } catch (error) {
          console.log("error setting initial settings", error);
        }
      };
      const loadMosaicMode = async () => {
        try {
          const savedMode = (await loadIsMosaicMode()) ?? false;
          setIsMosaic(savedMode);
        } catch (error) {
          console.log("error loading mosaic mode ", error);
        }
      };
      loadPalette();
      loadMosaicMode();
    }, [])
  );

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
      handleBoardComplete(updatedScore);
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
    setBoardVersion((prev) => prev + 1);
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
    setBoardVersion((prev) => prev + 1);
  };

  async function handleBoardComplete(updatedScore: number) {
    console.log("no remaining squares!");
    setShowBoardCompleteModal(true);
    const boardData = boardState.flatMap((row) =>
      row.map((x) => x.defaultColor)
    );
    // const userDoc = await getUser(user.uid)
    const [userDoc] = await Promise.all([
      getUser(user.uid),
      addDoc(collection(db, "scores"), {
        boardId: uuid.v4(),
        score: updatedScore,
        size: boardSize,
        boardData,
        createdBy: user?.displayName,
        uid: user?.uid,
        gamemode: "freeplay",
        highScore: true,
        createdAt: serverTimestamp(),
      }),
    ]);
    await addDoc(collection(db, "scores"), {
      boardId: uuid.v4(),
      score: updatedScore,
      size: boardSize,
      boardData: boardData,
      createdBy: user?.displayName,
      uid: user?.uid,
      gamemode: "freeplay",
      highScore: true,
      createdAt: serverTimestamp(),
    });

    let criteriaMap: Unlockables | null = null;

    switch (boardSize) {
      case "small":
        criteriaMap = await updateCriteriaMap({
          userDoc,
          bestSmallScore: updatedScore,
        });
        break;
      case "medium":
        criteriaMap = await updateCriteriaMap({
          userDoc,
          bestMediumScore: updatedScore,
        });
        break;
      case "large":
        criteriaMap = await updateCriteriaMap({
          userDoc,
          bestLargeScore: updatedScore,
        });
        break;
      case "xlarge":
        criteriaMap = await updateCriteriaMap({
          userDoc,
          bestXLargeScore: updatedScore,
        });
        break;
    }
    if (criteriaMap) {
      await saveCriteriaMap(criteriaMap);
      const updatedColorPaletteOptions = await getColorPaletteOptions(
        criteriaMap
      );
      await saveColorPaletteOptions(updatedColorPaletteOptions);
    }
  }
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.score}>{score}</ThemedText>
      {!selectedColorPalette ? (
        <ActivityIndicator />
      ) : (
        <>
          <GameBoard
            boardState={boardState}
            selectedColorPalette={selectedColorPalette}
            boardSize={boardSize}
            calculateSquareSize={calculateSquareSize}
            boardVersion={boardVersion}
            isMosaic={isMosaic}
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
        </>
      )}

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

const GameBoard = ({
  boardState,
  selectedColorPalette,
  boardSize,
  boardVersion,
  isMosaic,
}: GameBoardProps) => {
  let windowWidth =
    Platform.OS === "web"
      ? useWindowDimensions().width * 0.33
      : useWindowDimensions().width;
  const columns = Math.sqrt(boardConfig[boardSize]);

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
              key={`${square.x}-${square.y}-${boardVersion}`}
              color={selectedColorPalette[square.color]}
              tileSize={tileSize}
              isMosaic={isMosaic}
              square={square}
            />
          );
        });
      })}
    </View>
  );
};

const Square = ({
  square,
  color,
  tileSize,
  isMosaic,
}: {
  square: Square;
  color: string;
  tileSize: number;
  isMosaic: boolean;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (square.captured && square.depth !== undefined) {
      Animated.sequence([
        Animated.delay(square.depth * 80),
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
        {
          width: tileSize, // exact size given by the grid calculation
          height: tileSize,
          backgroundColor: color,
          transform: [{ scale }],
          borderColor: "black",
          borderWidth: isMosaic ? 1 : 0,
        },
        square.captured && { zIndex: 2 },
      ]}
    />
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
    fontSize: 20,
    marginBottom: 10,
  },
  squareGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  square: {
    // borderColor: "black",
    // borderWidth: 1,
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
