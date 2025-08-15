// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC92UqpQypcOiK9sLv9-gvRvBfZbGbngcY",
  authDomain: "colorfill-updated.firebaseapp.com",
  projectId: "colorfill-updated",
  storageBucket: "colorfill-updated.firebasestorage.app",
  messagingSenderId: "185336486852",
  appId: "1:185336486852:web:11c097f26bc37c1427e291",
  measurementId: "G-6WKVKQTM8W",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
