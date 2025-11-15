import { saveColorPaletteOptions } from "./asyncStorageHelper";
import { getColorPaletteOptions } from "./getColorPaletteOptions";
import { Unlockables } from "./updateCriteriaMap";

export const getUnlockedColorPalettes = async (
  prevCriteriaMap: Unlockables,
  newCriteriaMap: Unlockables
) => {
  const updatedColorPaletteOptions = await getColorPaletteOptions(
    newCriteriaMap
  );
  const newlyUnlockedColorPalettes = updatedColorPaletteOptions.filter(
    (item) => {
      if ("key" in item) {
        const prevCriteriaMapItemLocked =
          prevCriteriaMap[item.key]?.locked ?? true;
        const newCriteriaMapItemLocked =
          newCriteriaMap[item.key]?.locked ?? true;
        return prevCriteriaMapItemLocked !== newCriteriaMapItemLocked;
      }
      return false;
    }
  );
  await saveColorPaletteOptions(updatedColorPaletteOptions);
  return newlyUnlockedColorPalettes;
};
