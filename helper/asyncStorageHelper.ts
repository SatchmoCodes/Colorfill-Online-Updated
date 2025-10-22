import { PaletteObj } from "@/app/(protected)/settings";
import { BoardDoc } from "@/schema/boardDocModel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Unlockables } from "./updateCriteriaMap";

const COLOR_INDEX_KEY = "color-index";
const COLOR_PALETTE_KEY = "color-palettes";
const CRITERIA_MAP_KEY = "criteria-map";
const MOSAIC_MODE_KEY = "mosaic-mode";
const BOTD_KEY = "botd";
const SOLVED_BOTD_ID_KEY = "botd_id";
const PROFILE_BACKGROUND_COLOR_KEY = "profile-color";
const PROFILE_LETTER_COLOR_KEY = "profile-letter-color";

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
