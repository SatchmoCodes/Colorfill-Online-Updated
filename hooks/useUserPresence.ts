import { rtdb } from "@/firebaseConfig";
import { getUser } from "@/helper/commonQueries";
import { registerForPushNotificationsAsync } from "@/helper/registerForPushNotifications";
import { User } from "firebase/auth";
import { onDisconnect, ref, serverTimestamp, set } from "firebase/database";
import { updateDoc } from "firebase/firestore";
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
    const profileBackground = userDoc.data.profileBackground;
    const profileLetter = userDoc.data.profileLetter;
    const userStatusRef = ref(rtdb, `/onlineUsers/${user.uid}`);
    if (!userDoc.data.expoPushToken) {
      const expoToken = await registerForPushNotificationsAsync();
      if (expoToken) {
        await updateDoc(userDoc.ref, {
          expoPushToken: expoToken,
        });
      }
    }
    set(userStatusRef, {
      displayName: user.displayName ?? "Anonymous",
      profileBackground,
      profileLetter,
      online: true,
      lastSeen: Date.now(),
    });
    onDisconnect(userStatusRef).set({
      displayName: user.displayName ?? "Anonymous",
      profileBackground,
      profileLetter,
      online: false,
      lastSeen: serverTimestamp(),
    });
  }
};
