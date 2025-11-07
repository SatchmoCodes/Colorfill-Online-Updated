import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const sizeMap = {
  small: 30,
  medium: 40,
  large: 50,
  xlarge: 60,
};

const fontSizeMap = {
  small: 12,
  medium: 16,
  large: 18,
  xlarge: 22,
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
        <Text
          style={[
            styles.avatarText,
            { color: profileLetter ?? "#ffffff", fontSize: fontSizeMap[size] },
          ]}
        >
          {username[0]?.toUpperCase()}
        </Text>
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
      <Text
        style={[
          styles.avatarText,
          { color: profileLetter ?? "#ffffff", fontSize: fontSizeMap[size] },
        ]}
      >
        {username[0]?.toUpperCase()}
      </Text>
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
