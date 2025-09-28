import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  loadColorIndex,
  loadColorPaletteOptions,
  loadCriteriaMap,
  loadIsMosaicMode,
  saveColorIndex,
  saveIsMosaicMode,
} from "@/helper/asyncStorageHelper";
import { getColorPaletteOptions } from "@/helper/getColorPaletteOptions";
import { useUser } from "@/hooks/useFirebaseUser";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  PixelRatio,
  StyleSheet,
  Switch,
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
  locked?: boolean;
  message?: string;
  progress?: string;
};

interface ColorPaletteOptionsContainerProps {
  colorPaletteOptions: PaletteObj[][];
  initialPage: number;
  selectedIndex: number;
  isMosaic: boolean;
  handleChangeColorPalette: (arg1: number, arg2: boolean) => void;
}

interface MosaicToggleProps {
  isMosaic: boolean;
  handleToggleMosaicMode: (mode: boolean) => void;
}

interface ColorPaletteModalProps {
  progressModalPalette: PaletteObj | null;
  setProgressModalPalette: React.Dispatch<
    React.SetStateAction<PaletteObj | null>
  >;
}

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
  const user = useUser();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedColorPalette, setSelectedColorPalette] =
    useState<PaletteObj | null>(null);
  const [colorPaletteOptions, setColorPaletteOptions] = useState<
    PaletteObj[][] | []
  >([]);
  const [progressModalPalette, setProgressModalPalette] =
    useState<PaletteObj | null>(null);
  const [isMosaic, setIsMosaic] = useState(false);

  const initialPage = Math.floor(selectedIndex / PAGE_SIZE);

  useEffect(() => {
    loadInitialSettings();
  }, []);

  const handleChangeColorPalette = async (
    paletteIndex: number,
    isLocked: boolean
  ) => {
    const selectedPalettePage = Math.floor(paletteIndex / 6);
    const selectedPaletteIndex = paletteIndex % 6;
    if (isLocked) {
      setProgressModalPalette(
        colorPaletteOptions[selectedPalettePage][selectedPaletteIndex]
      );
    } else {
      try {
        await saveColorIndex(paletteIndex);
        setSelectedIndex(paletteIndex);
        setSelectedColorPalette(
          colorPaletteOptions[selectedPalettePage][selectedPaletteIndex]
        );
      } catch (err) {
        console.log("error changing color ", err);
      }
    }
  };

  const handleToggleMosaicMode = async (mode: boolean) => {
    setIsMosaic(mode);
    await saveIsMosaicMode(mode);
  };

  async function loadInitialSettings() {
    try {
      const savedIndex = (await loadColorIndex()) ?? 0;
      const isMosaic = (await loadIsMosaicMode()) ?? false;
      let colorOptions = await loadColorPaletteOptions();
      if (!colorOptions) {
        const currentCriteriaMap = await loadCriteriaMap();
        if (currentCriteriaMap) {
          colorOptions = await getColorPaletteOptions(currentCriteriaMap);
          setSelectedColorPalette(colorOptions[savedIndex] ?? colorOptions[0]);
          setColorPaletteOptions(chunkArray(colorOptions, PAGE_SIZE));
          setSelectedIndex(savedIndex);
          setIsMosaic(isMosaic);
        }
      } else {
        setSelectedColorPalette(colorOptions[savedIndex] ?? colorOptions[0]);
        setColorPaletteOptions(chunkArray(colorOptions, PAGE_SIZE));
        setSelectedIndex(savedIndex);
        setIsMosaic(isMosaic);
      }
    } catch (e) {
      setSelectedIndex(0);
      setSelectedColorPalette(null);
    }
  }

  return (
    <ThemedView style={[styles.container]}>
      <ThemedText style={styles.optionText} type="subtitle">
        Selected Color
      </ThemedText>

      {/* preview of current selection */}
      {!selectedColorPalette ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.paletteCard}>
          <View style={styles.paletteRow}>
            <View
              style={[
                styles.paletteSquare,
                {
                  backgroundColor: selectedColorPalette[3],
                  borderColor: "black",
                  borderWidth: isMosaic ? 1 : 0,
                },
              ]}
            />
            <View
              style={[
                styles.paletteSquare,
                {
                  backgroundColor: selectedColorPalette[4],
                  borderColor: "black",
                  borderWidth: isMosaic ? 1 : 0,
                },
              ]}
            />
          </View>
          <View style={styles.paletteRow}>
            <View
              style={[
                styles.paletteSquare,
                {
                  backgroundColor: selectedColorPalette[0],
                  borderColor: "black",
                  borderWidth: isMosaic ? 1 : 0,
                },
              ]}
            />
            <View
              style={[
                styles.paletteSquare,
                {
                  backgroundColor: selectedColorPalette[1],
                  borderColor: "black",
                  borderWidth: isMosaic ? 1 : 0,
                },
              ]}
            />
            <View
              style={[
                styles.paletteSquare,
                {
                  backgroundColor: selectedColorPalette[2],
                  borderColor: "black",
                  borderWidth: isMosaic ? 1 : 0,
                },
              ]}
            />
          </View>
        </View>
      )}

      <ThemedText
        style={[styles.optionText, { marginTop: 12 }]}
        type="subtitle"
      >
        Color Options
      </ThemedText>

      {colorPaletteOptions.length === 0 ? (
        <ActivityIndicator />
      ) : (
        <ColorPaletteOptionsContainer
          colorPaletteOptions={colorPaletteOptions}
          initialPage={initialPage}
          selectedIndex={selectedIndex}
          isMosaic={isMosaic}
          handleChangeColorPalette={handleChangeColorPalette}
        />
      )}
      <ToggleMosaicBorders
        isMosaic={isMosaic}
        handleToggleMosaicMode={handleToggleMosaicMode}
      />
      {progressModalPalette && (
        <ColorPaletteProgressModal
          progressModalPalette={progressModalPalette}
          setProgressModalPalette={setProgressModalPalette}
        />
      )}
    </ThemedView>
  );
}

