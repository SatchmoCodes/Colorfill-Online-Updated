import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import CommonButton from "@/components/ui/CommonButton";
import { db } from "@/firebaseConfig";
import { router, useLocalSearchParams } from "expo-router";
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function ViewScore() {
  const { boardId, boardSize, boardData, bestScore, createdBy } =
    useLocalSearchParams();

  const [originalCreator, setOriginalCreator] = useState<DocumentData | null>(
    null
  );

  if (!boardId) {
    return (
      <ThemedView>
        <ThemedText>No board found...</ThemedText>
      </ThemedView>
    );
  }

  async function getScoreCreator() {
    try {
      const creatorQuery = query(
        collection(db, "scores"),
        where("boardId", "==", boardId),
        orderBy("createdAt", "asc"),
        limit(1)
      );
      const querySnapshot = await getDocs(creatorQuery);
      if (!querySnapshot.empty) {
        setOriginalCreator(querySnapshot.docs[0].data());
      }
    } catch (error) {
      console.log("error getting creator ", error);
    }
  }

  useEffect(() => {
    getScoreCreator();
  }, []);

  return (
    <View style={styles.container}>
      <View style={{ height: "90%" }}>
        <ThemedText style={{ textAlign: "center" }} type="title">
          Board Info
        </ThemedText>
        {!originalCreator ? (
          <ActivityIndicator />
        ) : (
          <View style={{ marginTop: 20, marginBottom: 20, gap: 20 }}>
            <View style={{ flexDirection: "row", gap: 20 }}>
              <ThemedText>Created by:</ThemedText>
              <ThemedText>{originalCreator?.createdBy ?? ""}</ThemedText>
            </View>
            <View style={{ flexDirection: "row", gap: 20 }}>
              <ThemedText>Best score: </ThemedText>
              <ThemedText>{createdBy}</ThemedText>
            </View>
            <View style={{ flexDirection: "row", gap: 20 }}>
              <ThemedText>Board size: </ThemedText>
              <ThemedText>
                {boardSize[0].toUpperCase() + boardSize.slice(1)}
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      <CommonButton
        title="Play Board"
        size={200}
        handlePress={() =>
          router.push({
            pathname: "/freeplay",
            params: { boardId, boardData, bestScore },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 30,
  },
});
