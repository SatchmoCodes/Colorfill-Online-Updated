import BoardSizeModal from "@/components/BoardSizeModal";
import ColorPaletteUnlockModal from "@/components/ColorPaletteUnlockModal";
import SquareCounter, { resetSquareCount } from "@/components/SquareCounter";
import { ThemedBackground } from "@/components/ThemedBackground";
import { ThemedText } from "@/components/ThemedText";
import BoardCompleteModal from "@/components/ui/BoardCompleteModal";
import ColorButton from "@/components/ui/ColorButton";
import { db } from "@/firebaseConfig";
import {
  loadColorIndex,
  loadColorPaletteOptions,
  loadCriteriaMap,
  loadIsMosaicMode,
  loadShowSquareCounter,
  saveColorPaletteOptions,
  saveOfflineScores,
} from "@/helper/asyncStorageHelper";
import { getUser } from "@/helper/commonQueries";
import { getColorPaletteOptions } from "@/helper/getColorPaletteOptions";
import { getWindowWidth } from "@/helper/getWindowWidth";
import { squareGenerator } from "@/helper/squareGenerator";
import { updateCriteriaMap } from "@/helper/updateCriteriaMap";
import { useUser } from "@/hooks/useFirebaseUser";
import { useFocusEffect } from "@react-navigation/native";
import * as Network from "expo-network";
import { useLocalSearchParams } from "expo-router";
import {
  addDoc,
  collection,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  PixelRatio,
  StyleSheet,
  View,
} from "react-native";
import uuid from "react-native-uuid";
import { Gamemode } from "./(tabs)/leaderboard";
import { PaletteObj } from "./settings";

