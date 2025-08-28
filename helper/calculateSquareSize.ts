import { Dimensions, Platform } from "react-native";

export const calculateSquareSize = (squareCount: number) => {
  const screenWidth =
    Platform.OS === "web"
      ? Dimensions.get("window").width * 0.32
      : Dimensions.get("window").width - 40;

  const columns = Math.sqrt(squareCount);

  // Optional: add some padding or margin
  const padding = 24;

  return Math.floor((screenWidth - padding) / columns);
};
