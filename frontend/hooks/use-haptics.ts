"use client";

import { useState, useCallback, useEffect } from "react";
import {
  haptic,
  getHapticsEnabled,
  setHapticsEnabled,
  type HapticIntensity,
} from "@/lib/haptics";

interface UseHapticsReturn {
  /** Fire a haptic pulse. */
  haptic: (intensity?: HapticIntensity) => void;
  /** Whether the user has haptics enabled. */
  enabled: boolean;
  /** Toggle or explicitly set the haptics preference. */
  setEnabled: (value: boolean) => void;
}

/**
 * React hook for haptic feedback.
 *
 * Usage:
 *   const { haptic } = useHaptics();
 *   <button onClick={() => haptic("light")}>Tap me</button>
 *
 * The `enabled` and `setEnabled` values can be wired up to a settings toggle
 * (e.g. in the Account page) to let users opt out.
 */
export function useHaptics(): UseHapticsReturn {
  const [enabled, setEnabledState] = useState<boolean>(true);

  // Sync initial state from localStorage on mount (client-only).
  useEffect(() => {
    setEnabledState(getHapticsEnabled());
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setHapticsEnabled(value);
    setEnabledState(value);
  }, []);

  const trigger = useCallback(
    (intensity: HapticIntensity = "light") => {
      haptic(intensity);
    },
    []
  );

  return { haptic: trigger, enabled, setEnabled };
}
