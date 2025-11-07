import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

export function ThemedBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={["#1a1a1aff", "#2b2a2aff"]}
        style={{ flex: 1 }}
      >
        {children}
      </LinearGradient>
    </View>
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
