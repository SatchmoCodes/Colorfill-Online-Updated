import BaseModal from "@/components/BaseModal";
import ColorPaletteUnlockModal from "@/components/ColorPaletteUnlockModal";
import SquareCounter, { resetSquareCount } from "@/components/SquareCounter";
import { ThemedBackground } from "@/components/ThemedBackground";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ColorButton from "@/components/ui/ColorButton";
import { db } from "@/firebaseConfig";
import {
  loadColorIndex,
  loadColorPaletteOptions,
  loadCriteriaMap,
  loadCurrentBOTD,
  loadIsMosaicMode,
  loadShowSquareCounter,
  loadSolvedBOTDId,
  saveCurrentBOTD,
  saveSolvedBOTDId,
} from "@/helper/asyncStorageHelper";
//@ts-ignore
import { playPop, resetPlayedDepths } from "@/helper/audio/soundManager";
import { getUser } from "@/helper/commonQueries";
import { getColorPaletteOptions } from "@/helper/getColorPaletteOptions";
import { getEasternBoardDate } from "@/helper/getEasternBoardDate";
import { getUnlockedColorPalettes } from "@/helper/getUnlockedColorPalettes";
import { getWindowWidth } from "@/helper/getWindowWidth";
import { squareGenerator } from "@/helper/squareGenerator";
import { updateCriteriaMap } from "@/helper/updateCriteriaMap";
import { useUser } from "@/hooks/useFirebaseUser";
import { BoardDoc } from "@/schema/boardDocModel";
import { useFocusEffect } from "@react-navigation/native";
import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  increment,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  SnapshotOptions,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  PixelRatio,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { PaletteObj } from "./settings";

export interface Square {
  color: ColorKey;
  captured: boolean;
  defaultColor: ColorKey;
  landLocked: boolean;
  depth: number;
  x: number;
  y: number;
}

export type ColorKey = 0 | 1 | 2 | 3 | 4;
export type BoardOfTheDaySize = "small" | "medium" | "large" | "xlarge";
type LoadingState = "loading" | "loaded" | "complete" | "error";

interface GameBoardProps {
  boardState: Square[][];
  selectedColorPalette: PaletteObj;
  boardSize: BoardOfTheDaySize;
  isMosaic: boolean;
  boardVersion: number;
}

