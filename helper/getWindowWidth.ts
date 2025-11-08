import { Platform, useWindowDimensions } from "react-native";

export const getWindowWidth = () => {
  return Platform.OS === "web"
    ? useWindowDimensions().width * 0.28
    : useWindowDimensions().width;
};
