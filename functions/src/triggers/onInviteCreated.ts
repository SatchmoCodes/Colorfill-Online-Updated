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

    const users = await admin
      .firestore()
      .collection("users")
      .where("uid", "==", invite.recipientUid)
      .limit(1)
      .get();

    const recipientDoc = users.docs[0];

    const token = recipientDoc.data()?.expoPushToken;

    console.log("Invite recipient UID:", invite.recipientUid);
    console.log("Recipient doc exists?", recipientDoc.exists);
    console.log("Recipient data:", recipientDoc.data());

    if (!token) {
      console.log("No Expo token for recipient:", invite.recipientUid);
      return;
    }

    await sendPushNotification(
      token,
      "New Game Invite!",
      `${invite.senderName} invited you to play!`,
      invite.gameId
    );
  }
);
