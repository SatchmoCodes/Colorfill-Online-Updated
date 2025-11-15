import { Platform } from "react-native";

let loadSounds: () => void;
let playPop: (depth?: number) => void;
let resetPlayedDepths: () => void;

const MAX_POOL_SIZE = 6;

if (Platform.OS === "web") {
  // ---------------- WEB ----------------
  const playedDepths = new Set<number>();
  let audioTemplate: HTMLAudioElement | null = null;

  loadSounds = () => {
    if (!audioTemplate) {
      audioTemplate = new Audio(require("@/assets/sounds/pop.wav")); // use .wav for consistency
      audioTemplate.load();
    }
  };

  playPop = (depth: number = 0) => {
    if (!audioTemplate || playedDepths.has(depth)) return;

    playedDepths.add(depth);

    const audio = audioTemplate.cloneNode(true) as HTMLAudioElement;
    const rate = 1 + depth * 0.05 + (Math.random() * 0.03 - 0.015);
    audio.playbackRate = rate;
    audio.currentTime = 0;
    audio.play();
  };

  resetPlayedDepths = () => {
    playedDepths.clear();
  };
} else {
  // ---------------- NATIVE ----------------
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Sound = require("react-native-sound").default;
  Sound.setCategory("Playback");

  const soundPool: (typeof Sound)[] = [];
  let nextIndex = 0;
  const playedDepths = new Set<number>();

  loadSounds = () => {
    if (soundPool.length > 0) return;

    for (let i = 0; i < MAX_POOL_SIZE; i++) {
      const snd = new Sound("pop.wav", Sound.MAIN_BUNDLE, (error: any) => {
        if (error) console.warn("Failed to load sound:", error);
      });
      soundPool.push(snd);
    }
  };

  playPop = (depth: number = 0) => {
    if (!soundPool.length || playedDepths.has(depth)) return;

    playedDepths.add(depth);

    const snd = soundPool[nextIndex];
    nextIndex = (nextIndex + 1) % soundPool.length;

    const rate = 1 + depth * 0.05 + (Math.random() * 0.03 - 0.015);

    snd.setCurrentTime(0);
    snd.setSpeed(rate); // works reliably on .wav
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
