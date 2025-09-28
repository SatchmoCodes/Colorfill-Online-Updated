import { db } from "@/firebaseConfig";
import { UserDoc } from "@/schema/userDocModel";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

export const getUser = async (uid: string): Promise<UserDoc | null> => {
  const userQuery = query(
    collection(db, "users"),
    where("uid", "==", uid),
    limit(1)
  );
  const userDoc = await getDocs(userQuery);
  if (!userDoc.empty) {
    return userDoc.docs[0].data() as UserDoc;
  }
  return null;
};
