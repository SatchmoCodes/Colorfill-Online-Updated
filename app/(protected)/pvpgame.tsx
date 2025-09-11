import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { colorPaletteOptions } from "@/constants/ColorPaletteOptions";
import { db } from "@/firebaseConfig";
import { calculateSquareSize } from "@/helper/calculateSquareSize";
import { PVPSquare } from "@/helper/pvpSquareGenerator";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
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

interface ScoreSectionProps {
  ownerScore: number;
  opponentScore: number;
  ownerName: string;
  opponentName: string;
  selectedColorPalette: PaletteObj;
  timeLeft: number;
  currentUserType: PlayerType;
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
  const { user, loading } = useFirebaseUser();

  const [ownerName, setOwnerName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [ownerSelectedColor, setOwnerSelectedColor] = useState(0);
  const [opponentSelectedColor, setOpponentSelectedColor] = useState(0);
  const [turn, setTurn] = useState<PlayerType | null>(null);
  const [boardState, setBoardState] = useState<PVPSquare[][]>([]);
  const [boardSize, setBoardSize] = useState<PVPBoardSize>("small");
  const [selectedColorPalette, setSelectedColorPalette] = useState(
    colorPaletteOptions[0]
  );
  const [isFogOfWar, setIsFogOfWar] = useState(false);
  const [ownerScore, setOwnerScore] = useState(1);
  const [opponentScore, setOpponentScore] = useState(1);
  const [winner, setWinner] = useState<PlayerType | null>(null);
  const [turnDeadline, setTurnDeadline] = useState(16000);
  const [timeLeft, setTimeLeft] = useState(16);

  const [boardLoaded, setBoardLoaded] = useState(false);
  const [docRef, setDocRef] = useState<DocumentReference | null>(null);

  const ownerNameRef = useRef<string>(null);
  const opponentNameRef = useRef<string>(null);

  useFocusEffect(
    useCallback(() => {
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
    if (!gameId || loading || !user) return;
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
  }, [gameId, user, loading]);

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

  useEffect(() => {
    if (!turnDeadline) return;
    const interval = setInterval(() => {
      const remaining = turnDeadline - Date.now();
      const roundedSeconds = Math.max(0, Math.floor(remaining / 1000));
      setTimeLeft(roundedSeconds);
      if (remaining <= 0) {
        handleEndOfTurn();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [turnDeadline]);

  const handleEndOfTurn = () => {
    const randomColor = Math.floor(Math.random() * 5) as ColorKey;
    const currentUser = user?.displayName;
    const currentUserType = currentUser === ownerName ? "owner" : "opponent";

    if (currentUserType === turn) {
      handleColorChange(randomColor);
    }
  };

  const handleColorChange = async (color: ColorKey) => {
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
        <>
          <ScoreSection
            ownerName={ownerName}
            opponentName={opponentName}
            ownerScore={ownerScore}
            opponentScore={opponentScore}
            selectedColorPalette={selectedColorPalette}
            timeLeft={timeLeft}
            currentUserType={currentUserType}
          />
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
            currentUserType={currentUserType}
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
      </ThemedView>
    );
  }

  return <ThemedText>loading...</ThemedText>;
}

const GameBoard = (props: PVPGameBoard) => {
  const { boardState, boardSize, selectedColorPalette, currentUserType } =
    props;

  const columns = Math.sqrt(boardSizePVPConfig[boardSize]);
  const squareSize = calculateSquareSize(boardSizePVPConfig[boardSize]);
  const containerSize = columns * squareSize;

  const getSquareColor = (square: PVPSquare) => {
    if (square.captured) {
      if (square.squareOwner === "owner")
        return selectedColorPalette[5] ?? "black";
      if (square.squareOwner === "opponent")
        return selectedColorPalette[6] ?? "white";
    }
    if (square.visibleTo.includes(currentUserType)) {
      return selectedColorPalette[square.color];
    }
    return "gray";
  };

  if (currentUserType === "owner") {
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
              <Square
                square={square}
                color={getSquareColor(square)}
                squareSize={squareSize}
                key={`${square.x}-${square.y}`}
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
          <Square
            square={square}
            color={getSquareColor(square)}
            squareSize={squareSize}
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

const ScoreSection = (props: ScoreSectionProps) => {
  const {
    ownerName,
    opponentName,
    ownerScore,
    opponentScore,
    selectedColorPalette,
    timeLeft,
    currentUserType,
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
            { backgroundColor: selectedColorPalette[5] },
          ]}
        >
          <ThemedText style={styles.scoreSquareText}>{ownerScore}</ThemedText>
        </View>
      </View>
      <View>
        <ThemedText style={{ textAlign: "center", marginBottom: 20 }}>
          VS
        </ThemedText>
        <ThemedText style={{ textAlign: "center" }}>{timeLeft}</ThemedText>
      </View>
      <View style={{ alignItems: "center" }}>
        <ThemedText style={{ textAlign: "center" }}>{opponentName}</ThemedText>
        <View
          style={[
            styles.scoreSquare,
            { backgroundColor: selectedColorPalette[6] },
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
