import { Image } from "expo-image";
import { Button, StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { auth } from "@/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function HomeScreen() {
  const handleSignOut = async () => {
    await AsyncStorage.clear();
    auth.signOut();
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#1D3D47", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <Button title="Freeplay" onPress={() => router.push("/freeplay")} />
      <Button
        title="Board of the Day"
        onPress={() => router.push("/boardoftheday")}
      />
      <Button
        title="Player vs Player"
        onPress={() => router.push("/pvpmenu")}
      />
      {/* <Button title="Login" onPress={() => router.push("/login")}></Button> */}
      <Button title="Logout" onPress={() => handleSignOut()}></Button>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