export interface Square {
  color: ColorKey;
  captured: boolean;
  defaultColor: ColorKey;
  landLocked: boolean;
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

const scoreFieldMap = {
  small: "bestSmallScore",
  medium: "bestMediumScore",
  large: "bestLargeScore",
  xlarge: "bestXLargeScore",
} as const;

const squaresRemainingMap: Record<ColorKey, number> = {
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
};

export default function Freeplay() {
  const user = useUser();
  const { boardId, boardData: colorData, bestScore } = useLocalSearchParams();
  const networkState = Network.useNetworkState();

  const [boardSize, setBoardSize] = useState<BoardSize>(() => {
    if (boardId && colorData) {
      const size = Object.keys(boardConfig).find((key) => {
        const colorDataLength = [...colorData].filter((x) => x !== ",").length;
        return boardConfig[key as BoardSize] === colorDataLength; // must return boolean
      }) as BoardSize | undefined;
      return size ?? "small";
    }
    return "small";
  });
  const [squaresRemaining, setSquaresRemaining] = useState(squaresRemainingMap);
  const [boardState, setBoardState] = useState(() => {
    let boardData = null;
    if (boardId && colorData) {
      const colorDataArr = [...colorData]
        .filter((x) => x !== ",")
        .map((x) => parseInt(x));
      boardData = squareGenerator(colorDataArr.length, colorDataArr);
    } else {
      boardData = squareGenerator(64);
    }
    const initialNumberCaptured = checkAdjacentSquares(
      boardData[0][0],
      boardData,
      boardData[0][0].color,
      new Set()
    );
    resetSquareCount(boardData, initialNumberCaptured, setSquaresRemaining);
    return boardData;
  });
  const [activeColor, setActiveColor] = useState(boardState[0][0].color);
  const [score, setScore] = useState(0);
  const [showBoardSizeModal, setShowBoardSizeModal] = useState(false);
  const [showBoardCompleteModal, setShowBoardCompleteModal] = useState(false);
  const [selectedColorPalette, setSelectedColorPalette] =
    useState<PaletteObj | null>(null);
  const [unlockedColorPalettes, setUnlockedColorPalettes] = useState<
    PaletteObj[] | []
  >([]);
  const [boardVersion, setBoardVersion] = useState(1);
  const [isMosaic, setIsMosaic] = useState(false);
  const [showSquareCounter, setShowSquareCounter] = useState(true);
  const [hasGeneratedNewBoard, setHasGeneratedNewBoard] = useState(false);
  const [currentBestScore, setCurrentBestScore] = useState(
    parseInt(!Array.isArray(bestScore) ? bestScore : "0")
  );
  const [loadingSetScore, setLoadingSetScore] = useState(false);
  const [hasCreatedScore, setHasCreatedScore] = useState(false); //state variable for board loaded from leaderboard in case user resets board before actually solving
  const [boardComplete, setBoardComplete] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadInitialSettings = async () => {
        try {
          const savedIndex = (await loadColorIndex()) ?? 0;
          let colorOptions = await loadColorPaletteOptions();
          if (!colorOptions) {
            colorOptions = await getColorPaletteOptions({});
          }
          const savedMosaicMode = (await loadIsMosaicMode()) ?? false;
          const savedShowSquareCounter =
            (await loadShowSquareCounter()) ?? true;
          setIsMosaic(savedMosaicMode);
          setShowSquareCounter(savedShowSquareCounter);
          setSelectedColorPalette(colorOptions[savedIndex] ?? colorOptions[0]);
        } catch (error) {
          console.log("error setting initial settings", error);
        }
      };
      loadInitialSettings();
    }, [])
  );

  const handleColorChange = (color: ColorKey) => {
    const visited = new Set<string>();
    let remainingSquares = false;
    let capturedCount = 0;
    const currentBoardState = boardState.map((row) =>
      row.map((square) => ({ ...square }))
    );
    currentBoardState.forEach((row) => {
      row.forEach((square) => {
        if (square.captured) {
          square.color = color;
          if (!square.landLocked) {
            capturedCount += checkAdjacentSquares(
              square,
              currentBoardState,
              color,
              visited
            );
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
    setSquaresRemaining((prev) => {
      return Object.fromEntries(
        Object.entries(prev).map(([key, value]) => {
          const colorKey = key as unknown as ColorKey;
          if (key == (color as unknown as string)) {
            return [colorKey, value - capturedCount];
          }
          return [colorKey, value];
        })
      ) as Record<ColorKey, number>;
    });
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
    if (visited.has(key)) return 0;
    visited.add(key);

    let capturedCount = 0;
    const neighbors = getAdjacentSquares(currentSquare, board);
    for (const neighbor of neighbors) {
      if (neighbor && !neighbor.captured && neighbor.color === color) {
        neighbor.captured = true;
        neighbor.depth = depth + 1;
        capturedCount += 1;
        capturedCount += checkAdjacentSquares(
          neighbor,
          board,
          color,
          visited,
          depth + 1
        );
      }
    }
    return capturedCount;
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
    const capturedCount = checkAdjacentSquares(
      resetBoard[0][0],
      resetBoard,
      resetBoard[0][0].color,
      new Set()
    );
    if (!hasGeneratedNewBoard && hasCreatedScore && boardId) {
      setCurrentBestScore(score < currentBestScore ? score : currentBestScore);
    }
    resetSquareCount(resetBoard, capturedCount, setSquaresRemaining);
    setBoardState(resetBoard);
    setActiveColor(resetBoard[0][0].color);
    setBoardVersion((prev) => prev + 1);
    setUnlockedColorPalettes([]);
    setBoardComplete(false);
    setScore(0);
  };

  const newBoardProcess = (size: BoardSize) => {
    const boardData = squareGenerator(boardConfig[size]);
    const capturedCount = checkAdjacentSquares(
      boardData[0][0],
      boardData,
      boardData[0][0].color,
      new Set()
    );
    resetSquareCount(boardData, capturedCount, setSquaresRemaining);
    setBoardState(boardData);
    setScore(0);
    setActiveColor(boardData[0][0].color);
    setShowBoardSizeModal(false);
    setBoardVersion((prev) => prev + 1);
    setUnlockedColorPalettes([]);
    setHasGeneratedNewBoard(true);
    setBoardComplete(false);
  };

  async function handleBoardComplete(updatedScore: number) {
    if (boardComplete) return;

    setBoardComplete(true);
    setLoadingSetScore(true);
    setHasCreatedScore(true);
    setShowBoardCompleteModal(true);
    const boardData = boardState.flatMap((row) =>
      row.map((x) => x.defaultColor)
    );
    if (!networkState.isConnected) {
      if (!boardId) {
        const scoreData = {
          boardId: uuid.v4(),
          score: updatedScore,
          size: boardSize,
          boardData,
          createdBy: user?.displayName ?? "Anonymous",
          uid: user?.uid,
          gamemode: "freeplay" as Gamemode,
          highScore: true,
          createdAt: Date.now(),
        };
        await saveOfflineScores(scoreData);
      }

      setLoadingSetScore(false);
      return;
    }
    let currentBoardBestScore = null;
    if (!hasGeneratedNewBoard && boardId) {
      const currentBestScoreDocs = await getDocs(
        query(
          collection(db, "scores"),
          where("boardId", "==", boardId),
          where("highScore", "==", true),
          orderBy("score", "asc")
        )
      );
      if (!currentBestScoreDocs.empty) {
        currentBoardBestScore = currentBestScoreDocs.docs[0].data().score;
        setCurrentBestScore(currentBoardBestScore);
        if (updatedScore < currentBoardBestScore) {
          await Promise.all(
            currentBestScoreDocs.docs.map((doc) => {
              return updateDoc(doc.ref, {
                highScore: false,
              });
            })
          );
        }
      }
    }
    const [userDoc] = await Promise.all([
      getUser(user.uid),
      addDoc(collection(db, "scores"), {
        boardId: boardId ? boardId : uuid.v4(),
        score: updatedScore,
        size: boardSize,
        boardData,
        createdBy: user?.displayName,
        uid: user?.uid,
        gamemode: "freeplay",
        highScore: !currentBoardBestScore
          ? true
          : currentBoardBestScore && updatedScore < currentBoardBestScore,
        createdAt: serverTimestamp(),
      }),
    ]);

    if (userDoc) {
      const scoreField = scoreFieldMap[boardSize];
      const currentBest = userDoc.data[scoreField];
      const isBetterScore = currentBest === null || updatedScore < currentBest;

      const updatedScoreMap = Object.fromEntries(
        Object.entries(scoreFieldMap).map(([key, value]) => {
          if (boardSize === key) {
            return [value, updatedScore];
          }
          return [value, userDoc.data[value] ?? null]; // always default to null
        })
      );
      const prevCriteriaMap = (await loadCriteriaMap()) ?? {};

      await updateDoc(userDoc.ref, {
        boardsCompleted: increment(1),
        ...(isBetterScore ? { [scoreField]: updatedScore } : {}),
      });

      const newCriteriaMap = await updateCriteriaMap({
        boardsCompleted: (userDoc.data.boardsCompleted ?? 0) + 1,
        boardsOfTheDayCompleted: userDoc.data.boardsOfTheDayCompleted,
        totalGames: userDoc.data.totalGames,
        wins: userDoc.data.wins,
        bestWinStreak: userDoc.data.bestWinStreak,
        ...updatedScoreMap,
      });
      const updatedColorPaletteOptions = await getColorPaletteOptions(
        newCriteriaMap
      );
      const newlyUnlockedColorPalettes = updatedColorPaletteOptions.filter(
        (item) => {
          if ("key" in item) {
            const prevCriteriaMapItemLocked =
              prevCriteriaMap[item.key]?.locked ?? true;
            const newCriteriaMapItemLocked =
              newCriteriaMap[item.key]?.locked ?? true;
            return prevCriteriaMapItemLocked !== newCriteriaMapItemLocked;
          }
          return false;
        }
      );

      if (newlyUnlockedColorPalettes.length > 0) {
        setUnlockedColorPalettes(newlyUnlockedColorPalettes);
      }
      console.log("unlocked", newlyUnlockedColorPalettes);
      await saveColorPaletteOptions(updatedColorPaletteOptions);
      setLoadingSetScore(false);
    }
  }

  return (
    <ThemedBackground style={styles.container}>
      {!selectedColorPalette ? (
        <ActivityIndicator />
      ) : (
        <>
          <View>
            <ThemedText style={styles.score}>
              {score}
              {bestScore && !hasGeneratedNewBoard && ` / ${currentBestScore}`}
            </ThemedText>
            {showSquareCounter && (
              <SquareCounter
                squaresRemaining={squaresRemaining}
                selectedColorPalette={selectedColorPalette}
                isMosaic={isMosaic}
              />
            )}
          </View>

          <GameBoard
            boardState={boardState}
            selectedColorPalette={selectedColorPalette}
            boardSize={boardSize}
            boardVersion={boardVersion}
            isMosaic={isMosaic}
          />
          <View>
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
          </View>
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
          currentBestScore={currentBestScore}
          hasGeneratedNewBoard={hasGeneratedNewBoard}
          loadingSetScore={loadingSetScore}
        />
      )}
      {unlockedColorPalettes.length > 0 && (
        <ColorPaletteUnlockModal
          unlockedColorPalettes={unlockedColorPalettes}
          isMosaic={isMosaic}
          setUnlockedColorPalettes={setUnlockedColorPalettes}
        />
      )}
    </ThemedBackground>
  );
}

const GameBoard = ({
  boardState,
  selectedColorPalette,
  boardSize,
  boardVersion,
  isMosaic,
}: GameBoardProps) => {
  let windowWidth = getWindowWidth();
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
    <View style={[styles.colorRow, { justifyContent: "center" }]}>
      <ColorButton
        isDisabled={false}
        text="New Board"
        handlePress={() => newBoardProcess(boardSize)}
        style={{ backgroundColor: "rgba(40, 40, 40, 1)" }}
      />
      <ColorButton
        isDisabled={false}
        text="Reset Board"
        handlePress={() => resetBoardProcess()}
        style={{ backgroundColor: "rgba(40, 40, 40, 1)" }}
      />
      <ColorButton
        isDisabled={false}
        text="Board Size"
        handlePress={() => setShowBoardSizeModal(true)}
        style={{ backgroundColor: "rgba(40, 40, 40, 1)" }}
      />
    </View>
  );
};

const ColorRowButtons = (props: ColorRowButtons) => {
  const { activeColor, selectedColorPalette, handleColorChange } = props;
  return (
    <View style={styles.colorRow}>
      {Array.from({ length: 5 }).map((_, i) => {
        const isActive = activeColor === i;
        const colorKeyIndex = i as ColorKey;
        return (
          <ColorButton
            key={i}
            isDisabled={activeColor === i}
            handlePress={() => {
              if (!isActive) handleColorChange(colorKeyIndex);
            }}
            style={{
              backgroundColor: isActive
                ? "white"
                : selectedColorPalette[colorKeyIndex],
            }}
          />
        );
      })}
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
    textAlign: "center",
  },
  squareGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)", // subtle edge separation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // Android shadow
  },
  extraButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(40, 40, 40, 1)",
    borderColor: "rgba(255,255,255,0.15)", // subtle edge separation
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  extraText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
  },
});
