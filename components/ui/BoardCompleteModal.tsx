import { BoardSize } from "@/app/(protected)/freeplay";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

interface ModalProps {
  setShowBoardCompleteModal: React.Dispatch<React.SetStateAction<boolean>>;
  newBoardProcess: (size: BoardSize) => void;
  resetBoardProcess: () => void;
  boardSize: BoardSize;
  score: number;
  currentBestScore: number;
  hasGeneratedNewBoard: boolean;
  loadingSetScore: boolean;
}

export default function BoardCompleteModal(props: ModalProps) {
  const {
    setShowBoardCompleteModal,
    newBoardProcess,
    resetBoardProcess,
    boardSize,
    score,
    currentBestScore,
    hasGeneratedNewBoard,
    loadingSetScore,
  } = props;

  return (
    <Modal
      onRequestClose={() => setShowBoardCompleteModal(false)}
      transparent
      animationType="slide"
    >
      <ThemedView style={styles.centeredView}>
        {loadingSetScore ? (
          <ActivityIndicator />
        ) : (
          <>
            {!hasGeneratedNewBoard && currentBestScore > 0 ? (
              <ThemedText>
                {score < currentBestScore
                  ? `You beat the previous best score in ${score} turns!`
                  : "You did not beat the previous best score!"}
              </ThemedText>
            ) : (
              <ThemedText>You completed the board in {score} turns!</ThemedText>
            )}

            <ThemedView
              style={{ flexDirection: "row", gap: 10, marginTop: 10 }}
            >
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
          </>
        )}
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
