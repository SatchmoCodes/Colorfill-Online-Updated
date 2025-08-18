import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useCallback, useEffect, useState } from "react";
import { Dropdown } from "react-native-element-dropdown";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { auth, db } from "@/firebaseConfig";
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";

const gamemodeOptions = [
  { label: "Free Play", value: "FreePlay" },
  { label: "Progressive", value: "Progressive" },
  { label: "Player vs Player", value: "PVP" },
];

const sizeOptions = [
  { label: "Small", value: "Small" },
  { label: "Medium", value: "Medium" },
  { label: "Large", value: "Large" },
];

interface LeaderboardOptionsModal {
  gamemode: string;
  size: string;
  tempGamemode: string;
  tempSize: string;
  openLeaderboardOptionsModal: boolean;
  setOpenLeaderboardOptionsModal: React.Dispatch<React.SetStateAction<boolean>>;
  setGamemode: React.Dispatch<React.SetStateAction<string>>;
  setSize: React.Dispatch<React.SetStateAction<string>>;
  setTempGamemode: React.Dispatch<React.SetStateAction<string>>;
  setTempSize: React.Dispatch<React.SetStateAction<string>>;
}

export default function Leaderboard() {
  const [openLeaderboardOptionsModal, setOpenLeaderboardOptionsModal] =
    useState(false);
  const [gamemode, setGamemode] = useState("FreePlay");
  const [size, setSize] = useState("Small");
  const [tempGamemode, setTempGamemode] = useState(gamemode); // working copy
  const [tempSize, setTempSize] = useState(size);
  const [tableData, setTableData] = useState<DocumentData[]>([]);

  useEffect(() => {
    getQueryResults();
  }, [gamemode, size]);

  async function getQueryResults() {
    console.log("hahahah");
    try {
      const scoreQuery = query(
        collection(db, "Scores"),
        where("gamemode", "==", gamemode),
        where("size", "==", size),
        where("highScore", "==", true),
        orderBy("score", "asc"),
        orderBy("createdAt", "asc"),
        limit(10)
      );

      const snapshot = await getDocs(scoreQuery);
      console.log("snap", snapshot);

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
      <TouchableOpacity
        style={styles.optionsButton}
        onPress={() =>
          setOpenLeaderboardOptionsModal(!openLeaderboardOptionsModal)
        }
      >
        <ThemedText style={styles.optionsText}>Sort Options</ThemedText>
      </TouchableOpacity>
      <TopRow />
      <Table tableData={tableData} />
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
    <ThemedView style={styles.topRow}>
      <ThemedView style={[styles.topRowCell, { width: "15%" }]}>
        <ThemedText style={styles.topRowCellText}>Rank</ThemedText>
      </ThemedView>
      <ThemedView style={[styles.topRowCell, { width: "60%" }]}>
        <ThemedText style={styles.topRowCellText}>User</ThemedText>
      </ThemedView>
      <ThemedView style={[styles.topRowCell, { width: "25%" }]}>
        <ThemedText style={styles.topRowCellText}>Score</ThemedText>
      </ThemedView>
    </ThemedView>
  );
};

const Table = ({ tableData }: { tableData: DocumentData[] }) => {
  return (
    <FlatList
      data={tableData}
      keyExtractor={(item) => item.id} // important for performance
      renderItem={({ item, index }) => (
        <ThemedView style={styles.row}>
          <ThemedView style={[styles.cell, { width: "15%" }]}>
            <ThemedText style={styles.cellText}>{index + 1}</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.cell, { width: "60%" }]}>
            <ThemedText style={styles.cellText}>{item.createdBy}</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.cell, { width: "25%" }]}>
            <ThemedText style={styles.cellText}>{item.score}</ThemedText>
          </ThemedView>
        </ThemedView>
      )}
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

    // only update if different
    if (gamemode !== tempGamemode || size !== tempSize) {
      setGamemode(tempGamemode);
      setSize(tempSize);
    }
  };

  useEffect(() => {
    if (openLeaderboardOptionsModal) {
      setTempGamemode(gamemode);
      setTempSize(size);
    }
  }, [openLeaderboardOptionsModal]);

  return (
    <Modal
      onRequestClose={() => setOpenLeaderboardOptionsModal(false)}
      animationType="slide"
    >
      <ThemedView style={styles.container}>
        {/* close button */}
        <TouchableOpacity
          style={{ position: "absolute", top: 5, right: 5 }}
          onPress={() => setOpenLeaderboardOptionsModal(false)}
        >
          <IconSymbol size={28} name="clear.fill" color={"white"} />
        </TouchableOpacity>

        <ThemedText style={{ marginBottom: 10, marginTop: 10 }} type="title">
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
          style={{ width: 200, marginTop: 20, marginBottom: 20 }}
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
          style={{ width: 200, marginTop: 20, marginBottom: 20 }}
          disable={gamemode !== "FreePlay"}
        />

        {/* Apply button */}
        <TouchableOpacity onPress={handleApply}>
          <ThemedText>Apply</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 5,
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  optionsButton: {
    marginBottom: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "black",
    padding: 5,
    backgroundColor: "rgba(93, 93, 93, 1)",
  },
  optionsText: {},
  topRow: {
    flexDirection: "row",
    width: "100%",
  },
  topRowCell: {
    borderWidth: 1,
    borderBlockColor: "black",
    padding: 10,
    backgroundColor: "rgba(36, 36, 36, 1)",
  },
  topRowCellText: {
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    width: "100%",
  },
  cell: {
    borderWidth: 1,
    borderBlockColor: "black",
    padding: 10,
    backgroundColor: "rgba(62, 62, 62, 1)",
  },
  cellText: {
    textAlign: "center",
  },
});
