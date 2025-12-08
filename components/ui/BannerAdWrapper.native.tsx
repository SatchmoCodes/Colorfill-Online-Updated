import { Platform } from "react-native";

export function BannerAdWrapper() {
  if (Platform.OS === "web") {
    return null; // or return a placeholder ad box for layout
  }

  const {
    BannerAd,
    BannerAdSize,
    TestIds,
  } = require("react-native-google-mobile-ads");

  return (
    <BannerAd
      unitId={TestIds.ADAPTIVE_BANNER}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{
        networkExtras: {
          collapsible: "bottom",
        },
      }}
    />
  );
}