interface SquareViewProps {
  square: Square;
  color: string;
  squareSize: number;
  isMosaic: boolean;
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

const squaresRemainingMap: Record<ColorKey, number> = {
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
};

const boardConverter = {
  toFirestore(board: BoardDoc): DocumentData {
    return board;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions,
  ): BoardDoc {
    return snapshot.data(options) as BoardDoc;
  },
};

const screenSize = Dimensions.get("window").width;

export default function BoardoftheDay() {
  const user = useUser();
  const [boardSize, setBoardSize] = useState<BoardOfTheDaySize>("small");
  const [squaresRemaining, setSquaresRemaining] = useState(squaresRemainingMap);
  const [boardState, setBoardState] = useState<Square[][]>([]);
  const [activeColor, setActiveColor] = useState(boardState[0]?.[0]?.color);
  const [score, setScore] = useState(0);
  const [showBoardCompleteModal, setShowBoardCompleteModal] = useState(false);
  const [selectedColorPalette, setSelectedColorPalette] =
    useState<PaletteObj | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [boardId, setBoardId] = useState("");
  const [isMosaic, setIsMosaic] = useState(false);
  const [showSquareCounter, setShowSquareCounter] = useState(true);
  const [boardVersion, setBoardVersion] = useState(1);
  const [unlockedColorPalettes, setUnlockedColorPalettes] = useState<
    PaletteObj[] | []
  >([]);

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
    }, []),
  );

  useEffect(() => {
    if (user) {
      boardOfTheDayProcess();
    }
  }, [user]);

  const handleColorChange = (color: ColorKey) => {
    resetPlayedDepths();
    const visited = new Set<string>();
    let remainingSquares = false;
    let capturedCount = 0;
    const currentBoardState = boardState.map((row) =>
      row.map((square) => ({ ...square })),
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
              visited,
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
              (n) => !n || n.captured,
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
        }),
      ) as Record<ColorKey, number>;
    });
    if (!remainingSquares) {
      setShowBoardCompleteModal(true);
    }
  };

  function checkAdjacentSquares(
    currentSquare: Square,
    board: Square[][],
    color: ColorKey,
    visited: Set<string>,
    depth: number = 0,
  ) {
    const key = `${currentSquare.x},${currentSquare.y}`;
    if (visited.has(key)) return 0;
    visited.add(key);

    let capturedCount = 0;
    const neighbors = getAdjacentSquares(currentSquare, board);
    for (const neighbor of neighbors) {
      if (neighbor && !neighbor.captured && neighbor.color === color) {
        neighbor.captured = true;
        neighbor.color = color;
        neighbor.depth = depth + 1;
        capturedCount += 1;
        capturedCount += checkAdjacentSquares(
          neighbor,
          board,
          color,
          visited,
          depth + 1,
        );
      }
    }
    return capturedCount;
  }

  function getAdjacentSquares(
    square: Square,
    board: Square[][],
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
    resetPlayedDepths();
    const resetBoard = boardState.map((row) =>
      row.map((square) => ({
        ...square,
        color: square.defaultColor,
        captured: false,
        landLocked: false,
      })),
    );

    resetBoard[0][0].captured = true;

    // Re-capture starting square
    const capturedCount = checkAdjacentSquares(
      resetBoard[0][0],
      resetBoard,
      resetBoard[0][0].color,
      new Set(),
    );

    resetSquareCount(resetBoard, capturedCount, setSquaresRemaining);
    setBoardState(resetBoard);
    setActiveColor(resetBoard[0][0].color);
    setBoardVersion((prev) => prev + 1);
    setScore(0);
  };

  async function handleScoreSubmission() {
    try {
      const boardData = boardState.flatMap((row) =>
        row.map((x) => x.defaultColor),
      );
      const createdAt = serverTimestamp();
      if (user.displayName !== null) {
        const [userDoc] = await Promise.all([
          getUser(user.uid),
          await addDoc(collection(db, "scores"), {
            boardId: boardId,
            score: score,
            size: boardSize,
            boardData: boardData,
            createdBy: user?.displayName,
            uid: user?.uid,
            gamemode: "boardoftheday",
            highScore: true,
            createdAt,
          }),
        ]);
        if (userDoc) {
          await updateDoc(userDoc.ref, {
            boardsOfTheDayCompleted: increment(1),
          });
          const updatedBOTDCompleted = userDoc.data.boardsOfTheDayCompleted + 1;
          const prevCriteriaMap = (await loadCriteriaMap()) ?? {};
          const newCriteriaMap = await updateCriteriaMap({
            boardsOfTheDayCompleted: updatedBOTDCompleted,
          });
          const newlyUnlockedColorPalettes = await getUnlockedColorPalettes(
            prevCriteriaMap,
            newCriteriaMap,
          );
          if (newlyUnlockedColorPalettes.length > 0) {
            setUnlockedColorPalettes(newlyUnlockedColorPalettes);
          }
          await saveSolvedBOTDId(boardId);
        }
      } else {
        await addDoc(collection(db, "scores"), {
          boardId: boardId,
          score: score,
          size: boardSize,
          boardData: boardData,
          createdBy: "Anonymous",
          uid: user?.uid,
          gamemode: "boardoftheday",
          highScore: true,
          createdAt,
        });
      }
      await saveSolvedBOTDId(boardId);
      setLoadingState("complete");
      setShowBoardCompleteModal(false);
    } catch (error) {
      console.log("error submitting score", error);
    }
  }

  async function boardOfTheDayProcess() {
    resetPlayedDepths();
    let isProcessingBOTD = false;
    if (isProcessingBOTD) return;
    isProcessingBOTD = true;

    try {
      const currentlySavedBOTD = await loadCurrentBOTD();
      const currentSolvedBOTDID = await loadSolvedBOTDId();

      // --- 1. Validate saved board ---
      const validSaved =
        currentlySavedBOTD &&
        currentlySavedBOTD.boardId &&
        currentlySavedBOTD.boardData &&
        currentlySavedBOTD.size &&
        currentlySavedBOTD.generatedAt;

      if (!validSaved) {
        console.warn("Invalid or missing cached BOTD, fetching new one.");
        await getBoardOfTheDay();
        return;
      }

      // --- 2. Time difference check (UTC-safe) ---

      const generatedAtDate = new Date(currentlySavedBOTD.generatedAt);

      const generatedAtMs = generatedAtDate.getTime();
      console.log("Adjusted generatedAt", generatedAtMs);

      const now = Date.now();
      const hoursSinceGenerated =
        Math.abs(now - generatedAtMs) / (1000 * 60 * 60);

      if (isNaN(hoursSinceGenerated)) {
        console.warn("Invalid generatedAt date, fetching new BOTD.");
        await getBoardOfTheDay();
        return;
      }

      // --- 3. If 24h passed → get a fresh one ---
      if (hoursSinceGenerated >= 24) {
        console.log("BOTD expired, fetching new one.");
        await getBoardOfTheDay();
        return;
      }

      // --- 4. If user already solved this board ---
      if (
        currentSolvedBOTDID &&
        currentSolvedBOTDID === currentlySavedBOTD.boardId
      ) {
        console.log("User already solved current BOTD.");
        setLoadingState("complete");
        return;
      }

      // --- 5. Otherwise, load the cached board ---
      const { boardData, size, boardId } = currentlySavedBOTD;
      const board = squareGenerator(boardData.length, boardData);
      const capturedCount = checkAdjacentSquares(
        board[0][0],
        board,
        board[0][0].color,
        new Set(),
      );

      resetSquareCount(board, capturedCount, setSquaresRemaining);
      setBoardState(board);
      setActiveColor(board[0][0].defaultColor);
      setBoardSize(size);
      setBoardId(boardId);
      setLoadingState("loaded");
    } catch (error) {
      console.error("Error in boardOfTheDayProcess:", error);
      setLoadingState("error");
    } finally {
      isProcessingBOTD = false;
    }
  }

  async function getBoardOfTheDay() {
    try {
      const yyyyMMdd = getEasternBoardDate();
      console.log("Fetching BOTD for (ET):", yyyyMMdd);

      const boardRef = doc(db, "boards", yyyyMMdd).withConverter(
        boardConverter,
      );
      const boardSnap = await getDoc(boardRef);

      if (!boardSnap.exists()) {
        console.warn("No BOTD found for", yyyyMMdd);
        setLoadingState("error");
        return;
      }

      const boardDoc = boardSnap.data();
      await saveCurrentBOTD(boardDoc);

      const boardId = boardDoc.boardId;

      // --- Check if user already has a score for this board ---
      const userHasBOTDScoreQuery = query(
        collection(db, "scores"),
        where("uid", "==", user?.uid),
        where("boardId", "==", boardId),
      );

      const existingScore = await getDocs(userHasBOTDScoreQuery);
      if (!existingScore.empty) {
        console.log("User already has BOTD score recorded.");
        await saveSolvedBOTDId(boardId);
        setLoadingState("complete");
        return;
      }

      // --- Otherwise, load the board data ---
      const { boardData, size } = boardDoc;
      const board = squareGenerator(boardData.length, boardData);
      const capturedCount = checkAdjacentSquares(
        board[0][0],
        board,
        board[0][0].color,
        new Set(),
      );

      resetSquareCount(board, capturedCount, setSquaresRemaining);
      setBoardState(board);
      setActiveColor(board[0][0].defaultColor);
      setBoardSize(size);
      setBoardId(boardId);
      setLoadingState("loaded");
    } catch (error) {
      console.error("Error getting board of the day:", error);
      setLoadingState("error");
    }
  }

  return (
    <ThemedBackground style={styles.container}>
      {loadingState === "loading" && (
        <>
          <ThemedText type="subtitle">Fetching todays board...</ThemedText>
          <ActivityIndicator size={"large"} color={"blue"} />
        </>
      )}
      {loadingState === "loaded" && selectedColorPalette && (
        <>
          <ThemedText style={styles.score}>{score}</ThemedText>
          {showSquareCounter && (
            <SquareCounter
              squaresRemaining={squaresRemaining}
              selectedColorPalette={selectedColorPalette}
              isMosaic={isMosaic}
            />
          )}
          <GameBoard
            boardState={boardState}
            selectedColorPalette={selectedColorPalette}
            boardSize={boardSize}
            isMosaic={isMosaic}
            boardVersion={boardVersion}
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
          <ThemedText
            type="subtitle"
            style={{ textAlign: "center", marginBottom: 20 }}
          >
            You completed todays board! Check back later for the next one!
          </ThemedText>
          <TimeUntilNextBoard />
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
        <BaseModal
          visible={showBoardCompleteModal}
          onClose={() => setShowBoardCompleteModal(false)}
          showCloseButton={false}
        >
          <BoardCompleteModal
            score={score}
            setShowBoardCompleteModal={setShowBoardCompleteModal}
            handleScoreSubmission={handleScoreSubmission}
            resetBoardProcess={resetBoardProcess}
          />
        </BaseModal>
      )}
      {unlockedColorPalettes.length > 0 && (
        <BaseModal
          visible={unlockedColorPalettes.length > 0}
          onClose={() => setUnlockedColorPalettes([])}
        >
          <ColorPaletteUnlockModal
            unlockedColorPalettes={unlockedColorPalettes}
            isMosaic={isMosaic}
            setUnlockedColorPalettes={setUnlockedColorPalettes}
          />
        </BaseModal>
      )}
    </ThemedBackground>
  );
}

