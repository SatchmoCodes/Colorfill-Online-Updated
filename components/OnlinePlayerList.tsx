import { useOnlinePlayerList } from "@/hooks/useOnlinePlayerList";
import React from "react";
import { View } from "react-native";
import { ThemedText } from "./ThemedText";

export default function OnlinePlayerList() {
  const { onlinePlayerCount } = useOnlinePlayerList();

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
        Players Online: {onlinePlayerCount}
      </ThemedText>
    </View>
  );
}
