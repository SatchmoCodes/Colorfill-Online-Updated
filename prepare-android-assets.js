// prepare-android-assets.js
const fs = require("fs");
const path = require("path");

// --- Configuration ---
const SOURCE_DIR = path.join("assets", "sounds", "pitched");
const DEST_DIR = path.join("android", "app", "src", "main", "res", "raw");
const FILE_COUNT = 12; // Files from 0 to 11

/**
 * Ensures the destination directory exists.
 */
function ensureDirectory() {
  if (!fs.existsSync(DEST_DIR)) {
    console.log(`Creating destination directory: ${DEST_DIR}`);
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }
}

/**
 * Copies and renames sound files.
 */
function copySoundAssets() {
  ensureDirectory();
  console.log(`Copying sound assets from ${SOURCE_DIR} to ${DEST_DIR}...`);

  try {
    for (let i = 0; i < FILE_COUNT; i++) {
      const sourceFileName = `pop_${i}.mp3`;
      const sourceFilePath = path.join(SOURCE_DIR, sourceFileName);

      // Android raw resource names must be lowercase and contain only a-z, 0-9, or underscore.
      // Since your files are already pop_0.mp3, they meet this requirement.
      const destFileName = sourceFileName.toLowerCase();
      const destFilePath = path.join(DEST_DIR, destFileName);

      if (fs.existsSync(sourceFilePath)) {
        fs.copyFileSync(sourceFilePath, destFilePath);
        console.log(`  Copied: ${sourceFileName} -> ${destFileName}`);
      } else {
        console.warn(`  Warning: Source file not found: ${sourceFilePath}`);
      }
    }
    console.log("Asset copying complete.");
  } catch (error) {
    console.error("Error during asset copying:", error.message);
    process.exit(1); // Exit with error code
  }
}

copySoundAssets();
