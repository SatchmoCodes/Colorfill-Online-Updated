// components/ThemedBackground.tsx
import { LinearGradient } from "expo-linear-gradient";
import React from "react";

export function ThemedBackground({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={["#2b2a2aff", "#141414ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 1]}
      style={{ flex: 1 }}
    >
      {children}
    </LinearGradient>
  );
}
