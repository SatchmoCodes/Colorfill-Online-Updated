// Do NOT put any logic here.
// Expo will automatically select .native.ts or .web.ts at build time.

export * from "./soundManager.native"; // fallback
export * from "./soundManager.web"; // will be ignored except on web
