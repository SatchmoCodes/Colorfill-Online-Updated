import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { db } from "@/firebaseConfig";
import { buildBOTDDateOptions, monthMap } from "@/helper/buildBOTDDateOptions";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export type Gamemode = "freeplay" | "progressive" | "boardoftheday" | "pvp";

type Option = { label: string; value: string };

const gamemodeOptions = [
  { label: "Free Play", value: "freeplay" },
  // { label: "Progressive", value: "progressive" },
  { label: "Board of the Day", value: "boardoftheday" },
  { label: "Player vs Player", value: "pvp" },
];

const sizeOptions = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
  { label: "XLarge", value: "xlarge" },
];

const PVPQueryOptions = [
  { label: "Wins", value: "wins" },
  { label: "Current Win Streak", value: "currentWinStreak" },
  { label: "Best Win Streak", value: "bestWinStreak" },
  { label: "Win Rate", value: "winRate" },
];

const botdDateOptions = buildBOTDDateOptions();

console.log("what is this", botdDateOptions);

const today = new Date();

interface LeaderboardOptionsModal {
  gamemode: string;
  size: string;
  pvpQueryParameter: string;
  year: string;
  month: string;
  day: string;
  botdDateOptions: Record<
    string,
    {
      month: string;
      dates: string[];
    }[]
  >;
  lastDoc: QueryDocumentSnapshot<DocumentData, DocumentData> | null;
  setOpenLeaderboardOptionsModal: React.Dispatch<React.SetStateAction<boolean>>;
  setGamemode: React.Dispatch<React.SetStateAction<Gamemode>>;
  setSize: React.Dispatch<React.SetStateAction<string>>;
  setPvpQueryParameter: React.Dispatch<React.SetStateAction<string>>;
  setYear: React.Dispatch<React.SetStateAction<string>>;
  setMonth: React.Dispatch<React.SetStateAction<string>>;
  setDay: React.Dispatch<React.SetStateAction<string>>;
  setBotdId: React.Dispatch<React.SetStateAction<string>>;
  setLastDoc: React.Dispatch<
    React.SetStateAction<QueryDocumentSnapshot<
      DocumentData,
      DocumentData
    > | null>
  >;
  getQueryResults: ({
    queryGamemode,
    querySize,
    queryPVPOption,
    queryBotdId,
    startAfterDoc,
  }: {
    queryGamemode: Gamemode;
    querySize?: string | null;
    queryPVPOption?: string | null;
    queryBotdId?: string | null;
    startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
  }) => Promise<void>;
}

