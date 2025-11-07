import { LinearGradient } from "expo-linear-gradient";
import { StyleProp, ViewStyle } from "react-native";

export function ThemedBackground({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 2, y: 2 }}
      colors={["#1a1a1aff", "#424242ff"]}
      style={[style, { flex: 1 }]}
    >
      {children}
    </LinearGradient>
  );
}

{
  /* <LinearGradient
      colors={["#2b2a2aff", "#141414ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 1]}
      style={{ flex: 1 }}
    ></LinearGradient> */
}
