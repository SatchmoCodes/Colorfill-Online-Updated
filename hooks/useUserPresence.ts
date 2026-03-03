import { colors } from "@/components/SimpleColorPicker";
import { db, rtdb } from "@/firebaseConfig";
import {
  FREEPLAY_OFFLINE_SCORES_KEY,
  loadOfflineScores,
  loadPopSoundVolume,
  saveColorPaletteOptions,
  saveProfileBackgroundColor,
  saveProfileBannerColor,
  saveProfileLetterColor,
} from "@/helper/asyncStorageHelper";
//@ts-ignore
import { setSoundVolume } from "@/helper/audio/soundManager";
import { getUser } from "@/helper/commonQueries";
import { getColorPaletteOptions } from "@/helper/getColorPaletteOptions";
import { registerForPushNotificationsAsync } from "@/helper/registerForPushNotifications";
import { updateCriteriaMap } from "@/helper/updateCriteriaMap";
import { UserDoc } from "@/schema/userDocModel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { User } from "firebase/auth";
import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
  update,
} from "firebase/database";
import { addDoc, collection, updateDoc } from "firebase/firestore";
import { useEffect } from "react";
import { AppState, DeviceEventEmitter, Platform } from "react-native";

export const useUserPresence = (user?: User | null) => {
  useEffect(() => {
    if (!user) return;

    // Establish initial presence
    establishUserPresence(user);

    // Handle foreground/background transitions
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        // Re-mark user as online when app returns to foreground
        const userStatusRef = ref(rtdb, `/onlineUsers/${user.uid}`);
        update(userStatusRef, {
          online: true,
          lastSeen: Date.now(),
        });

        // Re-check notification permissions and update token if necessary
        const expoToken = await registerForPushNotificationsAsync();
        if (expoToken) {
          const userDoc = await getUser(user.uid);
          if (userDoc && userDoc.data.expoPushToken !== expoToken) {
            await updateDoc(userDoc.ref, { expoPushToken: expoToken });
          }
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  useEffect(() => {
    async function setupChannel() {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.HIGH,
          sound: "default",
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
    }

    setupChannel();
  }, []);
};

const establishUserPresence = async (user: User) => {
  uploadOfflineScores();
  const userDoc = await getUser(user.uid);
  const userStatusRef = ref(rtdb, `/onlineUsers/${user.uid}`);
  let profileBackground = "gray";
  let profileLetter = "white";
  let profileBanner = "#313131ff";
  if (userDoc) {
    profileBackground =
      userDoc.data.profileBackground ??
      colors[Math.floor(Math.random() * colors.length)];
    profileLetter =
      userDoc.data.profileLetter ??
      colors[Math.floor(Math.random() * colors.length)];
    profileBanner =
      userDoc.data.profileBanner ??
      colors[Math.floor(Math.random() * colors.length)];

    updateAsyncStorageValuesOnLoad({
      ...userDoc.data,
      profileBackground,
      profileLetter,
      profileBanner,
    });

    let updatedUserDocData: any = {
      profileBackground,
      profileBanner,
      profileLetter,
    };

    const expoToken = await registerForPushNotificationsAsync();
    if (expoToken) {
      updatedUserDocData.expoPushToken = expoToken;
    }

    await updateDoc(userDoc.ref, updatedUserDocData);
  }
  const savedCaptureAudioLevel = await loadPopSoundVolume();
  await setSoundVolume(savedCaptureAudioLevel ?? 0.25);

  const connectedRef = ref(rtdb, ".info/connected");
  onValue(connectedRef, (snap) => {
    if (snap.val() === false) return;

    // Set user online
    set(userStatusRef, {
      displayName: user.displayName ?? "Anonymous",
      profileBackground: profileBackground,
      profileLetter,
      profileBanner,
      online: true,
      lastSeen: serverTimestamp(),
    });
    if (!user.displayName) {
      onDisconnect(userStatusRef).remove();
    } else {
      // Ensure proper cleanup on disconnect
      onDisconnect(userStatusRef).update({
        online: false,
        lastSeen: serverTimestamp(),
      });
    }
  });
};

const updateAsyncStorageValuesOnLoad = async (userDoc: UserDoc) => {
  try {
    const updatedCriteriaMap = await updateCriteriaMap({
      boardsCompleted: userDoc.boardsCompleted,
      boardsOfTheDayCompleted: userDoc.boardsOfTheDayCompleted,
      bestSmallScore: userDoc.bestSmallScore,
      bestMediumScore: userDoc.bestMediumScore,
      bestLargeScore: userDoc.bestLargeScore,
      bestXLargeScore: userDoc.bestXLargeScore,
      totalGames: userDoc.totalGames,
      wins: userDoc.wins,
      bestWinStreak: userDoc.bestWinStreak,
    });
    const updatedColorPaletteOptions =
      await getColorPaletteOptions(updatedCriteriaMap);
    await saveColorPaletteOptions(updatedColorPaletteOptions);
    await saveProfileBackgroundColor(userDoc.profileBackground);
    await saveProfileLetterColor(userDoc.profileLetter);
    await saveProfileBannerColor(userDoc.profileBanner);
    DeviceEventEmitter.emit("profileColorsUpdated");
  } catch (error) {
    console.log("error updating async values ", error);
  }
};

const uploadOfflineScores = async () => {
  const offlineScoreArr = (await loadOfflineScores()) ?? [];

  if (offlineScoreArr.length > 0) {
    console.log(`Uploading ${offlineScoreArr.length} offline scores...`);

    const uploadPromises = offlineScoreArr.map(async (scoreData) => {
      const docToUpload = {
        ...scoreData,
        createdAt: serverTimestamp(),
      };
      return addDoc(collection(db, "scores"), docToUpload);
    });

    try {
      await Promise.all(uploadPromises);
      await AsyncStorage.removeItem(FREEPLAY_OFFLINE_SCORES_KEY);
    } catch (error) {
      console.error("Failed to upload some offline scores:", error);
    }
  }
};
