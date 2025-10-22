import * as admin from "firebase-admin";
import { onValueDeleted } from "firebase-functions/v2/database";

type GameState = "waiting" | "playing" | "deleting";

const db = admin.firestore();

export const handlePlayerDisconnect = onValueDeleted(
  "/gamePresence/{gameId}/{userId}",
  async (event) => {
    const { gameId, userId } = event.params;
    const gameRef = db.collection("games").doc(gameId);
    const gameSnap = await gameRef.get();

    if (!gameSnap.exists) return null;

    const data = gameSnap.data();
    const isOwner = data?.ownerUid === userId;
    const isOpponent = data?.opponentUid === userId;
    const status = data?.status;

    if (!isOwner && !isOpponent) return null;

    console.log(`User ${userId} left game ${gameId}`);

    if (status === "waiting") {
      if (isOwner) {
        if (data?.opponentName) {
          await gameRef.update({
            ownerName: data.opponentName,
            ownerUid: data.opponentUid,
            opponentName: null,
            opponentUid: null,
          });
        } else {
          await gameRef.update({ status: "deleting" });
        }
      } else if (isOpponent) {
        await gameRef.update({
          opponentName: null,
          opponentUid: null,
        });
      }
    } else if (status === "playing") {
      if (isOwner) {
        if (data?.opponentName) {
          await gameRef.update({
            winner: "opponent",
          });
        } else {
          await gameRef.update({
            status: "deleting",
          });
        }
      } else if (isOpponent) {
        if (data?.ownerName) {
          await gameRef.update({
            winner: "owner",
          });
        } else {
          await gameRef.update({
            status: "deleting",
          });
        }
      }
    }

    return null;
  }
);
