import BaseModal from "@/components/BaseModal";
import ThemedDropDown from "@/components/ThemedDropDown";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import CommonButton from "@/components/ui/CommonButton";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { TimerPie } from "@/components/ui/TimerPie";
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
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Platform,
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
        setTableData([]);
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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <ThemedText style={{ marginTop: 20, marginBottom: 20 }} type="title">
          Leaderboard
        </ThemedText>
        <TouchableOpacity
          onPress={() =>
            setOpenLeaderboardOptionsModal(!openLeaderboardOptionsModal)
          }
        >
          <IconSymbol name="slider.horizontal.3" size={24} color={"white"} />
        </TouchableOpacity>
      </View>

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
        <BaseModal
          visible={openLeaderboardOptionsModal}
          onClose={() => setOpenLeaderboardOptionsModal(false)}
        >
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
        </BaseModal>
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
        maxWidth: 700,
        marginLeft: "auto",
        marginRight: "auto",
        marginBottom: 10,
        justifyContent: "space-evenly",
        flexDirection: "row",
      }}
    >
      <ThemedText type="subtitle">
        {gamemodeOptions.find((x) => x.value === gamemode)?.label}
      </ThemedText>
      <ThemedText type="subtitle">{getParameterLabel(gamemode)}</ThemedText>
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

const getRowColor = (index: number) => {
  if (index === 0) return ["#c4b214ff", "#504803ff"];
  if (index === 1) return ["#b9b9b9ff", "rgba(100, 100, 99, 1)"];
  if (index === 2) return ["#ac691dff", "#5e370bff"];
  if (index % 2 === 0) return ["#8eb7faff", "#053070ff"];
  return ["#266bdbff", "#031736ff"];
};

const LeaderboardRow = React.memo(
  ({
    item,
    index,
    gamemode,
    pvpQueryParameter,
    translateX,
  }: {
    item: DocumentData;
    index: number;
    gamemode: Gamemode;
    pvpQueryParameter: string;
    translateX: any;
  }) => {
    let readableDate = "";
    if (item.createdAt && typeof item.createdAt.toDate === "function") {
      readableDate = item.createdAt.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      readableDate = "N/A";
    }

    const [firstRowColor, secondRowColor] = getRowColor(index);

    return (
      <TouchableOpacity
        style={{ marginTop: 5, marginBottom: 5, position: "relative" }}
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
              createdAt: readableDate,
            },
          })
        }
      >
        <LinearGradient
          style={styles.row}
          colors={[firstRowColor, secondRowColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {index < 3 && <ShimmerOverlay translateX={translateX} />}

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
  }
);

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
  const translateX = useShimmer();

  const webScrollLock = useRef(false);
  const nativeEndReachedLock = useRef(false);

  const NATIVE_THRESHOLD = 0.1;
  const WEB_THRESHOLD_PX = 150;

  const handleWebScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (layoutMeasurement.height + contentOffset.y);
    if (distanceFromBottom <= WEB_THRESHOLD_PX && !webScrollLock.current) {
      webScrollLock.current = true;
      handlePagination();
      setTimeout(() => { webScrollLock.current = false; }, 800);
    }
  };

  const renderItem = useCallback(
    ({ item, index }: { item: DocumentData; index: number }) => (
      <LeaderboardRow
        item={item}
        index={index}
        gamemode={gamemode}
        pvpQueryParameter={pvpQueryParameter}
        translateX={translateX}
      />
    ),
    [gamemode, pvpQueryParameter, translateX]
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={tableData}
        keyExtractor={(item: DocumentData) => item.id?.toString() ?? Math.random().toString()}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        onEndReached={
          Platform.OS !== "web"
            ? () => {
                if (!nativeEndReachedLock.current) {
                  nativeEndReachedLock.current = true;
                  handlePagination();
                  setTimeout(() => (nativeEndReachedLock.current = false), 800);
                }
              }
            : undefined
        }
        onEndReachedThreshold={NATIVE_THRESHOLD}
        onScroll={Platform.OS === "web" ? handleWebScroll : undefined}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 20 }}
        style={{ flex: 1 }}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator size="small" /> : null
        }
        renderItem={renderItem}
      />
    </View>
  );
};

const ShimmerOverlay = ({ translateX }: { translateX: any }) => (
  <Animated.View
    pointerEvents="none"
    style={{
      position: "absolute",
      top: 0,
      bottom: 0,
      width: 150,
      transform: [{ translateX }],
      opacity: 0.5,
    }}
  >
    <LinearGradient
      colors={["transparent", "white", "transparent"]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={{ flex: 1 }}
    />
  </Animated.View>
);

const useShimmer = () => {
  const shimmer = useRef(new Animated.Value(0)).current;
  const cardWidth = Platform.OS === "web" ? 900 : 500;

  useEffect(() => {
    const loop = () => {
      shimmer.setValue(0);
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => loop());
    };

    loop();
  }, []);

  return shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, cardWidth],
  });
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
    <View style={styles.modalContainer}>
      <ThemedText style={{ marginBottom: 20 }} type="title">
        Options
      </ThemedText>

      <ThemedText style={{ marginBottom: 10, marginTop: 10 }} type="subtitle">
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
    </View>
  );
};

const RefreshButton = ({
  fetchRefreshData,
}: {
  fetchRefreshData: () => Promise<void>;
}) => {
  const [startTime, setStartTime] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleClickRefresh() {
    const lastRefresh = await loadLeaderboardRefreshTime();
    const currentTime = Date.now();

    if (lastRefresh) {
      const diff = (currentTime - lastRefresh) / 1000;
      if (diff > COOLDOWN_SECONDS) {
        await fetchRefreshData();
        await saveLeaderboardRefreshTime(currentTime);
        setStartTime(currentTime);
        setIsRefreshing(true);
      }
    } else {
      await fetchRefreshData();
      await saveLeaderboardRefreshTime(currentTime);
      setStartTime(currentTime);
      setIsRefreshing(true);
    }
  }

  // Change color based on cooldown
  const iconColor = isRefreshing ? "#888888" : "#ffffff"; // gray when waiting
  const iconOpacity = isRefreshing ? 0.5 : 1;

  console.log(startTime + 15000 - Date.now());

  return (
    <View style={{ position: "relative" }}>
      <TouchableOpacity
        onPress={() => !isRefreshing && handleClickRefresh()}
        style={{ opacity: iconOpacity }}
      >
        <IconSymbol size={25} name="arrow.clockwise" color={iconColor} />
        {isRefreshing && (
          <TimerPie
            duration={startTime + 15000 - Date.now()}
            startTime={startTime}
            onComplete={() => setIsRefreshing(false)}
            style={{ position: "absolute", right: -30 }}
            size={20}
          />
        )}
      </TouchableOpacity>
    </View>
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
  },
  topRow: {
    flexDirection: "row",
    width: "100%",
    borderRadius: 10,
    padding: 10,
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
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    width: "100%",
    maxWidth: 700,
    margin: "auto",
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
