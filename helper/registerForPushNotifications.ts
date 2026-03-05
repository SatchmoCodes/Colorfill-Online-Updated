import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  loadHasAskedNotificationPermission,
  saveHasAskedNotificationPermission,
} from "./asyncStorageHelper";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice || Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  const hasAsked = await loadHasAskedNotificationPermission();

  // Only ask if permission not yet granted or denied
  if (
    (existingStatus !== "granted" && existingStatus !== "denied") ||
    !hasAsked
  ) {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    await saveHasAskedNotificationPermission(true);
  }

  if (finalStatus !== "granted") {
    console.log("Notifications not granted.");
    return null;
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Push token fetch timed out")), 10000)
    );
    const { data: token } = await Promise.race([
      Notifications.getExpoPushTokenAsync({
        projectId: "495c2cc3-7384-4eaa-a937-648fad614abb",
      }),
      timeoutPromise,
    ]);
    console.log("Expo Push Token:", token);
    return token;
  } catch (error) {
    console.log("Failed to get push token:", error);
    return null;
  }
}
