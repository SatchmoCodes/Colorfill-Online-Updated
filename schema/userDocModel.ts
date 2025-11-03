import { Timestamp } from "firebase/firestore";

export interface UserDoc {
  uid: string;
  username: string;
  email: string;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  bestWinStreak: number;
  currentWinStreak: number;
  boardsCompleted: number;
  boardsOfTheDayCompleted: number;
  bestSmallScore: number | null;
  bestMediumScore: number | null;
  bestLargeScore: number | null;
  bestXLargeScore: number | null;
  profileBackground: string;
  profileLetter: string;
  profileBanner: string;
  expoPushToken: string | null;
  createdAt: Timestamp;
}
