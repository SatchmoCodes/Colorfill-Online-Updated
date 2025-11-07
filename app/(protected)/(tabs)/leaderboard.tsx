import ThemedDropDown from "@/components/ThemedDropDown";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import CommonButton from "@/components/ui/CommonButton";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { db } from "@/firebaseConfig";
import {
  loadLeaderboardRefreshTime,
  saveLeaderboardRefreshTime,
} from "@/helper/asyncStorageHelper";
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

const COOLDOWN_SECONDS = 15;

const botdDateOptions = buildBOTDDateOptions();

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
                ? [...currentTableData]
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
                  ? [...currentTableData]
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
                ? [...currentTableData]
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
      switch (gamemode) {
        case "freeplay":
          await getQueryResults({
            queryGamemode: gamemode,
            querySize: size,
            startAfterDoc: lastDoc,
            currentTableData: tableData,
          });
          break;
        case "boardoftheday":
          await getQueryResults({
            queryGamemode: gamemode,
            queryBotdId: botdId,
            startAfterDoc: lastDoc,
            currentTableData: tableData,
          });
          break;
        case "pvp":
          await getQueryResults({
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

  const fetchRefreshData = async () => {
    switch (gamemode) {
      case "freeplay":
        await getQueryResults({
          queryGamemode: gamemode,
          querySize: size,
        });
        break;
      case "boardoftheday":
        await getQueryResults({
          queryGamemode: gamemode,
          queryBotdId: botdId,
        });
        break;
      case "pvp":
        await getQueryResults({
          queryGamemode: gamemode,
          queryPVPOption: pvpQueryParameter,
        });
        break;
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText style={{ marginTop: 20, marginBottom: 20 }} type="title">
        Leaderboard
      </ThemedText>

      {/* Sort Options Button */}
      <CommonButton
        title="Sort Options"
        size={150}
        style={{ marginBottom: 10 }}
        handlePress={() =>
          setOpenLeaderboardOptionsModal(!openLeaderboardOptionsModal)
        }
      />
      <RefreshButton fetchRefreshData={fetchRefreshData} />

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
    </View>
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
        marginLeft: "auto",
        marginRight: "auto",
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
        onEndReachedThreshold={0.5}
        stickyHeaderIndices={[0]}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator size="small" color="blue" /> : null
        }
        renderItem={({ item, index }) => {
          let readableDate = "";

          if (item.createdAt && typeof item.createdAt.toDate === "function") {
            const jsDate = item.createdAt.toDate();

            readableDate = jsDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          } else {
            readableDate = "N/A";
          }

          return (
            <TouchableOpacity
              onPress={() =>
                gamemode === "freeplay" &&
                router.push({
                  pathname: "/viewscore",
                  params: {
                    boardId: item.boardId,
                    boardSize: item.size,
                    boardData: item.boardData,
                    bestScore: item.score,
                    createdBy: item.createdBy,
                    // 🚀 Pass the new readable date
                    createdAt: readableDate,
                  },
                })
              }
            >
              {/* ... Rest of your rendering logic remains the same ... */}
              <LinearGradient
                style={styles.row}
                colors={
                  index % 2 === 0
                    ? ["#0f0f0fff", "#202020ff"]
                    : ["#383838ff", "#525151ff"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
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
              </LinearGradient>
            </TouchableOpacity>
          );
        }}
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

          <ThemedText
            style={{ marginBottom: 10, marginTop: 10 }}
            type="subtitle"
          >
            Gamemode
          </ThemedText>
          <ThemedDropDown
            options={gamemodeOptions}
            value={tempGamemode}
            onSetValue={setTempGamemode}
            placeholder="Select Gamemode..."
          />
          {tempGamemode === "freeplay" && (
            <>
              <ThemedText
                style={{ marginBottom: 10, marginTop: 10 }}
                type="subtitle"
              >
                Board Size
              </ThemedText>
              <ThemedDropDown
                options={sizeOptions}
                value={tempSize}
                onSetValue={setTempSize}
                placeholder="Select Size..."
              />
            </>
          )}
          {tempGamemode === "boardoftheday" && (
            <>
              <ThemedText
                style={{ marginBottom: 10, marginTop: 10 }}
                type="subtitle"
              >
                Year
              </ThemedText>
              <ThemedDropDown
                options={yearOptions}
                value={tempYear}
                onSetValue={setTempYear}
                placeholder="Select Year..."
              />
              <ThemedText
                style={{ marginBottom: 10, marginTop: 10 }}
                type="subtitle"
              >
                Month
              </ThemedText>
              <ThemedDropDown
                options={monthOptions}
                value={tempMonth}
                onSetValue={setTempMonth}
                placeholder="Select Month..."
              />
              <ThemedText
                style={{ marginBottom: 10, marginTop: 10 }}
                type="subtitle"
              >
                Day
              </ThemedText>
              <ThemedDropDown
                options={dayOptions ?? []}
                value={tempDay}
                onSetValue={setTempDay}
                placeholder="Select Day..."
              />
            </>
          )}
          {tempGamemode === "pvp" && (
            <>
              <ThemedText
                style={{ marginBottom: 10, marginTop: 10 }}
                type="subtitle"
              >
                Query Parameters
              </ThemedText>
              <ThemedDropDown
                options={PVPQueryOptions}
                value={tempPvpQueryParameter}
                onSetValue={setTempPvpQueryParameter}
                placeholder="Select Option..."
              />
            </>
          )}

          {/* Apply Button */}
          <View style={{ marginTop: 30 }}>
            <CommonButton title="Apply" size={200} handlePress={handleApply} />
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
};

const RefreshButton = ({
  fetchRefreshData,
}: {
  fetchRefreshData: () => Promise<void>;
}) => {
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Interval to update cooldown timer
  useEffect(() => {
    let interval = null;

    const updateRemaining = async () => {
      const lastRefresh = await loadLeaderboardRefreshTime();
      if (lastRefresh) {
        const currentTime = Date.now();
        const diff = (currentTime - lastRefresh) / 1000;
        const remaining = Math.max(0, COOLDOWN_SECONDS - diff);
        setRemainingTime(remaining);
      } else {
        setRemainingTime(0);
      }
    };

    updateRemaining(); // run immediately
    interval = setInterval(updateRemaining, 1000); // update every second

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  async function handleClickRefresh() {
    const lastRefresh = await loadLeaderboardRefreshTime();
    const currentTime = Date.now();

    if (lastRefresh) {
      const diff = (currentTime - lastRefresh) / 1000;
      if (diff > COOLDOWN_SECONDS) {
        await fetchRefreshData();
        await saveLeaderboardRefreshTime(currentTime);
        setRemainingTime(COOLDOWN_SECONDS); // reset cooldown
      } else {
        alert(
          `Please wait ${Math.ceil(
            COOLDOWN_SECONDS - diff
          )} seconds to refresh scores`
        );
      }
    } else {
      await fetchRefreshData();
      await saveLeaderboardRefreshTime(currentTime);
      setRemainingTime(COOLDOWN_SECONDS);
    }
  }

  // Change color based on cooldown
  const iconColor = remainingTime > 0 ? "#888888" : "#ffffff"; // gray when waiting
  const iconOpacity = remainingTime > 0 ? 0.5 : 1;

  return (
    <TouchableOpacity
      onPress={handleClickRefresh}
      disabled={remainingTime > 0}
      style={{ opacity: iconOpacity }}
    >
      <IconSymbol size={25} name="arrow.clockwise" color={iconColor} />
    </TouchableOpacity>
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
  },
  topRow: {
    flexDirection: "row",
    width: "100%",
  },
  topRowCell: {
    padding: 10,
    backgroundColor: "transparent",
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
  cell: {
    // This is the cell content wrapper
    paddingVertical: 10,
    // Add horizontal padding to the cells to match the TopRow
    paddingHorizontal: 10,
    // CRITICAL FIX: Make the cell background transparent
    backgroundColor: "transparent",
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
