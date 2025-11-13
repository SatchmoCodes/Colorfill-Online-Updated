// soundHelper.ts
import { Audio } from "expo-av";

let popBuffer: Audio.Sound | null = null;
let playedDepths = new Set<number>();

export async function loadSounds() {
  if (!popBuffer) {
    popBuffer = new Audio.Sound();
    await popBuffer.loadAsync(require("@/assets/sounds/pop.mp3"));
  }
}

// playPop: plays once per depth, creating a temporary sound instance
export async function playPop(depth: number = 0) {
  if (playedDepths.has(depth)) return;
  playedDepths.add(depth);

  try {
    // Create a temporary sound instance from the same file
    const sound = new Audio.Sound();
    await sound.loadAsync(require("@/assets/sounds/pop.mp3"));

    // Slight pitch variation by depth
    const playbackRate = 1 + depth * 0.05 + Math.random() * 0.03;
    await sound.setRateAsync(playbackRate, false);

    // Play sound
    await sound.playAsync();

    // Schedule cleanup (approx. length of sound)
    setTimeout(() => {
      sound.unloadAsync().catch(() => {});
    }, 1000); // adjust to slightly longer than your sound’s duration
  } catch (err) {
    console.warn("Failed to play pop:", err);
  }
}

export function resetPlayedDepths() {
  playedDepths.clear();
}
