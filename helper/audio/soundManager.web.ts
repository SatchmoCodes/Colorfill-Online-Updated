const { Audio } = require("expo-av");

const NUM_PITCHES = 12;
const playedDepths = new Set<number>();
const popSounds: any[] = [];

console.log("what about this file, asdf");

export const resetPlayedDepths = () => playedDepths.clear();

const importedFiles = [
  require("@/assets/sounds/pitched/pop_0.mp3"),
  require("@/assets/sounds/pitched/pop_1.mp3"),
  require("@/assets/sounds/pitched/pop_2.mp3"),
  require("@/assets/sounds/pitched/pop_3.mp3"),
  require("@/assets/sounds/pitched/pop_4.mp3"),
  require("@/assets/sounds/pitched/pop_5.mp3"),
  require("@/assets/sounds/pitched/pop_6.mp3"),
  require("@/assets/sounds/pitched/pop_7.mp3"),
  require("@/assets/sounds/pitched/pop_8.mp3"),
  require("@/assets/sounds/pitched/pop_9.mp3"),
  require("@/assets/sounds/pitched/pop_10.mp3"),
  require("@/assets/sounds/pitched/pop_11.mp3"),
];

export const loadSounds = async () => {
  if (popSounds.length > 0) return;

  for (let i = 0; i < NUM_PITCHES; i++) {
    const sound = new Audio.Sound();
    await sound.loadAsync(importedFiles[i]);
    popSounds.push(sound);
  }
};

export const playPop = async (depth: number = 0) => {
  console.log("web pop");
  const idx = Math.min(depth, NUM_PITCHES - 1);
  if (playedDepths.has(idx)) return;
  playedDepths.add(idx);

  const sound = popSounds[idx];
  if (!sound) return;

  try {
    await sound.stopAsync();
  } catch {}

  try {
    await sound.playAsync();
  } catch (e) {
    console.warn("web audio failed", e);
  }
};
