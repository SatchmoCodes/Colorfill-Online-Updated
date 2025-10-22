import { rtdb } from "@/firebaseConfig";
import { getUser } from "@/helper/commonQueries";
import { User } from "firebase/auth";
import { onDisconnect, ref, serverTimestamp, set } from "firebase/database";
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
