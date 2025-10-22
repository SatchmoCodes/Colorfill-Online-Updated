import { BoardOfTheDaySize } from "@/app/(protected)/boardoftheday";
import { ColorKey } from "@/app/(protected)/freeplay";

export interface BoardDoc {
  boardId: string;
  boardData: ColorKey[];
  size: BoardOfTheDaySize;
  generatedAt: string;
}
