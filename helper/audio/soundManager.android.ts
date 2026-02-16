import { NativeModules } from "react-native";
import { savePopSoundVolume } from "../asyncStorageHelper";

const { PopSoundPool } = NativeModules;

const NUM_PITCHES = 12;
const playedDepths = new Set<number>();

let globalVolume = 0.25;
let loaded = false;

export const resetPlayedDepths = () => playedDepths.clear();

export const setSoundVolume = async (
  v: number,
  shouldPlaySound: boolean = false,
) => {
  globalVolume = v;
  if (shouldPlaySound) {
    resetPlayedDepths();
    playPop(1);
  }
  await savePopSoundVolume(v);
};

export const loadSounds = () => {
  if (loaded) return;
  loaded = true;
  for (let i = 0; i < NUM_PITCHES; i++) {
    PopSoundPool.load(`pop_${i}.mp3`);
  }
};

export const playPop = (depth: number = 0) => {
  if (!loaded) return;

  const idx = depth >= NUM_PITCHES ? NUM_PITCHES - 1 : Math.max(0, depth);

  if (playedDepths.has(depth)) return;
  playedDepths.add(depth);

  PopSoundPool.play(`pop_${idx}.mp3`, globalVolume);
};
