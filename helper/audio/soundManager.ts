import { Audio } from "expo-av"; // Used only on web
import { Platform } from "react-native";

let loadSounds: () => Promise<void> | void;
let playPop: (depth?: number) => Promise<void> | void;
let resetPlayedDepths: () => void;

/** Prevent multiple pops for same depth */
const playedDepths = new Set<number>();

/** Keep same pitch-shift formula */
const calculateRate = (depth: number) => {
  const base = 1 + depth * 0.05;
  const jitter = Math.random() * 0.03 - 0.01;
  let rate = base + jitter;

  // TrackPlayer rate safety (Android crashes above ~1.7)
  rate = Math.min(rate, 1.65);
  rate = Math.max(rate, 0.75);

  return rate;
};

if (Platform.OS === "web") {
  // -----------------------------------------------------------
  // WEB: Expo AV
  // -----------------------------------------------------------
  let soundPool: Audio.Sound[] = [];
  let nextIndex = 0;
  const MAX_POOL = 6;

  const popAsset = require("@/assets/sounds/pop.wav");

  loadSounds = async () => {
    if (soundPool.length > 0) return;

    for (let i = 0; i < MAX_POOL; i++) {
      const { sound } = await Audio.Sound.createAsync(popAsset);
      soundPool.push(sound);
    }
  };

  playPop = async (depth: number = 0) => {
    if (!soundPool.length || playedDepths.has(depth)) return;
    playedDepths.add(depth);

    const sound = soundPool[nextIndex];
    nextIndex = (nextIndex + 1) % soundPool.length;

    const rate = calculateRate(depth);

    try {
      await sound.setStatusAsync({
        shouldPlay: true,
        positionMillis: 0,
        rate,
        pitchCorrectionQuality: Audio.PitchCorrectionQuality.High,
      });
    } catch (err) {
      console.warn("Web pop play failed:", err);
    }
  };

  resetPlayedDepths = () => playedDepths.clear();
} else {
  // -----------------------------------------------------------
  // NATIVE (Android + iOS): react-native-track-player v3
  // -----------------------------------------------------------
  import("react-native-track-player").then((TrackPlayerModule) => {
    const TrackPlayer = TrackPlayerModule.default;

    let players: string[] = []; // array of player IDs (instead of TrackPlayer instances)
    const MAX_POOL = 4; // minimal pool reduces overlap + increases performance

    loadSounds = async () => {
      try {
        // Initialize TrackPlayer once
        await TrackPlayer.setupPlayer();

        if (players.length > 0) return;

        const popAsset = require("@/assets/sounds/pop.wav");

        // Create multiple players (playlist-based Player API in v3)
        for (let i = 0; i < MAX_POOL; i++) {
          const trackId = `pop-${i}`;

          await TrackPlayer.add([
            {
              id: trackId,
              url: popAsset,
              title: "pop",
              artist: "sfx",
            },
          ]);

          players.push(trackId);
        }
      } catch (e) {
        console.error("Failed to load TrackPlayer:", e);
      }
    };

    let nextIndex = 0;

    playPop = async (depth: number = 0) => {
      if (players.length === 0 || playedDepths.has(depth)) return;

      playedDepths.add(depth);

      const trackId = players[nextIndex];
      nextIndex = (nextIndex + 1) % players.length;

      const rate = calculateRate(depth);

      try {
        await TrackPlayer.stop();
        await TrackPlayer.seekTo(0);
        await TrackPlayer.setRate(rate);

        await TrackPlayer.play();
      } catch (e) {
        console.warn("Native pop play failed:", e);
      }
    };

    resetPlayedDepths = () => playedDepths.clear();
  });
}

export { loadSounds, playPop, resetPlayedDepths };
