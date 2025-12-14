import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import CommonButton from "@/components/ui/CommonButton";
import { IconSymbol } from "@/components/ui/IconSymbol";
import UnlockableProgressModal from "@/components/ui/UnlockableProgressModal";
import {
  loadColorIndex,
  loadColorPaletteOptions,
  loadCriteriaMap,
  loadIsMosaicMode,
  loadPopSoundVolume,
  loadShowSquareCounter,
  saveColorIndex,
  saveIsMosaicMode,
  saveShowSquareCounter,
} from "@/helper/asyncStorageHelper";
//@ts-ignore
import { setSoundVolume } from "@/helper/audio/soundManager";
import { getColorPaletteOptions } from "@/helper/getColorPaletteOptions";
import { getWindowHeight } from "@/helper/getWindowHeight";
import { updateCriteriaMap } from "@/helper/updateCriteriaMap";
import Slider from "@react-native-community/slider";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  FlatListProps,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PixelRatio,
  Platform,
  ScrollView,
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
  key?: string;
};

type PaletteCardProps = {
  palette: PaletteObj;
  index: number;
  isSelected: boolean;
  isMosaic: boolean;
  onSelect: (index: number, locked: boolean) => void;
};

interface ColorPaletteOptionsContainerProps {
  colorPaletteOptions: PaletteObj[][];
  initialPage: number;
  selectedIndex: number;
  isMosaic: boolean;
  handleChangeColorPalette: (arg1: number, arg2: boolean) => void;
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

const AnimatedFlatList =
  Animated.createAnimatedComponent<
    React.ComponentType<FlatListProps<PaletteObj[]>>
  >(FlatList);

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function Settings() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedColorPalette, setSelectedColorPalette] =
    useState<PaletteObj | null>(null);
  const [colorPaletteOptions, setColorPaletteOptions] = useState<
    PaletteObj[][] | []
  >([]);
  const [progressModalPalette, setProgressModalPalette] =
    useState<PaletteObj | null>(null);
  const [isMosaic, setIsMosaic] = useState(false);
  const [showSquareCounter, setShowSquareCounter] = useState(false);
  const [unlockableProgressMdoal, setUnlockableProgressModal] = useState(false);
  const [captureAudioLevel, setCaptureAudioLevel] = useState(0.25);

  const isSmallDevice = getWindowHeight() <= 720;

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

  const handleToggleShowSquareCounter = async (mode: boolean) => {
    setShowSquareCounter(mode);
    await saveShowSquareCounter(mode);
  };

  async function loadInitialSettings() {
    try {
      const savedIndex = (await loadColorIndex()) ?? 0;
      const isMosaic = (await loadIsMosaicMode()) ?? false;
      const shouldShowSquareCounter = (await loadShowSquareCounter()) ?? true;
      const currentCriteriaMap =
        (await loadCriteriaMap()) ?? (await updateCriteriaMap({}));
      const popAudioLevel = (await loadPopSoundVolume()) ?? 0.25;
      let colorOptions =
        (await loadColorPaletteOptions()) ??
        (await getColorPaletteOptions(currentCriteriaMap));
      setSelectedColorPalette(colorOptions?.[savedIndex] ?? colorOptions[0]);
      setColorPaletteOptions(chunkArray(colorOptions, PAGE_SIZE));
      setSelectedIndex(savedIndex);
      setIsMosaic(isMosaic);
      setShowSquareCounter(shouldShowSquareCounter);
      setCaptureAudioLevel(popAudioLevel);
    } catch (e) {
      setSelectedIndex(0);
      setSelectedColorPalette(null);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{ alignItems: "center" }}
      style={[styles.container]}
    >
      <View style={{ minHeight: 100, justifyContent: "center" }}>
        {!selectedColorPalette ? (
          <ActivityIndicator />
        ) : (
          <>
            <ThemedText type="subtitle">Selected Color</ThemedText>
            <View style={[styles.paletteCard]}>
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
          </>
        )}
      </View>

      <ThemedText
        style={[styles.optionText, { marginTop: 12 }]}
        type="subtitle"
      >
        Color Options
      </ThemedText>

      <View
        style={{
          minHeight: 220,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {colorPaletteOptions.length === 0 ? (
          <ActivityIndicator />
        ) : Platform.OS === "web" ? (
          <ColorPaletteOptionsWebView
            colorPaletteOptions={colorPaletteOptions}
            isMosaic={isMosaic}
            selectedIndex={selectedIndex}
            handleChangeColorPalette={handleChangeColorPalette}
          />
        ) : (
          <ColorPaletteOptionsContainer
            colorPaletteOptions={colorPaletteOptions}
            initialPage={initialPage}
            selectedIndex={selectedIndex}
            isMosaic={isMosaic}
            handleChangeColorPalette={handleChangeColorPalette}
          />
        )}
      </View>

      <View style={{ marginBottom: 30 }}>
        <TouchableOpacity
          style={styles.unlockableButton}
          onPress={() => setUnlockableProgressModal(true)}
        >
          <ThemedText style={{ fontWeight: "bold" }}>
            View Unlockables
          </ThemedText>
        </TouchableOpacity>
        <ThemedText></ThemedText>
      </View>
      <ThemedText style={{ marginBottom: 30 }} type="subtitle">
        General Settings
      </ThemedText>
      <ThemedView style={{ marginBottom: 10 }}>
        <ThemedText>Show Square Borders</ThemedText>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isMosaic ? "#f5dd4b" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={(e) => handleToggleMosaicMode(e)}
          style={{ margin: "auto" }}
          value={isMosaic}
        />
      </ThemedView>
      {!isSmallDevice && (
        <ThemedView style={{ marginBottom: 10 }}>
          <ThemedText>Show Square Counter</ThemedText>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={showSquareCounter ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={(e) => handleToggleShowSquareCounter(e)}
            style={{ margin: "auto" }}
            value={showSquareCounter}
          />
        </ThemedView>
      )}
      <ThemedView style={{ paddingBottom: 30 }}>
        <ThemedText style={{ textAlign: "center" }}>
          Square Capture Audio
        </ThemedText>
        <TouchableOpacity
          onPress={() => {
            if (captureAudioLevel > 0) {
              setCaptureAudioLevel(0);
              setSoundVolume(0, false);
            } else {
              setCaptureAudioLevel(0.1);
              setSoundVolume(0.1, true);
            }
          }}
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          {captureAudioLevel === 0 && (
            <IconSymbol
              style={{ textAlign: "center" }}
              name="speaker.slash.fill"
              size={36}
              color={"white"}
            />
          )}
          {captureAudioLevel > 0 && captureAudioLevel < 0.125 && (
            <IconSymbol
              style={{ textAlign: "center" }}
              name="speaker.1.fill"
              size={36}
              color={"white"}
            />
          )}
          {captureAudioLevel >= 0.125 && (
            <IconSymbol
              style={{ textAlign: "center" }}
              name="speaker.2.fill"
              size={36}
              color={"white"}
            />
          )}
        </TouchableOpacity>
        <Slider
          style={{ width: 200, height: 40 }}
          value={captureAudioLevel}
          minimumValue={0}
          maximumValue={0.25}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="#000000"
          onValueChange={(value) => setCaptureAudioLevel(value)}
          onSlidingComplete={(value) => {
            if (value !== 0) {
              console.log("value", value);
              setSoundVolume(value, true);
            }
          }}
        />
      </ThemedView>
      {progressModalPalette && (
        <ColorPaletteProgressModal
          progressModalPalette={progressModalPalette}
          setProgressModalPalette={setProgressModalPalette}
        />
      )}
      {unlockableProgressMdoal && (
        <UnlockableProgressModal
          colorPaletteOptions={colorPaletteOptions.flat()}
          isMosaic={isMosaic}
          setUnlockableProgressModal={setUnlockableProgressModal}
        />
      )}
    </ScrollView>
  );
}

const ColorPaletteOptionsWebView = ({
  colorPaletteOptions,
  isMosaic,
  selectedIndex,
  handleChangeColorPalette,
}: {
  colorPaletteOptions: PaletteObj[][];
  isMosaic: boolean;
  selectedIndex: number;
  handleChangeColorPalette: (paletteIndex: number, isLocked: boolean) => void;
}) => {
  const colorOptions = colorPaletteOptions.flat();
  return (
    <View
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 30, width: "80%" }}
    >
      {colorOptions.map((palette, paletteIndex) => {
        const isSelected = selectedIndex === paletteIndex;
        return (
          <TouchableOpacity
            key={paletteIndex}
            style={[
              styles.paletteCard,
              isSelected && styles.selectedCard,
              { padding: 10 },
            ]}
            onPress={() =>
              handleChangeColorPalette(paletteIndex, palette.locked ?? false)
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
                    backgroundColor: palette.locked ? "black" : palette[3],
                    borderColor: "black",
                    borderWidth: isMosaic ? 1 : 0,
                  },
                ]}
              />
              <View
                style={[
                  styles.paletteSquare,
                  {
                    backgroundColor: palette.locked ? "black" : palette[4],
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
                    backgroundColor: palette.locked ? "black" : palette[0],
                    borderColor: "black",
                    borderWidth: isMosaic ? 1 : 0,
                  },
                ]}
              />
              <View
                style={[
                  styles.paletteSquare,
                  {
                    backgroundColor: palette.locked ? "black" : palette[1],
                    borderColor: "black",
                    borderWidth: isMosaic ? 1 : 0,
                  },
                ]}
              />
              <View
                style={[
                  styles.paletteSquare,
                  {
                    backgroundColor: palette.locked ? "black" : palette[2],
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
  );
};

const ColorPaletteOptionsContainer = ({
  colorPaletteOptions,
  initialPage,
  selectedIndex,
  isMosaic,
  handleChangeColorPalette,
}: ColorPaletteOptionsContainerProps) => {
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentPage, setCurrentPage] = useState(0);

  // Native-driven scroll
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.setValue(e.nativeEvent.contentOffset.x);
  }, []);

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const page = Math.round(offsetX / SCREEN_WIDTH);
      // Only update if changed
      setCurrentPage((prev) => (prev === page ? prev : page));
    },
    []
  );

  useEffect(() => {
    flatListRef.current?.scrollToIndex({
      index: initialPage,
      animated: false,
    });
  }, [initialPage]);

  const renderItem = useCallback(
    ({
      item: pagePalettes,
      index: pageIndex,
    }: {
      item: PaletteObj[];
      index: number;
    }) => (
      <PalettePage
        pagePalettes={pagePalettes}
        pageIndex={pageIndex}
        selectedIndex={selectedIndex}
        isMosaic={isMosaic}
        onSelect={handleChangeColorPalette}
      />
    ),
    [selectedIndex, isMosaic, handleChangeColorPalette]
  );

  return (
    <>
      <PaginationDots count={colorPaletteOptions.length} scrollX={scrollX} />

      <FlashList
        // @ts-expect-error FlashList typing mismatch
        ref={flatListRef}
        data={colorPaletteOptions}
        horizontal
        pagingEnabled
        estimatedItemSize={SCREEN_WIDTH}
        removeClippedSubViews
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews
        windowSize={3}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={50}
        getItemLayout={(_: any, index: number) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        initialScrollIndex={initialPage}
        style={{ maxHeight: 200 }}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
      />
    </>
  );
};

const PaginationDots = React.memo(
  ({ count, scrollX }: { count: number; scrollX: Animated.Value }) => (
    <View style={styles.paginationContainer}>
      {Array.from({ length: count }).map((_, i) => {
        const inputRange = [
          (i - 1) * SCREEN_WIDTH,
          i * SCREEN_WIDTH,
          (i + 1) * SCREEN_WIDTH,
        ];

        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                transform: [
                  {
                    scale: scrollX.interpolate({
                      inputRange,
                      outputRange: [0.7, 1.4, 0.7],
                      extrapolate: "clamp",
                    }),
                  },
                ],
                opacity: scrollX.interpolate({
                  inputRange,
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: "clamp",
                }),
              },
            ]}
          />
        );
      })}
    </View>
  )
);

