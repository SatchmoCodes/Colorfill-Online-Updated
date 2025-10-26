import { db, rtdb } from "@/firebaseConfig";
import { router } from "expo-router";
import { User } from "firebase/auth";
import { onDisconnect, ref, set } from "firebase/database";
import { DocumentReference, runTransaction } from "firebase/firestore";
import {
  loadProfileBackgroundColor,
  loadProfileLetterColor,
} from "./asyncStorageHelper";

export const handleJoinGame = async (docRef: DocumentReference, user: User) => {
  console.log("these here", docRef, user);
  try {
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists()) throw "Game does not exist";

      const data = docSnap.data();

      if (data.opponentName) throw "Game already has an opponent";

      transaction.update(docRef, {
        opponentName: user?.displayName,
        opponentUid: user?.uid,
        opponentProfileBackground:
          (await loadProfileBackgroundColor()) ?? "#313131ff",
        opponentProfileLetter: (await loadProfileLetterColor()) ?? "#ffffff",
      });
    });

    // ✅ Transaction succeeded — user officially joined the game.
    // Now handle presence tracking in Realtime Database.
    const gamePresenceRef = ref(
      rtdb,
      `/gamePresence/${docRef.id}/${user?.uid}`
    );

    await set(gamePresenceRef, {
      displayName: user?.displayName,
      joinedAt: Date.now(),
      inGame: true,
    });

    // Automatically remove this player if they disconnect
    onDisconnect(gamePresenceRef).remove();

    // Move to the game lobby
    router.push({
      pathname: "/(protected)/pvplobby",
      params: { gameId: docRef.id },
    });
  } catch (e) {
    alert(typeof e === "string" ? e : "Failed to join game.");
  }
};
