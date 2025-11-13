import { PlayerType, PVPBoardType } from "@/app/(protected)/creategame";
import { ColorKey } from "@/app/(protected)/freeplay";

export type SquareOwner = "owner" | "opponent" | null;

export interface PVPSquare {
  color: ColorKey;
  captured: boolean;
  squareOwner: SquareOwner;
  defaultColor: ColorKey;
  landLocked: boolean;
  visibleTo: PlayerType[];
  depth: number;
  x: number;
  y: number;
}

export const pvpSquareGenerator = (
  numberOfSquares: number,
  boardType: PVPBoardType,
  isfogOfWar: boolean
) => {
  const squareGrid: PVPSquare[][] = [];
  let xCoord = 1;
  let yCoord = 1;
  let squareRow = [];
  let colorData;
  switch (boardType) {
    case "random":
      colorData = createRandomColorList(numberOfSquares);
      break;
    case "mirror":
      colorData = createMirroredColorList(numberOfSquares);
      break;
    case "partmirror":
      colorData = createPartialMirrorColorList(numberOfSquares);
      break;
  }
  const updatedColorData = checkSurroundingSquares(colorData, colorData.length);
  for (let x = 0; x < numberOfSquares; x++) {
    const color = updatedColorData[x] as ColorKey;
    squareRow.push({
      color: color,
      defaultColor: color,
      captured: x === 0 || x === numberOfSquares - 1,
      squareOwner: getSquareOwner(x, numberOfSquares),
      landLocked: false,
      x: xCoord,
      y: yCoord,
      depth: 0,
      visibleTo: [],
      revealed: !isfogOfWar,
    });
    if (Math.sqrt(numberOfSquares) === xCoord) {
      xCoord = 0;
      yCoord++;
      squareGrid.push(squareRow);
      squareRow = [];
    }
    xCoord++;
  }
  squareGrid[0][0] = {
    ...squareGrid[0][0],
    visibleTo: ["owner", "opponent"],
  };
  squareGrid[squareGrid.length - 1][squareGrid.length - 1] = {
    ...squareGrid[squareGrid.length - 1][squareGrid.length - 1],
    visibleTo: ["owner", "opponent"],
  };
  return squareGrid;
};

const createRandomColorList = (numberOfSquares: number) => {
  return new Array(numberOfSquares).fill(null).map((_) => {
    return Math.floor(Math.random() * 5);
  });
};

const createMirroredColorList = (numberOfSquares: number) => {
  const boardHalf = new Array((numberOfSquares - 1) / 2).fill(null).map((_) => {
    return Math.floor(Math.random() * 5);
  });
  const boardCenterColor = Math.floor(Math.random() * 5);
  return [...boardHalf, boardCenterColor, ...boardHalf.reverse()];
};

const createPartialMirrorColorList = (numberOfSquares: number) => {
  const excludedIndexes = [
    0,
    1,
    Math.sqrt(numberOfSquares),
    numberOfSquares - 1,
    numberOfSquares - 2,
    numberOfSquares - Math.sqrt(numberOfSquares),
  ];
  const boardHalf = new Array((numberOfSquares - 1) / 2).fill(null).map((_) => {
    return Math.floor(Math.random() * 5);
  });
  const boardCenterColor = Math.floor(Math.random() * 5);
  return [...boardHalf, boardCenterColor, ...boardHalf.reverse()].map(
    (color, i) => {
      if ((i + 1) % 2 === 0 && !excludedIndexes.includes(i))
        return Math.floor(Math.random() * 5);
      return color;
    }
  );
};

const getSquareOwner = (index: number, length: number) => {
  if (index === 0) return "owner" as SquareOwner;
  if (index === length - 1) return "opponent" as SquareOwner;
  return null;
};

const checkSurroundingSquares = (colorData: number[], length: number) => {
  const ownerCapturedColor = colorData[0];
  const opponentCapturedColor = colorData[length - 1];

  const ownerRightSquareIndex = 1;
  const ownerDownSquareIndex = Math.sqrt(length);
  const opponentLeftSquareIndex = length - 2;
  const opponentUpSquareIndex = length - 1 - Math.sqrt(length);

  [ownerRightSquareIndex, ownerDownSquareIndex].forEach((item) => {
    let currentValue = colorData[item];
    while (currentValue === ownerCapturedColor)
      currentValue = generateRandomNumber();
    colorData[item] = currentValue;
  });

  [opponentLeftSquareIndex, opponentUpSquareIndex].forEach((item) => {
    let currentValue = colorData[item];
    while (currentValue === opponentCapturedColor)
      currentValue = generateRandomNumber();
    colorData[item] = currentValue;
  });
  return colorData;
};

const generateRandomNumber = () => {
  return Math.floor(Math.random() * 5);
};
