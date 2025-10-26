import CustomHeader from "@/components/CustomHeader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { db, rtdb } from "@/firebaseConfig";
import { useUser } from "@/hooks/useFirebaseUser";
import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { User } from "firebase/auth";
import { ref, remove } from "firebase/database";
import {
  doc,
  DocumentReference,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

interface PlayerRefObject {
  name: string | null;
  uid: string;
}

export default function PvpLobby() {
  const user = useUser();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const navigation = useNavigation();

  const [ownerName, setOwnerName] = useState("");
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [ownerUid, setOwnerUid] = useState("");
  const [opponentUid, setOpponentUid] = useState("");
  const [docRef, setDocRef] = useState<DocumentReference | null>(null);

  const ownerRef = useRef<PlayerRefObject | null>(null);
  const opponentRef = useRef<PlayerRefObject | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!gameId) return;

      const id = gameId as string;
      const gameRef = doc(db, "games", id);

      const unsubscribe = onSnapshot(gameRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setOwnerName(data.ownerName);
          setOpponentName(data.opponentName);
          setOwnerUid(data.ownerUid);
          setOpponentUid(data.opponentUid);
          setDocRef(docSnap.ref);

          if (data.status === "playing") {
            router.replace({
              pathname: "/pvpgame",
              params: { gameId },
            });
          }
        }
      });

      return () => {
        unsubscribe();
      };
    }, [gameId])
  );

  useEffect(() => {
    if (user && gameId) {
      const gameRef = doc(db, "games", gameId as string);
      const gamePresenceRef = ref(rtdb, `/gamePresence/${gameId}/${user.uid}`);

      const beforeRemove = navigation.addListener("beforeRemove", async (e) => {
        const targetRoute = (e.data?.action as any)?.payload?.name;

        // Prevent leave handling if navigating into the actual game
        if (["settings", "pvpgame"].includes(targetRoute)) {
          return;
        }

        const leavingUser = user;
        await handlePlayerLeave(gameRef, leavingUser);
        remove(gamePresenceRef);
      });

      return () => {
        beforeRemove();
      };
    }
  }, [user, gameId, navigation]);

  useEffect(() => {
    ownerRef.current = {
      name: ownerName,
      uid: ownerUid,
    };
  }, [ownerName, ownerUid]);

  useEffect(() => {
    opponentRef.current = {
      name: opponentName,
      uid: opponentUid,
    };
  }, [opponentName, opponentUid]);

  async function handleGameStart() {
    if (docRef) {
      try {
        await updateDoc(docRef, {
          status: "playing",
        });
      } catch (error) {
        console.log("error starting game ", error);
      }
    }
  }

  async function handlePlayerLeave(
    gameRef: DocumentReference,
    leavingUser: User
  ) {
    if (!leavingUser || !opponentRef.current || !ownerRef.current) return;
    const { name: leavingOpponentName, uid: leavingOpponentUid } =
      opponentRef.current;
    const leavingOwnerName = ownerRef.current?.name;

    try {
      if (leavingUser.displayName === leavingOwnerName) {
        if (leavingOpponentName) {
          await updateDoc(gameRef, {
            ownerName: leavingOpponentName,
            ownerUid: leavingOpponentUid,
            opponentName: null,
            opponentUid: null,
          });
        } else {
          await updateDoc(gameRef, {
            status: "deleting",
          });
        }
      } else if (leavingUser.displayName === leavingOpponentName) {
        await updateDoc(gameRef, {
          opponentName: null,
          opponentUid: null,
        });
      }
    } catch (error) {
      console.error("Error updating game on leave:", error);
    }
  }

  console.log("game id here", docRef, user.displayName === ownerName);

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <CustomHeader
              title="PVP Lobby"
              routeName="pvplobby"
              docRef={user.displayName === ownerName ? docRef : null}
            />
          ),
        }}
      />
      <ThemedView style={styles.container}>
        <ThemedText>pvplobby</ThemedText>
        <ThemedView style={{ flexDirection: "row", gap: 20 }}>
          <ThemedText>{ownerName}</ThemedText>
          <ThemedText>Vs</ThemedText>
          <ThemedText>{opponentName}</ThemedText>
        </ThemedView>
        <ThemedView>
          {user?.displayName === ownerName && opponentName !== null && (
            <TouchableOpacity onPress={() => handleGameStart()}>
              <ThemedText>Start Game</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
});