export default function Leaderboard() {
  const [openLeaderboardOptionsModal, setOpenLeaderboardOptionsModal] =
    useState(false);
  const [gamemode, setGamemode] = useState<Gamemode>("freeplay");
  const [size, setSize] = useState("medium");
  const [pvpQueryParameter, setPvpQueryParameter] = useState("wins");
  const [tableData, setTableData] = useState<DocumentData[]>([]);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [year, setYear] = useState(today.getFullYear().toString());
  const [month, setMonth] = useState((today.getMonth() + 1).toString());
  const [day, setDay] = useState(today.getDate().toString());
  const [botdId, setBotdId] = useState("");
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<
    DocumentData,
    DocumentData
  > | null>(null);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    getQueryResults({ queryGamemode: "freeplay", querySize: "medium" });
  }, []);

  async function getQueryResults({
    queryGamemode,
    querySize = null,
    queryPVPOption = null,
    queryBotdId = null,
    startAfterDoc = null, // 👈 add this
    currentTableData = [],
  }: {
    queryGamemode: Gamemode;
    querySize?: string | null;
    queryPVPOption?: string | null;
    queryBotdId?: string | null;
    startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
    currentTableData?: DocumentData[] | [];
  }) {
    try {
      if (gamemode !== queryGamemode) {
        setLoadingQuery(true);
      }
      let snapshot = null;

      switch (queryGamemode) {
        case "freeplay":
          if (querySize) {
            let scoreQuery = query(
              collection(db, "scores"),
              where("gamemode", "==", queryGamemode),
              where("size", "==", querySize),
              where("highScore", "==", true),
              orderBy("score", "asc"),
              orderBy("createdAt", "asc"),
              limit(25)
            );

            // 👇 add pagination dynamically
            if (startAfterDoc) {
              scoreQuery = query(scoreQuery, startAfter(startAfterDoc));
            }

            snapshot = await getDocs(scoreQuery);

            setTableData(
              snapshot.empty
                ? []
                : [
                    ...currentTableData,
                    ...snapshot.docs.map((doc) => ({
                      id: doc.id,
                      ...doc.data(),
                    })),
                  ]
            );
          } else {
            console.log("no size selected");
            setTableData([]);
          }
          break;

        case "boardoftheday":
          if (queryBotdId) {
            const ref = doc(db, "boards", queryBotdId);
            const botdDoc = await getDoc(ref);
            if (botdDoc.exists()) {
              const boardId = botdDoc.data().boardId;

              let botdScoreQuery = query(
                collection(db, "scores"),
                where("gamemode", "==", queryGamemode),
                where("boardId", "==", boardId),
                orderBy("score", "asc"),
                orderBy("createdAt", "asc"),
                limit(25)
              );

              if (startAfterDoc) {
                botdScoreQuery = query(
                  botdScoreQuery,
                  startAfter(startAfterDoc)
                );
              }

              snapshot = await getDocs(botdScoreQuery);

              setTableData(
                snapshot.empty
                  ? []
                  : [
                      ...currentTableData,
                      ...snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                      })),
                    ]
              );
            } else {
              setTableData([]);
            }
          } else {
            console.log("no board id selected");
            setTableData([]);
          }
          break;

        case "pvp":
          if (queryPVPOption) {
            let userQuery = null;
            if (queryPVPOption === "winRate") {
              userQuery = query(
                collection(db, "users"),
                where("totalGames", ">=", 10),
                orderBy("winRate", "desc"),
                limit(25)
              );
            } else {
              userQuery = query(
                collection(db, "users"),
                orderBy(queryPVPOption, "desc"),
                limit(25)
              );
            }

            if (startAfterDoc) {
              userQuery = query(userQuery, startAfter(startAfterDoc));
            }

            snapshot = await getDocs(userQuery);

            setTableData(
              snapshot.empty
                ? []
                : [
                    ...currentTableData,
                    ...snapshot.docs.map((doc) => ({
                      id: doc.id,
                      ...doc.data(),
                    })),
                  ]
            );
          } else {
            console.log("no pvp query option selected");
            setTableData([]);
          }
          break;
      }

      // 👇 Optionally return the last document for pagination
      if (snapshot && !snapshot.empty) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === 25);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Firestore query error:", err);
    } finally {
      setLoadingQuery(false);
    }
  }

  const handlePagination = async () => {
    if (
      loadingMore ||
      !hasMore ||
      tableData.length === 0 ||
      tableData.length >= 500 ||
      !lastDoc
    )
      return;

    setLoadingMore(true);

    try {
      let results;

      switch (gamemode) {
        case "freeplay":
          results = await getQueryResults({
            queryGamemode: gamemode,
            querySize: size,
            startAfterDoc: lastDoc,
            currentTableData: tableData,
          });
          break;
        case "boardoftheday":
          results = await getQueryResults({
            queryGamemode: gamemode,
            queryBotdId: botdId,
            startAfterDoc: lastDoc,
            currentTableData: tableData,
          });
          break;
        case "pvp":
          results = await getQueryResults({
            queryGamemode: gamemode,
            queryPVPOption: pvpQueryParameter,
            startAfterDoc: lastDoc,
            currentTableData: tableData,
          });
          break;
      }
    } catch (err) {
      console.error("Pagination error:", err);
    } finally {
      setLoadingMore(false);
    }
  };

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
        <SelectedParameters
          gamemode={gamemode}
          size={size}
          pvpQueryParameter={pvpQueryParameter}
          botdId={botdId}
        />
        {loadingQuery ? (
          <ActivityIndicator />
        ) : (
          <Table
            tableData={tableData}
            gamemode={gamemode}
            pvpQueryParameter={pvpQueryParameter}
            loadingMore={loadingMore}
            handlePagination={handlePagination}
          />
        )}
      </View>

      {/* Options Modal */}
      {openLeaderboardOptionsModal && (
        <OptionsModal
          gamemode={gamemode}
          size={size}
          pvpQueryParameter={pvpQueryParameter}
          year={year}
          month={month}
          day={day}
          botdDateOptions={botdDateOptions}
          lastDoc={lastDoc}
          setGamemode={setGamemode}
          setSize={setSize}
          setPvpQueryParameter={setPvpQueryParameter}
          setOpenLeaderboardOptionsModal={setOpenLeaderboardOptionsModal}
          setYear={setYear}
          setMonth={setMonth}
          setDay={setDay}
          setBotdId={setBotdId}
          setLastDoc={setLastDoc}
          getQueryResults={getQueryResults}
        />
      )}
    </ThemedView>
  );
}

