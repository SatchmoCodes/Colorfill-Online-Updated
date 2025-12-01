import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "./ThemedText";
import { IconSymbol } from "./ui/IconSymbol";

interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
  contentStyle?: object;
  containerStyle?: object;
}

export default function BaseModal({
  visible,
  onClose,
  children,
  title,
  showCloseButton = true,
  contentStyle,
  containerStyle,
}: BaseModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Dimmed background overlay */}
      <Pressable
        style={styles.overlay}
        onPress={() => showCloseButton && onClose()}
      >
        {/* Prevent overlay press from closing when pressing inside */}
        <Pressable
          style={[styles.cardContainer, containerStyle]}
          onPress={() => {}}
        >
          {showCloseButton && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <IconSymbol size={26} name="clear.fill" color="white" />
            </TouchableOpacity>
          )}

          {title && (
            <ThemedText type="title" style={styles.title}>
              {title}
            </ThemedText>
          )}

          <View
            style={[
              styles.content,
              contentStyle,
              { marginTop: showCloseButton ? 20 : 0 },
            ]}
          >
            {children}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)", // translucent dim
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  cardContainer: {
    backgroundColor: "#151718", // soft dark card
    borderRadius: 16,
    padding: 23,
    width: "85%",
    // maxWidth: 420,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    maxWidth: 500,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
  },
  content: {
    width: "100%",
  },
});
