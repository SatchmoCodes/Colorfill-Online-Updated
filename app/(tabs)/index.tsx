import { Image } from "expo-image";
import { Button, Platform, StyleSheet } from "react-native";

import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import { auth } from "@/firebaseConfig";
import { CommonActions, useNavigation } from "@react-navigation/core";

export default function HomeScreen() {
  const navigation = useNavigation();

  const handleSignOut = () => {
    auth.signOut().then(() => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "login" }], // replace 'HomePage' with the actual route name
        })
      );
    });
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
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
      <Button title="Login" onPress={() => router.push("/login")}></Button>
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
