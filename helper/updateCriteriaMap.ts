import { loadCriteriaMap, saveCriteriaMap } from "./asyncStorageHelper";

export type Unlockable = {
  locked: boolean;
  message: string;
  progress: string;
};

export type Unlockables = Record<string, Unlockable>;

export const updateCriteriaMap = async ({
  boardsCompleted = null,
  boardsOfTheDayCompleted = null,
  bestSmallScore = null,
  bestMediumScore = null,
  bestLargeScore = null,
  bestXLargeScore = null,
  totalGames = null,
  wins = null,
  bestWinStreak = null,
}: {
  boardsCompleted?: number | null;
  boardsOfTheDayCompleted?: number | null;
  bestSmallScore?: number | null;
  bestMediumScore?: number | null;
  bestLargeScore?: number | null;
  bestXLargeScore?: number | null;
  totalGames?: number | null;
  wins?: number | null;
  bestWinStreak?: number | null;
}) => {
  const savedCriteriaMap = (await loadCriteriaMap()) ?? {};

  const criteriaMap: Unlockables = {
    small_1: {
      locked:
        (bestSmallScore === null || bestSmallScore > 13) &&
        savedCriteriaMap["small_1"]?.locked !== false,
      message: "Score 13 or lower on a small board to unlock this color scheme",
      progress: bestSmallScore ? `current best: ${bestSmallScore}` : "n/a",
    },
    small_2: {
      locked:
        (bestSmallScore === null || bestSmallScore > 11) &&
        savedCriteriaMap["small_2"]?.locked !== false,
      message: "Score 11 or lower on a small board to unlock this color scheme",
      progress: bestSmallScore ? `current best: ${bestSmallScore}` : "n/a",
    },
    small_3: {
      locked:
        (bestSmallScore === null || bestSmallScore > 9) &&
        savedCriteriaMap["small_3"]?.locked !== false,
      message: "Score 11 or lower on a small board to unlock this color scheme",
      progress: bestSmallScore ? `current best: ${bestSmallScore}` : "n/a",
    },
    medium_1: {
      locked:
        (bestMediumScore === null || bestMediumScore > 17) &&
        savedCriteriaMap["medium_1"]?.locked !== false,
      message:
        "Score 17 or lower on a medium board to unlock this color scheme",
      progress: bestMediumScore ? `current best: ${bestMediumScore}` : "n/a",
    },
    medium_2: {
      locked:
        (bestMediumScore === null || bestMediumScore > 15) &&
        savedCriteriaMap["medium_2"]?.locked !== false,
      message:
        "Score 15 or lower on a medium board to unlock this color scheme",
      progress: bestMediumScore ? `current best: ${bestMediumScore}` : "n/a",
    },
    medium_3: {
      locked:
        (bestMediumScore === null || bestMediumScore > 13) &&
        savedCriteriaMap["medium_3"]?.locked !== false,
      message:
        "Score 13 or lower on a medium board to unlock this color scheme",
      progress: bestMediumScore ? `current best: ${bestMediumScore}` : "n/a",
    },
    large_1: {
      locked:
        (bestLargeScore === null || bestLargeScore > 21) &&
        savedCriteriaMap["large_1"]?.locked !== false,
      message: "Score 21 or lower on a large board to unlock this color scheme",
      progress: bestLargeScore ? `current best: ${bestLargeScore}` : "n/a",
    },
    large_2: {
      locked:
        (bestLargeScore === null || bestLargeScore > 19) &&
        savedCriteriaMap["large_2"]?.locked !== false,
      message: "Score 19 or lower on a large board to unlock this color scheme",
      progress: bestLargeScore ? `current best: ${bestLargeScore}` : "n/a",
    },
    large_3: {
      locked:
        (bestLargeScore === null || bestLargeScore > 17) &&
        savedCriteriaMap["large_3"]?.locked !== false,
      message: "Score 17 or lower on a large board to unlock this color scheme",
      progress: bestLargeScore ? `current best: ${bestLargeScore}` : "n/a",
    },
    xlarge_1: {
      locked:
        (bestXLargeScore === null || bestXLargeScore > 30) &&
        savedCriteriaMap["xlarge_1"]?.locked !== false,
      message: "Score 30 or lower on an XL board to unlock this color scheme",
      progress: bestXLargeScore ? `current best: ${bestXLargeScore}` : "n/a",
    },
    xlarge_2: {
      locked:
        (bestXLargeScore === null || bestXLargeScore > 23) &&
        savedCriteriaMap["xlarge_2"]?.locked !== false,
      message: "Score 23 or lower on an XL board to unlock this color scheme",
      progress: bestXLargeScore ? `current best: ${bestXLargeScore}` : "n/a",
    },
    xlarge_3: {
      locked:
        (bestXLargeScore === null || bestXLargeScore > 21) &&
        savedCriteriaMap["xlarge_3"]?.locked !== false,
      message: "Score 21 or lower on an XL board to unlock this color scheme",
      progress: bestXLargeScore ? `current best: ${bestXLargeScore}` : "n/a",
    },
    boards_completed_1: {
      locked:
        (boardsCompleted === null || boardsCompleted < 20) &&
        savedCriteriaMap["boards_completed_1"]?.locked !== false,
      message: "Play 20 boards to unlock this color scheme",
      progress: boardsCompleted === null ? "n/a" : `${boardsCompleted} / 20`,
    },
    boards_completed_2: {
      locked:
        (boardsCompleted === null || boardsCompleted < 100) &&
        savedCriteriaMap["boards_completed_2"]?.locked !== false,
      message: "Play 100 boards to unlock this color scheme",
      progress: boardsCompleted === null ? "n/a" : `${boardsCompleted} / 100`,
    },
    boards_completed_3: {
      locked:
        (boardsCompleted === null || boardsCompleted < 200) &&
        savedCriteriaMap["boards_completed_3"]?.locked !== false,
      message: "Play 200 boards to unlock this color scheme",
      progress: boardsCompleted === null ? "n/a" : `${boardsCompleted} / 200`,
    },
    botd_completed_1: {
      locked:
        (boardsOfTheDayCompleted === null || boardsOfTheDayCompleted < 5) &&
        savedCriteriaMap["botd_completed_1"]?.locked !== false,
      message: "Complete 5 boards of the day to unlock this color scheme",
      progress:
        boardsOfTheDayCompleted === null
          ? "n/a"
          : `${boardsOfTheDayCompleted} / 5`,
    },
    botd_completed_2: {
      locked:
        (boardsOfTheDayCompleted === null || boardsOfTheDayCompleted < 20) &&
        savedCriteriaMap["botd_completed_2"]?.locked !== false,
      message: "Complete 20 boards of the day to unlock this color scheme",
      progress:
        boardsOfTheDayCompleted === null
          ? "n/a"
          : `${boardsOfTheDayCompleted} / 20`,
    },
    botd_completed_3: {
      locked:
        (boardsOfTheDayCompleted === null || boardsOfTheDayCompleted < 60) &&
        savedCriteriaMap["botd_completed_3"]?.locked !== false,
      message: "Complete 60 boards of the day to unlock this color scheme",
      progress:
        boardsOfTheDayCompleted === null
          ? "n/a"
          : `${boardsOfTheDayCompleted} / 60`,
    },
    total_games_1: {
      locked:
        (totalGames === null || totalGames < 10) &&
        savedCriteriaMap["total_games_1"]?.locked !== false,
      message: "Play 10 player vs player matches to unlock this color scheme",
      progress: totalGames === null ? "n/a" : `${totalGames} / 10`,
    },
    total_games_2: {
      locked:
        (totalGames === null || totalGames < 25) &&
        savedCriteriaMap["total_games_2"]?.locked !== false,
      message: "Play 25 player vs player matches to unlock this color scheme",
      progress: totalGames === null ? "n/a" : `${totalGames} / 25`,
    },
    total_games_3: {
      locked:
        (totalGames === null || totalGames < 50) &&
        savedCriteriaMap["total_games_3"]?.locked !== false,
      message: "Play 50 player vs player matches to unlock this color scheme",
      progress: totalGames === null ? "n/a" : `${totalGames} / 50`,
    },
    wins_1: {
      locked:
        (wins === null || wins < 5) &&
        savedCriteriaMap["wins_1"]?.locked !== false,
      message: "Win 5 player vs player matches to unlock this color scheme",
      progress: wins === null ? "n/a" : `${wins} / 5`,
    },
    wins_2: {
      locked:
        (wins === null || wins < 15) &&
        savedCriteriaMap["wins_2"]?.locked !== false,
      message: "Win 15 player vs player matches to unlock this color scheme",
      progress: wins === null ? "n/a" : `${wins} / 15`,
    },
    wins_3: {
      locked:
        (wins === null || wins < 30) &&
        savedCriteriaMap["wins_3"]?.locked !== false,
      message: "Win 30 player vs player matches to unlock this color scheme",
      progress: wins === null ? "n/a" : `${wins} / 30`,
    },
    winstreak_1: {
      locked:
        (bestWinStreak === null || bestWinStreak < 3) &&
        savedCriteriaMap["winstreak_1"]?.locked !== false,
      message: "Win 3 matches in a row in player vs player",
      progress:
        bestWinStreak === null ? "n/a" : `current best: ${bestWinStreak}`,
    },
    winstreak_2: {
      locked:
        (bestWinStreak === null || bestWinStreak < 6) &&
        savedCriteriaMap["winstreak_2"]?.locked !== false,
      message: "Win 6 matches in a row in player vs player",
      progress:
        bestWinStreak === null ? "n/a" : `current best: ${bestWinStreak}`,
    },
    winstreak_3: {
      locked:
        (bestWinStreak === null || bestWinStreak < 9) &&
        savedCriteriaMap["winstreak_3"]?.locked !== false,
      message: "Win 9 matches in a row in player vs player",
      progress:
        bestWinStreak === null ? "n/a" : `current best: ${bestWinStreak}`,
    },
  };

  // const falsifiedCriteriaMap = Object.fromEntries(
  //   Object.entries(criteriaMap).map(([key, value]) => {
  //     return [key, { ...value, locked: true }];
  //   })
  // );

  // return falsifiedCriteriaMap;
  await saveCriteriaMap(criteriaMap);

  return criteriaMap;
};
