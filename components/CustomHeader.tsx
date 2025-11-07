// components/CustomHeader.tsx
import {
  loadProfileBackgroundColor,
  loadProfileBannerColor,
  loadProfileLetterColor,
} from "@/helper/asyncStorageHelper";
import { useUser } from "@/hooks/useFirebaseUser";
import { router, useFocusEffect, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  DeviceEventEmitter,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Avatar from "./Avatar";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { IconSymbol } from "./ui/IconSymbol";

interface CustomHeaderProps {
  title: string;
  routeName: string;
  docId?: string | null;
  // Add other props you might need, like iconName, iconColor, etc.
}

export default function CustomHeader({
  title,
  routeName,
  docId = null,
}: CustomHeaderProps) {
  const user = useUser();
  const navigation = useNavigation();
  const theme = useColorScheme() ?? "light";
  const isGearIconHidden = ["settings", "playerlist", "viewprofile"].includes(
    routeName
  );
  const isPlayerIconHidden = ["settings", "playerlist", "viewprofile"].includes(
    routeName
  );

  const isProfileIconHidden = [
    "settings",
    "playerlist",
    "viewprofile",
  ].includes(routeName);

  const [profileBackground, setProfileBackground] = useState("gray");
  const [profileLetter, setProfileLetter] = useState("white");
  const [profileBanner, setProfileBanner] = useState("blue");

  async function loadProfileIcon() {
    setProfileBackground((await loadProfileBackgroundColor()) ?? "gray");
    setProfileLetter((await loadProfileLetterColor()) ?? "white");
    setProfileBanner((await loadProfileBannerColor()) ?? "blue");
  }

  useFocusEffect(
    useCallback(() => {
      loadProfileIcon();
    }, [])
  );

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "profileColorsUpdated",
      loadProfileIcon
    );
    return () => sub.remove();
  }, []);

  const handleProfileClick = async () => {
    const paramData = {
      id: user.uid,
      displayName: user.displayName,
      profileBackground: profileBackground,
      profileLetter: profileLetter,
      profileBanner: profileBanner,
      online: true,
      lastSeen: Date.now(),
    };
    router.push({
      pathname: "/(protected)/viewprofile",
      params: { player: JSON.stringify(paramData) },
    });
  };

  return (
    <ThemedView style={styles.headerContainer}>
      {/* Back button */}
      {navigation.canGoBack() && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <IconSymbol name="backward" size={24} color="white" />
        </TouchableOpacity>
      )}

      {/* Title */}
      <ThemedText style={[styles.headerTitle]}>{title}</ThemedText>

      {!isPlayerIconHidden && (
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() =>
            router.push({
              pathname: "/(protected)/playerlist",
              params: { docId },
            })
          }
        >
          <IconSymbol name="person" size={24} color="white" />
        </TouchableOpacity>
      )}

      {/* Settings Icon */}
      {!isGearIconHidden && (
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => router.push("/(protected)/settings")}
        >
          <IconSymbol name="gear" size={24} color="white" />
        </TouchableOpacity>
      )}
      {!isProfileIconHidden && (
        <Avatar
          username={user.displayName ?? "?"}
          profileBackground={profileBackground}
          profileLetter={profileLetter}
          size="small"
          handleAvatarClick={() => handleProfileClick()}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // spread back, title, settings
    paddingHorizontal: 16,
    height: 90,
    paddingTop: 40,
    backgroundColor: "#0e0e0eff",
  },
  headerTitle: {
    fontSize: 20,
    // fontWeight: "bold",
    flex: 1,
    // textAlign: "center",
    paddingLeft: 10,
  },
  backButton: {
    padding: 8,
  },
  iconContainer: {
    padding: 8,
  },
});
