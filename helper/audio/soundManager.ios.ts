// soundManager.ios.ts
import { Audio } from "expo-av";
import { savePopSoundVolume } from "../asyncStorageHelper";

const NUM_PITCHES = 12;
const HIGH_POOL_SIZE = 6;
const playedDepths = new Set<number>();
let globalVolume = 0.25;

// Normal sounds 0–10 (index 11 unused placeholder)
const popSounds: Audio.Sound[] = [];

// High-pitch pool for index 11
const highPitchPool: Audio.Sound[] = [];
let highPoolIndex = 0;

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
  require("@/assets/sounds/pitched/pop_11.mp3"), // high pitch
];

// ----------------------------------------
export const resetPlayedDepths = () => playedDepths.clear();
// ----------------------------------------

export const setSoundVolume = async (v: number, shouldPlaySound = false) => {
  globalVolume = v;

  // Update all sounds (normal + pool)
  for (const s of [...popSounds, ...highPitchPool]) {
    try {
      await s.setVolumeAsync(v);
    } catch {}
  }

  if (shouldPlaySound) {
    resetPlayedDepths();
    playPop(1);
  }

  await savePopSoundVolume(v);
};

// ----------------------------------------
// Load Sounds
// ----------------------------------------
export const loadSounds = async () => {
  if (popSounds.length > 0) return;

  // Normal indexed sounds 0–10
  for (let i = 0; i < NUM_PITCHES - 1; i++) {
    const sound = new Audio.Sound();
    await sound.loadAsync(importedFiles[i]);
    await sound.setVolumeAsync(globalVolume);
    popSounds.push(sound);
  }

  // Placeholder
  popSounds.push(null as any);

  // High-pitch pool (all using pop_11.mp3)
  for (let i = 0; i < HIGH_POOL_SIZE; i++) {
    const sound = new Audio.Sound();
    await sound.loadAsync(importedFiles[11]);
    await sound.setVolumeAsync(globalVolume);
    highPitchPool.push(sound);
  }
};

// ----------------------------------------
// Play Sound
// ----------------------------------------
export const playPop = async (depth: number = 0) => {
  if (popSounds.length === 0) return;

  const idx = depth >= NUM_PITCHES ? NUM_PITCHES - 1 : Math.max(0, depth);

  // Prevent overlaps per depth
  if (playedDepths.has(depth)) return;
  playedDepths.add(depth);

  // High pitch → pool
  if (idx === NUM_PITCHES - 1) {
    const s = highPitchPool[highPoolIndex];
    highPoolIndex = (highPoolIndex + 1) % HIGH_POOL_SIZE;

    await s.setVolumeAsync(globalVolume);
    try {
      await s.stopAsync();
    } catch {}
    await s.playAsync();
    return;
  }

  // Normal sound
  const s = popSounds[idx];
  if (!s) return;

  await s.setVolumeAsync(globalVolume);
  try {
    await s.stopAsync();
  } catch {}
  await s.playAsync();
};
