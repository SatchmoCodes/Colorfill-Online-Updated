import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Pressable,
} from "react-native";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { squareGenerator } from "@/helper/squareGenerator";

export interface Square {
  color: ColorKey;
  captured: boolean;
  defaultColor: ColorKey;
  landLocked: boolean;
  x: number;
  y: number;
}

export type ColorKey = 0 | 1 | 2 | 3 | 4;

const colorMap = {
  0: "red",
  1: "orange",
  2: "yellow",
  3: "green",
  4: "blue",
};

export default function Freeplay() {
  const [boardState, setBoardState] = useState(() => {
    const boardData = squareGenerator(100);
    checkAdjacentSquares(
      boardData[0][0],
      boardData,
      boardData[0][0].color,
      new Set()
    );
    return boardData;
  });
  const [activeColor, setActiveColor] = useState(boardState[0][0].color);
  const [score, setScore] = useState(1);

  const handleColorChange = (color: ColorKey) => {
    const visited = new Set<string>();
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
        if (square.captured && !square.landLocked) {
          const neighbors = getAdjacentSquares(square, currentBoardState);
          const allNeighborsCaptured = neighbors.every((n) => !n || n.captured);
          if (allNeighborsCaptured) {
            square.landLocked = true;
          }
        }
      });
    });
    setBoardState(currentBoardState);
    setActiveColor(color);
    setScore((prev) => prev + 1);
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

  const newBoardProcess = () => {
    const boardData = squareGenerator(100);
    checkAdjacentSquares(
      boardData[0][0],
      boardData,
      boardData[0][0].color,
      new Set()
    );
    setBoardState(boardData);
    setScore(0);
    setActiveColor(boardData[0][0].color);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.score}>Moves: {score}</Text>
      <View style={styles.squareGrid}>
        {boardState.map((row) => {
          return row.map((square: Square) => {
            return (
              <TouchableOpacity
                key={`${square.x}-${square.y}`}
                style={[
                  styles.square,
                  { backgroundColor: colorMap[square.color] },
                ]}
                onPress={() => console.log("square", square)}
              />
            );
          });
        })}
      </View>
      <View style={styles.colorRow}>
        <TouchableOpacity
          style={[
            styles.extraButton,
            { backgroundColor: "rgba(46, 46, 46, 1)" },
          ]}
          onPress={() => newBoardProcess()}
        >
          <Text style={styles.extraText}>New Board</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.extraButton,
            { backgroundColor: "rgba(46, 46, 46, 1)" },
          ]}
          onPress={() => resetBoardProcess()}
        >
          <Text style={styles.extraText}>Reset Board</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.colorRow}>
        <TouchableOpacity
          style={[
            styles.colorButton,
            { backgroundColor: activeColor === 0 ? "white" : colorMap[0] },
          ]}
          onPress={() => activeColor !== 0 && handleColorChange(0)}
        />
        <TouchableOpacity
          style={[
            styles.colorButton,
            { backgroundColor: activeColor === 1 ? "white" : colorMap[1] },
          ]}
          onPress={() => activeColor !== 1 && handleColorChange(1)}
        />
        <TouchableOpacity
          style={[
            styles.colorButton,
            { backgroundColor: activeColor === 2 ? "white" : colorMap[2] },
          ]}
          onPress={() => activeColor !== 2 && handleColorChange(2)}
        />
        <TouchableOpacity
          style={[
            styles.colorButton,
            { backgroundColor: activeColor === 3 ? "white" : colorMap[3] },
          ]}
          onPress={() => activeColor !== 3 && handleColorChange(3)}
        />
        <TouchableOpacity
          style={[
            styles.colorButton,
            { backgroundColor: activeColor === 4 ? "white" : colorMap[4] },
          ]}
          onPress={() => activeColor !== 4 && handleColorChange(4)}
        />
      </View>
    </View>
  );
}

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
    width: 400,
    height: 400,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  square: {
    width: 40,
    height: 40,
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
