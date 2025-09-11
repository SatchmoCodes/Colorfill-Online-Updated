import { ColorKey, Square } from "@/app/(protected)/freeplay";

export const squareGenerator = (
  numberOfSquares: number,
  squareSize: number,
  boardColors?: ColorKey[]
) => {
  const squareGrid: Square[][] = [];
  let xCoord = 1;
  let yCoord = 1;
  let squareRow = [];
  const colorData = boardColors
    ? [...boardColors]
    : createRandomColorList(numberOfSquares);
  for (let x = 0; x < numberOfSquares; x++) {
    const color = colorData[x] as ColorKey;
    squareRow.push({
      color: color,
      defaultColor: color,
      captured: x === 0,
      landLocked: false,
      size: squareSize,
      x: xCoord,
      y: yCoord,
      depth: 0,
    });
    if (Math.sqrt(numberOfSquares) === xCoord) {
      xCoord = 0;
      yCoord++;
      squareGrid.push(squareRow);
      squareRow = [];
    }
    xCoord++;
  }
  return squareGrid;
};

const createRandomColorList = (numberOfSquares: number) => {
  return new Array(numberOfSquares).fill(null).map((_) => {
    return Math.floor(Math.random() * 5);
  });
};
