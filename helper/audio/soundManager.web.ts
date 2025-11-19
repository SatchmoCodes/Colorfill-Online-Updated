import { savePopSoundVolume } from "../asyncStorageHelper";

const { Audio } = require("expo-av");

const NUM_PITCHES = 12;
const HIGHEST_INDEX = NUM_PITCHES - 1;
const HIGH_PITCH_POOL_SIZE = 6; // adjustable
let globalVolume = 0.25;

const playedDepths = new Set<number>();
const popSounds: any[] = [];
const highPitchPool: any[] = [];
let highPitchPoolIndex = 0;

// -----------------------------
// VOLUME API
// -----------------------------
export const setSoundVolume = async (v: number, shouldPlaySound = false) => {
  globalVolume = v;

  // update main pitch sounds
  for (const snd of popSounds) {
    try {
      await snd.setVolumeAsync(v);
    } catch {}
  }

  // update pooled high pitch sounds
  for (const snd of highPitchPool) {
    try {
      await snd.setVolumeAsync(v);
    } catch {}
  }

  if (shouldPlaySound) {
    resetPlayedDepths();
    playPop(1);
  }

  await savePopSoundVolume(v);
};

export const resetPlayedDepths = () => playedDepths.clear();

// -----------------------------
// SOUND FILES IMPORT
// -----------------------------
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

// -----------------------------
// LOAD SOUNDS
// -----------------------------
export const loadSounds = async () => {
  if (popSounds.length > 0) return;

  // Load standard 0–11 sounds
  for (let i = 0; i < NUM_PITCHES; i++) {
    const snd = new Audio.Sound();
    await snd.loadAsync(importedFiles[i]);
    await snd.setVolumeAsync(globalVolume);
    popSounds.push(snd);
  }

  // Build pool for top pitch sound (index 11)
  for (let p = 0; p < HIGH_PITCH_POOL_SIZE; p++) {
    const snd = new Audio.Sound();
    await snd.loadAsync(importedFiles[HIGHEST_INDEX]);
    await snd.setVolumeAsync(globalVolume);
    highPitchPool.push(snd);
  }
};

// -----------------------------
// PLAY FUNCTION
// -----------------------------
export const playPop = async (depth: number = 0) => {
  // already played this exact depth → skip
  if (playedDepths.has(depth)) return;
  playedDepths.add(depth);

  const idx = Math.min(depth, HIGHEST_INDEX);

  // -----------------------------
  // High pitch overflow (depth >= 12) → pooled sounds
  // -----------------------------
  if (depth >= HIGHEST_INDEX) {
    const snd = highPitchPool[highPitchPoolIndex];
    highPitchPoolIndex = (highPitchPoolIndex + 1) % HIGH_PITCH_POOL_SIZE;

    try {
      await snd.stopAsync();
    } catch {}

    try {
      await snd.playAsync();
    } catch (e) {
      console.warn("High pitch pooled sound error:", e);
    }

    return;
  }

  // -----------------------------
  // Standard 0–10 and first play of 11
  // -----------------------------
  const snd = popSounds[idx];
  if (!snd) return;

  try {
    await snd.stopAsync();
  } catch {}

  try {
    await snd.playAsync();
  } catch (e) {
    console.warn("web audio failed", e);
  }
};