const PalettePage = React.memo(
  ({
    pagePalettes,
    pageIndex,
    selectedIndex,
    isMosaic,
    onSelect,
  }: {
    pagePalettes: PaletteObj[];
    pageIndex: number;
    selectedIndex: number;
    isMosaic: boolean;
    onSelect: (arg1: number, arg2: boolean) => void;
  }) => (
    <View style={{ width: SCREEN_WIDTH }}>
      <PaletteRow
        palettes={pagePalettes.slice(0, 3)}
        offset={pageIndex * PAGE_SIZE}
        selectedIndex={selectedIndex}
        isMosaic={isMosaic}
        onSelect={onSelect}
      />
      <PaletteRow
        palettes={pagePalettes.slice(3, 6)}
        offset={pageIndex * PAGE_SIZE + 3}
        selectedIndex={selectedIndex}
        isMosaic={isMosaic}
        onSelect={onSelect}
      />
    </View>
  )
);

const PaletteRow = React.memo(
  ({
    palettes,
    offset,
    selectedIndex,
    isMosaic,
    onSelect,
  }: {
    palettes: PaletteObj[];
    offset: number;
    selectedIndex: number;
    isMosaic: boolean;
    onSelect: (arg1: number, arg2: boolean) => void;
  }) => (
    <View style={styles.row}>
      {palettes.map((palette, i) => {
        const index = offset + i;
        return (
          <PaletteCard
            key={index}
            palette={palette}
            index={index}
            isSelected={index === selectedIndex}
            isMosaic={isMosaic}
            onSelect={onSelect}
          />
        );
      })}
    </View>
  )
);

