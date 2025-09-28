import { UserDoc } from "@/schema/userDocModel";
import { loadCriteriaMap } from "./asyncStorageHelper";

export type Unlockable = {
  locked: boolean;
  message: string;
  progress: string;
};

export type Unlockables = Record<string, Unlockable>;

export const updateCriteriaMap = async ({
  userDoc,
  bestSmallScore = null,
  bestMediumScore = null,
  bestLargeScore = null,
  bestXLargeScore = null,
}: {
  userDoc: UserDoc | null;
  bestSmallScore?: number | null;
  bestMediumScore?: number | null;
  bestLargeScore?: number | null;
  bestXLargeScore?: number | null;
}) => {
  const boardsCompleted = userDoc?.boardsCompleted ?? 0;
  const boardsOfTheDayCompleted = userDoc?.boardsOfTheDayCompleted ?? 0;
  const totalGames = userDoc?.totalGames ?? 0;
  const wins = userDoc?.wins ?? 0;
  const bestWinStreak = userDoc?.bestWinStreak ?? 0;

  const savedCriteriaMap = (await loadCriteriaMap()) ?? {};

  const criteriaMap: Unlockables = {
    small_1: {
      locked:
        savedCriteriaMap["small_1"]?.locked !== false ||
        bestSmallScore === null ||
        bestSmallScore > 13,
      message: "Score 13 or lower on a small board to unlock this color scheme",
      progress: bestSmallScore ? `current best: ${bestSmallScore}` : "n/a",
    },
    small_2: {
      locked:
        savedCriteriaMap["small_2"]?.locked !== false ||
        bestSmallScore === null ||
        bestSmallScore > 11,
      message: "Score 11 or lower on a small board to unlock this color scheme",
      progress: bestSmallScore ? `current best: ${bestSmallScore}` : "n/a",
    },
    medium_1: {
      locked:
        savedCriteriaMap["medium_1"]?.locked !== false ||
        bestMediumScore === null ||
        bestMediumScore > 17,
      message:
        "Score 17 or lower on a medium board to unlock this color scheme",
      progress: bestMediumScore ? `current best: ${bestMediumScore}` : "n/a",
    },
    medium_2: {
      locked:
        savedCriteriaMap["medium_2"]?.locked !== false ||
        bestMediumScore === null ||
        bestMediumScore > 15,
      message:
        "Score 15 or lower on a medium board to unlock this color scheme",
      progress: bestMediumScore ? `current best: ${bestMediumScore}` : "n/a",
    },
    large_1: {
      locked:
        savedCriteriaMap["large_1"]?.locked !== false ||
        bestLargeScore === null ||
        bestLargeScore > 21,
      message: "Score 21 or lower on a large board to unlock this color scheme",
      progress: bestLargeScore ? `current best: ${bestLargeScore}` : "n/a",
    },
    large_2: {
      locked:
        savedCriteriaMap["large_2"]?.locked !== false ||
        bestLargeScore === null ||
        bestLargeScore > 19,
      message: "Score 19 or lower on a large board to unlock this color scheme",
      progress: bestLargeScore ? `current best: ${bestLargeScore}` : "n/a",
    },
    xlarge_1: {
      locked:
        savedCriteriaMap["xlarge_1"]?.locked !== false ||
        bestXLargeScore === null ||
        bestXLargeScore > 25,
      message: "Score 25 or lower on a large board to unlock this color scheme",
      progress: bestXLargeScore ? `current best: ${bestXLargeScore}` : "n/a",
    },
    xlarge_2: {
      locked:
        savedCriteriaMap["xlarge_2"]?.locked !== false ||
        bestXLargeScore === null ||
        bestXLargeScore > 23,
      message: "Score 23 or lower on a large board to unlock this color scheme",
      progress: bestXLargeScore ? `current best: ${bestXLargeScore}` : "n/a",
    },
    boards_completed_1: {
      locked:
        savedCriteriaMap["boards_completed_1"]?.locked !== false ||
        boardsCompleted < 20,
      message: "Play 20 boards to unlock this color scheme",
      progress: `${boardsCompleted} / 20`,
    },
    boards_completed_2: {
      locked:
        savedCriteriaMap["boards_completed_2"]?.locked !== false ||
        boardsCompleted < 100,
      message: "Play 100 boards to unlock this color scheme",
      progress: `${boardsCompleted} / 100`,
    },
    boards_completed_3: {
      locked:
        savedCriteriaMap["boards_completed_3"]?.locked !== false ||
        boardsCompleted < 200,
      message: "Play 200 boards to unlock this color scheme",
      progress: `${boardsCompleted} / 200`,
    },
    botd_completed_1: {
      locked:
        savedCriteriaMap["botd_completed_1"]?.locked !== false ||
        boardsOfTheDayCompleted < 5,
      message: "Complete 5 boards of the day to unlock this color scheme",
      progress: `${boardsOfTheDayCompleted} / 5`,
    },
    botd_completed_2: {
      locked:
        savedCriteriaMap["botd_completed_2"]?.locked !== false ||
        boardsOfTheDayCompleted < 20,
      message: "Complete 20 boards of the day to unlock this color scheme",
      progress: `${boardsOfTheDayCompleted} / 20`,
    },
    botd_completed_3: {
      locked:
        savedCriteriaMap["botd_completed_3"]?.locked !== false ||
        boardsOfTheDayCompleted < 60,
      message: "Complete 60 boards of the day to unlock this color scheme",
      progress: `${boardsOfTheDayCompleted} / 60`,
    },
    total_games_1: {
      locked:
        savedCriteriaMap["total_games_1"]?.locked !== false || totalGames < 10,
      message: "Play 10 player vs player matches to unlock this color scheme",
      progress: `${totalGames} / 10`,
    },
    total_games_2: {
      locked:
        savedCriteriaMap["total_games_2"]?.locked !== false || totalGames < 25,
      message: "Play 25 player vs player matches to unlock this color scheme",
      progress: `${totalGames} / 25`,
    },
    total_games_3: {
      locked:
        savedCriteriaMap["total_games_3"]?.locked !== false || totalGames < 50,
      message: "Play 50 player vs player matches to unlock this color scheme",
      progress: `${totalGames} / 50`,
    },
    wins_1: {
      locked: savedCriteriaMap["wins_1"]?.locked !== false || wins < 5,
      message: "Win 5 player vs player matches to unlock this color scheme",
      progress: `${wins} / 5`,
    },
    wins_2: {
      locked: savedCriteriaMap["wins_2"]?.locked !== false || wins < 15,
      message: "Win 15 player vs player matches to unlock this color scheme",
      progress: `${wins} / 15`,
    },
    wins_3: {
      locked: savedCriteriaMap["wins_3"]?.locked !== false || wins < 30,
      message: "Win 30 player vs player matches to unlock this color scheme",
      progress: `${wins} / 30`,
    },
    winstreak_1: {
      locked:
        savedCriteriaMap["winstreak_1"]?.locked !== false || bestWinStreak < 3,
      message: "Win 3 matches in a row in player vs player",
      progress: `current best: ${bestWinStreak}`,
    },
    winstreak_2: {
      locked:
        savedCriteriaMap["winstreak_2"]?.locked !== false || bestWinStreak < 6,
      message: "Win 6 matches in a row in player vs player",
      progress: `current best: ${bestWinStreak}`,
    },
    winstreak_3: {
      locked:
        savedCriteriaMap["winstreak_3"]?.locked !== false || bestWinStreak < 9,
      message: "Win 9 matches in a row in player vs player",
      progress: `current best: ${bestWinStreak}`,
    },
  };
  return criteriaMap;
};
