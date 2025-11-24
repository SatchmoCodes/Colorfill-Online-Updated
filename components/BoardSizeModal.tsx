import { BoardSize } from "@/app/(protected)/freeplay";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";

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
    <View style={[styles.centeredView]}>
      <ThemedText
        style={{ textAlign: "center", marginBottom: 90 }}
        type="title"
      >
        Choose board size
      </ThemedText>
      <View
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
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
