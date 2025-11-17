const Sound = require("react-native-sound").default;

const NUM_PITCHES = 12;
const playedDepths = new Set<number>();
const popSounds: any[] = [];

export const resetPlayedDepths = () => playedDepths.clear();

export const loadSounds = () => {
  if (popSounds.length > 0) return;

  for (let i = 0; i < NUM_PITCHES; i++) {
    const s = new Sound(`pop_${i}.mp3`, Sound.MAIN_BUNDLE, (err: any) => {
      if (err) {
        console.log("Native sound load error:", err);
      } else {
        console.log("Loaded native sound index:", i);
        s.setVolume(1.0); // <-- Important for Android
      }
    });
    popSounds.push(s);
  }
};

export const playPop = (depth: number = 0) => {
  const idx = Math.min(depth, NUM_PITCHES - 1);
  if (playedDepths.has(idx)) return;
  playedDepths.add(idx);

  const s = popSounds[idx];
  if (!s) return;

  //   s.setVolume(1.0); // <-- Extra safety
  s.stop(() => s.play());
};
