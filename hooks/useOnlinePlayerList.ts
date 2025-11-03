import { rtdb } from "@/firebaseConfig";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";

export interface PlayerList {
  id: string;
  displayName: string;
  profileBackground: string;
  profileLetter: string;
  profileBanner: string;
  online: boolean;
  lastSeen: number;
}

export const useOnlinePlayerList = () => {
  const [playerList, setPlayerList] = useState<undefined | PlayerList[]>();
  const [onlinePlayerCount, setOnlinePlayerCount] = useState(0);

  useEffect(() => {
    const usersRef = ref(rtdb, "/onlineUsers");

    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (!snapshot.exists()) return [];
      const users = snapshot.val();
      const currentPlayerList = Object.entries(users as PlayerList).map(
        ([key, value]) => ({ ...value, id: key })
      );
      const onlineCount = Object.entries(users as PlayerList).filter(
        ([key, u]) => u.online
      ).length;
      // .map(([key, u]) => ({ ...u, id: key }));
      setPlayerList(currentPlayerList);
      setOnlinePlayerCount(onlineCount);
    });

    return () => unsubscribe();
  }, []);

  return { playerList, onlinePlayerCount };
};
