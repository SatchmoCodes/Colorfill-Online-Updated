import { colors } from "@/components/SimpleColorPicker";
import { auth, db } from "@/firebaseConfig";
import { router, useNavigation } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Register = () => {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");

  const navigation = useNavigation();

  const handleSignUp = async () => {
    let cancel = false;
    if (displayName.includes(" ")) {
      cancel = true;
      alert("username must not include spaces");
    }
    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      updateProfile(response.user, {
        displayName: displayName,
      });
      await addDoc(collection(db, "users"), {
        email: email,
        uid: response.user.uid,
        username: displayName,
        wins: 0,
        losses: 0,
        totalGames: 0,
        winRate: 0,
        currentWinStreak: 0,
        bestWinStreak: 0,
        boardsCompleted: 0,
        boardsOfTheDayCompleted: 0,
        bestSmallScore: null,
        bestMediumScore: null,
        bestLargeScore: null,
        bestXLargeScore: null,
        profileBackground: colors[Math.floor(Math.random() * colors.length)],
        profileBanner: colors[Math.floor(Math.random() * colors.length)],
        profileLetter: colors[Math.floor(Math.random() * colors.length)],
        expoPushToken: null,
        createdAt: serverTimestamp(),
      });
      router.replace("/(protected)/(tabs)");
    } catch (error) {
      alert(error);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/ColorFill-Splash.png")}
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <View style={styles.top}>
          <Image
            style={styles.colorImage}
            source={require("@/assets/images/ColorFill.png")}
            resizeMode="contain"
          ></Image>
        </View>

        <KeyboardAvoidingView
          style={styles.bottomKAV}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          contentContainerStyle={{ alignItems: "center" }}
        >
          <View style={styles.bottom}>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Email"
                placeholderTextColor="black"
                value={email}
                onChangeText={(text) => setEmail(text)}
                style={styles.input}
              />
              <TextInput
                placeholder="Username"
                placeholderTextColor="black"
                value={displayName}
                onChangeText={(text) => setDisplayName(text)}
                style={styles.input}
                maxLength={15}
              />
              <TextInput
                placeholder="Password"
                placeholderTextColor="black"
                value={password}
                onChangeText={(text) => setPassword(text)}
                style={styles.input}
                secureTextEntry
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleSignUp}
                style={[styles.button, styles.buttonOutline]}
              >
                <Text style={styles.buttonOutlineText}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
};

export default Register;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    justifyContent: "flex-start", // Start content from the top
    alignItems: "center",
    backgroundColor: "transparent",
  },
  top: {
    height: "20%", // Fixed height for the logo
    width: "100%",
    zIndex: 10, // Ensure logo is on top if anything else moves under it,
    marginTop: 20,
  },
  colorImage: {
    maxWidth: "100%",
    height: "100%",
  },
  bottomKAV: {
    flex: 1,
    width: "100%",
  },
  bottom: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  inputContainer: {
    width: "80%",
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 5,
    borderWidth: 1,
    width: "50%",
    maxWidth: 600,
    minWidth: 300,
    marginLeft: "auto",
    marginRight: "auto",
  },
  buttonContainer: {
    width: "60%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  button: {
    backgroundColor: "#0782F9",
    width: "100%",
    maxWidth: 250,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonOutline: {
    backgroundColor: "white",
    marginTop: 5,
    borderColor: "#0782F9",
    borderWidth: 2,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonOutlineText: {
    color: "#0782F9",
    fontWeight: "700",
    fontSize: 16,
  },
});
