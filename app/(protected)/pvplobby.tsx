import Avatar from "@/components/Avatar";
import CustomHeader from "@/components/CustomHeader";
import { ThemedBackground } from "@/components/ThemedBackground";
import { ThemedText } from "@/components/ThemedText";
import CommonButton from "@/components/ui/CommonButton";
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
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";

interface PlayerRefObject {
  name: string | null;
  uid: string;
  profileBackground: string;
  profileLetter: string;
}

const boardTypeMap = {
  random: "Random",
  partmirror: "Partial Mirror",
  mirror: "Mirror",
} as const;

type BoardTypeKey = keyof typeof boardTypeMap;

export default function PvpLobby() {
  const user = useUser();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const navigation = useNavigation();

  const [ownerName, setOwnerName] = useState("");
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [ownerUid, setOwnerUid] = useState("");
  const [opponentUid, setOpponentUid] = useState("");
  const [ownerBackground, setOwnerBackground] = useState("#313131ff");
  const [ownerLetter, setOwnerLetter] = useState("#ffffff");
  const [opponentBackground, setOpponentBackground] = useState("#313131ff");
  const [opponentLetter, setOpponentLetter] = useState("#ffffff");
  const [docRef, setDocRef] = useState<DocumentReference | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [boardType, setBoardType] = useState<string | null>(null);
  const [fogOfWar, setFogOfWar] = useState<boolean | null>(null);
  const [code, setCode] = useState("");

  const ownerRef = useRef<PlayerRefObject | null>(null);
  const opponentRef = useRef<PlayerRefObject | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!gameId) return;

      const gameRef = doc(db, "games", gameId);

      const unsubscribe = onSnapshot(gameRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("data here", data);
          setOwnerName(data.ownerName);
          setOpponentName(data.opponentName);
          setOwnerUid(data.ownerUid);
          setOpponentUid(data.opponentUid);
          setDocRef(docSnap.ref);
          setOwnerBackground(data.ownerProfileBackground);
          setOwnerLetter(data.ownerProfileLetter);
          setOpponentBackground(data.opponentProfileBackground ?? "#313131ff");
          setOpponentLetter(data.opponentProfileLetter ?? "#ffffff");
          setCode(data.code);
          setSize(data.size);
          setBoardType(data.boardType);
          setFogOfWar(data.fog);
          if (data.status === "playing") {
            router.replace({
              pathname: "/pvpgame",
              params: { gameId },
            });
          }
          if (data.status === "deleting") {
            alert("The game has been closed.");
            router.replace("/(protected)/pvpmenu");
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
      const gameRef = doc(db, "games", gameId);
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
      profileBackground: ownerBackground,
      profileLetter: ownerLetter,
    };
  }, [ownerName, ownerUid, ownerBackground, ownerLetter]);

  useEffect(() => {
    opponentRef.current = {
      name: opponentName,
      uid: opponentUid,
      profileBackground: opponentBackground,
      profileLetter: opponentLetter,
    };
  }, [opponentName, opponentUid, opponentBackground, opponentLetter]);

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
            ownerProfileBackground: opponentRef.current.profileBackground,
            ownerProfileLetter: opponentRef.current.profileLetter,
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

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opponentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (opponentName) {
      Animated.timing(opponentAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    } else {
      opponentAnim.setValue(0);
    }
  }, [opponentName]);

  return (
    <>
      <Stack.Screen
        options={{
          contentStyle: { backgroundColor: "transparent" },
          animation: "fade",
          header: () => (
            <CustomHeader
              title="PVP Lobby"
              routeName="pvplobby"
              docId={user.displayName === ownerName ? docRef?.id : null}
            />
          ),
        }}
      />
      <ThemedBackground style={styles.container}>
        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            <View style={{ flexBasis: "40%", alignItems: "center" }}>
              <Avatar
                username={ownerName}
                size="large"
                profileBackground={ownerBackground}
                profileLetter={ownerLetter}
              />
              <ThemedText style={{ textAlign: "center" }} type="subtitle">
                {ownerName}
              </ThemedText>
            </View>

            <Animated.Text
              style={{
                color: "#d8330aff",
                textAlign: "center",
                fontSize: 28,
                fontWeight: "bold",
                paddingTop: 15,
                transform: [{ scale: pulseAnim }],
              }}
            >
              VS
            </Animated.Text>
            {!opponentName ? (
              <View style={{ flexBasis: "40%", alignItems: "center" }}>
                <ThemedText>Waiting on player</ThemedText>
                <ActivityIndicator />
              </View>
            ) : (
              <Animated.View
                style={{
                  alignItems: "center",
                  opacity: opponentAnim,
                  flexBasis: "40%",
                  transform: [
                    {
                      scale: opponentAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                }}
              >
                <Avatar
                  username={opponentName ?? ""}
                  size="large"
                  profileBackground={opponentBackground}
                  profileLetter={opponentLetter}
                />
                <ThemedText style={{ textAlign: "center" }} type="subtitle">
                  {opponentName}
                </ThemedText>
              </Animated.View>
            )}
          </View>
        </View>
        <View style={{ gap: 20 }}>
          {[
            {
              label: "Board Size",
              value: size ? size[0].toUpperCase() + size.slice(1) : "Unknown",
            },
            {
              label: "Board Type",
              value: boardType
                ? boardTypeMap[boardType as BoardTypeKey]
                : "Unknown",
            },
            {
              label: "Fog of War",
              value: fogOfWar === null ? "Unknown" : fogOfWar ? "On" : "Off",
            },
          ].map((item, index) => (
            <View key={index} style={styles.infoCard}>
              <ThemedText style={styles.infoLabel}>{item.label}</ThemedText>
              <ThemedText style={styles.infoValue}>{item.value}</ThemedText>
            </View>
          ))}
        </View>
        <View>
          {user.displayName === ownerName && (
            <ThemedText
              type="subtitle"
              style={{ textAlign: "center", paddingBottom: 30 }}
            >
              Code: {code}
            </ThemedText>
          )}
          {user?.displayName === ownerName ? (
            <CommonButton
              title="Start Game"
              size={200}
              handlePress={() => handleGameStart()}
              style={{ opacity: opponentName ? 1 : 0.5 }}
            />
          ) : (
            <ThemedText style={{ marginBottom: 50 }}>
              Waiting for game to start...
            </ThemedText>
          )}
        </View>
      </ThemedBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 100,
    paddingBottom: 30,
  },
  createButtonBackground: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  infoCard: {
    width: "90%",
    minWidth: 300,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "rgba(27, 27, 27, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ccc",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
