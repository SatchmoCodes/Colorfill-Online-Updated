import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { colorPaletteOptions } from "@/constants/ColorPaletteOptions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type PaletteObj = {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
};

const PAGE_SIZE = 6; // 2 rows × 3 cols
const screenWidth = Dimensions.get("window").width;
const COLS = 3;
const GAP = 12; // horizontal/vertical spacing between items
const PAGE_PADDING_H = GAP; // left/right padding per page
const cardWidth = Math.floor(
  (screenWidth - PAGE_PADDING_H * 2 - GAP * (COLS - 1)) / COLS
);

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function Settings() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedColorPalette, setSelectedColorPalette] = useState<PaletteObj>(
    colorPaletteOptions[0]
  );

  const pages = useMemo(
    () => chunkArray<PaletteObj>(colorPaletteOptions, PAGE_SIZE),
    []
  );

  async function loadInitialSettings() {
    try {
      const saved = await AsyncStorage.getItem("color-index");
      const idx = Number.isFinite(parseInt(saved ?? "", 10))
        ? parseInt(saved!, 10)
        : 0;
      setSelectedIndex(idx);
      setSelectedColorPalette(
        colorPaletteOptions[idx] ?? colorPaletteOptions[0]
      );
    } catch (e) {
      setSelectedIndex(0);
      setSelectedColorPalette(colorPaletteOptions[0]);
    }
  }

  const handleChangeColorPalette = async (index: number) => {
    try {
      await AsyncStorage.setItem("color-index", index.toString());
      setSelectedIndex(index);
      setSelectedColorPalette(colorPaletteOptions[index]);
    } catch {}
  };

  useEffect(() => {
    loadInitialSettings();
  }, []);

  return (
    <ThemedView style={[styles.container]}>
      <ThemedText style={styles.optionText} type="subtitle">
        Selected Color
      </ThemedText>

      {/* preview of current selection */}
      <View>
        <View style={styles.paletteRow}>
          <View
            style={[
              styles.paletteSquare,
              { backgroundColor: selectedColorPalette[3] },
            ]}
          />
          <View
            style={[
              styles.paletteSquare,
              { backgroundColor: selectedColorPalette[4] },
            ]}
          />
        </View>
        <View style={styles.paletteRow}>
          <View
            style={[
              styles.paletteSquare,
              { backgroundColor: selectedColorPalette[0] },
            ]}
          />
          <View
            style={[
              styles.paletteSquare,
              { backgroundColor: selectedColorPalette[1] },
            ]}
          />
          <View
            style={[
              styles.paletteSquare,
              { backgroundColor: selectedColorPalette[2] },
            ]}
          />
        </View>
      </View>

      <ThemedText
        style={[styles.optionText, { marginTop: 12 }]}
        type="subtitle"
      >
        Color Options
      </ThemedText>

      <FlatList
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={true}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH} // full screen per page
        snapToAlignment="start"
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item: pagePalettes, index: pageIndex }) => (
          <View style={[{ width: SCREEN_WIDTH }]}>
            {/* First row */}
            <View style={styles.row}>
              {pagePalettes.slice(0, 3).map((palette, i) => {
                const paletteIndex = pageIndex * PAGE_SIZE + i;
                const isSelected = paletteIndex === selectedIndex;
                return (
                  <TouchableOpacity
                    key={paletteIndex}
                    style={[
                      styles.paletteCard,
                      { width: cardWidth },
                      isSelected && styles.selectedCard,
                    ]}
                    onPress={() => handleChangeColorPalette(paletteIndex)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.paletteRow}>
                      <View
                        style={[
                          styles.paletteSquare,
                          { backgroundColor: palette[3] },
                        ]}
                      />
                      <View
                        style={[
                          styles.paletteSquare,
                          { backgroundColor: palette[4] },
                        ]}
                      />
                    </View>
                    <View style={styles.paletteRow}>
                      <View
                        style={[
                          styles.paletteSquare,
                          { backgroundColor: palette[0] },
                        ]}
                      />
                      <View
                        style={[
                          styles.paletteSquare,
                          { backgroundColor: palette[1] },
                        ]}
                      />
                      <View
                        style={[
                          styles.paletteSquare,
                          { backgroundColor: palette[2] },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Second row */}
            <View style={styles.row}>
              {pagePalettes.slice(3, 6).map((palette, i) => {
                const paletteIndex = pageIndex * PAGE_SIZE + (i + 3); // <-- FIXED here
                const isSelected = paletteIndex === selectedIndex;
                return (
                  <TouchableOpacity
                    key={paletteIndex}
                    style={[
                      styles.paletteCard,
                      { width: cardWidth },
                      isSelected && styles.selectedCard,
                    ]}
                    onPress={() => handleChangeColorPalette(paletteIndex)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.paletteRow}>
                      <View
                        style={[
                          styles.paletteSquare,
                          { backgroundColor: palette[3] },
                        ]}
                      />
                      <View
                        style={[
                          styles.paletteSquare,
                          { backgroundColor: palette[4] },
                        ]}
                      />
                    </View>
                    <View style={styles.paletteRow}>
                      <View
                        style={[
                          styles.paletteSquare,
                          { backgroundColor: palette[0] },
                        ]}
                      />
                      <View
                        style={[
                          styles.paletteSquare,
                          { backgroundColor: palette[1] },
                        ]}
                      />
                      <View
                        style={[
                          styles.paletteSquare,
                          { backgroundColor: palette[2] },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
        keyExtractor={(_, i) => i.toString()}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20 },
  optionText: { marginTop: 5, marginBottom: 5, textAlign: "center" },
  paletteRow: { flexDirection: "row", justifyContent: "center" },
  paletteSquare: {
    width: 25,
    height: 25,
    borderWidth: 1,
    borderColor: "black",
  },
  paletteCard: {
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedCard: {
    borderColor: "white",
  },
  // page: {
  //   flexDirection: "column",
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "90%",
    marginVertical: 10,
  },
  paletteOption: {
    alignItems: "center",
  },
});
