import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { db } from "@/firebaseConfig";
import {
  loadColorIndex,
  loadColorPaletteOptions,
  loadIsColorPaletteStale,
} from "@/helper/asyncStorageHelper";
import { getColorPaletteOptions } from "@/helper/getColorPaletteOptions";
import { PVPSquare } from "@/helper/pvpSquareGenerator";
import { useUser } from "@/hooks/useFirebaseUser";
import { CommonActions } from "@react-navigation/native";
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import {
  doc,
  DocumentReference,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  PixelRatio,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
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
}

interface PVPSquareViewProps {
  square: PVPSquare;
  squareSize: number;
  color: string;
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

export default function PvpGame() {
  const { gameId } = useLocalSearchParams();
  const user = useUser();

  const [ownerName, setOwnerName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [ownerSelectedColor, setOwnerSelectedColor] = useState<ColorKey>(0);
  const [opponentSelectedColor, setOpponentSelectedColor] =
    useState<ColorKey>(0);
  const [turn, setTurn] = useState<PlayerType | null>(null);
  const [boardState, setBoardState] = useState<PVPSquare[][]>([]);
  const [boardSize, setBoardSize] = useState<PVPBoardSize>("small");
  const [colorPaletteOptions, setColorPaletteOptions] = useState<
    PaletteObj[] | []
  >([]);
  const [selectedColorPalette, setSelectedColorPalette] =
    useState<PaletteObj | null>(null);

  const [isFogOfWar, setIsFogOfWar] = useState(false);
  const [ownerScore, setOwnerScore] = useState(1);
  const [opponentScore, setOpponentScore] = useState(1);
  const [winner, setWinner] = useState<PlayerType | null>(null);
  const [turnDeadline, setTurnDeadline] = useState(16000);

  const [boardLoaded, setBoardLoaded] = useState(false);
  const [docRef, setDocRef] = useState<DocumentReference | null>(null);

  const ownerNameRef = useRef<string>(null);
  const opponentNameRef = useRef<string>(null);

  useFocusEffect(
    useCallback(() => {
      console.log("focusing");
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
            console.log("do this be runnin");
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
    if (!gameId) return;
    const id = gameId as string;
    const unsubscribe = onSnapshot(doc(db, "games", id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();

        const currentUser = user?.displayName;
        const currentUserType =
          currentUser === data.ownerName ? "owner" : "opponent";

        if (currentUserType === data.turn && boardLoaded) {
          // opponent must have just moved
          const updatedBoardData = JSON.parse(data.boardData);
          setBoardState(updatedBoardData);
        }

        if (!boardLoaded) {
          setBoardSize(data.size);
          setDocRef(docSnapshot.ref);
          setIsFogOfWar(data.fog);
          const result = markAvailableSquares(
            JSON.parse(data.boardData),
            currentUserType,
            data.fog
          );
          setBoardState(result.updatedBoardState);
        }
        const turnStart = data.turnStartTime?.toMillis?.() ?? Date.now();
        const deadline = turnStart + 16000;
        setTurn(data.turn);
        setTurnDeadline(deadline);
        setOwnerName(data.ownerName);
        setOpponentName(data.opponentName);
        setOwnerSelectedColor(data.ownerSelectedColor);
        setOpponentSelectedColor(data.opponentSelectedColor);
        setBoardSize(data.size);
        setOwnerScore(data.ownerScore);
        setOpponentScore(data.opponentScore);
        setBoardLoaded(true);
        const scoreToWinGame =
          (Math.pow(JSON.parse(data.boardData).length, 2) + 1) / 2;
        if (
          data.ownerScore >= scoreToWinGame ||
          (ownerNameRef.current && data.winner === ownerNameRef.current)
        ) {
          setWinner("owner");
        }
        if (
          data.opponentScore >= scoreToWinGame ||
          (opponentNameRef.current && data.winner === opponentNameRef.current)
        ) {
          setWinner("opponent");
        }
      }
    });
    return unsubscribe;
  }, [gameId]);

  useEffect(() => {
    if (ownerName) {
      ownerNameRef.current = ownerName;
    }
  }, [ownerName]);

  useEffect(() => {
    if (opponentName) {
      opponentNameRef.current = opponentName;
    }
  }, [opponentName]);

  const handleEndOfTurn = () => {
    const fullColorIndexList = [0, 1, 2, 3, 4] as ColorKey[];
    const filteredColorIndexList = fullColorIndexList.filter(
      (x) => x !== ownerSelectedColor && x !== opponentSelectedColor
    );

    const randomColor =
      filteredColorIndexList[
        Math.floor(Math.random() * filteredColorIndexList.length)
      ];
    const currentUser = user?.displayName;
    const currentUserType = currentUser === ownerName ? "owner" : "opponent";

    if (currentUserType === turn) {
      handleColorChange(randomColor);
    }
  };

  const handleColorChange = async (color: ColorKey) => {
    console.log("color picked", color);
    if (winner || !turn) return;
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
          updatedData = {
            ...updatedData,
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
          updatedData = {
            ...updatedData,
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
        neighbor.visibleTo = [...new Set([...neighbor.visibleTo, squareOwner])];
        visited.add(key);
        neighbor.captured = true;
        neighbor.squareOwner = squareOwner;
        neighbor.visibleTo.push("owner", "opponent");
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
        neighbor.revealed = true;
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

  if (user) {
    const currentUser = user.displayName;
    const currentUserType = currentUser === ownerName ? "owner" : "opponent";

    return (
      <ThemedView style={styles.container}>
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
            />
            <TimerDisplay
              turnDeadline={turnDeadline}
              onEndOfTurn={handleEndOfTurn}
            />
            <FakeColorRowButtons
              selectedColorPalette={selectedColorPalette}
              activeColor={[ownerSelectedColor, opponentSelectedColor]}
              turn={turn}
              currentUserType={currentUserType}
            />
            <GameBoard
              boardState={boardState}
              boardSize={boardSize}
              selectedColorPalette={selectedColorPalette}
              currentUserType={currentUserType}
            />
            <ColorRowButtons
              selectedColorPalette={selectedColorPalette}
              activeColor={[ownerSelectedColor, opponentSelectedColor]}
              turn={turn}
              handleColorChange={handleColorChange}
              currentUserType={currentUserType}
            />
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
          </>
        )}
      </ThemedView>
    );
  }

  return <ThemedText>loading...</ThemedText>;
}

const GameBoard = (props: PVPGameBoard) => {
  const { boardState, boardSize, selectedColorPalette, currentUserType } =
    props;

  let windowWidth =
    Platform.OS === "web"
      ? useWindowDimensions().width * 0.33
      : useWindowDimensions().width;
  const columns = Math.sqrt(boardSizePVPConfig[boardSize]);

  const parentHorizontalPadding = 30;
  const maxBoardWidth = Math.min(windowWidth - parentHorizontalPadding, 700);
  const rawTile = Math.floor(maxBoardWidth / columns);
  const tileSize = PixelRatio.roundToNearestPixel(rawTile);

  const getSquareColor = (square: PVPSquare) => {
    if (square.visibleTo.includes(currentUserType)) {
      return selectedColorPalette[square.color];
    }
    return "gray";
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
            key={`${square.x}-${square.y}`}
          />
        ))
      )}
    </View>
  );
};