const ColorPaletteOptionsContainer = (
  props: ColorPaletteOptionsContainerProps
) => {
  const {
    colorPaletteOptions,
    initialPage,
    selectedIndex,
    isMosaic,
    handleChangeColorPalette,
  } = props;

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: initialPage,
        animated: false, // no animation so it feels like initial load
      });
    }
  }, [initialPage]);

  return (
    <FlatList
      data={colorPaletteOptions}
      ref={flatListRef}
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
      initialScrollIndex={initialPage}
      renderItem={({ item: pagePalettes, index: pageIndex }) => (
        <View style={[{ width: SCREEN_WIDTH }]}>
          {/* First row */}
          <View style={styles.row}>
            {pagePalettes.slice(0, 3).map((palette: PaletteObj, i: number) => {
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
                  onPress={() =>
                    handleChangeColorPalette(
                      paletteIndex,
                      palette.locked ?? false
                    )
                  }
                  activeOpacity={0.7}
                >
                  {palette.locked && (
                    <ThemedText
                      style={{
                        position: "absolute",
                        zIndex: 2,
                        top: 20,
                        fontSize: 20,
                        fontWeight: "bold",
                      }}
                    >
                      ?
                    </ThemedText>
                  )}
                  <View style={styles.paletteRow}>
                    <View
                      style={[
                        styles.paletteSquare,
                        {
                          backgroundColor: palette.locked
                            ? "black"
                            : palette[3],
                          borderColor: "black",
                          borderWidth: isMosaic ? 1 : 0,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.paletteSquare,
                        {
                          backgroundColor: palette.locked
                            ? "black"
                            : palette[4],
                          borderColor: "black",
                          borderWidth: isMosaic ? 1 : 0,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.paletteRow}>
                    <View
                      style={[
                        styles.paletteSquare,
                        {
                          backgroundColor: palette.locked
                            ? "black"
                            : palette[0],
                          borderColor: "black",
                          borderWidth: isMosaic ? 1 : 0,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.paletteSquare,
                        {
                          backgroundColor: palette.locked
                            ? "black"
                            : palette[1],
                          borderColor: "black",
                          borderWidth: isMosaic ? 1 : 0,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.paletteSquare,
                        {
                          backgroundColor: palette.locked
                            ? "black"
                            : palette[2],
                          borderColor: "black",
                          borderWidth: isMosaic ? 1 : 0,
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Second row */}
          <View style={styles.row}>
            {pagePalettes.slice(3, 6).map((palette: PaletteObj, i: number) => {
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
                  onPress={() =>
                    handleChangeColorPalette(
                      paletteIndex,
                      palette.locked ?? false
                    )
                  }
                  activeOpacity={0.7}
                >
                  {palette.locked && (
                    <ThemedText
                      style={{
                        position: "absolute",
                        zIndex: 2,
                        top: 20,
                        fontSize: 20,
                        fontWeight: "bold",
                      }}
                    >
                      ?
                    </ThemedText>
                  )}
                  <View style={styles.paletteRow}>
                    <View
                      style={[
                        styles.paletteSquare,
                        {
                          backgroundColor: palette.locked
                            ? "black"
                            : palette[3],
                          borderColor: "black",
                          borderWidth: isMosaic ? 1 : 0,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.paletteSquare,
                        {
                          backgroundColor: palette.locked
                            ? "black"
                            : palette[4],
                          borderColor: "black",
                          borderWidth: isMosaic ? 1 : 0,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.paletteRow}>
                    <View
                      style={[
                        styles.paletteSquare,
                        {
                          backgroundColor: palette.locked
                            ? "black"
                            : palette[0],
                          borderColor: "black",
                          borderWidth: isMosaic ? 1 : 0,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.paletteSquare,
                        {
                          backgroundColor: palette.locked
                            ? "black"
                            : palette[1],
                          borderColor: "black",
                          borderWidth: isMosaic ? 1 : 0,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.paletteSquare,
                        {
                          backgroundColor: palette.locked
                            ? "black"
                            : palette[2],
                          borderColor: "black",
                          borderWidth: isMosaic ? 1 : 0,
                        },
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
  );
};

const ToggleMosaicBorders = (props: MosaicToggleProps) => {
  const { isMosaic, handleToggleMosaicMode } = props;
  return (
    <>
      <ThemedText>Square Borders</ThemedText>
      <Switch
        trackColor={{ false: "#767577", true: "#81b0ff" }}
        thumbColor={isMosaic ? "#f5dd4b" : "#f4f3f4"}
        ios_backgroundColor="#3e3e3e"
        onValueChange={(e) => handleToggleMosaicMode(e)}
        value={isMosaic}
      />
    </>
  );
};

const ColorPaletteProgressModal = (props: ColorPaletteModalProps) => {
  const { progressModalPalette, setProgressModalPalette } = props;
  return (
    <Modal
      onRequestClose={() => setProgressModalPalette(null)}
      transparent
      animationType="fade"
    >
      <ThemedView style={styles.centeredView}>
        <ThemedText>{progressModalPalette?.message}</ThemedText>
        <ThemedText>Progress: {progressModalPalette?.progress}</ThemedText>
        <ThemedView style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <TouchableOpacity onPress={() => setProgressModalPalette(null)}>
            <ThemedText>Close</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20 },
  centeredView: {
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
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
  optionText: { marginTop: 5, marginBottom: 5, textAlign: "center" },
  paletteRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  paletteSquare: {
    width: PixelRatio.roundToNearestPixel(25),
    height: PixelRatio.roundToNearestPixel(25),
  },
  paletteCard: {
    position: "relative",
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedCard: {
    borderColor: "white",
  },
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
