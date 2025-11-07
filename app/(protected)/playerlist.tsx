import Avatar from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { db } from "@/firebaseConfig";
import { useUser } from "@/hooks/useFirebaseUser";
import { PlayerList, useOnlinePlayerList } from "@/hooks/useOnlinePlayerList";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Switch } from "react-native-paper";

export default function Playerlist() {
  const { docId } = useLocalSearchParams<{ docId: string }>();
  const user = useUser();
  const { playerList, onlinePlayerCount } = useOnlinePlayerList();

  console.log("what is this", playerList);

  // 👇 Track which player's popover is open
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);

  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [searchText, setSearchText] = useState("");

  const filteredPlayerList = playerList
    ? playerList
        .sort((a, b) => {
          // 1. Primary Sort: Online Status
          // If 'a' is online AND 'b' is offline, 'a' comes first (-1)
          if (a.online && !b.online) return -1;
          // If 'b' is online AND 'a' is offline, 'b' comes first (1)
          if (!a.online && b.online) return 1;

          // 2. Secondary Sort: Last Seen (Descending)
          // If both statuses are the same (both online or both offline),
          // sort by lastSeen. (b - a for descending/newest first)
          return b.lastSeen - a.lastSeen;
        })
        // The rest of your code remains the same
        .filter((x) => {
          // if (user.displayName === x.displayName) return false;
          if (showAllPlayers) return true;
          if (!x.online) return false;
          return true;
        })
        .filter((x) => {
          if (searchText !== "")
            return x.displayName
              .toLowerCase()
              .includes(searchText.toLowerCase());
          return true;
        })
    : [];

  return (
    <ThemedView style={styles.list}>
      <ThemedView style={{ width: "100%", zIndex: 200, paddingTop: 20 }}>
        <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
          Players Online: {onlinePlayerCount}
        </ThemedText>
        <ThemedView
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
          }}
        >
          <ThemedText>Show Offline Players</ThemedText>

          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={showAllPlayers ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={(e) => setShowAllPlayers(!showAllPlayers)}
            value={showAllPlayers}
          />
        </ThemedView>
        <ThemedView style={{ margin: "auto", marginBottom: 20 }}>
          <ThemedText style={{ textAlign: "center" }}>
            Search for Player
          </ThemedText>
          <TextInput
            value={searchText}
            onChangeText={(e) => setSearchText(e)}
            style={styles.input}
          ></TextInput>
        </ThemedView>
      </ThemedView>
      <FlatList
        data={filteredPlayerList}
        style={{ width: "100%", overflow: "visible" }}
        contentContainerStyle={{ overflow: "visible" }}
        renderItem={({ item: player }) => (
          <PlayerCard
            key={player.id}
            player={player}
            isOpen={openPlayerId === player.id}
            docId={docId}
            onToggle={() =>
              setOpenPlayerId(openPlayerId === player.id ? null : player.id)
            }
          />
        )}
      ></FlatList>
    </ThemedView>
  );
}

const PlayerCard = ({
  player,
  isOpen,
  docId,
  onToggle,
}: {
  player: PlayerList;
  isOpen: boolean;
  docId: string | null;
  onToggle: () => void;
}) => {
  const [pressed, setPressed] = useState(false);
  const user = useUser();

  const handleInvite = async () => {
    if (docId) {
      await addDoc(collection(db, "invites"), {
        recipientUid: player.id,
        senderName: user.displayName,
        gameId: docId,
      });
    } else {
      alert("error creating invitation");
    }
  };

  return (
    <ThemedView style={[{ paddingBottom: 20 }, isOpen && { zIndex: 100 }]}>
      <ThemedView
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 5,
        }}
      >
        <View
          style={[
            styles.onlineIndicator,
            {
              backgroundColor: player.online ? "green" : "red",
            },
          ]}
        ></View>
        <Pressable
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={{
            transform: [{ scale: pressed ? 0.97 : 1 }],
            position: "relative",
            zIndex: isOpen ? 100 : 1,
            ...(Platform.OS === "web" && { minWidth: 350 }),
          }}
          onPress={onToggle}
        >
          {isOpen && (
            <ThemedView
              style={{
                width: "95%",
                height: "100%",
                zIndex: 200,
                position: "absolute",
                backgroundColor: "rgba(0, 0, 0, 0.75)", // 🔥 use this instead of opacity
                justifyContent: "space-evenly",
                alignItems: "center",
                borderRadius: 20,
              }}
            >
              {user.displayName !== player.displayName && (
                <TouchableOpacity onPress={() => docId && handleInvite()}>
                  <ThemedText style={{ color: docId ? "white" : "gray" }}>
                    Invite to Game
                  </ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(protected)/viewprofile",
                    params: { player: JSON.stringify(player) },
                  })
                }
              >
                <ThemedText>View Profile</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
          <LinearGradient
            colors={[player.profileBanner, "#080808ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <Avatar
              profileBackground={player.profileBackground}
              profileLetter={player.profileLetter}
              username={player.displayName}
              size="large"
            />
            <ThemedText type="subtitle">{player.displayName}</ThemedText>
          </LinearGradient>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "95%",
    padding: 30,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 20,
    overflow: "visible",
    position: "relative",
    zIndex: 1,
  },
  centeredView: {
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
    borderRadius: 20,
    padding: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  optionsPopover: {
    position: "absolute",
    zIndex: 2,
    right: 18,
    top: 80,
    width: 160,
    height: 100,
    borderColor: "black",
    borderWidth: 1,
  },
  popoverButton: {
    flexGrow: 1,
    alignItems: "center",
    width: "100%",
    padding: 10,
    zIndex: 2,
    position: "relative",
  },
  filterButton: {
    borderWidth: 1,
    borderColor: "black",
    backgroundColor: "white",
    padding: 10,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 600,
    minWidth: 300,
    width: "50%",
  },
});
