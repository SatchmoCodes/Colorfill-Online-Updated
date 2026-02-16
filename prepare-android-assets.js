// prepare-android-assets.js
const fs = require("fs");
const path = require("path");

// --- Configuration ---
const SOURCE_DIR = path.join("assets", "sounds", "pitched");
const DEST_DIR = path.join("android", "app", "src", "main", "res", "raw");
const FILE_COUNT = 12; // Files from 0 to 11

const KT_SOURCE_DIR = path.join("native", "android");
const KT_DEST_DIR = path.join(
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "colorfillonlineupdated"
);
const KT_FILES = ["PopSoundPoolModule.kt", "PopSoundPoolPackage.kt"];

const MAIN_APP_PATH = path.join(KT_DEST_DIR, "MainApplication.kt");

/**
 * Ensures the destination directory exists.
 */
function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating destination directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Copies and renames sound files.
 */
function copySoundAssets() {
  ensureDirectory(DEST_DIR);
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

/**
 * Copies native Kotlin module files from native/android/ into the Android project.
 */
function copyNativeModules() {
  ensureDirectory(KT_DEST_DIR);
  console.log(`Copying native Kotlin modules to ${KT_DEST_DIR}...`);

  for (const file of KT_FILES) {
    const src = path.join(KT_SOURCE_DIR, file);
    const dest = path.join(KT_DEST_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  Copied: ${file}`);
    } else {
      console.warn(`  Warning: Native module source not found: ${src}`);
    }
  }
}

/**
 * Patches MainApplication.kt to register PopSoundPoolPackage.
 * Safe to run multiple times — skips if already patched.
 */
function patchMainApplication() {
  if (!fs.existsSync(MAIN_APP_PATH)) {
    console.warn("  Warning: MainApplication.kt not found, skipping patch.");
    return;
  }

  let content = fs.readFileSync(MAIN_APP_PATH, "utf8");

  if (content.includes("PopSoundPoolPackage()")) {
    console.log("  MainApplication.kt already patched.");
    return;
  }

  const patched = content.replace(
    /PackageList\(this\)\.packages\.apply \{\s*\/\/ Packages that cannot be autolinked yet can be added manually here[^\}]*\}/s,
    "PackageList(this).packages.apply {\n              add(PopSoundPoolPackage())\n            }"
  );

  if (patched === content) {
    console.warn(
      "  Warning: Could not locate package registration block in MainApplication.kt."
    );
    return;
  }

  fs.writeFileSync(MAIN_APP_PATH, patched, "utf8");
  console.log("  Patched MainApplication.kt with PopSoundPoolPackage().");
}

copySoundAssets();
copyNativeModules();
patchMainApplication();
