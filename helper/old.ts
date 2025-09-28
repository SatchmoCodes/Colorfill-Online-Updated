import { db } from "@/firebaseConfig";
import { User } from "firebase/auth";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { saveColorPaletteOptions } from "./asyncStorageHelper";

export const getColorPaletteOptions = async (user: User) => {
  const userQuery = query(
    collection(db, "users"),
    where("uid", "==", user.uid)
  );
  const bestSmall = query(
    collection(db, "scores"),
    where("uid", "==", user.uid),
    where("size", "==", "small"),
    orderBy("score", "asc"),
    limit(1)
  );

  const bestMedium = query(
    collection(db, "scores"),
    where("uid", "==", user.uid),
    where("size", "==", "medium"),
    orderBy("score", "asc"),
    limit(1)
  );

  const bestLarge = query(
    collection(db, "scores"),
    where("uid", "==", user.uid),
    where("size", "==", "large"),
    orderBy("score", "asc"),
    limit(1)
  );

  const totalBoardOfTheDays = query(
    collection(db, "scores"),
    where("uid", "==", user.uid),
    where("gamemode", "==", "boardoftheday"),
    limit(100)
  );
  let totalGames = 0;
  let wins = 0;
  let boardsCompleted = 0;
  let bestWinStreak = 0;
  let bestSmallScore: number | null = null;
  let bestMediumScore: number | null = null;
  let bestLargeScore: number | null = null;
  let numberOfBoardOfTheDaysSolved = 0;

  try {
    // Run everything at once
    const [userDocs, smallDocs, mediumDocs, largeDocs, botdDocs] =
      await Promise.all([
        getDocs(userQuery),
        getDocs(bestSmall),
        getDocs(bestMedium),
        getDocs(bestLarge),
        getDocs(totalBoardOfTheDays),
      ]);

    // Default values

    // Extract user stats
    if (!userDocs.empty) {
      const userData = userDocs.docs[0].data();
      totalGames = userData.totalGames ?? 0;
      wins = userData.wins ?? 0;
      boardsCompleted = userData.boardsCompleted ?? 0;
      bestWinStreak = userData.bestWinStreak ?? 0;
    }

    // Extract best scores
    if (!smallDocs.empty) {
      bestSmallScore = smallDocs.docs[0].data().score;
    }
    if (!mediumDocs.empty) {
      bestMediumScore = mediumDocs.docs[0].data().score;
    }
    if (!largeDocs.empty) {
      bestLargeScore = largeDocs.docs[0].data().score;
    }
    if (!botdDocs.empty) {
      numberOfBoardOfTheDaysSolved = botdDocs.docs.length;
    }
  } catch (error) {
    console.error("Error fetching user data: ", error);
    throw error;
  }
  const colorPaletteOptions = [
    {
      0: "red",
      1: "orange",
      2: "yellow",
      3: "green",
      4: "blue",
    },
    {
      0: "#3e2303",
      1: "#824b07",
      2: "#d55c05",
      3: "#2252bb",
      4: "#d4e4f7",
    },
    {
      0: "#a30f14",
      1: "#dc2e28",
      2: "#0a4f99",
      3: "#636363",
      4: "#242424",
    },
    {
      0: "#05d69e",
      1: "#f5f5ff",
      2: "#ffd466",
      3: "#4a636d",
      4: "#0a141a",
    },
    {
      0: "#401219",
      1: "#82C9D9",
      2: "#ABBF63",
      3: "#F37A5E",
      4: "#F33D3C",
    },
    {
      0: "#000F08",
      1: "#136F64",
      2: "#FFC126",
      3: "#F34213",
      4: "#3E2F5B",
    },
    {
      0: "#00475b",
      1: "#ff5c39",
      2: "#e5e1e6",
      3: "#888b8d",
      4: "#222223",
    },
    {
      0: "#bf0423ff",
      1: "#fe374eff",
      2: "#edf2f4",
      3: "#8d99ae",
      4: "#2b2d42",
    },
    {
      0: "#001524",
      1: "#15616d",
      2: "#ffecd1",
      3: "#ff7d00",
      4: "#78290f",
    },
    {
      0: "#3c1642",
      1: "#064552ff",
      2: "#1dd3b0",
      3: "#71ac1fff",
      4: "#c1f5b4ff",
    },
    {
      0: "#000000",
      1: "#14213d",
      2: "#fca311",
      3: "#afafafff",
      4: "#ffffff",
    },
    {
      0: "#222222",
      1: "#8c8c8c",
      2: "#F5F5F5",
      3: "#F77A36",
      4: "#62516D",
    },
    {
      0: "#29270B",
      1: "#494f06",
      2: "#ED3F09",
      3: "#A28E88",
      4: "#141414",
    },
    {
      0: "#a8201a",
      1: "#ec9a29",
      2: "#dad2d8",
      3: "#0f8b8d",
      4: "#143642",
    },
    {
      0: "#04151F",
      1: "#183A37",
      2: "#EFD6AC",
      3: "#C44900",
      4: "#432534",
    },
    {
      0: "#721817",
      1: "#fa9f42",
      2: "#e0e0e2",
      3: "#0b6e4f",
      4: "#2b4162",
    },
    {
      0: "#292A3C",
      1: "#E64F48",
      2: "#FAF8FB",
      3: "#98A9B5",
      4: "#58599A",
    },
    {
      0: "#050038",
      1: "#3F53D9",
      2: "#F0F2FC",
      3: "#FFD02f",
      4: "#ECB1B5",
    },
    {
      0: "#CC0000",
      1: "#F0F0F0",
      2: "#808087",
      3: "#242222ff",
      4: "#002D5C",
    },
    {
      0: "#FF6700",
      1: "#EBEBEB",
      2: "#ACACAC",
      3: "#447FBD",
      4: "#034482",
    },
    {
      0: "#9B1D20",
      1: "#FE621D",
      2: "#030302ff",
      3: "#636363",
      4: "#0C090D",
    },
    {
      0: "#2f4232",
      1: "#935b08",
      2: "#d5d3d0",
      3: "#ff9123",
      4: "#5a0203",
    },
    {
      0: "#5f0f40",
      1: "#9a031e",
      2: "#f8a354ff",
      3: "#c5540eff",
      4: "#0f4c5c",
    },
    {
      0: "#335c67",
      1: "#fff3b0",
      2: "#e09f3e",
      3: "#9e2a2b",
      4: "#540b0e",
    },
    {
      0: "#09410dff",
      1: "#23ef23ff",
      2: "#edf2f4",
      3: "#8d99ae",
      4: "#2b2d42",
    },
    {
      0: "#92140c",
      1: "#ffcf99",
      2: "#fff8f0",
      3: "#111d4a",
      4: "#1e1e24",
    },
    {
      0: "#334319",
      1: "#828017",
      2: "#e1ddad",
      3: "#fed52f",
      4: "#825026",
    },
    {
      0: "#eb5e28",
      1: "#fffcf2",
      2: "#aaa397ff",
      3: "#383532ff",
      4: "#1b1a19ff",
    },
    {
      0: "#30343f",
      1: "#fafaff",
      2: "#baabdfff",
      3: "#364996ff",
      4: "#1e2749",
    },
    {
      0: "#FF4365",
      1: "#B7AD99",
      2: "#FFFFF3",
      3: "#00D9C0",
      4: "#030301",
    },
    {
      0: "#221D23",
      1: "#4F3824",
      2: "#D1603D",
      3: "#D5AB48",
      4: "#DBE99B",
    },
    {
      0: "#325e43ff",
      1: "#92b19aff",
      2: "#EDF4ED",
      3: "#51291E",
      4: "#301014",
    },
    {
      0: "#D00000",
      1: "#FFBA08",
      2: "#A2AEBB",
      3: "#3F88C5",
      4: "#1C3144",
    },
    {
      0: "#A63446",
      1: "#FBFEF9",
      2: "#0C6291",
      3: "#7E1946",
      4: "#000004",
    },
    {
      0: "#070C0E",
      1: "#004643",
      2: "#FAF4D3",
      3: "#F6BE9A",
      4: "#D1AC00",
    },
    {
      0: "#0B0A09",
      1: "#3A2618",
      2: "#9A8873",
      3: "#2E3833",
      4: "#754043",
    },
    // {
    //   0: "#",
    //   1: "#",
    //   2: "#",
    //   3: "#",
    //   4: "#",
    // },
    // {
    //   0: "",
    //   1: "",
    //   2: "",
    //   3: "",
    //   4: "",
    // },
  ];
  await saveColorPaletteOptions(colorPaletteOptions);
  return colorPaletteOptions;
};

// const criteriaMap = {
//   'small_easy': {
//     locked: bestSmallScore === null || bestSmallScore > 11,
//       message: "Score 11 or lower on a small board to unlock this color scheme",
//       progress: bestSmallScore ? `current best: ${bestSmallScore}` : "n/a",
//   }
// }
