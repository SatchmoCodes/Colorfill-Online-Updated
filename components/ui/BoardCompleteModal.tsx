import { BoardSize } from "@/app/(protected)/freeplay";
import React from "react";
import { ActivityIndicator, Modal, StyleSheet } from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import CommonButton from "./CommonButton";

interface ModalProps {
  setShowBoardCompleteModal: React.Dispatch<React.SetStateAction<boolean>>;
  newBoardProcess: (size: BoardSize) => void;
  resetBoardProcess: () => void;
  boardSize: BoardSize;
  score: number;
  currentBestScore: number;
  loadingSetScore: boolean;
  isReplayingBoard: boolean;
}

export default function BoardCompleteModal(props: ModalProps) {
  const {
    setShowBoardCompleteModal,
    newBoardProcess,
    resetBoardProcess,
    boardSize,
    score,
    currentBestScore,
    loadingSetScore,
    isReplayingBoard,
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
            {isReplayingBoard && currentBestScore > 0 ? (
              <ThemedText>
                {score < currentBestScore
                  ? `You beat the previous best score in ${score} turns!`
                  : "You did not beat the previous best score!"}
              </ThemedText>
            ) : (
              <ThemedText style={{ marginBottom: 30 }} type="subtitle">
                You completed the board in {score} turns!
              </ThemedText>
            )}

            <ThemedView
              style={{ flexDirection: "row", gap: 10, marginTop: 10 }}
            >
              <CommonButton
                title="New Board"
                size={150}
                handlePress={() => {
                  newBoardProcess(boardSize);
                  setShowBoardCompleteModal(false);
                }}
              />
              <CommonButton
                title="Retry Board"
                size={150}
                handlePress={() => {
                  resetBoardProcess();
                  setShowBoardCompleteModal(false);
                }}
              />
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
