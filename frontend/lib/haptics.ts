"use client";

/**
 * Haptic feedback utility built on the web-haptics library.
 *
 * Uses the WebHaptics class which handles the Vibration API internally,
 * including graceful no-ops on unsupported browsers/devices (iOS, desktop).
 *
 * User preference is persisted in localStorage under "haptics-enabled"
 * (defaults to true). Wire up setHapticsEnabled() to a settings toggle
 * so users can opt out.
 */

import { WebHaptics } from "web-haptics";

// Our semantic haptic intensities mapped to web-haptics preset names.
// "tick" has no direct preset; we use "rigid" (10ms, intensity 1.0) which
// produces a very short, crisp pulse — ideal for slider step ticks.
export type HapticIntensity =
  | "selection" // 8ms,  0.3 — lightest; tab/radio/checkbox selection
  | "light"     // 15ms, 0.4 — button taps, nav item taps
  | "medium"    // 25ms, 0.7 — toggle switches, select dropdowns
  | "heavy"     // 35ms, 1.0 — FAB open/close, destructive actions
  | "success"   // two-pulse — successful operation
  | "error"     // three-pulse — failed operation / warning
  | "tick";     // 10ms, 1.0 — slider step (mapped to "rigid")

const PRESET_MAP: Record<HapticIntensity, string> = {
  selection: "selection",
  light:     "light",
  medium:    "medium",
  heavy:     "heavy",
  success:   "success",
  error:     "error",
  tick:      "rigid",
};

const PREF_KEY = "haptics-enabled";

// Singleton instance — created once on first use, never on the server.
let _instance: WebHaptics | null = null;

function getInstance(): WebHaptics | null {
  if (typeof window === "undefined") return null;
  if (!_instance) _instance = new WebHaptics();
  return _instance;
}

/** Returns true when the user has NOT explicitly disabled haptics. */
function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(PREF_KEY);
  // Default to enabled when no preference has been saved yet.
  return stored === null ? true : stored === "true";
}

/**
 * Fire a haptic pulse of the given intensity.
 * Safe to call anywhere — silently no-ops when:
 *   • running on the server (SSR)
 *   • the browser does not support the Vibration API
 *   • the user has disabled haptics in their settings
 */
export function haptic(intensity: HapticIntensity = "light"): void {
  if (!WebHaptics.isSupported || !isEnabled()) return;
  getInstance()?.trigger(PRESET_MAP[intensity]);
}

/** Read the current user preference (safe to call on server; returns true). */
export function getHapticsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(PREF_KEY);
  return stored === null ? true : stored === "true";
}

/** Persist the user preference. */
export function setHapticsEnabled(value: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREF_KEY, String(value));
}
