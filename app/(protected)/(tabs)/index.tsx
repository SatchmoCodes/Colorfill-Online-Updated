import { ThemedText } from "@/components/ThemedText";
import { auth, rtdb } from "@/firebaseConfig";
import { useUser } from "@/hooks/useFirebaseUser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import { router } from "expo-router";
import { ref, remove, serverTimestamp, update } from "firebase/database";
import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

export default function HomeScreen() {
  const user = useUser();
  const handleSignOut = async () => {
    const userStatusRef = ref(rtdb, `/onlineUsers/${user.uid}`);
    await AsyncStorage.clear();
    if (!user.displayName) {
      remove(userStatusRef);
    } else {
      update(userStatusRef, {
        online: false,
        lastSeen: serverTimestamp(),
      });
    }

    auth.signOut();
  };

  return (
    <View style={styles.container}>
      <View style={{ height: "40%" }}>
        <Image
          style={styles.colorImage}
          source={require("@/assets/images/ColorFill.png")}
          resizeMode="contain"
        />
      </View>
      <View>
        <NavButton
          title="Free Play"
          handlePress={() => router.push("/freeplay")}
        />
        <NavButton
          title="Board of the Day"
          handlePress={() => router.push("/boardoftheday")}
        />
        <NavButton
          title="Player vs Player"
          handlePress={() => router.push("/pvpmenu")}
        />
        <View style={{ paddingTop: 30 }}>
          <NavButton
            title="How to Play"
            handlePress={() => router.push("/howtoplay")}
          />
          <NavButton title="Logout" handlePress={() => handleSignOut()} />
        </View>
      </View>
    </View>
  );
}

const NavButton = ({
  title,
  handlePress,
}: {
  title: string;
  handlePress: () => void;
}) => {
  const networkState = Network.useNetworkState();
  const [isPressed, setIsPressed] = useState(false);

  const checkNetworkState = (handleNavigate: () => void) => {
    if (title === "Free Play") return handleNavigate();
    if (networkState.isConnected) {
      handleNavigate();
    } else {
      alert("Internet connection required to play this mode");
    }
  };

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={() => checkNetworkState(handlePress)}
      style={[
        styles.navButtons,
        {
          transform: [{ scale: isPressed ? 0.96 : 1 }],
        },
      ]}
    >
      <ThemedText style={styles.navText}>{title.toUpperCase()}</ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    // justifyContent: "center",
    width: "100%",
    gap: 20,
    backgroundColor: "transparent",
  },
  colorImage: {
    maxWidth: "100%",
    height: "100%",
  },
  navButtons: {
    width: 200,
    padding: 10,
    backgroundColor: "#448ee2ff",
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
  },
  navText: {
    fontWeight: "bold",
    textAlign: "center",
  },
});
