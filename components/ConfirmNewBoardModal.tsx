import { BoardSize } from "@/app/(protected)/freeplay";
import React from "react";
import { StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import CommonButton from "./ui/CommonButton";

export default function ConfirmNewBoardModal({
  boardSize,
  setShowConfirmModal,
  newBoardProcess,
}: {
  boardSize: BoardSize;
  setShowConfirmModal: React.Dispatch<React.SetStateAction<boolean>>;
  newBoardProcess: (size: BoardSize) => void;
}) {
  return (
    <ThemedView style={styles.centeredView}>
      <>
        <ThemedText
          style={{ textAlign: "center", marginBottom: 30 }}
          type="subtitle"
        >
          Are you sure you want a new board?
        </ThemedText>
        <ThemedView style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <CommonButton
            title="Yes"
            size={150}
            handlePress={() => {
              newBoardProcess(boardSize);
              setShowConfirmModal(false);
            }}
          />
          <CommonButton
            title="Cancel"
            size={150}
            handlePress={() => {
              setShowConfirmModal(false);
            }}
          />
        </ThemedView>
      </>
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
