import { UserDoc } from "@/schema/userDocModel";

export type Unlockable = {
  locked: boolean;
  message: string;
  progress: string;
};

export type Unlockables = Record<string, Unlockable>;

const updateCriteriaMap = async ({
  userDoc,
  bestSmallScore,
  bestMediumScore,
  bestLargeScore,
}: {
  userDoc: UserDoc | null;
  bestSmallScore: number | null;
  bestMediumScore: number | null;
  bestLargeScore: number | null;
}) => {
  const boardsCompleted = userDoc?.boardsCompleted ?? 0;
  const boardsOfTheDayCompleted = userDoc?.boardsOfTheDayCompleted ?? 0;
  const totalGames = userDoc?.totalGames ?? 0;
  const wins = userDoc?.wins ?? 0;
  const bestWinStreak = userDoc?.bestWinStreak ?? 0;

  const criteriaMap: Unlockables = {
    small_1: {
      locked: bestSmallScore === null || bestSmallScore > 13,
      message: "Score 13 or lower on a small board to unlock this color scheme",
      progress: bestSmallScore ? `current best: ${bestSmallScore}` : "n/a",
    },
    small_2: {
      locked: bestSmallScore === null || bestSmallScore > 11,
      message: "Score 11 or lower on a small board to unlock this color scheme",
      progress: bestSmallScore ? `current best: ${bestSmallScore}` : "n/a",
    },
    medium_1: {
      locked: bestMediumScore === null || bestMediumScore > 17,
      message:
        "Score 17 or lower on a medium board to unlock this color scheme",
      progress: bestMediumScore ? `current best: ${bestMediumScore}` : "n/a",
    },
    medium_2: {
      locked: bestMediumScore === null || bestMediumScore > 15,
      message:
        "Score 15 or lower on a medium board to unlock this color scheme",
      progress: bestMediumScore ? `current best: ${bestMediumScore}` : "n/a",
    },
    large_1: {
      locked: bestLargeScore === null || bestLargeScore > 21,
      message: "Score 21 or lower on a large board to unlock this color scheme",
      progress: bestLargeScore ? `current best: ${bestLargeScore}` : "n/a",
    },
    large_2: {
      locked: bestLargeScore === null || bestLargeScore > 19,
      message: "Score 19 or lower on a large board to unlock this color scheme",
      progress: bestLargeScore ? `current best: ${bestLargeScore}` : "n/a",
    },
    xlarge_1: {
      locked: bestLargeScore === null || bestLargeScore > 25,
      message: "Score 25 or lower on a large board to unlock this color scheme",
      progress: bestLargeScore ? `current best: ${bestLargeScore}` : "n/a",
    },
    xlarge_2: {
      locked: bestLargeScore === null || bestLargeScore > 23,
      message: "Score 23 or lower on a large board to unlock this color scheme",
      progress: bestLargeScore ? `current best: ${bestLargeScore}` : "n/a",
    },
    boards_completed_1: {
      locked: boardsCompleted < 20,
      message: "Play 20 boards to unlock this color scheme",
      progress: `${boardsCompleted} / 20`,
    },
    boards_completed_2: {
      locked: boardsCompleted < 100,
      message: "Play 100 boards to unlock this color scheme",
      progress: `${boardsCompleted} / 100`,
    },
    boards_completed_3: {
      locked: boardsCompleted < 200,
      message: "Play 200 boards to unlock this color scheme",
      progress: `${boardsCompleted} / 200`,
    },
    botd_completed_1: {
      locked: boardsOfTheDayCompleted < 5,
      message: "Complete 5 boards of the day to unlock this color scheme",
      progress: `${boardsOfTheDayCompleted} / 5`,
    },
    botd_completed_2: {
      locked: boardsOfTheDayCompleted < 20,
      message: "Complete 20 boards of the day to unlock this color scheme",
      progress: `${boardsOfTheDayCompleted} / 20`,
    },
    botd_completed_3: {
      locked: boardsOfTheDayCompleted < 60,
      message: "Complete 60 boards of the day to unlock this color scheme",
      progress: `${boardsOfTheDayCompleted} / 60`,
    },
    total_games_1: {
      locked: totalGames < 10,
      message: "Play 10 player vs player matches to unlock this color scheme",
      progress: `${totalGames} / 10`,
    },
    total_games_2: {
      locked: totalGames < 25,
      message: "Play 25 player vs player matches to unlock this color scheme",
      progress: `${totalGames} / 25`,
    },
    total_games_3: {
      locked: totalGames < 50,
      message: "Play 50 player vs player matches to unlock this color scheme",
      progress: `${totalGames} / 50`,
    },
    wins_1: {
      locked: wins < 5,
      message: "Win 5 player vs player matches to unlock this color scheme",
      progress: `${wins} / 5`,
    },
    wins_2: {
      locked: wins < 15,
      message: "Win 15 player vs player matches to unlock this color scheme",
      progress: `${wins} / 15`,
    },
    wins_3: {
      locked: wins < 30,
      message: "Win 30 player vs player matches to unlock this color scheme",
      progress: `${wins} / 30`,
    },
    winstreak_1: {
      locked: bestWinStreak < 3,
      message: "Win 3 matches in a row in player vs player",
      progress: `current best: ${bestWinStreak}`,
    },
    winstreak_2: {
      locked: bestWinStreak < 6,
      message: "Win 6 matches in a row in player vs player",
      progress: `current best: ${bestWinStreak}`,
    },
    winstreak_3: {
      locked: bestWinStreak < 9,
      message: "Win 9 matches in a row in player vs player",
      progress: `current best: ${bestWinStreak}`,
    },
  };
  return criteriaMap;
};
