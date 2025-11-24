import {
  loadHasAskedNotificationPermission,
  saveHasAskedNotificationPermission,
} from "@/helper/asyncStorageHelper";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";

export function useNotificationPermission() {
  const [status, setStatus] = useState<Notifications.PermissionStatus | null>(
    null
  );
  const [hasAskedBefore, setHasAskedBefore] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setStatus(status);

      const asked = await loadHasAskedNotificationPermission();
      setHasAskedBefore(asked);
    })();
  }, []);

  const askPermission = async () => {
    if (!Device.isDevice) return null;

    await saveHasAskedNotificationPermission(true);

    const { status } = await Notifications.requestPermissionsAsync();
    setStatus(status);

    return status;
  };

  return {
    status, // "granted" | "denied" | "undetermined"
    hasAskedBefore, // boolean
    askPermission, // call on user action
  };
}