const SelectedParameters = ({
  gamemode,
  size,
  pvpQueryParameter,
  botdId,
}: {
  gamemode: Gamemode;
  size: string;
  pvpQueryParameter: string;
  botdId: string;
}) => {
  const getParameterLabel = (gamemode: Gamemode) => {
    switch (gamemode) {
      case "freeplay":
        return sizeOptions.find((x) => x.value === size)?.label;
      case "boardoftheday":
        const day = botdId.split("-")[2];
        const month = botdId.split("-")[1];
        const year = botdId.split("-")[0];
        return `${monthMap[parseInt(month)]} ${day}, ${year}`;
      case "pvp":
        return PVPQueryOptions.find((x) => x.value === pvpQueryParameter)
          ?.label;
    }
  };
  return (
    <View
      style={{
        width: "100%",
        margin: "auto",
        marginBottom: 10,
        justifyContent: "space-evenly",
        flexDirection: "row",
      }}
    >
      <ThemedText>
        {gamemodeOptions.find((x) => x.value === gamemode)?.label}
      </ThemedText>
      <ThemedText>{getParameterLabel(gamemode)}</ThemedText>
    </View>
  );
};

const TopRow = ({ gamemode }: { gamemode: Gamemode }) => {
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
        <ThemedText style={styles.topRowCellText}>
          {gamemode === "pvp" ? "Value" : "Score"}
        </ThemedText>
      </ThemedView>
    </LinearGradient>
  );
};

const Table = ({
  tableData,
  gamemode,
  pvpQueryParameter,
  loadingMore,
  handlePagination,
}: {
  tableData: DocumentData[];
  gamemode: Gamemode;
  pvpQueryParameter: string;
  loadingMore: boolean;
  handlePagination: () => void;
}) => {
  // console.log("data", tableData);

  const displayValue = (item: any, parameter: string) => {
    if (parameter === "winRate") {
      if (item["totalGames"] < 10) return `${item["totalGames"]}/10`;
      return `${item[parameter]}%`;
    }
    return item[parameter];
  };

  const getValueColor = (item: any, parameter: string) => {
    if (parameter === "winRate") {
      if (item["totalGames"] < 10) return "white";
      if (item[parameter] < 50) return "red";
      if (item[parameter] >= 50) return "green";
    }
    return "white";
  };

  return (
    <>
      <FlatList
        data={tableData}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<TopRow gamemode={gamemode} />}
        onEndReached={handlePagination}
        onEndReachedThreshold={0.5} // triggers when 50% away from bottom
        ListFooterComponent={
          loadingMore ? <ActivityIndicator size="small" color="#999" /> : null
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.row,
              index % 2 === 0 ? styles.rowEven : styles.rowOdd,
            ]}
            onPress={() =>
              gamemode === "freeplay" &&
              router.push({
                pathname: "/viewscore",
                params: {
                  boardId: item.boardId,
                  boardData: item.boardData,
                  bestScore: item.score,
                },
              })
            }
          >
            <ThemedView style={[styles.cell, { width: "20%" }]}>
              <ThemedText style={styles.cellText}>{index + 1}</ThemedText>
            </ThemedView>
            <ThemedView style={[styles.cell, { width: "55%" }]}>
              <ThemedText style={styles.cellText}>
                {gamemode === "pvp" ? item.username : item.createdBy}
              </ThemedText>
            </ThemedView>
            <ThemedView style={[styles.cell, { width: "25%" }]}>
              <ThemedText
                style={[
                  styles.cellText,
                  {
                    color:
                      gamemode === "pvp"
                        ? getValueColor(item, pvpQueryParameter)
                        : "white",
                  },
                ]}
              >
                {gamemode === "pvp"
                  ? displayValue(item, pvpQueryParameter)
                  : item.score}
              </ThemedText>
            </ThemedView>
          </TouchableOpacity>
        )}
      />
    </>
  );
};

