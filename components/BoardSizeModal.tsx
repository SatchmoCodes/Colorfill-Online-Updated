import { View, Text, Modal, TouchableOpacity } from "react-native";
import React from "react";
import { ThemedText } from "./ThemedText";
import { StyleSheet } from "react-native";
import { ThemedView } from "./ThemedView";
import { BoardSize } from "@/app/freeplay";
import { RadioButton } from "react-native-paper";

interface ModalProps {
  setShowBoardSizeModal: React.Dispatch<React.SetStateAction<boolean>>;
  setBoardSize: React.Dispatch<React.SetStateAction<BoardSize>>;
  boardSize: BoardSize;
  newBoardProcess: () => void;
}

const boardSizeOptions: BoardSize[] = ["Small", "Medium", "Large"];

export default function BoardSizeModal(props: ModalProps) {
  const { boardSize, setBoardSize, setShowBoardSizeModal, newBoardProcess } =
    props;

  return (
    <Modal transparent animationType="fade">
      <ThemedView style={styles.centeredView}>
        <ThemedText type="title">Choose board size</ThemedText>
        <ThemedView>
          <RadioButton.Group
            onValueChange={(newValue) => setBoardSize(newValue as BoardSize)}
            value={boardSize}
          >
            {boardSizeOptions.map((option, i) => {
              return (
                <RadioButton.Item
                  label={option}
                  value={option}
                  key={i}
                ></RadioButton.Item>
              );
            })}
          </RadioButton.Group>
        </ThemedView>
        <ThemedView style={styles.buttonView}>
          <TouchableOpacity
            style={[styles.modalButtons, styles.confirmButton]}
            onPress={() => {
              newBoardProcess();
              setShowBoardSizeModal(false);
            }}
          >
            <ThemedText style={styles.buttonText}>Confirm</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButtons, styles.cancelButton]}
            onPress={() => setShowBoardSizeModal(false)}
          >
            <ThemedText style={styles.buttonText}>Cancel</ThemedText>
          </TouchableOpacity>
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
    backgroundColor: "white",
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
  buttonText: {
    color: "white",
  },
});
