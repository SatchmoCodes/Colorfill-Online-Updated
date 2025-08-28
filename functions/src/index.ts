import { setGlobalOptions } from "firebase-functions";
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const { onSchedule } = require("firebase-functions/v2/scheduler");

setGlobalOptions({ maxInstances: 10 });

type ColorKey = 0 | 1 | 2 | 3 | 4;

const boardOptions: Record<number, { size: string; count: number }> = {
  // 0: { size: "Extra Small", count: 25 },
  1: { size: "Small", count: 64 },
  2: { size: "Medium", count: 100 },
  3: { size: "Large", count: 144 },
  4: { size: "Extra Large", count: 225 },
};

const sizeOptionsLength = Object.keys(boardOptions).length;

export const generateDailyBoard = onSchedule(
  { schedule: "0 8 * * *", timeZone: "America/New_York" },
  async () => {
    const randomSelectionNumber = Math.floor(Math.random() * sizeOptionsLength);
    const boardSelection = boardOptions[randomSelectionNumber];
    const boardData = createRandomColorList(boardSelection.count);

    await admin.firestore().collection("boards").add({
      boardData,
      size: boardSelection.size,
      generatedAt: new Date().toISOString(),
    });

    console.log("Daily board generated at 8 AM!");
  }
);

const createRandomColorList = (numberOfSquares: number) => {
  return new Array(numberOfSquares).fill(null).map(() => {
    return Math.floor(Math.random() * 5) as ColorKey;
  });
};
