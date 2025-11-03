import { Gamemode } from "@/app/(protected)/(tabs)/leaderboard";
import { BoardSize, ColorKey } from "@/app/(protected)/freeplay";
import { Timestamp } from "firebase/firestore";

export interface ScoreDoc {
  boardId: string;
  boardData: ColorKey[];
  createdBy: string;
  uid: string;
  gamemode: Gamemode;
  highScore: boolean;
  score: number;
  size: BoardSize;
  createdAt: Timestamp | number;
}
