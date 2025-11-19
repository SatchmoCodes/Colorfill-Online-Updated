import { PaletteObj } from "@/app/(protected)/settings";
import { BoardDoc } from "@/schema/boardDocModel";
import { ScoreDoc } from "@/schema/scoreDocModel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Unlockables } from "./updateCriteriaMap";

const COLOR_INDEX_KEY = "color-index";
const COLOR_PALETTE_KEY = "color-palettes";
const CRITERIA_MAP_KEY = "criteria-map";
const MOSAIC_MODE_KEY = "mosaic-mode";
const SQUARE_COUNTER_KEY = "square-counter";
const BOTD_KEY = "botd";
const SOLVED_BOTD_ID_KEY = "botd_id";
const PROFILE_BACKGROUND_COLOR_KEY = "profile-color";
const PROFILE_LETTER_COLOR_KEY = "profile-letter-color";
const PROFILE_BANNER_COLOR_KEY = "profile-banner-color";
const LEADERBOARD_REFRESH_KEY = "leaderboard-refresh";
const POPSOUND_VOLUME_KEY = "pop-volume";

export const FREEPLAY_OFFLINE_SCORES_KEY = "offline-scores";

export async function saveColorIndex(idx: number) {
  await AsyncStorage.setItem(COLOR_INDEX_KEY, JSON.stringify(idx));
}

export async function loadColorIndex(): Promise<number | null> {
  const saved = await AsyncStorage.getItem(COLOR_INDEX_KEY);
  return saved !== null ? JSON.parse(saved) : null;
}

export async function saveColorPaletteOptions(colorPalette: PaletteObj[]) {
  await AsyncStorage.setItem(COLOR_PALETTE_KEY, JSON.stringify(colorPalette));
}

export async function loadColorPaletteOptions(): Promise<PaletteObj[] | null> {
  const saved = await AsyncStorage.getItem(COLOR_PALETTE_KEY);
  return saved !== null ? JSON.parse(saved) : null;
}

export async function saveCriteriaMap(mapObj: Unlockables) {
  await AsyncStorage.setItem(CRITERIA_MAP_KEY, JSON.stringify(mapObj));
}

export async function loadCriteriaMap(): Promise<Unlockables | null> {
  const saved = await AsyncStorage.getItem(CRITERIA_MAP_KEY);
  return saved !== null ? JSON.parse(saved) : null;
}

export async function saveIsMosaicMode(mode: boolean) {
  await AsyncStorage.setItem(MOSAIC_MODE_KEY, JSON.stringify(mode));
}

export async function loadIsMosaicMode(): Promise<boolean | null> {
  const saved = await AsyncStorage.getItem(MOSAIC_MODE_KEY);
  return saved !== null ? JSON.parse(saved) : null;
}

export async function saveShowSquareCounter(shouldSave: boolean) {
  await AsyncStorage.setItem(SQUARE_COUNTER_KEY, JSON.stringify(shouldSave));
}

export async function loadShowSquareCounter(): Promise<boolean | null> {
  const saved = await AsyncStorage.getItem(SQUARE_COUNTER_KEY);
  return saved !== null ? JSON.parse(saved) : null;
}

export async function saveCurrentBOTD(board: BoardDoc) {
  await AsyncStorage.setItem(BOTD_KEY, JSON.stringify(board));
}

export async function loadCurrentBOTD(): Promise<BoardDoc | null> {
  const saved = await AsyncStorage.getItem(BOTD_KEY);
  return saved !== null ? JSON.parse(saved) : null;
}

export async function saveSolvedBOTDId(id: string) {
  await AsyncStorage.setItem(SOLVED_BOTD_ID_KEY, JSON.stringify(id));
}

export async function loadSolvedBOTDId(): Promise<string | null> {
  const saved = await AsyncStorage.getItem(SOLVED_BOTD_ID_KEY);
  return saved !== null ? JSON.parse(saved) : null;
}

export async function saveProfileBackgroundColor(color: string) {
  await AsyncStorage.setItem(PROFILE_BACKGROUND_COLOR_KEY, color);
}

export async function loadProfileBackgroundColor(): Promise<string | null> {
  const saved = await AsyncStorage.getItem(PROFILE_BACKGROUND_COLOR_KEY);
  return saved !== null ? saved : null;
}

export async function saveProfileLetterColor(color: string) {
  await AsyncStorage.setItem(PROFILE_LETTER_COLOR_KEY, color);
}

export async function loadProfileLetterColor(): Promise<string | null> {
  const saved = await AsyncStorage.getItem(PROFILE_LETTER_COLOR_KEY);
  return saved !== null ? saved : null;
}

export async function saveProfileBannerColor(color: string) {
  await AsyncStorage.setItem(PROFILE_BANNER_COLOR_KEY, color);
}

export async function loadProfileBannerColor(): Promise<string | null> {
  const saved = await AsyncStorage.getItem(PROFILE_BANNER_COLOR_KEY);
  return saved !== null ? saved : null;
}

export async function saveOfflineScores(score: ScoreDoc) {
  const savedScoresString = await AsyncStorage.getItem(
    FREEPLAY_OFFLINE_SCORES_KEY
  );

  const prevScores: ScoreDoc[] = savedScoresString
    ? JSON.parse(savedScoresString)
    : [];

  const updatedScoreArr = JSON.stringify([...prevScores, score]);
  await AsyncStorage.setItem(FREEPLAY_OFFLINE_SCORES_KEY, updatedScoreArr);
}

export async function loadOfflineScores(): Promise<ScoreDoc[] | []> {
  const saved = await AsyncStorage.getItem(FREEPLAY_OFFLINE_SCORES_KEY);
  return saved !== null ? JSON.parse(saved) : [];
}

export async function saveLeaderboardRefreshTime(time: number) {
  await AsyncStorage.setItem(LEADERBOARD_REFRESH_KEY, JSON.stringify(time));
}

export async function loadLeaderboardRefreshTime(): Promise<number | null> {
  const saved = await AsyncStorage.getItem(LEADERBOARD_REFRESH_KEY);
  return saved !== null ? JSON.parse(saved) : null;
}

export async function savePopSoundVolume(volume: number) {
  await AsyncStorage.setItem(POPSOUND_VOLUME_KEY, JSON.stringify(volume));
}

export async function loadPopSoundVolume(): Promise<number | null> {
  const saved = await AsyncStorage.getItem(POPSOUND_VOLUME_KEY);
  return saved !== null ? Number(saved) : null;
}
