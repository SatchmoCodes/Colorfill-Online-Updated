import { db } from "@/firebaseConfig";
import { UserDoc } from "@/schema/userDocModel";
import {
  collection,
  DocumentReference,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";

export const getUser = async (
  uid: string
): Promise<{ ref: DocumentReference; data: UserDoc } | null> => {
  try {
    const userQuery = query(
      collection(db, "users"),
      where("uid", "==", uid),
      limit(1)
    );

    const userDoc = await getDocs(userQuery);

    if (!userDoc.empty) {
      const docSnap = userDoc.docs[0];
      return {
        ref: docSnap.ref,
        data: docSnap.data() as UserDoc,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.log("error getting user doc ", error);
    return null;
  }
};
