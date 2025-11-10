import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice || Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Only ask if permission not yet granted or denied
  if (existingStatus !== "granted" && existingStatus !== "denied") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notifications not granted.");
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: "495c2cc3-7384-4eaa-a937-648fad614abb",
  });

  console.log("Expo Push Token:", token);
  return token;
}
