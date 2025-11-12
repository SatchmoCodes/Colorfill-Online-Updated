import { useWindowDimensions } from "react-native";

export const getWindowHeight = () => {
  return useWindowDimensions().height;
};
