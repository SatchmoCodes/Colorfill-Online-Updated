import * as crypto from "crypto";
import { setGlobalOptions } from "firebase-functions";
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const { onSchedule } = require("firebase-functions/v2/scheduler");

setGlobalOptions({ maxInstances: 10 });

type ColorKey = 0 | 1 | 2 | 3 | 4;

const boardOptions: Record<number, { size: string; count: number }> = {
  1: { size: "small", count: 64 },
  2: { size: "medium", count: 100 },
  3: { size: "large", count: 144 },
  4: { size: "xlarge", count: 225 },
};

export const generateDailyBoard = onSchedule(
  { schedule: "0 8 * * *", timeZone: "America/New_York" },
  async () => {
    const options = Object.values(boardOptions);
    const randomIndex = Math.floor(Math.random() * options.length);
    const boardSelection = options[randomIndex];

    if (!boardSelection) {
      console.error("No boardSelection found", { boardOptions, randomIndex });
      return;
    }

    const boardData = createRandomColorList(boardSelection.count);
    const boardId = crypto.randomUUID();
    const today = new Date();
    const yyyyMMdd = today.toISOString().split("T")[0];

    await admin.firestore().collection("boards").doc(yyyyMMdd).set({
      boardId,
      boardData,
      size: boardSelection.size,
      generatedAt: today.toISOString(),
    });

    console.log("Daily board generated at 8 AM!", { yyyyMMdd, boardSelection });
  }
);

const createRandomColorList = (numberOfSquares: number) => {
  return new Array(numberOfSquares).fill(null).map(() => {
    return Math.floor(Math.random() * 5) as ColorKey;
  });
};
