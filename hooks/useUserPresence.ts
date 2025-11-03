import { colors } from "@/components/SimpleColorPicker";
import { db, rtdb } from "@/firebaseConfig";
import {
  FREEPLAY_OFFLINE_SCORES_KEY,
  loadOfflineScores,
  saveProfileBackgroundColor,
  saveProfileBannerColor,
  saveProfileLetterColor,
} from "@/helper/asyncStorageHelper";
import { getUser } from "@/helper/commonQueries";
import { registerForPushNotificationsAsync } from "@/helper/registerForPushNotifications";
import { updateCriteriaMap } from "@/helper/updateCriteriaMap";
import { UserDoc } from "@/schema/userDocModel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "firebase/auth";
import { onDisconnect, ref, serverTimestamp, set } from "firebase/database";
import { addDoc, collection, updateDoc } from "firebase/firestore";
import { useEffect } from "react";
export const useUserPresence = (user?: User | null) => {
  useEffect(() => {
    if (!user) return;
    establishUserPresence(user);
  }, [user]);
};

const establishUserPresence = async (user: User) => {
  const userDoc = await getUser(user.uid);
  if (userDoc) {
    const profileBackground =
      userDoc.data.profileBackground ??
      colors[Math.floor(Math.random() * colors.length)];
    const profileLetter =
      userDoc.data.profileLetter ??
      colors[Math.floor(Math.random() * colors.length)];
    const profileBanner =
      userDoc.data.profileBanner ??
      colors[Math.floor(Math.random() * colors.length)];
    updateAsyncStorageValuesOnLoad({
      ...userDoc.data,
      profileBackground,
      profileLetter,
      profileBanner,
    });
    uploadOfflineScores();
    const userStatusRef = ref(rtdb, `/onlineUsers/${user.uid}`);
    let updatedUserDocData: any = {
      profileBackground,
      profileBanner,
      profileLetter,
    };
    const expoToken = await registerForPushNotificationsAsync();
    if (expoToken) {
      updatedUserDocData = { ...updatedUserDocData, expoPushToken: expoToken };
    }
    await updateDoc(userDoc.ref, {
      ...updatedUserDocData,
    });
    set(userStatusRef, {
      displayName: user.displayName ?? userDoc.data.username ?? "Anonymous",
      profileBackground,
      profileLetter,
      profileBanner,
      online: true,
      lastSeen: Date.now(),
    });
    onDisconnect(userStatusRef).set({
      displayName: user.displayName ?? userDoc.data.username ?? "Anonymous",
      profileBackground,
      profileLetter,
      profileBanner,
      online: false,
      lastSeen: serverTimestamp(),
    });
  }
};

const updateAsyncStorageValuesOnLoad = async (userDoc: UserDoc) => {
  try {
    await updateCriteriaMap({
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
    await saveProfileBackgroundColor(userDoc.profileBackground);
    await saveProfileLetterColor(userDoc.profileLetter);
    await saveProfileBannerColor(userDoc.profileBanner);
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
