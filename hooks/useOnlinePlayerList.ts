import { rtdb } from "@/firebaseConfig";
import {
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  ref,
} from "firebase/database";
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
  const [playerList, setPlayerList] = useState<PlayerList[]>([]);
  const [onlinePlayerCount, setOnlinePlayerCount] = useState(0);

  useEffect(() => {
    const usersRef = ref(rtdb, "/onlineUsers");

    // Add listener for new users coming online
    const addListener = onChildAdded(usersRef, (snapshot) => {
      const data = snapshot.val();
      setPlayerList((prev) => [...prev, { ...data, id: snapshot.key! }]);
      if (data.online) setOnlinePlayerCount((prev) => prev + 1);
    });

    // Remove listener for users going offline / removed
    const removeListener = onChildRemoved(usersRef, (snapshot) => {
      setPlayerList((prev) => prev.filter((p) => p.id !== snapshot.key));
    });

    // Handle updates (e.g. user goes from offline → online)
    const changeListener = onChildChanged(usersRef, (snapshot) => {
      const data = snapshot.val();

      setPlayerList((prev) => {
        const prevUser = prev.find((p) => p.id === snapshot.key);
        const newList = prev.map((p) =>
          p.id === snapshot.key ? { ...p, ...data } : p
        );

        setOnlinePlayerCount((prevCount) => {
          if (!prevUser) return prevCount;
          if (prevUser.online && !data.online) return prevCount - 1;
          if (!prevUser.online && data.online) return prevCount + 1;
          return prevCount;
        });

        return newList;
      });
    });

    return () => {
      addListener();
      removeListener();
      changeListener();
    };
  }, []);

  return { playerList, onlinePlayerCount };
};
