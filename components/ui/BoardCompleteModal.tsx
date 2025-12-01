import { BoardSize } from "@/app/(protected)/freeplay";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
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
    <ThemedView style={styles.centeredView}>
      {loadingSetScore ? (
        <View style={{ justifyContent: "space-between", minHeight: 60 }}>
          <ThemedText style={{ textAlign: "center" }}>
            Saving Score...
          </ThemedText>
          <ActivityIndicator />
        </View>
      ) : (
        <>
          {isReplayingBoard && currentBestScore > 0 ? (
            <ThemedText style={{ textAlign: "center" }}>
              {score < currentBestScore
                ? `You beat the previous best score in ${score} turns!`
                : "You did not beat the previous best score!"}
            </ThemedText>
          ) : (
            <ThemedText
              style={{ textAlign: "center", marginBottom: 30 }}
              type="subtitle"
            >
              You completed the board in {score} turns!
            </ThemedText>
          )}

          <ThemedView style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
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
  );
}

const styles = StyleSheet.create({
  centeredView: {
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
  },
});