const OptionsModal = ({
  gamemode,
  size,
  pvpQueryParameter,
  year,
  month,
  day,
  botdDateOptions,
  lastDoc,
  setGamemode,
  setSize,
  setPvpQueryParameter,
  setOpenLeaderboardOptionsModal,
  setBotdId,
  setYear,
  setMonth,
  setDay,
  setLastDoc,
  getQueryResults,
}: LeaderboardOptionsModal) => {
  const [tempGamemode, setTempGamemode] = useState(gamemode);
  const [tempSize, setTempSize] = useState(size);
  const [tempPvpQueryParameter, setTempPvpQueryParameter] =
    useState(pvpQueryParameter);
  const [tempYear, setTempYear] = useState(year);
  const [tempMonth, setTempMonth] = useState(month);
  const [tempDay, setTempDay] = useState(day);

  const yearOptions = Object.keys(botdDateOptions).map((x) => ({
    label: x,
    value: x,
  }));

  const [monthOptions, setMonthOptions] = useState<Option[]>(() => {
    return botdDateOptions[tempYear].map((x) => ({
      label: monthMap[parseInt(x.month)],
      value: x.month,
    }));
  });
  const [dayOptions, setDayOptions] = useState<Option[] | undefined>(() => {
    return botdDateOptions[tempYear]
      .find((x) => x.month === tempMonth.toString())
      ?.dates.map((y) => ({ label: y, value: y }))
      .sort((a, b) => parseInt(a.value) - parseInt(b.value));
  });

  const handleApply = async () => {
    setOpenLeaderboardOptionsModal(false);
    switch (tempGamemode) {
      case "freeplay":
        if (gamemode !== tempGamemode || size !== tempSize) {
          setSize(tempSize);
          setLastDoc(null);
          await getQueryResults({
            queryGamemode: "freeplay",
            querySize: tempSize,
          });
        }
        break;
      case "boardoftheday":
        if (
          gamemode !== tempGamemode ||
          tempYear !== year ||
          tempMonth !== month ||
          tempDay !== day
        ) {
          const updatedMonth = parseInt(tempMonth).toString();
          const queryBotdId = `${tempYear}-${updatedMonth.padStart(
            2,
            "0"
          )}-${tempDay.padStart(2, "0")}`;
          setBotdId(queryBotdId);
          setYear(tempYear);
          setMonth(tempMonth);
          setDay(tempDay);
          setLastDoc(null);
          await getQueryResults({
            queryGamemode: "boardoftheday",
            queryBotdId,
          });
        }
        break;
      case "pvp":
        if (
          gamemode !== tempGamemode ||
          tempPvpQueryParameter !== pvpQueryParameter
        ) {
          setPvpQueryParameter(tempPvpQueryParameter);
          setLastDoc(null);
          await getQueryResults({
            queryGamemode: "pvp",
            queryPVPOption: tempPvpQueryParameter,
          });
        }
        break;
    }
    setGamemode(tempGamemode as Gamemode);
  };

  useEffect(() => {
    if (tempYear && tempMonth && tempDay) {
      setMonthOptions(
        botdDateOptions[tempYear].map((x) => ({
          label: monthMap[parseInt(x.month)],
          value: x.month,
        }))
      );
      const updatedDayOptions = botdDateOptions[tempYear]
        .find((x) => x.month === tempMonth.toString())
        ?.dates.map((y) => ({ label: y, value: y }))
        .sort((a, b) => parseInt(a.value) - parseInt(b.value));
      setDayOptions(updatedDayOptions);
      if (
        updatedDayOptions &&
        !updatedDayOptions?.find((x) => x.value === tempDay)
      ) {
        setTempDay(updatedDayOptions[0].value);
      }
    }
  }, [tempYear, tempMonth, tempDay]);

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
            value={tempGamemode}
            onChange={(item) => setTempGamemode(item.value)}
            style={{ width: 200, marginTop: 10, marginBottom: 20 }}
          />
          {tempGamemode === "freeplay" && (
            <>
              <ThemedText type="subtitle">Board Size</ThemedText>
              <Dropdown
                data={sizeOptions}
                placeholderStyle={{ color: "white" }}
                selectedTextStyle={{ color: "white" }}
                labelField="label"
                valueField="value"
                value={tempSize}
                onChange={(item) => setTempSize(item.value)}
                style={{ width: 200, marginTop: 10, marginBottom: 20 }}
              />
            </>
          )}
          {tempGamemode === "boardoftheday" && (
            <>
              <ThemedText type="subtitle">Year</ThemedText>
              <Dropdown
                data={yearOptions}
                placeholderStyle={{ color: "white" }}
                selectedTextStyle={{ color: "white" }}
                labelField="label"
                valueField="value"
                value={tempYear}
                onChange={(item) => setTempYear(item.value)}
                style={{ width: 200, marginTop: 10, marginBottom: 20 }}
              />
              <ThemedText type="subtitle">Month</ThemedText>
              <Dropdown
                data={monthOptions}
                placeholderStyle={{ color: "white" }}
                selectedTextStyle={{ color: "white" }}
                labelField="label"
                valueField="value"
                value={tempMonth}
                onChange={(item) => setTempMonth(item.value)}
                style={{ width: 200, marginTop: 10, marginBottom: 20 }}
              />
              <ThemedText type="subtitle">Day</ThemedText>
              <Dropdown
                data={dayOptions ?? []}
                placeholderStyle={{ color: "white" }}
                selectedTextStyle={{ color: "white" }}
                labelField="label"
                valueField="value"
                value={tempDay}
                onChange={(item) => setTempDay(item.value)}
                style={{ width: 200, marginTop: 10, marginBottom: 20 }}
              />
            </>
          )}
          {tempGamemode === "pvp" && (
            <>
              <ThemedText type="subtitle">Query Parameters</ThemedText>
              <Dropdown
                data={PVPQueryOptions}
                placeholderStyle={{ color: "white" }}
                selectedTextStyle={{ color: "white" }}
                labelField="label"
                valueField="value"
                value={tempPvpQueryParameter}
                onChange={(item) => setTempPvpQueryParameter(item.value)}
                style={{ width: 200, marginTop: 10, marginBottom: 20 }}
              />
            </>
          )}

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
    padding: 10,
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
