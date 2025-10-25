import { rtdb } from "@/firebaseConfig";
import { onValue, ref } from "firebase/database";
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";

export interface PlayerList {
  id: string;
  displayName: string;
  profileBackground: string;
  profileLetter: string;
  online: boolean;
  lastSeen: Timestamp;
}

export const useOnlinePlayerList = () => {
  const [playerList, setPlayerList] = useState<undefined | PlayerList[]>();

  useEffect(() => {
    const usersRef = ref(rtdb, "/onlineUsers");

    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (!snapshot.exists()) return [];
      const users = snapshot.val();
      const onlineCount = Object.entries(users as PlayerList)
        .filter(([key, u]) => u.online)
        .map(([key, u]) => ({ ...u, id: key }));
      setPlayerList(onlineCount);
    });

    return () => unsubscribe();
  }, []);

  return playerList;
};
