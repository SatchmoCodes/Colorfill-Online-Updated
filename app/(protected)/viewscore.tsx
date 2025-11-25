import { ThemedBackground } from "@/components/ThemedBackground";
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
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

export default function ViewScore() {
  const { boardId, boardSize, boardData, bestScore, createdBy, createdAt } =
    useLocalSearchParams();

  const [originalCreator, setOriginalCreator] = useState<DocumentData | null>(
    null
  );

  if (!boardId) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No board found...</ThemedText>
      </ThemedView>
    );
  }

  console.log("created at", createdAt);

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
    <ThemedBackground style={styles.container}>
      <View style={{ height: "90%", width: "100%" }}>
        <ScrollView
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{ alignItems: "center", gap: 20 }}
        >
          <ThemedText style={styles.title} type="title">
            Board Info
          </ThemedText>

          {!originalCreator ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <View style={styles.infoCard}>
              {[
                { id: "holder", label: "Score Holder", value: createdBy },
                { id: "score", label: "Best Score", value: bestScore },
                {
                  id: "creator",
                  label: "Created by",
                  value: originalCreator.createdBy ?? "",
                },
                {
                  id: "size",
                  label: "Board size",
                  value: boardSize[0].toUpperCase() + boardSize.slice(1),
                },
                { id: "createdAt", label: "Created At", value: createdAt },
              ].map((row) => (
                <View key={row.id} style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>{row.label}:</ThemedText>
                  <ThemedText style={styles.infoValue}>{row.value}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
      <View style={{ height: "10%" }}>
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
    </ThemedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  infoCard: {
    width: "100%",
    backgroundColor: "rgba(20, 20, 20, 0.9)",
    borderRadius: 20,
    padding: 20,
    gap: 15,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(60,60,60,0.5)",
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ddd",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
