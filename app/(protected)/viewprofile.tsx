import Avatar from "@/components/Avatar";
import BaseModal from "@/components/BaseModal";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import CommonButton from "@/components/ui/CommonButton";
import EditProfile from "@/components/ui/EditProfile";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { db, rtdb } from "@/firebaseConfig";
import { getUser } from "@/helper/commonQueries";
import { useUser } from "@/hooks/useFirebaseUser";
import { PlayerList } from "@/hooks/useOnlinePlayerList";
import { UserDoc } from "@/schema/userDocModel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { ref, remove } from "firebase/database";
import {
  collection,
  deleteDoc,
  DocumentReference,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Toast from "react-native-toast-message";

type LoadingState = "loading" | "complete" | "error";

const showErrorToast = () => {
  Toast.show({
    type: "error",
    text1: "Error deleting account",
  });
};

export default function ViewProfile() {
  const { player } = useLocalSearchParams<{ player: string }>();
  const profile: PlayerList = JSON.parse(player);
  const user = useUser();

  const [userDocData, setUserDocData] = useState<UserDoc | null>(null);
  const [userDocRef, setUserDocRef] = useState<DocumentReference | null>(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [profileBackground, setProfileBackground] = useState(
    profile.profileBackground ?? "#313131ff",
  );
  const [profileLetter, setProfileLetter] = useState(
    profile.profileLetter ?? "#ffffff",
  );
  const [profileBanner, setProfileBanner] = useState(
    profile.profileBanner ?? "#0b40b3ff",
  );
  const [loading, setLoading] = useState<LoadingState>("loading");
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!profile) return <ThemedText>No Profile Found</ThemedText>;

  const profileId = profile.id;

  const getUserData = async (uid: string) => {
    try {
      const userDoc = await getUser(uid);
      if (userDoc) {
        setUserDocData(userDoc.data);
        setUserDocRef(userDoc.ref);
        setLoading("complete");
      } else {
        setUserDocData(null);
        setLoading("error");
      }
    } catch (error) {
      console.log("error getting user data ", error);
      setUserDocData(null);
      setLoading("error");
    }
  };

  async function handleDeleteAccount() {
    if (userDocRef) {
      try {
        setIsDeleting(true);
        const userStatusRef = ref(rtdb, `/onlineUsers/${user.uid}`);
        remove(userStatusRef);
        const scoreQuery = query(
          collection(db, "scores"),
          where("uid", "==", user.uid),
        );
        const userScoreDocs = await getDocs(scoreQuery);
        await Promise.all([
          userScoreDocs.docs.map((doc) => deleteDoc(doc.ref)),
          deleteDoc(userDocRef),
          AsyncStorage.clear(),
          user.delete(),
        ]);
      } catch (error) {
        showErrorToast();
      } finally {
        setIsDeleting(false);
      }
    } else {
      showErrorToast();
    }
  }

  useEffect(() => {
    if (profile && !userDocData) {
      getUserData(profile.id);
    }
  }, [profileId]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={{ position: "relative" }}>
        {profile.displayName === user.displayName &&
        profile.displayName !== null ? (
          <>
            <Avatar
              profileBackground={profileBackground}
              profileLetter={profileLetter}
              size="xlarge"
              username={profile.displayName}
              handleAvatarClick={() => setOpenProfile(true)}
            />
            <TouchableOpacity
              onPress={() => setOpenProfile(true)}
              style={styles.iconContainer}
            >
              <IconSymbol
                style={{ textAlign: "center" }}
                size={14}
                name="pencil"
                color={"black"}
              />
            </TouchableOpacity>
          </>
        ) : (
          <Avatar
            profileBackground={profileBackground}
            profileLetter={profileLetter}
            size="xlarge"
            username={profile.displayName ?? "?"}
          />
        )}
      </ThemedView>
      <ThemedText type="subtitle" style={{ marginTop: 20, marginBottom: 20 }}>
        {profile.displayName}
      </ThemedText>
      <>
        {loading === "loading" && <ActivityIndicator />}
        {loading === "complete" && (
          <View style={{ gap: 5, width: "100%", alignItems: "center" }}>
            {/* Boards Played (Already styled) */}
            <View style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>Boards Played:</ThemedText>
              <ThemedText>{userDocData!.boardsCompleted ?? "N/A"}</ThemedText>
            </View>

            {/* Boards of the Day Completed */}
            <View style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>BOTD Completed:</ThemedText>
              <ThemedText>
                {userDocData!.boardsOfTheDayCompleted ?? "N/A"}
              </ThemedText>
            </View>

            {/* Best Small Score */}
            <View style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>
                Best Small Score:
              </ThemedText>
              <ThemedText>{userDocData!.bestSmallScore ?? "N/A"}</ThemedText>
            </View>

            {/* Best Medium Score */}
            <View style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>
                Best Medium Score:
              </ThemedText>
              <ThemedText>{userDocData!.bestMediumScore ?? "N/A"}</ThemedText>
            </View>

            {/* Best Large Score */}
            <View style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>
                Best Large Score:
              </ThemedText>
              <ThemedText>{userDocData!.bestLargeScore ?? "N/A"}</ThemedText>
            </View>

            <View style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>
                Best XLarge Score:
              </ThemedText>
              <ThemedText>{userDocData!.bestXLargeScore ?? "N/A"}</ThemedText>
            </View>

            {/* PVP Games Played */}
            <View style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>
                PVP Games Played:
              </ThemedText>
              <ThemedText>{userDocData!.totalGames ?? "N/A"}</ThemedText>
            </View>

            {/* Wins */}
            <View style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>Wins:</ThemedText>
              <ThemedText>{userDocData!.wins ?? "N/A"}</ThemedText>
            </View>

            {/* Losses */}
            <View style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>Losses:</ThemedText>
              <ThemedText>{userDocData!.losses ?? "N/A"}</ThemedText>
            </View>

            {/* Best Win Streak */}
            <View style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>Best Win Streak:</ThemedText>
              <ThemedText>{userDocData!.bestWinStreak ?? "N/A"}</ThemedText>
            </View>

            {/* Current Win Streak */}
            <View style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>
                Current Win Streak:
              </ThemedText>
              <ThemedText>{userDocData!.currentWinStreak ?? "N/A"}</ThemedText>
            </View>

            {/* Win Rate */}
            <View style={styles.dataRow}>
              <ThemedText style={styles.dataPoint}>Win Rate:</ThemedText>
              <ThemedText>
                {userDocData!.winRate ? `${userDocData!.winRate}%` : "N/A"}
              </ThemedText>
            </View>
          </View>
        )}
        {loading === "error" && <ThemedText>Profile not found</ThemedText>}
      </>
      {openProfile && (
        <BaseModal
          visible={openProfile}
          onClose={() => setOpenProfile(false)}
          containerStyle={{ maxWidth: 1000 }}
        >
          <EditProfile
            user={user}
            profileBackground={profileBackground}
            profileLetter={profileLetter}
            profileBanner={profileBanner}
            setProfileBackground={setProfileBackground}
            setProfileLetter={setProfileLetter}
            setProfileBanner={setProfileBanner}
            setOpenProfile={setOpenProfile}
          />
        </BaseModal>
      )}
      {profile.displayName === user.displayName &&
        profile.displayName !== null && (
          <ThemedView style={{ marginTop: "auto" }}>
            <CommonButton
              title="Delete Account"
              size={200}
              firstColor="#e30505"
              secondColor="#7d0404"
              handlePress={() => setOpenDeleteModal(true)}
            />
          </ThemedView>
        )}
      {openDeleteModal && (
        <BaseModal
          visible={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
        >
          <ThemedText
            type="subtitle"
            style={{ textAlign: "center", marginBottom: 20 }}
          >
            Are you sure you want to delete your account?
          </ThemedText>
          <ThemedText
            style={{ textAlign: "center", fontSize: 16, marginBottom: 20 }}
          >
            All data associated to account will be deleted and unrecoverable.
          </ThemedText>
          <ThemedView style={{ flexDirection: "row", gap: 20 }}>
            <CommonButton
              title="Yes"
              size={200}
              handlePress={() => handleDeleteAccount()}
            />
            <CommonButton
              title="No"
              size={200}
              handlePress={() => setOpenDeleteModal(false)}
            />
          </ThemedView>
        </BaseModal>
      )}
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
  iconContainer: {
    position: "absolute",
    bottom: 0,
    right: 10,
    backgroundColor: "#f0f0f0ff",
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
