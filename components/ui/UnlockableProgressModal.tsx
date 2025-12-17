import { PaletteObj } from "@/app/(protected)/settings";
import { ThemedView } from "@/components/ThemedView";
import React from "react";
import {
  Modal,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "../ThemedText";
import { IconSymbol } from "./IconSymbol";

export default function UnlockableProgressModal({
  colorPaletteOptions,
  isMosaic,
  setUnlockableProgressModal,
}: {
  colorPaletteOptions: PaletteObj[];
  isMosaic: boolean;
  setUnlockableProgressModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <Modal
      onRequestClose={() => setUnlockableProgressModal(false)}
      transparent
      animationType="slide"
    >
      <ThemedView style={styles.modalBody}>
        <ThemedView style={styles.fixedHeader}>
          <TouchableOpacity
            style={{ position: "absolute", top: 50, right: 10 }}
            onPress={() => setUnlockableProgressModal(false)}
          >
            <IconSymbol size={28} name="clear.fill" color={"white"} />
          </TouchableOpacity>
        </ThemedView>
        <ThemedView style={{ padding: 20 }}>
          <ThemedText type="subtitle" style={{ textAlign: "center" }}>
            Full Unlockable List (
            {colorPaletteOptions.filter((x) => !x.locked).length}/
            {colorPaletteOptions.length})
          </ThemedText>
        </ThemedView>

        <ScrollView>
          <ThemedView style={styles.container}>
            <View style={{ gap: 20 }}>
              {colorPaletteOptions.slice(3).map((x, i) => (
                <View key={i} style={styles.tableRow}>
                  <View style={[styles.paletteCard, { flexBasis: "25%" }]}>
                    {x.locked && (
                      <ThemedText
                        style={{
                          position: "absolute",
                          zIndex: 2,
                          top: 10,
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
                            backgroundColor: x.locked ? "black" : x[3],
                            borderColor: "black",
                            borderWidth: isMosaic ? 1 : 0,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.paletteSquare,
                          {
                            backgroundColor: x.locked ? "black" : x[4],
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
                            backgroundColor: x.locked ? "black" : x[0],
                            borderColor: "black",
                            borderWidth: isMosaic ? 1 : 0,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.paletteSquare,
                          {
                            backgroundColor: x.locked ? "black" : x[1],
                            borderColor: "black",
                            borderWidth: isMosaic ? 1 : 0,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.paletteSquare,
                          {
                            backgroundColor: x.locked ? "black" : x[2],
                            borderColor: "black",
                            borderWidth: isMosaic ? 1 : 0,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <View
                    style={{
                      flexGrow: 1,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        color: "white",
                        textAlign: "center",
                        fontSize: 12,
                        maxWidth: 150,
                      }}
                    >
                      {x.message}
                    </Text>
                  </View>
                  <View style={{ flexBasis: "20%", justifyContent: "center" }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        color: "white",
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      {!x.locked ? "Complete" : x.progress}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fixedHeader: {
    width: "100%",
    justifyContent: "center", // Center content vertically
    alignItems: "flex-end", // Align content horizontally to the end (right)
    paddingRight: 10,
    zIndex: 10, // Ensure it's above the scroll view content
    paddingTop: 60,
  },
  container: {
    flex: 1,
    padding: 10,
    maxWidth: 500,
    width: "100%",
    margin: "auto",
    paddingBottom: 60,
  },
  modalBody: {
    width: "100%",
    flex: 1,
    margin: "auto",
  },
  paletteRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  paletteSquare: {
    width: PixelRatio.roundToNearestPixel(20),
    height: PixelRatio.roundToNearestPixel(20),
  },
  paletteCard: {
    position: "relative",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
