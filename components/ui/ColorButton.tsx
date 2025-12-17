import React, { useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

export default function ColorButton({
  text,
  isDisabled,
  handlePress,
  style,
}: {
  text?: string;
  isDisabled: boolean;
  handlePress: () => void;
  style?: StyleProp<ViewStyle>; // <--- Add type for style
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={() => handlePress()}
      style={[
        styles.button,
        {
          transform: [{ scale: isPressed ? 0.95 : 1 }],
          opacity: isDisabled ? 0.05 : isPressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {text && (
        <Text allowFontScaling={false} style={styles.text}>
          {text}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: "rgba(255,255,255,0.15)", // subtle edge separation
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
    userSelect: "none",
  },
});
