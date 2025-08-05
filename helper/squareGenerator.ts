import { ColorKey, Square } from "@/app/freeplay";

export const squareGenerator = (numberOfSquares: number) => {
  const squares: Square[] = [];
  let xCoord = 0;
  let yCoord = Math.sqrt(numberOfSquares);
  for (let x = 0; x < numberOfSquares; x++) {
    const color = Math.floor(Math.random() * 5) as ColorKey;
    xCoord++;
    squares.push({
      color: color,
      captured: false,
      x: xCoord,
      y: yCoord,
    });
    if (Math.sqrt(numberOfSquares) === xCoord) {
      xCoord = 1;
      yCoord--;
    }
  }
  return squares;
};
