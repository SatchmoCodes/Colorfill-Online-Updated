import { Audio } from "expo-av";

const SOUND_POOL_SIZE = 5; // number of reusable sound players
const soundPool: Audio.Sound[] = [];
let nextIndex = 0;
let playedDepths = new Set<number>();

export async function loadSounds() {
  if (soundPool.length > 0) return;

  for (let i = 0; i < SOUND_POOL_SIZE; i++) {
    const sound = new Audio.Sound();
    await sound.loadAsync(require("@/assets/sounds/pop.mp3"));
    soundPool.push(sound);
  }
}

export async function playPop(depth: number = 0) {
  if (playedDepths.has(depth)) return;
  playedDepths.add(depth);

  if (soundPool.length === 0) return;

  const sound = soundPool[nextIndex];
  nextIndex = (nextIndex + 1) % soundPool.length;

  try {
    await sound.setPositionAsync(0);
    const rate = 1 + depth * 0.05 + Math.random() * 0.03;
    await sound.setRateAsync(rate, false);
    await sound.playAsync();
  } catch (err) {
    console.warn("playPop error:", err);
  }
}

export function resetPlayedDepths() {
  playedDepths.clear();
}
