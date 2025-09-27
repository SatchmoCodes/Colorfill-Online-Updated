import { Dimensions, Platform } from "react-native";

export const calculateSquareSize = (squareCount: number) => {
  const screenWidth =
    Platform.OS === "web"
      ? Dimensions.get("window").width * 0.3
      : Dimensions.get("window").width - 20;

  const columns = Math.sqrt(squareCount);

  return Math.round(screenWidth / columns);
};
