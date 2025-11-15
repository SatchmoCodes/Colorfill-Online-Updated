const fs = require("fs");
const path = require("path");

const rawDir = path.join(__dirname, "../android/app/src/main/res/raw");

// Create raw folder if missing
if (!fs.existsSync(rawDir)) {
  fs.mkdirSync(rawDir, { recursive: true });
}

// Copy sound file
fs.copyFileSync(
  path.join(__dirname, "../assets/sounds/pop.wav"),
  path.join(rawDir, "pop.mp3")
);

console.log("Copied pop.mp3 to Android res/raw");
