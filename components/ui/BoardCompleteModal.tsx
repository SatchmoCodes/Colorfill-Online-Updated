import { Modal, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import { ThemedView } from "../ThemedView";
import { ThemedText } from "../ThemedText";
import { BoardSize } from "@/app/freeplay";

interface ModalProps {
  setShowBoardCompleteModal: React.Dispatch<React.SetStateAction<boolean>>;
  newBoardProcess: (size: BoardSize) => void;
  resetBoardProcess: () => void;
  boardSize: BoardSize;
  score: number;
}

export default function BoardCompleteModal(props: ModalProps) {
  const {
    setShowBoardCompleteModal,
    newBoardProcess,
    resetBoardProcess,
    boardSize,
    score,
  } = props;

  return (
    <Modal
      onRequestClose={() => setShowBoardCompleteModal(false)}
      transparent
      animationType="slide"
    >
      <ThemedView style={styles.centeredView}>
        <ThemedText>You completed the board in {score} turns!</ThemedText>
        <ThemedView style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              newBoardProcess(boardSize);
              setShowBoardCompleteModal(false);
            }}
          >
            <ThemedText>New Board</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              resetBoardProcess();
              setShowBoardCompleteModal(false);
            }}
          >
            <ThemedText>Retry Board</ThemedText>
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
  button: {
    borderRadius: 30,
    backgroundColor: "gray",
    padding: 10,
  },
});
