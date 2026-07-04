import {
  saveProfileBackgroundColor,
  saveProfileBannerColor,
  saveProfileLetterColor,
} from "@/helper/asyncStorageHelper";
import { getUser } from "@/helper/commonQueries";
import { User } from "firebase/auth";

import { rtdb } from "@/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { ref, update } from "firebase/database";
import { updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Toast from "react-native-toast-message";
import Avatar from "../Avatar";
import SimpleColorPicker from "../SimpleColorPicker";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

export default function EditProfile({
  user,
  profileBackground,
  profileLetter,
  profileBanner,
  setProfileBackground,
  setProfileLetter,
  setProfileBanner,
  setOpenProfile,
}: {
  user: User;
  profileBackground: string;
  profileLetter: string;
  profileBanner: string;
  setProfileBackground: React.Dispatch<React.SetStateAction<string>>;
  setProfileLetter: React.Dispatch<React.SetStateAction<string>>;
  setProfileBanner: React.Dispatch<React.SetStateAction<string>>;
  setOpenProfile: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [originalBackground, setOriginalBackground] =
    useState(profileBackground);
  const [originalLetterColor, setOriginalLetter] = useState(profileLetter);
  const [originalBannerColor, setOriginalBannerColor] = useState(profileBanner);
  const [iconBackground, setIconBackground] = useState(profileBackground);
  const [letterColor, setLetterColor] = useState(profileLetter);
  const [bannerColor, setBannerColor] = useState(profileBanner);
  const [isSaving, setIsSaving] = useState(false);

  const saveBlocked =
    originalBackground === iconBackground &&
    originalBannerColor === bannerColor &&
    originalLetterColor === letterColor;

  async function updateColor() {
    const userStatusRef = ref(rtdb, `/onlineUsers/${user.uid}`);
    try {
      setIsSaving(true);
      const userDoc = await getUser(user.uid);
      const rtdbUpdateData = {
        profileBackground: iconBackground,
        profileLetter: letterColor,
        profileBanner: bannerColor,
      };
      if (userDoc) {
        await Promise.all([
          updateDoc(userDoc?.ref, {
            profileBackground: iconBackground,
            profileLetter: letterColor,
            profileBanner: bannerColor,
          }),
          update(userStatusRef, rtdbUpdateData),
          saveProfileBackgroundColor(iconBackground),
          saveProfileLetterColor(letterColor),
          saveProfileBannerColor(bannerColor),
        ]);
      }
      setProfileBackground(iconBackground);
      setProfileLetter(letterColor);
      setProfileBanner(bannerColor);
      setOpenProfile(false);
      Toast.show({
        type: "success",
        text1: "Profile updated successfully!",
      });
    } catch (error) {
      console.log("error saving");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ThemedView style={styles.centeredView}>
      {isSaving ? (
        <ActivityIndicator />
      ) : (
        <>
          <LinearGradient
            colors={[bannerColor, "#000000ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.banner,
              { ...(Platform.OS === "web" && { maxWidth: 350 }) },
            ]}
          >
            <Avatar
              profileBackground={iconBackground}
              profileLetter={letterColor}
              size="large"
              username={user.displayName ?? "?"}
            />
            <ThemedText type="subtitle">{user.displayName}</ThemedText>
          </LinearGradient>

          <ThemedText>Select profile color</ThemedText>
          <SimpleColorPicker
            startingColor={originalBackground}
            onSelectColor={setIconBackground}
          />
          <ThemedText>Select letter color</ThemedText>
          <SimpleColorPicker
            startingColor={originalLetterColor}
            onSelectColor={setLetterColor}
          />
          <ThemedText>Select Banner Background</ThemedText>
          <SimpleColorPicker
            startingColor={originalBannerColor}
            onSelectColor={setBannerColor}
          />
          <View style={{ flexDirection: "row", gap: 30, marginTop: 20 }}>
            <TouchableOpacity
              style={[
                styles.profileButton,
                { backgroundColor: "green", opacity: saveBlocked ? 0.3 : 1 },
              ]}
              disabled={
                originalBackground === iconBackground &&
                originalLetterColor === letterColor &&
                originalBannerColor === bannerColor
              }
              onPress={() => !saveBlocked && updateColor()}
            >
              <ThemedText style={{ textAlign: "center" }}>Save</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.profileButton, { backgroundColor: "red" }]}
              onPress={() => setOpenProfile(false)}
            >
              <ThemedText style={{ textAlign: "center" }}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 30,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 20,
    marginBottom: 20,
    zIndex: 1,
  },
  avatar: {
    position: "relative",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderColor: "black",
    borderWidth: 1,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },
  iconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "white",
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  profileButton: {
    padding: 8,
    borderRadius: 50,
    width: 75,
  },
});
