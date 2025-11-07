import { BoardSize } from "@/app/(protected)/freeplay";
import React from "react";
import { Modal, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { IconSymbol } from "./ui/IconSymbol";

interface ModalProps {
  setShowBoardSizeModal: React.Dispatch<React.SetStateAction<boolean>>;
  setBoardSize: React.Dispatch<React.SetStateAction<BoardSize>>;
  boardSize: BoardSize;
  newBoardProcess: (size: BoardSize) => void;
}

const sizeMap = {
  small: "S",
  medium: "M",
  large: "L",
  xlarge: "XL",
};

const boardSizeOptions: BoardSize[] = ["small", "medium", "large", "xlarge"];

export default function BoardSizeModal(props: ModalProps) {
  const { boardSize, setBoardSize, setShowBoardSizeModal, newBoardProcess } =
    props;

  console.log("size", boardSize);

  return (
    <Modal
      onRequestClose={() => setShowBoardSizeModal(false)}
      transparent
      animationType="fade"
    >
      <ThemedView style={[styles.centeredView]}>
        <TouchableOpacity
          style={{ position: "absolute", top: 5, right: 5 }}
          onPress={() => setShowBoardSizeModal(false)}
        >
          <IconSymbol size={28} name="clear.fill" color={"white"} />
        </TouchableOpacity>

        <ThemedText style={{ marginBottom: 90 }} type="title">
          Choose board size
        </ThemedText>
        <ThemedView
          style={{
            flexDirection: "row",
            gap: 20,
            alignItems: "center",
          }}
        >
          {boardSizeOptions.map((option, i) => {
            return (
              <TouchableOpacity
                style={[
                  styles.sizeButton,
                  { opacity: boardSize === option ? 0.5 : 1 },
                ]}
                key={i}
                onPress={() => {
                  if (boardSize === option) return;
                  setBoardSize(option);
                  newBoardProcess(option);
                }}
              >
                <ThemedText
                  style={{
                    textAlign: "center",
                    fontSize: 28,
                    fontWeight: "bold",
                    lineHeight: 36,
                    paddingVertical: 4,
                    color: "#fff",
                  }}
                >
                  {sizeMap[option]}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    // flex: 1,
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
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
  buttonView: {
    flexDirection: "row",
    gap: 10,
  },
  modalButtons: {
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 30,
    padding: 5,
  },
  confirmButton: {
    backgroundColor: "green",
  },
  cancelButton: {
    backgroundColor: "red",
  },
  sizeButton: {
    backgroundColor: "#448ee2ff",
    padding: 5,
    width: 50,
  },
  buttonText: {
    color: "white",
  },
});
