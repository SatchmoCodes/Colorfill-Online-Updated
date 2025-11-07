import { PaletteObj } from "@/app/(protected)/settings";
import React from "react";
import { Modal, PixelRatio, StyleSheet, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import CommonButton from "./ui/CommonButton";

interface ModalProps {
  unlockedColorPalettes: PaletteObj[];
  isMosaic: boolean;
  setUnlockedColorPalettes: React.Dispatch<
    React.SetStateAction<PaletteObj[] | []>
  >;
}

export default function ColorPaletteUnlockModal(props: ModalProps) {
  const { unlockedColorPalettes, isMosaic, setUnlockedColorPalettes } = props;

  return (
    <Modal
      onRequestClose={() => setUnlockedColorPalettes([])}
      transparent
      animationType="fade"
      style={styles.modalStyle}
    >
      <ThemedView style={styles.centeredView}>
        <ThemedText type="subtitle">
          {unlockedColorPalettes.length === 1
            ? "You unlocked a new color palette!"
            : `You unlocked ${unlockedColorPalettes.length} new color palettes!`}
        </ThemedText>
        <View style={styles.paletteContainer}>
          {unlockedColorPalettes.map((item) => {
            return (
              <View style={styles.paletteCard} key={item.key}>
                <View style={styles.paletteRow}>
                  <View
                    style={[
                      styles.paletteSquare,
                      {
                        backgroundColor: item[3],
                        borderColor: "black",
                        borderWidth: isMosaic ? 1 : 0,
                      },
                    ]}
                  ></View>
                  <View
                    style={[
                      styles.paletteSquare,
                      {
                        backgroundColor: item[4],
                        borderColor: "black",
                        borderWidth: isMosaic ? 1 : 0,
                      },
                    ]}
                  ></View>
                </View>
                <View style={styles.paletteRow}>
                  <View
                    style={[
                      styles.paletteSquare,
                      {
                        backgroundColor: item[0],
                        borderColor: "black",
                        borderWidth: isMosaic ? 1 : 0,
                      },
                    ]}
                  ></View>
                  <View
                    style={[
                      styles.paletteSquare,
                      {
                        backgroundColor: item[1],
                        borderColor: "black",
                        borderWidth: isMosaic ? 1 : 0,
                      },
                    ]}
                  ></View>
                  <View
                    style={[
                      styles.paletteSquare,
                      {
                        backgroundColor: item[2],
                        borderColor: "black",
                        borderWidth: isMosaic ? 1 : 0,
                      },
                    ]}
                  ></View>
                </View>
              </View>
            );
          })}
        </View>
        <CommonButton
          title="Close"
          size={80}
          handlePress={() => setUnlockedColorPalettes([])}
        />
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalStyle: {
    width: 200,
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
  paletteContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  paletteCard: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  paletteRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  paletteSquare: {
    width: PixelRatio.roundToNearestPixel(25),
    height: PixelRatio.roundToNearestPixel(25),
  },
  button: {
    borderRadius: 30,
    backgroundColor: "gray",
    padding: 10,
  },
});
