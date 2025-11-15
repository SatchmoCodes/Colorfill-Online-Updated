import { Platform } from "react-native";

let loadSounds: () => void;
let playPop: (depth?: number) => void;
let resetPlayedDepths: () => void;

if (Platform.OS === "web") {
  // ---------------- WEB IMPLEMENTATION ----------------
  let playedDepths = new Set<number>();
  let audio: HTMLAudioElement | null = null;

  loadSounds = () => {
    if (!audio) {
      // Web: require() works here for bundling the mp3
      audio = new Audio(require("@/assets/sounds/pop.mp3"));
      audio.load();
    }
  };

  playPop = (depth: number = 0) => {
    if (playedDepths.has(depth)) return;
    playedDepths.add(depth);

    if (!audio) return;

    const rate = 1 + depth * 0.05 + Math.random() * 0.03;
    audio.currentTime = 0;
    audio.playbackRate = rate;
    audio.play();
  };

  resetPlayedDepths = () => {
    playedDepths.clear();
  };
} else {
  // ---------------- NATIVE IMPLEMENTATION ----------------
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sound = require("react-native-sound").default;

  Sound.setCategory("Playback");

  const SOUND_POOL_SIZE = 6;
  const soundPool: (typeof Sound)[] = [];
  let nextIndex = 0;
  const playedDepths = new Set<number>();

  loadSounds = () => {
    if (soundPool.length > 0) return;

    for (let i = 0; i < SOUND_POOL_SIZE; i++) {
      // NATIVE: pass string filename + Sound.MAIN_BUNDLE
      const snd = new Sound("pop.mp3", Sound.MAIN_BUNDLE, (error: any) => {
        if (error) console.warn("Failed to load sound:", error);
      });
      soundPool.push(snd);
    }
  };

  playPop = (depth: number = 0) => {
    if (playedDepths.has(depth)) return;
    playedDepths.add(depth);

    if (!soundPool.length) return;

    const snd = soundPool[nextIndex];
    nextIndex = (nextIndex + 1) % soundPool.length;

    const rate = 1 + depth * 0.05 + Math.random() * 0.03;

    snd.setCurrentTime(0);
    snd.setSpeed(rate);

    snd.play((success: boolean) => {
      if (!success) console.warn("Playback failed");
    });
  };

  resetPlayedDepths = () => {
    playedDepths.clear();
  };
}

// ---------------- EXPORT ----------------
export { loadSounds, playPop, resetPlayedDepths };
