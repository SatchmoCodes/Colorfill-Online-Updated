import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "../ThemedText";

export default function CommonButton({
  title,
  size,
  handlePress,
}: {
  title: string;
  size: number;
  handlePress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => handlePress()}
      style={[styles.createButton, { width: size }]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={["#ff7e5f", "#feb47b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});
