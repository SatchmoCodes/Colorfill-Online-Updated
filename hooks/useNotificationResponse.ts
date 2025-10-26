import { handleJoinGame } from "@/helper/handleJoinGame";
import * as Notifications from "expo-notifications";
import { User } from "firebase/auth";
import { DocumentReference } from "firebase/firestore";
import { useEffect } from "react";

export function useNotificationResponse(user: User | null) {
  useEffect(() => {
    if (user) {
      const subscription =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data;
          console.log("User tapped notification with data:", data, user);

          // Example: Navigate to game screen with invite info
          if (data?.gameId && user) {
            console.log("is this be runnin");
            handleJoinGame(data.gameId as DocumentReference, user);
          }
        });
      return () => subscription.remove();
    }
  }, [user]);
}
