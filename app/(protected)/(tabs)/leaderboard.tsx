import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { db } from "@/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export type Gamemode = "freeplay" | "progressive" | "boardoftheday" | "pvp";

const gamemodeOptions = [
  { label: "Free Play", value: "freeplay" },
  { label: "Progressive", value: "progressive" },
  { label: "Board of the Day", value: "boardoftheday" },
  { label: "Player vs Player", value: "pvp" },
];

const sizeOptions = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

interface LeaderboardOptionsModal {
  gamemode: string;
  size: string;
  tempGamemode: string;
  tempSize: string;
  openLeaderboardOptionsModal: boolean;
  setOpenLeaderboardOptionsModal: React.Dispatch<React.SetStateAction<boolean>>;
  setGamemode: React.Dispatch<React.SetStateAction<Gamemode>>;
  setSize: React.Dispatch<React.SetStateAction<string>>;
  setTempGamemode: React.Dispatch<React.SetStateAction<Gamemode>>;
  setTempSize: React.Dispatch<React.SetStateAction<string>>;
}

export default function Leaderboard() {
  const [openLeaderboardOptionsModal, setOpenLeaderboardOptionsModal] =
    useState(false);
  const [gamemode, setGamemode] = useState<Gamemode>("freeplay");
  const [size, setSize] = useState("small");
  const [tempGamemode, setTempGamemode] = useState(gamemode);
  const [tempSize, setTempSize] = useState(size);
  const [tableData, setTableData] = useState<DocumentData[]>([]);

  useEffect(() => {
    getQueryResults();
  }, [gamemode, size]);

  async function getQueryResults() {
    try {
      const scoreQuery = query(
        collection(db, "scores"),
        where("gamemode", "==", gamemode),
        where("size", "==", size),
        where("highScore", "==", true),
        orderBy("score", "asc"),
        orderBy("createdAt", "asc"),
        limit(25)
      );

      const snapshot = await getDocs(scoreQuery);
      if (!snapshot.empty) {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTableData(docs);
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error("Firestore query error:", err);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={{ marginTop: 20, marginBottom: 20 }} type="title">
        Leaderboard
      </ThemedText>

      {/* Sort Options Button */}
      <TouchableOpacity
        style={styles.optionsButton}
        onPress={() =>
          setOpenLeaderboardOptionsModal(!openLeaderboardOptionsModal)
        }
        activeOpacity={0.8}
      >
        <IconSymbol size={20} name="slider.horizontal.3" color={"#fff"} />
        <ThemedText style={styles.optionsText}>Sort Options</ThemedText>
      </TouchableOpacity>

      {/* Leaderboard Table */}
      <View style={styles.tableWrapper}>
        <TopRow />
        <Table tableData={tableData} />
      </View>

      {/* Options Modal */}
      {openLeaderboardOptionsModal && (
        <OptionsModal
          gamemode={gamemode}
          size={size}
          tempGamemode={tempGamemode}
          tempSize={tempSize}
          openLeaderboardOptionsModal={openLeaderboardOptionsModal}
          setGamemode={setGamemode}
          setSize={setSize}
          setTempGamemode={setTempGamemode}
          setTempSize={setTempSize}
          setOpenLeaderboardOptionsModal={setOpenLeaderboardOptionsModal}
        />
      )}
    </ThemedView>
  );
}

const TopRow = () => {
  return (
    <LinearGradient
      colors={["#0a3d91", "#051937"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.topRow}
    >
      <ThemedView style={[styles.topRowCell, { width: "20%" }]}>
        <ThemedText style={styles.topRowCellText}>Rank</ThemedText>
      </ThemedView>
      <ThemedView style={[styles.topRowCell, { width: "55%" }]}>
        <ThemedText style={styles.topRowCellText}>User</ThemedText>
      </ThemedView>
      <ThemedView style={[styles.topRowCell, { width: "25%" }]}>
        <ThemedText style={styles.topRowCellText}>Score</ThemedText>
      </ThemedView>
    </LinearGradient>
  );
};

const Table = ({ tableData }: { tableData: DocumentData[] }) => {
  console.log("data", tableData);
  return (
    <FlatList
      data={tableData}
      keyExtractor={(item) => item.id}
      scrollEnabled
      renderItem={({ item, index }) => {
        return (
          <TouchableOpacity
            style={[
              styles.row,
              index % 2 === 0 ? styles.rowEven : styles.rowOdd,
            ]}
            onPress={() =>
              router.push({
                pathname: "/viewscore",
                params: { boardId: item.boardId, boardData: item.boardData },
              })
            }
          >
            <ThemedView style={[styles.cell, { width: "20%" }]}>
              <ThemedText style={[styles.cellText]}>{index + 1}</ThemedText>
            </ThemedView>
            <ThemedView style={[styles.cell, { width: "55%" }]}>
              <ThemedText style={styles.cellText}>{item.createdBy}</ThemedText>
            </ThemedView>
            <ThemedView style={[styles.cell, { width: "25%" }]}>
              <ThemedText style={styles.cellText}>{item.score}</ThemedText>
            </ThemedView>
          </TouchableOpacity>
        );
      }}
    />
  );
};

const OptionsModal = ({
  gamemode,
  size,
  tempGamemode,
  setTempGamemode,
  tempSize,
  openLeaderboardOptionsModal,
  setTempSize,
  setGamemode,
  setSize,
  setOpenLeaderboardOptionsModal,
}: LeaderboardOptionsModal) => {
  const handleApply = () => {
    setOpenLeaderboardOptionsModal(false);
    if (gamemode !== tempGamemode || size !== tempSize) {
      setGamemode(tempGamemode as Gamemode);
      setSize(tempSize);
    }
  };

  useEffect(() => {
    if (openLeaderboardOptionsModal) {
      setTempGamemode(gamemode as Gamemode);
      setTempSize(size);
    }
  }, [openLeaderboardOptionsModal]);

  return (
    <Modal transparent animationType="fade">
      <View style={styles.modalContainer}>
        <ThemedView style={styles.modalCard}>
          {/* Close button */}
          <TouchableOpacity
            style={{ position: "absolute", top: 10, right: 10 }}
            onPress={() => setOpenLeaderboardOptionsModal(false)}
          >
            <IconSymbol size={28} name="clear.fill" color={"white"} />
          </TouchableOpacity>

          <ThemedText style={{ marginBottom: 20 }} type="title">
            Options
          </ThemedText>

          <ThemedText type="subtitle">Gamemode</ThemedText>
          <Dropdown
            data={gamemodeOptions}
            placeholderStyle={{ color: "white" }}
            selectedTextStyle={{ color: "white" }}
            labelField="label"
            valueField="value"
            value={gamemode}
            onChange={(item) => setTempGamemode(item.value)}
            style={{ width: 200, marginTop: 10, marginBottom: 20 }}
          />

          <ThemedText type="subtitle">Board Size</ThemedText>
          <Dropdown
            data={sizeOptions}
            placeholderStyle={{ color: "white" }}
            selectedTextStyle={{ color: "white" }}
            labelField="label"
            valueField="value"
            value={size}
            onChange={(item) => setTempSize(item.value)}
            style={{ width: 200, marginTop: 10, marginBottom: 20 }}
            disable={gamemode !== "freeplay"}
          />

          {/* Apply Button */}
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <LinearGradient
              colors={["#ff7e5f", "#feb47b"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.applyButtonBackground}
            >
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 5,
  },
  // Sort Button
  optionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#0a3d91",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 15,
  },
  optionsText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 6,
  },
  // Table
  tableWrapper: {
    flex: 1,
    width: "95%",
    borderRadius: 12,
    // overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  topRow: {
    flexDirection: "row",
    width: "100%",
    paddingVertical: 10,
  },
  topRowCell: {
    padding: 10,
  },
  topRowCellText: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#FFD700",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    width: "100%",
  },
  rowEven: {
    backgroundColor: "rgba(62,62,62,0.95)",
  },
  rowOdd: {
    backgroundColor: "rgba(45,45,45,0.95)",
  },
  cell: {
    padding: 12,
  },
  cellText: {
    textAlign: "center",
    color: "#fff",
  },
  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalCard: {
    width: "80%",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#1e1e1e",
    alignItems: "center",
  },
  // Apply button
  applyButton: {
    width: "100%",
    marginTop: 10,
    borderRadius: 25,
    overflow: "hidden",
  },
  applyButtonBackground: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
