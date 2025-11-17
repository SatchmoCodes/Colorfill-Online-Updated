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

  loadSounds = async () => {
    if (popSounds.length > 0) return;

    for (let i = 0; i < NUM_PITCHES; i++) {
      const snd = new Audio.Sound();
      await snd.loadAsync(require(`@/assets/sounds/pitched/pop_${i}.wav`));
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
      const s = new Sound(`pop_${i}.wav`, Sound.MAIN_BUNDLE, (error: any) => {
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
