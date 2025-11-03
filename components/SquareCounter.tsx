import { ColorKey, Square } from "@/app/(protected)/freeplay";
import { PaletteObj } from "@/app/(protected)/settings";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const squaresRemainingMap: Record<ColorKey, number> = {
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
};

export default function SquareCounter({
  squaresRemaining,
  selectedColorPalette,
  isMosaic,
}: {
  squaresRemaining: Record<string, number>;
  selectedColorPalette: PaletteObj;
  isMosaic: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 20,
        marginBottom: 20,
        justifyContent: "space-evenly",
      }}
    >
      {Object.entries(squaresRemaining).map(([key, value]) => {
        const colorKey = key as unknown as ColorKey;
        return (
          <ThemedView
            style={{
              backgroundColor: selectedColorPalette[colorKey],
              width: 50,
              height: 50,
              justifyContent: "center",
              alignItems: "center",
              borderColor: "black",
              borderWidth: isMosaic ? 1 : 0,
            }}
            key={key}
          >
            <ThemedText style={styles.strokeText}>{value}</ThemedText>
          </ThemedView>
        );
      })}
    </View>
  );
}

export function resetSquareCount(
  boardState: Square[][],
  capturedCount: number,
  setSquaresRemaining: React.Dispatch<
    React.SetStateAction<Record<ColorKey, number>>
  >
) {
  const updatedSquareCountMap = {
    ...squaresRemainingMap,
    [boardState[0][0].color]: -capturedCount + -1,
  };
  boardState.map((row) =>
    row.map((sq) => {
      updatedSquareCountMap[sq.color] = updatedSquareCountMap[sq.color] + 1;
    })
  );

  setSquaresRemaining(updatedSquareCountMap);
}

const styles = StyleSheet.create({
  strokeText: {
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
});
