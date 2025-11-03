import Avatar from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { getUser } from "@/helper/commonQueries";
import { PlayerList } from "@/hooks/useOnlinePlayerList";
import { UserDoc } from "@/schema/userDocModel";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { ActivityIndicator } from "react-native-paper";

export default function ViewProfile() {
  const { player } = useLocalSearchParams<{ player: string }>();
  const profile: PlayerList = JSON.parse(player);

  const [userDocData, setUserDocData] = useState<UserDoc | null>(null);

  if (!profile) return <ActivityIndicator />;

  const getUserData = async (uid: string) => {
    try {
      const userDoc = await getUser(uid);
      if (userDoc) {
        setUserDocData(userDoc.data);
      } else {
        setUserDocData(null);
      }
    } catch (error) {
      console.log("error getting user data ", error);
      setUserDocData(null);
    }
  };

  useEffect(() => {
    if (profile) {
      getUserData(profile.id);
    }
  }, [profile]);

  return (
    <ThemedView style={styles.container}>
      <Avatar
        profileBackground={profile.profileBackground}
        profileLetter={profile.profileLetter}
        username={profile.displayName}
        size="xlarge"
      />
      <ThemedText type="subtitle" style={{ marginTop: 20, marginBottom: 20 }}>
        {profile.displayName}
      </ThemedText>
      <>
        {!userDocData ? (
          <ActivityIndicator />
        ) : (
          <ThemedView style={{ gap: 5, width: "100%", alignItems: "center" }}>
            {/* Boards Played (Already styled) */}
            <ThemedView style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>Boards Played:</ThemedText>
              <ThemedText>{userDocData.boardsCompleted ?? "N/A"}</ThemedText>
            </ThemedView>

            {/* Boards of the Day Completed */}
            <ThemedView style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>BOTD Completed:</ThemedText>
              <ThemedText>
                {userDocData.boardsOfTheDayCompleted ?? "N/A"}
              </ThemedText>
            </ThemedView>

            {/* Best Small Score */}
            <ThemedView style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>
                Best Small Score:
              </ThemedText>
              <ThemedText>{userDocData.bestSmallScore ?? "N/A"}</ThemedText>
            </ThemedView>

            {/* Best Medium Score */}
            <ThemedView style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>
                Best Medium Score:
              </ThemedText>
              <ThemedText>{userDocData.bestMediumScore ?? "N/A"}</ThemedText>
            </ThemedView>

            {/* Best Large Score */}
            <ThemedView style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>
                Best Large Score:
              </ThemedText>
              <ThemedText>{userDocData.bestLargeScore ?? "N/A"}</ThemedText>
            </ThemedView>

            {/* PVP Games Played */}
            <ThemedView style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>
                PVP Games Played:
              </ThemedText>
              <ThemedText>{userDocData.totalGames ?? "N/A"}</ThemedText>
            </ThemedView>

            {/* Wins */}
            <ThemedView style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>Wins:</ThemedText>
              <ThemedText>{userDocData.wins ?? "N/A"}</ThemedText>
            </ThemedView>

            {/* Losses */}
            <ThemedView style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>Losses:</ThemedText>
              <ThemedText>{userDocData.losses ?? "N/A"}</ThemedText>
            </ThemedView>

            {/* Best Win Streak */}
            <ThemedView style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>Best Win Streak:</ThemedText>
              <ThemedText>{userDocData.bestWinStreak ?? "N/A"}</ThemedText>
            </ThemedView>

            {/* Current Win Streak */}
            <ThemedView style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>
                Current Win Streak:
              </ThemedText>
              <ThemedText>{userDocData.currentWinStreak ?? "N/A"}</ThemedText>
            </ThemedView>

            {/* Win Rate */}
            <ThemedView style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>Win Rate:</ThemedText>
              <ThemedText>
                {userDocData.winRate ? `${userDocData.winRate}%` : "N/A"}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}
      </>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: "center",
    padding: 30,
    alignItems: "center",
  },
  dataRow: {
    flexDirection: "row",
    gap: 20,
    width: 300,
    justifyContent: "space-between",
  },
  dataPoint: {
    width: "70%",
  },
});
