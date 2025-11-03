import React, { useEffect, useState } from "react";
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
// import firebase from '@react-native-firebase/app'
import { auth, db } from "@/firebaseConfig";
import { router } from "expo-router";
import { signInAnonymously, signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";

const LoginScreen = ({}) => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.replace("/(protected)/(tabs)");
      }
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert(error);
    }
  };

  const handleLogin = async () => {
    let email;
    if (emailOrUsername.includes("@")) {
      email = emailOrUsername;
      handleSignIn(email, password);
    } else {
      const q = query(
        collection(db, "users"),
        where("username", "==", emailOrUsername)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        email = querySnapshot.docs[0].data().email;
        handleSignIn(email, password);
      } else {
        alert("no account registered with that username");
      }
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.log("error signing in anonymously", error);
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
          />
        </View>

        <KeyboardAvoidingView
          style={styles.bottomKAV}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <LoginInputs
            // ... (props)
            emailOrUsername={emailOrUsername}
            password={password}
            setEmailOrUsername={setEmailOrUsername}
            setPassword={setPassword}
            handleLogin={handleLogin}
            handleGuestLogin={handleGuestLogin}
          />
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
};

const LoginInputs = ({
  emailOrUsername,
  password,
  setEmailOrUsername,
  setPassword,
  handleLogin,
  handleGuestLogin,
}: {
  emailOrUsername: string;
  password: string;
  setEmailOrUsername: React.Dispatch<React.SetStateAction<string>>;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  handleLogin: () => void;
  handleGuestLogin: () => void;
}) => {
  return (
    <View style={styles.bottom}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Email or Username"
          placeholderTextColor="black"
          value={emailOrUsername}
          onChangeText={(text) => setEmailOrUsername(text)}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="black"
          value={password}
          onChangeText={(text) => setPassword(text)}
          style={styles.input}
          secureTextEntry
        />
        <TouchableOpacity
          style={{ marginTop: 10 }}
          //   onPress={() => navigation.navigate('PasswordReset')}
        >
          <Text style={{ textAlign: "center", color: "blue", fontSize: 15 }}>
            Forgot Password?
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => handleLogin()}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonOutline]}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.buttonOutlineText}>Register Account</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={styles.button}
          onPress={() => handleGuestLogin()}
        >
          <Text style={styles.buttonText}>Sign in Anonymously</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

export default LoginScreen;

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
    width: "100%",
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
    // width: "80%",
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
    marginBottom: 5,
    marginTop: 5,
    alignItems: "center",
  },
  buttonOutline: {
    backgroundColor: "white",
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