const Square = (props: PVPSquareViewProps) => {
  const { square, squareSize, color } = props;
  const scale = useRef(new Animated.Value(1)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (square.revealed) {
      Animated.timing(revealAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [square.revealed]);

  return (
    <Animated.View
      style={[
        styles.square,
        square.captured && { zIndex: 2 },
        {
          width: squareSize,
          height: squareSize,
          transform: [{ scale }],
        },
      ]}
    >
      {/* Base = unrevealed gray */}
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: "gray",
        }}
      />

      {/* Overlay = real color, fades in when revealed */}
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: color,
          opacity: revealAnim, // animate opacity only
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
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor: selectedColorPalette[0],
            opacity: activeColor.includes(0) ? 0.05 : 1,
          },
        ]}
        onPress={() =>
          !activeColor.includes(0) &&
          currentUserType === turn &&
          handleColorChange(0)
        }
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor: selectedColorPalette[1],
            opacity: activeColor.includes(1) ? 0.05 : 1,
          },
        ]}
        onPress={() =>
          !activeColor.includes(1) &&
          currentUserType === turn &&
          handleColorChange(1)
        }
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor: selectedColorPalette[2],
            opacity: activeColor.includes(2) ? 0.05 : 1,
          },
        ]}
        onPress={() =>
          !activeColor.includes(2) &&
          currentUserType === turn &&
          handleColorChange(2)
        }
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor: selectedColorPalette[3],
            opacity: activeColor.includes(3) ? 0.05 : 1,
          },
        ]}
        onPress={() =>
          !activeColor.includes(3) &&
          currentUserType === turn &&
          handleColorChange(3)
        }
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor: selectedColorPalette[4],
            opacity: activeColor.includes(4) ? 0.05 : 1,
          },
        ]}
        onPress={() =>
          !activeColor.includes(4) &&
          currentUserType === turn &&
          handleColorChange(4)
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
            backgroundColor: selectedColorPalette[0],
            opacity: activeColor.includes(0) ? 0.05 : 1,
          },
        ]}
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor: selectedColorPalette[1],
            opacity: activeColor.includes(1) ? 0.05 : 1,
          },
        ]}
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor: selectedColorPalette[2],
            opacity: activeColor.includes(2) ? 0.05 : 1,
          },
        ]}
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor: selectedColorPalette[3],
            opacity: activeColor.includes(3) ? 0.05 : 1,
          },
        ]}
      />
      <TouchableOpacity
        style={[
          styles.colorButton,
          {
            backgroundColor: selectedColorPalette[4],
            opacity: activeColor.includes(4) ? 0.05 : 1,
          },
        ]}
      />
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
  } = props;
  return (
    <View
      style={{
        flexDirection: currentUserType === "owner" ? "row" : "row-reverse",
        justifyContent: "space-evenly",
        alignItems: "center",
        width: "100%",
      }}
    >
      <View style={{ alignItems: "center" }}>
        <ThemedText style={{ textAlign: "center" }}>{ownerName}</ThemedText>
        <View
          style={[
            styles.scoreSquare,
            { backgroundColor: selectedColorPalette[ownerSelectedColor] },
          ]}
        >
          <ThemedText style={styles.scoreSquareText}>{ownerScore}</ThemedText>
        </View>
      </View>
      <View>
        <ThemedText style={{ textAlign: "center", marginBottom: 20 }}>
          VS
        </ThemedText>
        {/* <ThemedText style={{ textAlign: "center" }}>{timeLeft}</ThemedText> */}
      </View>
      <View style={{ alignItems: "center" }}>
        <ThemedText style={{ textAlign: "center" }}>{opponentName}</ThemedText>
        <View
          style={[
            styles.scoreSquare,
            { backgroundColor: selectedColorPalette[opponentSelectedColor] },
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

const TimerDisplay = ({
  turnDeadline,
  onEndOfTurn,
}: {
  turnDeadline: number;
  onEndOfTurn: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!turnDeadline) return;

    let lastSeconds: number | null = null;
    const interval = setInterval(() => {
      const remaining = turnDeadline - Date.now();
      const roundedSeconds = Math.max(0, Math.floor(remaining / 1000));

      if (roundedSeconds !== lastSeconds) {
        setTimeLeft(roundedSeconds);
        lastSeconds = roundedSeconds;
      }

      if (remaining <= 0) {
        onEndOfTurn();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [turnDeadline]);

  return <ThemedText style={{ fontSize: 20 }}>{timeLeft}</ThemedText>;
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
      <ThemedView style={styles.centeredView}>
        <ThemedText style={{ textAlign: "center" }} type="title">
          {winnerName} has won the game!
        </ThemedText>
        <ThemedText type="subtitle">Final Score</ThemedText>
        <ThemedText>
          {currentUserType === "owner"
            ? `${ownerScore} - ${opponentScore}`
            : `${opponentScore} - ${ownerScore}`}
        </ThemedText>
        <TouchableOpacity
          onPress={() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 1,
                routes: [{ name: "(tabs)" }, { name: "pvpmenu" }], // replace 'HomePage' with the actual route name
              })
            );
            setWinner(null);
          }}
        >
          <ThemedText>Return to menu</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    // justifyContent: "center",
    paddingTop: 30,
  },
  squareGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  square: {
    borderColor: "black",
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
    // flex: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
    gap: 20,
    // margin: 20,
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
});
