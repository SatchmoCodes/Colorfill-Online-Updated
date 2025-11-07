import { Platform, useWindowDimensions } from "react-native";

export const getWindowWidth = () => {
  return Platform.OS === "web"
    ? useWindowDimensions().height * 0.5
    : useWindowDimensions().width;
};
