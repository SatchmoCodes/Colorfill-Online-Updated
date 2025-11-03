import { db } from "@/firebaseConfig";
import { handleJoinGame } from "@/helper/handleJoinGame";
import * as Notifications from "expo-notifications";
import { User } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useEffect } from "react";
import { Platform } from "react-native";

export function useNotificationResponse(user: User | null) {
  if (Platform.OS === "web") return;
  useEffect(() => {
    if (user) {
      (() => {
        const lastNotificationResponse =
          Notifications.getLastNotificationResponse();

        if (lastNotificationResponse?.notification?.request?.content?.data) {
          const data =
            lastNotificationResponse.notification.request.content.data;
          handleNotificationNavigation(user, data.gameId as string);
        }
      })();

      const subscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data;
          console.log("User tapped notification with data:", data, user);

          // Example: Navigate to game screen with invite info
          if (data?.gameId) {
            handleNotificationNavigation(user, data.gameId as string);
          }
        });
      return () => subscription.remove();
    }
  }, [user]);
}

function handleNotificationNavigation(user: User, gameId: string) {
  const docRef = doc(db, "games", gameId);
  handleJoinGame(docRef, user);
}
