// hooks/useFirebaseUser.ts
import { auth } from "@/firebaseConfig";
import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

export function useFirebaseUser(redirectIfNoUser: boolean = false) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (redirectIfNoUser && !firebaseUser) {
        router.replace("/login");
      }
    });

    return unsubscribe;
  }, [redirectIfNoUser]);

  return { user, loading };
}

export function useRequiredUser() {
  const { user, loading } = useFirebaseUser(true);

  // Don’t throw → just let layout render a loading UI
  return { user, loading };
}

export const UserContext = createContext<User | null>(null);

export function useUser() {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error("useUser must be used inside <UserContext.Provider>");
  }
  return user;
}