const GameBoard = ({
  boardState,
  selectedColorPalette,
  boardSize,
  isMosaic,
  boardVersion,
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
              square={square}
              color={selectedColorPalette[square.color]}
              squareSize={tileSize}
              isMosaic={isMosaic}
              key={`${square.x}-${square.y}-${boardVersion}`}
            />
          );
        });
      })}
    </View>
  );
};

const Square = (props: SquareViewProps) => {
  const { square, color, squareSize, isMosaic } = props;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (square.captured && square.depth !== undefined) {
      const timeout = setTimeout(() => {
        playPop(square.depth);
      }, square.depth * 80); // same delay as animation start

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

      return () => clearTimeout(timeout);
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
          borderColor: "black",
          borderWidth: isMosaic ? 1 : 0,
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
      <ColorButton
        isDisabled={false}
        text="Reset Board"
        handlePress={() => resetBoardProcess()}
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

const BoardCompleteModal = (props: BoardCompleteProps) => {
  const {
    score,
    setShowBoardCompleteModal,
    handleScoreSubmission,
    resetBoardProcess,
  } = props;

  const [submitting, setSubmitting] = useState(false);

  return (
    <ThemedView style={styles.centeredView}>
      {submitting ? (
        <ThemedView style={{ alignItems: "center" }}>
          <ThemedText>Submitting Score...</ThemedText>
          <ActivityIndicator />
        </ThemedView>
      ) : (
        <>
          <ThemedText
            style={{ textAlign: "center", marginBottom: 20 }}
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
                setSubmitting(true);
                handleScoreSubmission();
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
        </>
      )}
    </ThemedView>
  );
};

export const TimeUntilNextBoard = () => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  const getNextBoardTime = () => {
    const now = new Date();

    // Get current date/time in ET
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "00";

    const hour = parseInt(get("hour"), 10);

    // Target today's noon ET, or tomorrow's if it's already past noon ET
    const etDate = new Date(`${get("year")}-${get("month")}-${get("day")}T00:00:00`);
    if (hour >= 12) etDate.setDate(etDate.getDate() + 1);

    const targetYear = etDate.getFullYear();
    const targetMonth = String(etDate.getMonth() + 1).padStart(2, "0");
    const targetDay = String(etDate.getDate()).padStart(2, "0");

    // Find the UTC timestamp for noon ET on the target day.
    // Start with noon UTC, check what ET hour that is, then correct.
    // This handles DST automatically.
    const noonUTC = new Date(`${targetYear}-${targetMonth}-${targetDay}T12:00:00Z`);
    const etHourAtNoonUTC = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        hour12: false,
      }).format(noonUTC),
      10
    );
    return new Date(noonUTC.getTime() + (12 - etHourAtNoonUTC) * 60 * 60 * 1000);
  };

  const formatTimeLeft = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const next = getNextBoardTime();
      const diff = next.getTime() - now.getTime();
      setTimeLeft(formatTimeLeft(diff));
    };

    update(); // initial call
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, []);

  return <ThemedText>Next board in {timeLeft}</ThemedText>;
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
    width: 85,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(22, 22, 22, 0.9)",
    borderColor: "#2b2b2b",
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
  centeredView: {
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
  },
  submissionButtons: {
    borderRadius: 30,
    padding: 10,
    width: 80,
    backgroundColor: "rgba(63, 63, 63, 1)",
  },
});
