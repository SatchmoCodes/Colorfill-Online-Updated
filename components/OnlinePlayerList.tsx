import { useOnlinePlayerList } from "@/hooks/useOnlinePlayerList";
import React from "react";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export default function OnlinePlayerList() {
  const playerList = useOnlinePlayerList();

  return (
    <ThemedView
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
        Players Online: {playerList?.length}
      </ThemedText>
      {/* <TouchableOpacity onPress={() => router.push("/(protected)/playerlist")}>
        <ThemedText>View</ThemedText>
      </TouchableOpacity> */}
    </ThemedView>
  );
}
