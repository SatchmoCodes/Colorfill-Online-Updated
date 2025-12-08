import { useEffect } from "react";

export function useMobileAds() {
  useEffect(() => {
    const ads = require("react-native-google-mobile-ads");
  }, []);
}