export const PaletteCard = React.memo(
  ({ palette, index, isSelected, isMosaic, onSelect }: PaletteCardProps) => {
    const borderWidth = isMosaic ? 1 : 0;
    const lockedColor = palette.locked ? "black" : undefined;

    return (
      <TouchableOpacity
        style={[
          styles.paletteCard,
          { width: cardWidth },
          isSelected && styles.selectedCard,
        ]}
        activeOpacity={0.7}
        onPress={() => onSelect(index, palette.locked ?? false)}
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

        {/* Top row */}
        <View style={styles.paletteRow}>
          <View
            style={[
              styles.paletteSquare,
              {
                backgroundColor: lockedColor ?? palette[3],
                borderWidth,
              },
            ]}
          />
          <View
            style={[
              styles.paletteSquare,
              {
                backgroundColor: lockedColor ?? palette[4],
                borderWidth,
              },
            ]}
          />
        </View>

        {/* Bottom row */}
        <View style={styles.paletteRow}>
          <View
            style={[
              styles.paletteSquare,
              {
                backgroundColor: lockedColor ?? palette[0],
                borderWidth,
              },
            ]}
          />
          <View
            style={[
              styles.paletteSquare,
              {
                backgroundColor: lockedColor ?? palette[1],
                borderWidth,
              },
            ]}
          />
          <View
            style={[
              styles.paletteSquare,
              {
                backgroundColor: lockedColor ?? palette[2],
                borderWidth,
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  }
);

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
          <CommonButton
            title="Close"
            size={100}
            handlePress={() => setProgressModalPalette(null)}
          />
        </ThemedView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#151718",
  },
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
  optionText: { marginTop: 10, marginBottom: 10, textAlign: "center" },
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
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginHorizontal: 5,
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
  unlockableButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: "#448ee2ff",
  },
});
