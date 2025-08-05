import { View, Text, Dimensions, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { squareGenerator } from "@/helper/squareGenerator";

export interface Square {
  color: ColorKey;
  captured: boolean;
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
  const [boardState, setBoardState] = useState(squareGenerator(100));
  const [activeColor, setActiveColor] = useState(colorMap[boardState[0].color]);

  const handleColorChange = (color: ColorKey) => {};

  const checkAdjacentSquares = (currentBoardState: Square[]) => {};

  return (
    <View style={styles.container}>
      <Text>freeplay</Text>
      <View style={styles.squareGrid}>
        {boardState.map((square: Square, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.square, { backgroundColor: colorMap[square.color] }]}
            onPress={() => console.log("square", square)}
          />
        ))}
      </View>
      <View style={styles.colorRow}>
        <TouchableOpacity
          style={[styles.extraButton, { backgroundColor: "rgb(100,100,100)" }]}
          onPress={() => setBoardState(squareGenerator(100))}
        >
          <Text>New Board</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.colorRow}>
        <TouchableOpacity
          style={[styles.colorButton, { backgroundColor: colorMap[0] }]}
          onPress={() => handleColorChange(0)}
        />
        <TouchableOpacity
          style={[styles.colorButton, { backgroundColor: colorMap[1] }]}
          onPress={() => handleColorChange(1)}
        />
        <TouchableOpacity
          style={[styles.colorButton, { backgroundColor: colorMap[2] }]}
          onPress={() => handleColorChange(2)}
        />
        <TouchableOpacity
          style={[styles.colorButton, { backgroundColor: colorMap[3] }]}
          onPress={() => handleColorChange(3)}
        />
        <TouchableOpacity
          style={[styles.colorButton, { backgroundColor: colorMap[4] }]}
          onPress={() => handleColorChange(4)}
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
  squareGrid: {
    width: 400,
    height: 400,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  square: {
    width: 40,
    height: 40,
    // borderColor: "black",
    // borderWidth: 1,
  },
  colorRow: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    marginTop: 30,
  },
  colorButton: {
    borderRadius: "50%",
    width: 60,
    height: 60,
  },
  extraButton: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "50%",
    width: 60,
    height: 60,
  },
});
