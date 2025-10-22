import {
  saveProfileBackgroundColor,
  saveProfileLetterColor,
} from "@/helper/asyncStorageHelper";
import { getUser } from "@/helper/commonQueries";
import { User } from "firebase/auth";

import { updateDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import SimpleColorPicker from "../SimpleColorPicker";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

export default function EditProfile({
  user,
  profileBackground,
  profileLetter,
  setProfileBackground,
  setProfileLetter,
  setOpenProfile,
}: {
  user: User;
  profileBackground: string;
  profileLetter: string;
  setProfileBackground: React.Dispatch<React.SetStateAction<string>>;
  setProfileLetter: React.Dispatch<React.SetStateAction<string>>;
  setOpenProfile: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [originalBackground, setOriginalBackground] =
    useState(profileBackground);
  const [originalLetterColor, setOriginalLetter] = useState(profileLetter);
  const [iconBackground, setIconBackground] = useState(profileBackground);
  const [letterColor, setLetterColor] = useState(profileLetter);
  const [isSaving, setIsSaving] = useState(false);

  async function updateColor() {
    try {
      setIsSaving(true);
      const userDoc = await getUser(user.uid);
      if (userDoc) {
        await Promise.all([
          updateDoc(userDoc?.ref, {
            profileBackground: iconBackground,
            profileLetter: letterColor,
          }),
          saveProfileBackgroundColor(iconBackground),
          saveProfileLetterColor(letterColor),
        ]);
      }
      setProfileBackground(iconBackground);
      setProfileLetter(letterColor);
      setOpenProfile(false);
      alert("Profile saved successfully!");
    } catch (error) {
      console.log("error saving");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      onRequestClose={() => setOpenProfile(false)}
      transparent
      animationType="fade"
      style={styles.modalStyle}
    >
      <ThemedView style={styles.centeredView}>
        {isSaving ? (
          <ActivityIndicator />
        ) : (
          <>
            <TouchableOpacity
              style={[styles.avatar, { backgroundColor: iconBackground }]}
              onPress={() => setOpenProfile(true)}
            >
              <ThemedText style={[styles.avatarText, { color: letterColor }]}>
                {user.displayName?.[0].toUpperCase()}
              </ThemedText>
            </TouchableOpacity>
            <ThemedText style={{ marginBottom: 20 }}>
              {user.displayName}
            </ThemedText>
            <ThemedText>Select background color</ThemedText>
            <SimpleColorPicker onSelectColor={setIconBackground} />
            <ThemedText>Select letter color</ThemedText>
            <SimpleColorPicker onSelectColor={setLetterColor} />
            <View style={{ flexDirection: "row", gap: 30, marginTop: 20 }}>
              <TouchableOpacity
                disabled={
                  originalBackground === iconBackground &&
                  originalLetterColor === letterColor
                }
                onPress={() => updateColor()}
              >
                <ThemedText>Save</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOpenProfile(false)}>
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalStyle: {
    width: 200,
  },
  centeredView: {
    justifyContent: "center",
    alignItems: "center",
    margin: "auto",
    borderRadius: 20,
    padding: 35,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderColor: "white",
    borderWidth: 1,
    minHeight: 300,
    minWidth: 300,
  },
  avatar: {
    position: "relative",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    borderColor: "black",
    borderWidth: 1,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },
  iconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "white",
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
