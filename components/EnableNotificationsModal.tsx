import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export default function EnableNotificationsModal({
  visible,
  onAllow,
  onCancel,
}: {
  visible: boolean;
  onAllow: () => void;
  onCancel: () => void;
}) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Enable Notifications</ThemedText>
      <ThemedText style={styles.body}>
        To invite other players to games or receive game invites, notification
        permissions are required.
      </ThemedText>

      <TouchableOpacity style={styles.button} onPress={onAllow}>
        <ThemedText style={styles.buttonText}>Enable Notifications</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity onPress={onCancel}>
        <ThemedText style={styles.cancelText}>Not now</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
  cancelText: {
    textAlign: "center",
    color: "#777",
  },
});
