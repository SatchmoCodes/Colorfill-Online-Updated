import Avatar from "@/components/Avatar";
import ColorPaletteUnlockModal from "@/components/ColorPaletteUnlockModal";
import { ThemedBackground } from "@/components/ThemedBackground";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ColorButton from "@/components/ui/ColorButton";
import CommonButton from "@/components/ui/CommonButton";
import { TimerDisplay } from "@/components/ui/PVPTimer";
import { db, rtdb } from "@/firebaseConfig";
import {
  loadColorIndex,
  loadColorPaletteOptions,
  loadIsMosaicMode,
} from "@/helper/asyncStorageHelper";
//@ts-ignore
import { playPop, resetPlayedDepths } from "@/helper/audio/soundManager";
import { getUser } from "@/helper/commonQueries";
import { getColorPaletteOptions } from "@/helper/getColorPaletteOptions";
import { getUnlockedColorPalettes } from "@/helper/getUnlockedColorPalettes";
import { getWindowHeight } from "@/helper/getWindowHeight";
import { getWindowWidth } from "@/helper/getWindowWidth";
import { PVPSquare } from "@/helper/pvpSquareGenerator";
import { updateCriteriaMap } from "@/helper/updateCriteriaMap";
import { useUser } from "@/hooks/useFirebaseUser";
import { CommonActions } from "@react-navigation/native";
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { User } from "firebase/auth";
import { ref, remove } from "firebase/database";
import {
  doc,
  DocumentReference,
  increment,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, {
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Modal,
  PixelRatio,
  StyleSheet,
  View,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { boardSizePVPConfig, PlayerType, PVPBoardSize } from "./creategame";
import { ColorKey } from "./freeplay";
import { PaletteObj } from "./settings";

interface PVPGameBoard {
  boardState: PVPSquare[][];
  boardSize: PVPBoardSize;
  selectedColorPalette: PaletteObj;
  currentUserType: PlayerType;
  isMosaic: boolean;
}

interface PVPSquareViewProps {
  square: PVPSquare;
  squareSize: number;
  color: string;
  isMosaic: boolean;
  currentUserType: PlayerType;
}

interface ColorRowProps {
  selectedColorPalette: PaletteObj;
  activeColor: number[];
  handleColorChange: (color: ColorKey) => void;
  turn: PlayerType | null;
  currentUserType: PlayerType;
}

interface FakeColorRowProps {
  selectedColorPalette: PaletteObj;
  activeColor: number[];
  turn: PlayerType | null;
  currentUserType: PlayerType;
}

interface ScoreSectionProps {
  ownerScore: number;
  opponentScore: number;
  ownerName: string;
  opponentName: string;
  currentUserType: PlayerType;
  ownerSelectedColor: ColorKey;
  opponentSelectedColor: ColorKey;
  selectedColorPalette: PaletteObj;
  ownerBackground: string;
  ownerLetter: string;
  opponentBackground: string;
  opponentLetter: string;
  isSmallDevice: boolean;
  turnDeadline: number;
  isGameStarted: boolean;
  isGameCompleted: boolean;
  gameRef: DocumentReference;
  ownerRef: RefObject<PlayerRefObject | null>;
  opponentRef: RefObject<PlayerRefObject | null>;
  user: User;
  onEndOfTurn: () => void;
  handlePlayerLeave: (gameRef: DocumentReference, username: string) => void;
}

interface BeginGameModalProps {
  visible: boolean;
  onClose: () => void;
  onGameStart: () => void;
  ownerName: string;
  opponentName: string;
  ownerBackground: string;
  ownerLetter: string;
  opponentBackground: string;
  opponentLetter: string;
  scoreToWin: number;
}

interface EndGameModalProps {
  winner: PlayerType;
  setWinner: React.Dispatch<React.SetStateAction<PlayerType | null>>;
  ownerScore: number;
  opponentScore: number;
  ownerName: string;
  opponentName: string;
  currentUserType: PlayerType;
}

interface PlayerRefObject {
  name: string;
  uid: string;
}

const fogColor = "transparent";
// const fogColor = "gray";

export default function PvpGame() {
  const { gameId } = useLocalSearchParams();
  const user = useUser();
  const navigation = useNavigation();

  const [ownerName, setOwnerName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [ownerUid, setOwnerUid] = useState("");
  const [opponentUid, setOpponentUid] = useState("");
  const [ownerSelectedColor, setOwnerSelectedColor] = useState<ColorKey>(0);
  const [opponentSelectedColor, setOpponentSelectedColor] =
    useState<ColorKey>(0);
  const [turn, setTurn] = useState<PlayerType | null>(null);
  const [boardState, setBoardState] = useState<PVPSquare[][]>([]);
  const [boardSize, setBoardSize] = useState<PVPBoardSize>("small");
  const [selectedColorPalette, setSelectedColorPalette] =
    useState<PaletteObj | null>(null);
  const [unlockedColorPalettes, setUnlockedColorPalettes] = useState<
    PaletteObj[] | []
  >([]);
  const [isFogOfWar, setIsFogOfWar] = useState(false);
  const [ownerScore, setOwnerScore] = useState(1);
  const [opponentScore, setOpponentScore] = useState(1);
  const [winner, setWinner] = useState<PlayerType | null>(null);
  const [turnDeadline, setTurnDeadline] = useState(16000);
  const [isMosaic, setIsMosaic] = useState(false);
  const [boardLoaded, setBoardLoaded] = useState(false);
  const [ownerBackground, setOwnerBackground] = useState("#313131ff");
  const [ownerLetter, setOwnerLetter] = useState("#ffffff");
  const [opponentBackground, setOpponentBackground] = useState("#313131ff");
  const [opponentLetter, setOpponentLetter] = useState("#ffffff");
  const [docRef, setDocRef] = useState<DocumentReference | null>(null);
  const [showBeginGameModal, setShowBeginGameModal] = useState(true);
  const [isGameStarted, setIsGameStarted] = useState(false);

  const ownerRef = useRef<PlayerRefObject>(null);
  const opponentRef = useRef<PlayerRefObject>(null);
  const gameCompletedRef = useRef(false);
  const moveInProgressRef = useRef(false);

  const currentUser = user.uid;
  const currentUserType = currentUser === ownerUid ? "owner" : "opponent";

  const gameRef = doc(db, "games", gameId as string);

  const isSmallDevice = getWindowHeight() <= 760;

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

  useEffect(() => {
    if (!gameId) return;

    const id = gameId as string;

    const unsubscribe = onSnapshot(doc(db, "games", id), (docSnapshot) => {
      (async () => {
        if (!docSnapshot.exists()) return;
        resetPlayedDepths();

        const data = docSnapshot.data();
        if (!data || gameCompletedRef.current) return;

        const currentUser = user?.uid;
        const currentUserType =
          currentUser === data.ownerUid ? "owner" : "opponent";

        // Update board state when the opponent moves
        if (currentUserType === data.turn && boardLoaded) {
          const updatedBoardData = JSON.parse(data.boardData);
          setBoardState(updatedBoardData);
        }

        // Initialize board on first load
        if (!boardLoaded) {
          setBoardSize(data.size);
          setDocRef(docSnapshot.ref);
          setIsFogOfWar(data.fog);
          setOwnerName(data.ownerName);
          setOpponentName(data.opponentName);
          setOwnerBackground(data.ownerProfileBackground);
          setOwnerLetter(data.ownerProfileLetter);
          setOpponentBackground(data.opponentProfileBackground);
          setOpponentLetter(data.opponentProfileLetter);
          setOwnerUid(data.ownerUid);
          setOpponentUid(data.opponentUid);
          const result = markAvailableSquares(
            JSON.parse(data.boardData),
            currentUserType,
            data.fog
          );
          setBoardState(result.updatedBoardState);
          setBoardLoaded(true);
        }

        // General updates
        const turnStart = data.turnStartTime?.toMillis?.() ?? Date.now();
        const deadline = turnStart + 16000;
        setTurn(data.turn);
        setTurnDeadline(deadline);
        setOwnerSelectedColor(data.ownerSelectedColor);
        setOpponentSelectedColor(data.opponentSelectedColor);
        setBoardSize(data.size);
        setOwnerScore(data.ownerScore);
        setOpponentScore(data.opponentScore);

        // ---- Handle game completion logic ----
        const scoreToWinGame =
          (Math.pow(JSON.parse(data.boardData).length, 2) + 1) / 2;

        const ownerWins =
          data.ownerScore >= scoreToWinGame || data.winner === "owner";

        const opponentWins =
          data.opponentScore >= scoreToWinGame || data.winner === "opponent";

        if (!gameCompletedRef.current) {
          if (ownerWins || opponentWins) {
            gameCompletedRef.current = true;

            // If the game doc doesn’t already have a winner, update it
            if (!data.winner) {
              const winnerName = ownerWins ? data.ownerName : data.opponentName;
              await updateDoc(doc(db, "games", id), { winner: winnerName });
            }

            const winnerType = ownerWins ? "owner" : "opponent";
            setWinner(winnerType);

            // Call your async handler (only once per user)
            await handleGameComplete(winnerType, {
              ownerUid: data.ownerUid,
              opponentUid: data.opponentUid,
              currentUserType: currentUserType,
            });
          }
        }
      })().catch((err) => {
        console.error("Error in snapshot:", err);
      });
    });

    return unsubscribe;
  }, [gameId]);

  useEffect(() => {
    ownerRef.current = {
      name: ownerName,
      uid: ownerUid,
    };
  }, [ownerName, ownerUid]);

  useEffect(() => {
    opponentRef.current = {
      name: opponentName,
      uid: opponentUid,
    };
  }, [opponentName, opponentUid]);

  const handleEndOfTurn = () => {
    const fullColorIndexList = [0, 1, 2, 3, 4] as ColorKey[];
    const filteredColorIndexList = fullColorIndexList.filter(
      (x) => x !== ownerSelectedColor && x !== opponentSelectedColor
    );

    const randomColor =
      filteredColorIndexList[
        Math.floor(Math.random() * filteredColorIndexList.length)
      ];
    const currentUser = user?.uid;
    const currentUserType = currentUser === ownerUid ? "owner" : "opponent";

    if (currentUserType === turn) {
      handleColorChange(randomColor);
    }
  };

  useEffect(() => {
    if (user && gameId) {
      const gamePresenceRef = ref(rtdb, `/gamePresence/${gameId}/${user.uid}`);

      const beforeRemove = navigation.addListener("beforeRemove", async (e) => {
        const targetRoute = (e.data?.action as any)?.payload?.name;

        // Prevent leave handling if navigating into the actual game
        if (["settings", "pvpgame"].includes(targetRoute)) {
          return;
        }

        const leavingUser = user;
        await handlePlayerLeave(gameRef, leavingUser.displayName ?? ""); //displayName is mapped to username on creation of account
        remove(gamePresenceRef);
      });

      return () => {
        beforeRemove();
      };
    }
  }, [user, gameId]);

  const handleColorChange = async (color: ColorKey) => {
    resetPlayedDepths();
    if (winner || !turn) return;
    if (moveInProgressRef.current) return;
    moveInProgressRef.current = true;
    const visited = new Set<string>();
    const currentBoardState = boardState.map((row) =>
      row.map((square) => ({ ...square }))
    );
    let updatedScore = 0;

    currentBoardState.forEach((row) => {
      row.forEach((square) => {
        if (square.captured && turn && square.squareOwner === turn) {
          square.color = color;
          if (!square.landLocked) {
            updatedScore += checkAdjacentSquares(
              square,
              currentBoardState,
              color,
              visited,
              turn
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
        }
      });
    });
    const { updatedBoardState, numberOfSquaresAvailable } =
      markAvailableSquares(currentBoardState, turn, isFogOfWar);
    setBoardState(updatedBoardState);

    let updatedData = {};
    const scoreToWinGame = (Math.pow(boardState.length, 2) + 1) / 2;

    if (turn === "owner") {
      const ownerUpdatedScore = updatedScore + ownerScore;
      setOwnerSelectedColor(color);
      setOwnerScore(ownerUpdatedScore);
      updatedData = {
        ownerSelectedColor: color,
        turn: "opponent",
        ownerScore: ownerUpdatedScore,
        updatedAt: serverTimestamp(),
      };
      if (numberOfSquaresAvailable === 0) {
        if (ownerUpdatedScore >= scoreToWinGame) {
          updatedData = {
            ...updatedData,
            winner: ownerName,
            loser: opponentName,
          };
        } else {
          const opponentUpdatedScore =
            Math.pow(boardState.length, 2) - ownerUpdatedScore;
          updatedData = {
            ...updatedData,
            opponentScore: opponentUpdatedScore,
            winner: opponentName,
            loser: ownerName,
          };
        }
      }
    } else {
      const opponentUpdatedScore = updatedScore + opponentScore;
      setOpponentSelectedColor(color);
      setOpponentScore(updatedScore + opponentScore);
      updatedData = {
        opponentSelectedColor: color,
        turn: "owner",
        opponentScore: opponentUpdatedScore,
      };
      if (numberOfSquaresAvailable === 0) {
        if (opponentUpdatedScore >= scoreToWinGame) {
          updatedData = {
            ...updatedData,
            winner: opponentName,
            loser: ownerName,
          };
        } else {
          const ownerUpdatedScore =
            Math.pow(boardState.length, 2) - opponentUpdatedScore;
          updatedData = {
            ...updatedData,
            ownerScore: ownerUpdatedScore,
            winner: ownerName,
            loser: opponentName,
          };
        }
      }
    }
    if (docRef) {
      try {
        await updateDoc(docRef, {
          boardData: JSON.stringify(updatedBoardState),
          ...updatedData,
        });
      } catch (error) {
        console.log("error updating board data, ", error);
      } finally {
        // allow next move only after a small delay to ensure state sync
        setTimeout(() => {
          moveInProgressRef.current = false;
        }, 500); // half a second is plenty
      }
    }
  };

  function checkAdjacentSquares(
    currentSquare: PVPSquare,
    board: PVPSquare[][],
    color: ColorKey,
    visited: Set<string>,
    squareOwner: PlayerType,
    depth: number = 0
  ) {
    const key = `${currentSquare.x},${currentSquare.y}`;
    if (visited.has(key)) return 0;

    let capturedCount = 0;
    const neighbors = getAdjacentSquares(currentSquare, board);
    for (const neighbor of neighbors) {
      if (neighbor && !neighbor.captured && neighbor.color === color) {
        neighbor.visibleTo = [
          ...new Set(["owner" as PlayerType, "opponent" as PlayerType]),
        ];
        visited.add(key);
        neighbor.captured = true;
        neighbor.squareOwner = squareOwner;
        neighbor.depth = depth + 1;
        capturedCount += 1;
        capturedCount += checkAdjacentSquares(
          neighbor,
          board,
          color,
          visited,
          squareOwner,
          depth + 1
        );
      }
    }
    return capturedCount;
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

  function markAvailableSquares(
    currentBoardState: PVPSquare[][],
    currentTurn: PlayerType,
    isFog: boolean
  ) {
    // Clone the board for safe updates
    let mutatedBoardState: PVPSquare[][] = currentBoardState.map((row) =>
      row.map((square) => {
        if (square.captured) {
          return square;
        }
        return {
          ...square,
          visibleTo: !isFog ? ["owner", "opponent"] : [],
        };
      })
    );

    const availableSquares = new Set<string>();

    for (let x = 0; x < 5; x++) {
      const color = x as ColorKey;
      const visited = new Set<string>();

      mutatedBoardState.forEach((row) => {
        row.forEach((square) => {
          if (
            square.captured &&
            square.squareOwner === currentTurn &&
            !square.landLocked
          ) {
            dfsMarkAvailable(
              square,
              mutatedBoardState,
              color,
              visited,
              currentTurn,
              availableSquares
            );
          }
        });
      });
    }

    return {
      updatedBoardState: mutatedBoardState,
      numberOfSquaresAvailable: availableSquares.size,
    };
  }

  function dfsMarkAvailable(
    currentSquare: PVPSquare,
    board: PVPSquare[][],
    color: ColorKey,
    visited: Set<string>,
    player: PlayerType,
    availableSquares: Set<string>
  ) {
    const key = `${currentSquare.x},${currentSquare.y}`;
    if (visited.has(key)) return;
    visited.add(key);

    const neighbors = getAdjacentSquares(currentSquare, board);

    for (const neighbor of neighbors) {
      if (neighbor && !neighbor.captured && neighbor.color === color) {
        neighbor.visibleTo = [...new Set([...neighbor.visibleTo, player])];
        availableSquares.add(`${neighbor.x},${neighbor.y}`);
        dfsMarkAvailable(
          neighbor,
          board,
          color,
          visited,
          player,
          availableSquares
        );
      }
    }
  }

  const handleGameStart = () => {
    setIsGameStarted(true);
    setTurnDeadline(Date.now() + 16000);
  };

  const handleGameComplete = async (
    winner: PlayerType,
    {
      ownerUid,
      opponentUid,
      currentUserType,
    }: { ownerUid: string; opponentUid: string; currentUserType: PlayerType }
  ) => {
    const [ownerUserDoc, opponentUserDoc] = await Promise.all([
      getUser(ownerUid),
      getUser(opponentUid),
    ]);

    const isOwnerClient = currentUserType === "owner";
    const isOpponentClient = currentUserType === "opponent";

    const isWinnerOwner = winner === "owner";
    const isWinnerOpponent = winner === "opponent";

    // unlock palettes stored separately
    let ownerUnlocked: PaletteObj[] = [];
    let opponentUnlocked: PaletteObj[] = [];

    // ----------------------------------------------------
    // OWNER USER LOGIC
    // ----------------------------------------------------
    if (ownerUserDoc) {
      const d = ownerUserDoc.data;
      const nextStreak = isWinnerOwner ? d.currentWinStreak + 1 : 0;

      const [prevCriteria, nextCriteria] = await Promise.all([
        updateCriteriaMap({
          wins: d.wins,
          totalGames: d.totalGames,
          bestWinStreak: d.bestWinStreak,
        }),
        updateCriteriaMap({
          totalGames: d.totalGames + 1,
          wins: d.wins + (isWinnerOwner ? 1 : 0),
          bestWinStreak: Math.max(d.bestWinStreak, nextStreak),
        }),
      ]);

      ownerUnlocked = await getUnlockedColorPalettes(
        prevCriteria,
        nextCriteria
      );
    }

    // ----------------------------------------------------
    // OPPONENT USER LOGIC
    // ----------------------------------------------------
    if (opponentUserDoc) {
      const d = opponentUserDoc.data;
      const nextStreak = isWinnerOpponent ? d.currentWinStreak + 1 : 0;

      const [prevCriteria, nextCriteria] = await Promise.all([
        updateCriteriaMap({
          wins: d.wins,
          totalGames: d.totalGames,
          bestWinStreak: d.bestWinStreak,
        }),
        updateCriteriaMap({
          totalGames: d.totalGames + 1,
          wins: d.wins + (isWinnerOpponent ? 1 : 0),
          bestWinStreak: Math.max(d.bestWinStreak, nextStreak),
        }),
      ]);

      opponentUnlocked = await getUnlockedColorPalettes(
        prevCriteria,
        nextCriteria
      );
    }

    // ----------------------------------------------------
    // WINNER UPDATES ALL USER DOCUMENTS (owner + opponent)
    // This ensures the loser gets their loss recorded even if they left
    // ----------------------------------------------------
    if (winner === currentUserType) {
      const updates: Promise<any>[] = [];

      // OWNER DOC UPDATE
      if (ownerUserDoc) {
        const d = ownerUserDoc.data;
        const nextStreak = isWinnerOwner ? d.currentWinStreak + 1 : 0;

        updates.push(
          updateDoc(ownerUserDoc.ref, {
            wins: isWinnerOwner ? increment(1) : d.wins,
            losses: isWinnerOpponent ? increment(1) : d.losses,
            currentWinStreak: nextStreak,
            bestWinStreak: Math.max(nextStreak, d.bestWinStreak),
            totalGames: increment(1),
            winRate:
              Math.round(
                ((d.wins + (isWinnerOwner ? 1 : 0)) / (d.totalGames + 1)) *
                  10000
              ) / 100,
          })
        );
      }

      // OPPONENT DOC UPDATE
      if (opponentUserDoc) {
        const d = opponentUserDoc.data;
        const nextStreak = isWinnerOpponent ? d.currentWinStreak + 1 : 0;

        updates.push(
          updateDoc(opponentUserDoc.ref, {
            wins: isWinnerOpponent ? increment(1) : d.wins,
            losses: isWinnerOwner ? increment(1) : d.losses,
            currentWinStreak: nextStreak,
            bestWinStreak: Math.max(nextStreak, d.bestWinStreak),
            totalGames: increment(1),
            winRate:
              Math.round(
                ((d.wins + (isWinnerOpponent ? 1 : 0)) / (d.totalGames + 1)) *
                  10000
              ) / 100,
          })
        );
      }

      await Promise.all(updates);
    }

    // ----------------------------------------------------
    // APPLY PALETTE UNLOCKS TO CURRENT USER ONLY
    // ----------------------------------------------------
    if (isOwnerClient && ownerUnlocked.length > 0) {
      setUnlockedColorPalettes(ownerUnlocked);
    }

    if (isOpponentClient && opponentUnlocked.length > 0) {
      setUnlockedColorPalettes(opponentUnlocked);
    }
  };

  async function handlePlayerLeave(
    gameRef: DocumentReference,
    leavingUser: string
  ) {
    if (
      !leavingUser ||
      !opponentRef.current ||
      !ownerRef.current ||
      gameCompletedRef.current
    )
      return;
    const { name: leavingOpponentName } = opponentRef.current;
    const leavingOwnerName = ownerRef.current?.name;

    try {
      if (leavingUser === leavingOwnerName) {
        if (leavingOpponentName) {
          await updateDoc(gameRef, {
            winner: "opponent",
          });
        } else {
          await updateDoc(gameRef, {
            status: "deleting",
          });
        }
      } else if (leavingUser === leavingOpponentName) {
        if (leavingOwnerName) {
          await updateDoc(gameRef, {
            winner: "owner",
          });
        } else {
          await updateDoc(gameRef, {
            status: "deleting",
          });
        }
      }
    } catch (error) {
      console.error("Error updating game on leave:", error);
    }
  }

  if (currentUserType) {
    return (
      <ThemedBackground style={styles.container}>
        {!selectedColorPalette ? (
          <ActivityIndicator />
        ) : (
          <>
            <ScoreSection
              ownerName={ownerName}
              opponentName={opponentName}
              ownerScore={ownerScore}
              opponentScore={opponentScore}
              currentUserType={currentUserType}
              ownerSelectedColor={ownerSelectedColor}
              opponentSelectedColor={opponentSelectedColor}
              selectedColorPalette={selectedColorPalette}
              ownerBackground={ownerBackground}
              ownerLetter={ownerLetter}
              opponentBackground={opponentBackground}
              opponentLetter={opponentLetter}
              isSmallDevice={isSmallDevice}
              turnDeadline={turnDeadline}
              isGameStarted={isGameStarted}
              isGameCompleted={gameCompletedRef.current}
              gameRef={gameRef}
              ownerRef={ownerRef}
              opponentRef={opponentRef}
              user={user}
              onEndOfTurn={handleEndOfTurn}
              handlePlayerLeave={handlePlayerLeave}
            />
            {/* {!isSmallDevice && (
              <FakeColorRowButtons
                selectedColorPalette={selectedColorPalette}
                activeColor={[ownerSelectedColor, opponentSelectedColor]}
                turn={turn}
                currentUserType={currentUserType}
              />
            )} */}
            <GameBoard
              boardState={boardState}
              boardSize={boardSize}
              selectedColorPalette={selectedColorPalette}
              currentUserType={currentUserType}
              isMosaic={isMosaic}
            />
            <ColorRowButtons
              selectedColorPalette={selectedColorPalette}
              activeColor={[ownerSelectedColor, opponentSelectedColor]}
              turn={turn}
              handleColorChange={handleColorChange}
              currentUserType={currentUserType}
            />
            <Modal
              transparent
              animationType="fade"
              visible={showBeginGameModal}
            >
              <BeginGameModal
                visible={showBeginGameModal}
                onClose={() => setShowBeginGameModal(false)}
                onGameStart={handleGameStart}
                ownerName={ownerName}
                opponentName={opponentName}
                ownerBackground={ownerBackground}
                ownerLetter={ownerLetter}
                opponentBackground={opponentBackground}
                opponentLetter={opponentLetter}
                scoreToWin={(Math.pow(boardState.length, 2) + 1) / 2}
              />
            </Modal>

            {winner && (
              <EndGameModal
                winner={winner}
                setWinner={setWinner}
                ownerScore={ownerScore}
                opponentScore={opponentScore}
                ownerName={ownerName}
                opponentName={opponentName}
                currentUserType={currentUserType}
              />
            )}
            {unlockedColorPalettes.length > 0 && (
              <ColorPaletteUnlockModal
                unlockedColorPalettes={unlockedColorPalettes}
                isMosaic={isMosaic}
                setUnlockedColorPalettes={setUnlockedColorPalettes}
              />
            )}
          </>
        )}
      </ThemedBackground>
    );
  }

  return <ThemedText>loading...</ThemedText>;
}

const GameBoard = (props: PVPGameBoard) => {
  const {
    boardState,
    boardSize,
    selectedColorPalette,
    currentUserType,
    isMosaic,
  } = props;

  console.log("boarddata", boardState);

  let windowWidth = getWindowWidth();
  const columns = Math.sqrt(boardSizePVPConfig[boardSize]);

  const parentHorizontalPadding = 30;
  const maxBoardWidth = Math.min(windowWidth - parentHorizontalPadding, 700);
  const rawTile = Math.floor(maxBoardWidth / columns);
  const tileSize = PixelRatio.roundToNearestPixel(rawTile);

  const getSquareColor = (square: PVPSquare) => {
    if (square.visibleTo.includes(currentUserType)) {
      return selectedColorPalette[square.color];
    }
    return fogColor;
  };

  const transformStyle =
    currentUserType === "opponent" ? { transform: [{ rotate: "180deg" }] } : {};

  return (
    <View
      style={[styles.squareGrid, { width: maxBoardWidth, ...transformStyle }]}
    >
      {boardState.map((row) =>
        row.map((square) => (
          <Square
            square={square}
            color={getSquareColor(square)}
            squareSize={tileSize}
            isMosaic={isMosaic}
            currentUserType={currentUserType}
            key={`${square.x}-${square.y}`}
          />
        ))
      )}
    </View>
  );
};

const Square = (props: PVPSquareViewProps) => {
  const { square, squareSize, color, isMosaic, currentUserType } = props;
  const scale = useRef(new Animated.Value(1)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (square.visibleTo.includes(currentUserType)) {
      Animated.timing(revealAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [square.visibleTo]);

  return (
    <Animated.View
      style={[
        styles.square,
        square.captured && { zIndex: 2 },
        {
          width: squareSize,
          height: squareSize,
          borderColor: "black",
          transform: [{ scale }],
        },
      ]}
    >
      <View
        style={{
          zIndex: 1000,
          justifyContent: "center",
          alignItems: "center",
        }}
      ></View>
      {/* Base = unrevealed gray */}
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: fogColor,
        }}
      />

      {/* Overlay = real color, fades in when revealed */}
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,

          backgroundColor: square.visibleTo.includes(currentUserType)
            ? color
            : fogColor,
          opacity: square.visibleTo.includes(currentUserType) ? revealAnim : 1,
          borderWidth:
            isMosaic && square.visibleTo.includes(currentUserType) ? 1 : 0,
        }}
      />
    </Animated.View>
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
      {Array.from({ length: 5 }).map((_, i) => {
        const isActive = activeColor.includes(i);
        const colorKeyIndex = i as ColorKey;
        return (
          <ColorButton
            key={i}
            isDisabled={isActive}
            handlePress={() => {
              if (!isActive && currentUserType === turn)
                handleColorChange(colorKeyIndex);
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

const FakeColorRowButtons = (props: FakeColorRowProps) => {
  const { activeColor, selectedColorPalette, currentUserType, turn } = props;

  return (
    <View
      style={[
        styles.colorRow,
        { marginBottom: 20, opacity: turn === currentUserType ? 0.2 : 1 },
      ]}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const isActive = activeColor.includes(i);
        const colorKeyIndex = i as ColorKey;
        return (
          <ColorButton
            key={i}
            isDisabled={isActive}
            handlePress={() => {}}
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

const ScoreSection = (props: ScoreSectionProps) => {
  const {
    ownerName,
    opponentName,
    ownerScore,
    opponentScore,
    currentUserType,
    ownerSelectedColor,
    opponentSelectedColor,
    selectedColorPalette,
    ownerBackground,
    ownerLetter,
    opponentBackground,
    opponentLetter,
    isSmallDevice,
    turnDeadline,
    isGameStarted,
    isGameCompleted,
    gameRef,
    ownerRef,
    opponentRef,
    user,
    onEndOfTurn,
    handlePlayerLeave,
  } = props;

  return (
    <View
      style={{
        flexDirection: currentUserType === "owner" ? "row" : "row-reverse",
        justifyContent: "space-evenly",
        alignItems: "center",
        width: "100%",
        marginBottom: 30,
      }}
    >
      {/* Owner */}
      <View style={{ alignItems: "center", flexGrow: 1 }}>
        <ThemedText style={{ textAlign: "center" }}>{ownerName}</ThemedText>
        {!isSmallDevice && (
          <Avatar
            profileBackground={ownerBackground}
            profileLetter={ownerLetter}
            username={ownerName}
            size="large"
          />
        )}
        <View
          style={[
            styles.scoreSquare,
            {
              backgroundColor: selectedColorPalette[ownerSelectedColor],
              marginTop: 10,
            },
          ]}
        >
          <ThemedText style={styles.scoreSquareText}>{ownerScore}</ThemedText>
        </View>
      </View>

      {/* Center Section: VS + Timer */}
      <View style={{ alignItems: "center", minWidth: 50 }}>
        <ThemedText style={{ textAlign: "center", marginBottom: 10 }}>
          VS
        </ThemedText>
        <TimerDisplay
          turnDeadline={turnDeadline}
          isGameStarted={isGameStarted}
          isGameCompleted={isGameCompleted}
          gameRef={gameRef}
          ownerRef={ownerRef}
          opponentRef={opponentRef}
          user={user}
          onEndOfTurn={onEndOfTurn}
          handlePlayerLeave={handlePlayerLeave}
        />
      </View>
      {/* Opponent */}
      <View style={{ alignItems: "center", flexGrow: 1 }}>
        <ThemedText style={{ textAlign: "center" }}>{opponentName}</ThemedText>
        {!isSmallDevice && (
          <Avatar
            profileBackground={opponentBackground}
            profileLetter={opponentLetter}
            username={opponentName}
            size="large"
          />
        )}
        <View
          style={[
            styles.scoreSquare,
            {
              backgroundColor: selectedColorPalette[opponentSelectedColor],
              marginTop: 10,
            },
          ]}
        >
          <ThemedText style={styles.scoreSquareText}>
            {opponentScore}
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

const BeginGameModal = ({
  visible,
  onClose,
  onGameStart,
  ownerName,
  opponentName,
  ownerBackground,
  ownerLetter,
  opponentBackground,
  opponentLetter,
  scoreToWin,
}: BeginGameModalProps) => {
  const [timeLeft, setTimeLeft] = useState(3);

  useEffect(() => {
    if (!visible) return;
    setTimeLeft(3);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          // ✅ Defer parent updates to avoid “update during render” warning
          setTimeout(() => {
            onClose();
            onGameStart();
          }, 0);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  return (
    <ThemedView style={styles.centeredView}>
      <View style={{ marginBottom: 10 }}>
        <ThemedText type="subtitle">
          First to {scoreToWin} wins the game!
        </ThemedText>
      </View>
      <View style={{ flexDirection: "row", gap: 30 }}>
        <View>
          <ThemedText style={{ marginBottom: 5, textAlign: "center" }}>
            {ownerName}
          </ThemedText>
          <Avatar
            profileBackground={ownerBackground}
            profileLetter={ownerLetter}
            username={ownerName}
            size="large"
          />
        </View>
        <View style={{ justifyContent: "center" }}>
          <ThemedText>VS</ThemedText>
        </View>

        <View>
          <ThemedText style={{ marginBottom: 5, textAlign: "center" }}>
            {opponentName}
          </ThemedText>
          <Avatar
            profileBackground={opponentBackground}
            profileLetter={opponentLetter}
            username={opponentName}
            size="large"
          />
        </View>
      </View>
      {/* <View>
        <TouchableOpacity
          onPress={() => {
            onClose();
            onGameStart();
          }}
        >
          <ThemedText>Close</ThemedText>
        </TouchableOpacity>
      </View> */}
      <ThemedText>Game Begins in {timeLeft}</ThemedText>
    </ThemedView>
  );
};

const EndGameModal = (props: EndGameModalProps) => {
  const {
    winner,
    setWinner,
    ownerScore,
    opponentScore,
    ownerName,
    opponentName,
    currentUserType,
  } = props;

  const winnerName = winner === "owner" ? ownerName : opponentName;
  const navigation = useNavigation();

  return (
    <Modal transparent animationType="fade">
      <ThemedView
        style={[
          styles.centeredView,
          {
            borderColor: winner === currentUserType ? "green" : "red",
            borderWidth: 2,
          },
        ]}
      >
        <ThemedText
          type="title"
          style={{ color: winner === currentUserType ? "green" : "red" }}
        >
          {winner === currentUserType ? "Victory" : "Defeat"}
        </ThemedText>
        <ThemedText style={{ textAlign: "center" }} type="title">
          {winnerName} has won the game!
        </ThemedText>
        <ThemedText type="subtitle">Final Score</ThemedText>
        <ThemedText>
          {currentUserType === "owner"
            ? `${ownerScore} - ${opponentScore}`
            : `${opponentScore} - ${ownerScore}`}
        </ThemedText>
        <CommonButton
          title="Return to Menu"
          size={150}
          handlePress={() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 1,
                routes: [{ name: "(tabs)" }, { name: "pvpmenu" }], // replace 'HomePage' with the actual route name
              })
            );
            setWinner(null);
          }}
        />
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    paddingTop: 30,
  },
  squareGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  square: {
    borderColor: "black",
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
  scoreSquare: {
    width: 40,
    height: 40,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreSquareText: {
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontSize: 20,
    textShadowColor: "black",
    textShadowRadius: 2,
    textShadowOffset: {
      width: 1,
      height: 1,
    },
  },
  centeredView: {
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
    gap: 20,
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
  avatar: {
    position: "relative",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderColor: "black",
    borderWidth: 1,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
