import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { ThemedText } from "../ThemedText";

export default function CommonButton({
  title,
  size,
  style,
  firstColor,
  secondColor,
  handlePress,
}: {
  title: string;
  size: number;
  style?: StyleProp<ViewStyle>;
  firstColor?: string;
  secondColor?: string;
  handlePress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => handlePress()}
      style={[style, styles.createButton, { width: size }]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[firstColor ?? "#448ee2ff", secondColor ?? "#162c44ff"]}
        style={[styles.createButtonBackground]}
      >
        <ThemedText style={styles.createButtonText}>{title}</ThemedText>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  createButton: {
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // Android shadow
  },
  createButtonBackground: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
});
