import { Platform } from "react-native";

// ---------- SHARED ----------
const NUM_PITCHES = 12;
const playedDepths = new Set<number>();

export const resetPlayedDepths = () => playedDepths.clear();

// Placeholders
let loadSounds: () => Promise<void> | void;
let playPop: (depth?: number) => Promise<void> | void;

// ============================================================================
//                               WEB (EXPO AV)
// ============================================================================
if (Platform.OS === "web") {
  const { Audio } = require("expo-av");
  const popSounds: any[] = [];

  // 1. Statically import all required assets
  const soundModules = [
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

  loadSounds = async () => {
    if (popSounds.length > 0) return;

    for (let i = 0; i < NUM_PITCHES; i++) {
      const snd = new Audio.Sound();
      // 2. Load the sound using the static import result
      await snd.loadAsync(soundModules[i]);
      popSounds.push(snd);
    }
  };

  playPop = async (depth: number = 0) => {
    const idx = Math.min(depth, NUM_PITCHES - 1);
    if (playedDepths.has(idx)) return;
    playedDepths.add(idx);

    const snd = popSounds[idx];
    if (!snd) return;

    try {
      await snd.stopAsync();
    } catch {}

    try {
      await snd.playAsync();
    } catch (err) {
      console.warn("Web play failed", err);
    }
  };
}

// ============================================================================
//                        NATIVE (IOS + ANDROID)
//                          react-native-sound
// ============================================================================
else {
  const Sound = require("react-native-sound").default;
  Sound.setCategory("Ambient");

  const popSounds: any[] = [];

  loadSounds = () => {
    if (popSounds.length > 0) return;

    for (let i = 0; i < NUM_PITCHES; i++) {
      const s = new Sound(`pop_${i}.mp3`, Sound.MAIN_BUNDLE, (error: any) => {
        if (error) console.log("Sound load error:", error);
      });
      popSounds.push(s);
    }
  };

  playPop = (depth: number = 0) => {
    const idx = Math.min(depth, NUM_PITCHES - 1);
    if (playedDepths.has(idx)) return;
    playedDepths.add(idx);

    const s = popSounds[idx];
    if (!s) return;

    s.stop(() => s.play());
  };
}

// ---------- EXPORT ----------
export { loadSounds, playPop };
