import { db } from "@/firebaseConfig";
import { UserDoc } from "@/schema/userDocModel";
import { doc, DocumentReference, getDoc } from "firebase/firestore";

export const getUser = async (
  uid: string
): Promise<{ ref: DocumentReference; data: UserDoc } | null> => {
  try {
    const newDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(newDocRef);

    if (!userDoc.exists()) {
      const docSnap = userDoc;
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
