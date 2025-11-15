import Sound from "react-native-sound";

Sound.setCategory("Playback");

const SOUND_POOL_SIZE = 6;
const soundPool: Sound[] = [];
let nextIndex = 0;
let playedDepths = new Set<number>();

export function loadSounds() {
  if (soundPool.length > 0) return;

  // Enable faster loading on Android
  Sound.setCategory("Ambient", true);

  for (let i = 0; i < SOUND_POOL_SIZE; i++) {
    const snd = new Sound(
      require("@/assets/sounds/pop.mp3"),
      Sound.MAIN_BUNDLE,
      (error) => {
        if (error) {
          console.warn("Failed to load sound:", error);
        }
      }
    );

    soundPool.push(snd);
  }
}

export function playPop(depth: number = 0) {
  if (playedDepths.has(depth)) return;
  playedDepths.add(depth);

  if (soundPool.length === 0) return;

  const snd = soundPool[nextIndex];
  nextIndex = (nextIndex + 1) % soundPool.length;

  // Pitch / playback rate variation
  const rate = 1 + depth * 0.05 + Math.random() * 0.03;

  // 1. reset position
  snd.setCurrentTime(0);

  // 2. set playback speed (supported on both iOS + Android)
  snd.setSpeed(rate);

  // 3. play instantly
  snd.play((success) => {
    if (!success) {
      console.warn("playback failed");
    }
  });
}

export function resetPlayedDepths() {
  playedDepths.clear();
}
