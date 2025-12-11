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
import { auth } from "@/firebaseConfig";
import { router } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import Toast from "react-native-toast-message";

const showToast = () => {
  Toast.show({
    type: "success",
    text1: "Email Sent Successfully!",
    text2: "Check your spam folder if you do not see a link.",
  });
};

const ResetPassword = ({}) => {
  const [emailOrUsername, setEmailOrUsername] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.replace("/(protected)/(tabs)");
      }
    });
    return unsubscribe;
  }, []);

  const handleSendEmail = async () => {
    try {
      await sendPasswordResetEmail(auth, emailOrUsername);
      showToast();
    } catch (error) {
      alert(error);
      console.error("Email could not be sent: ", error);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/ColorFill-Background.png")}
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
            setEmailOrUsername={setEmailOrUsername}
            handleSendEmail={handleSendEmail}
          />
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
};

const LoginInputs = ({
  emailOrUsername,
  setEmailOrUsername,
  handleSendEmail,
}: {
  emailOrUsername: string;
  setEmailOrUsername: React.Dispatch<React.SetStateAction<string>>;
  handleSendEmail: () => void;
}) => {
  return (
    <View style={styles.bottom}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="black"
          value={emailOrUsername}
          onChangeText={(text) => setEmailOrUsername(text)}
          style={styles.input}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleSendEmail()}
        >
          <Text style={styles.buttonText}>Send Email</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonOutline, { marginTop: 10 }]}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.buttonOutlineText}>Back to Login Page</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ResetPassword;

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
