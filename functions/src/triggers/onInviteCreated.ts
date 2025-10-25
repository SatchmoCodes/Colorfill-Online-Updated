import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { sendPushNotification } from "../sendPushNotification";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const onInviteCreated = onDocumentCreated(
  "invites/{inviteId}",
  async (event) => {
    const invite = event.data?.data();
    if (!invite) return;

    const recipientDoc = await admin
      .firestore()
      .collection("users")
      .doc(invite.recipientUid)
      .get();
    const token = recipientDoc.data()?.expoPushToken;

    if (!token) {
      console.log("No Expo token for recipient:", invite.recipientUid);
      return;
    }

    await sendPushNotification(
      token,
      "New Game Invite!",
      `${invite.senderName} invited you to play!`
    );
  }
);
