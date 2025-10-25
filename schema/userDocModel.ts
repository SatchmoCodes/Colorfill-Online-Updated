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
  bestSmallScore: number;
  bestMediumScore: number;
  bestLargeScore: number;
  bestXLargeScore: number;
  profileBackground: string;
  profileLetter: string;
  expoPushToken: string | null;
  createdAt: Timestamp;
}
