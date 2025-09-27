import { PaletteObj } from "@/app/(protected)/settings";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLOR_INDEX_KEY = "color-index";
const COLOR_PALETTE_KEY = "color-palettes";
const COLOR_PALETTE_STALE_KEY = "color-palettes-stale";
const MOSAIC_MODE_KEY = "mosaic-mode";

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

export async function saveIsColorPaletteStale(isStale: boolean) {
  await AsyncStorage.setItem(COLOR_PALETTE_STALE_KEY, JSON.stringify(isStale));
}

export async function loadIsColorPaletteStale(): Promise<boolean | null> {
  const saved = await AsyncStorage.getItem(COLOR_PALETTE_STALE_KEY);
  return saved !== null ? JSON.parse(saved) : null;
}

export async function saveIsMosaicMode(mode: boolean) {
  await AsyncStorage.setItem(MOSAIC_MODE_KEY, JSON.stringify(mode));
}

export async function loadIsMosaicMode(): Promise<boolean | null> {
  const saved = await AsyncStorage.getItem(MOSAIC_MODE_KEY);
  return saved !== null ? JSON.parse(saved) : null;
}
