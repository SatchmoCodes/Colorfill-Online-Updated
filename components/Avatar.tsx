import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";

const sizeMap = {
  small: 30,
  medium: 40,
  large: 50,
  xlarge: 60,
};

interface AvatarProps {
  profileBackground: string;
  profileLetter: string;
  username: string;
  size: "small" | "medium" | "large" | "xlarge";
  handleAvatarClick?: () => void;
}

export default function Avatar(props: AvatarProps) {
  const {
    profileBackground,
    profileLetter,
    username,
    size,
    handleAvatarClick,
  } = props;

  if (handleAvatarClick) {
    return (
      <TouchableOpacity
        onPress={() => handleAvatarClick()}
        style={[
          styles.avatar,
          {
            backgroundColor: profileBackground ?? "#313131ff",
            width: sizeMap[size],
            height: sizeMap[size],
            borderRadius: sizeMap[size] / 2,
          },
        ]}
      >
        <ThemedText
          style={[styles.avatarText, { color: profileLetter ?? "#ffffff" }]}
        >
          {username[0]?.toUpperCase()}
        </ThemedText>
      </TouchableOpacity>
    );
  }
  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: profileBackground ?? "#313131ff",
          width: sizeMap[size],
          height: sizeMap[size],
          borderRadius: sizeMap[size] / 2,
        },
      ]}
    >
      <ThemedText
        style={[styles.avatarText, { color: profileLetter ?? "#ffffff" }]}
      >
        {username[0]?.toUpperCase()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderColor: "black",
    borderWidth: 1,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
