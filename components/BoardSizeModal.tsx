import { BoardSize } from "@/app/(protected)/freeplay";
import React from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { IconSymbol } from "./ui/IconSymbol";

interface ModalProps {
  setShowBoardSizeModal: React.Dispatch<React.SetStateAction<boolean>>;
  setBoardSize: React.Dispatch<React.SetStateAction<BoardSize>>;
  boardSize: BoardSize;
  newBoardProcess: (size: BoardSize) => void;
}

const boardSizeOptions: BoardSize[] = ["small", "medium", "large"];

export default function BoardSizeModal(props: ModalProps) {
  const { setBoardSize, setShowBoardSizeModal, newBoardProcess } = props;

  const theme = useColorScheme() ?? "light";
  console.log("theme", theme);

  return (
    <Modal
      onRequestClose={() => setShowBoardSizeModal(false)}
      transparent
      animationType="fade"
    >
      <ThemedView
        style={[
          styles.centeredView,
          // {
          //   backgroundColor: theme === "dark" ? "#151718" : "white",
          //   position: "relative",
          // },
        ]}
      >
        <TouchableOpacity
          style={{ position: "absolute", top: 5, right: 5 }}
          onPress={() => setShowBoardSizeModal(false)}
        >
          <IconSymbol size={28} name="clear.fill" color={"white"} />
        </TouchableOpacity>

        <ThemedText type="title">Choose board size</ThemedText>
        <ThemedView style={{ gap: 10, marginBottom: 20, marginTop: 20 }}>
          {boardSizeOptions.map((option, i) => {
            return (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setBoardSize(option);
                  newBoardProcess(option);
                }}
                style={{
                  backgroundColor: "gray",
                  borderRadius: 30,
                  padding: 5,
                }}
              >
                <ThemedText style={{ textAlign: "center" }}>
                  {option}
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
  buttonText: {
    color: "white",
  },
});
