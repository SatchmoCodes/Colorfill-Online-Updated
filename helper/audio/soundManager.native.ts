// soundManager.native.ts
const Sound = require("react-native-sound").default;

const NUM_PITCHES = 12; // number of pitch files
const HIGH_POOL_SIZE = 6; // pool size for highest pitch
const playedDepths = new Set<number>();

// Main sound list (0–10 normal, 11 unused placeholder)
const popSounds: any[] = [];

// Pool for the highest-pitch repeated sound
const highPitchPool: any[] = [];
let highPoolIndex = 0;

// ----------------------------------------------------
// Reset depth tracking
// ----------------------------------------------------
export const resetPlayedDepths = () => playedDepths.clear();

// ----------------------------------------------------
// Load all sounds
// ----------------------------------------------------
export const loadSounds = () => {
  if (popSounds.length > 0) return; // already loaded

  console.log("Loading native sounds…");

  // Load normal pitched sounds (0–10)
  for (let i = 0; i < NUM_PITCHES - 1; i++) {
    const s = new Sound(`pop_${i}.mp3`, Sound.MAIN_BUNDLE, (err: any) => {
      if (err) {
        console.log("❌ Native sound load error:", err);
      } else {
        console.log(`Loaded native sound index: ${i}`);
        s.setVolume(1.0);
      }
    });
    popSounds.push(s);
  }

  // Load placeholder for index 11 (never used directly)
  popSounds.push(null);

  // ----------------------------------------------------
  // Load HIGH PITCH POOL (file: pop_11.mp3)
  // ----------------------------------------------------
  for (let i = 0; i < HIGH_POOL_SIZE; i++) {
    const s = new Sound(`pop_11.mp3`, Sound.MAIN_BUNDLE, (err: any) => {
      if (err) {
        console.log("❌ High-pitch load error:", err);
      } else {
        console.log(`Loaded high-pitch pool sound: ${i}`);
        s.setVolume(1.0);
      }
    });
    highPitchPool.push(s);
  }

  console.log("All native pop sounds loaded.");
};

// ----------------------------------------------------
// Play the appropriate sound (with high-pitch pool)
// ----------------------------------------------------
export const playPop = (depth: number = 0) => {
  if (popSounds.length === 0) return; // not loaded yet

  // Convert depth→index (1-based depth → 0-based)
  const raw = depth - 1;
  const idx = raw >= NUM_PITCHES ? NUM_PITCHES - 1 : Math.max(0, raw);

  // Prevent overlapping sounds at the same depth
  if (playedDepths.has(depth)) return;
  playedDepths.add(depth);

  // --------------------------------------------------------
  // SPECIAL CASE: Highest pitch → use pool for low latency
  // --------------------------------------------------------
  if (idx === NUM_PITCHES - 1) {
    const snd = highPitchPool[highPoolIndex];
    highPoolIndex = (highPoolIndex + 1) % HIGH_POOL_SIZE;

    snd.stop(() => snd.play());
    return;
  }

  // --------------------------------------------------------
  // Normal sound (0–10)
  // --------------------------------------------------------
  const snd = popSounds[idx];
  if (!snd) return;

  snd.stop(() => snd.play());
};
