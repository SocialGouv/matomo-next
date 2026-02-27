"use client";

import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import type {
  ABTestName,
  ABTestVariant,
  MatomoABTestState,
} from "./ab-testing";

// ---------------------------------------------------------------------------
// Polling-based hook (works with React 16-18+)
// ---------------------------------------------------------------------------

/**
 * React hook that returns the activated variant for a given Matomo A/B test.
 *
 * Returns `null` while the test is not yet ready (script loading, not
 * participating, or not enabled). Once a variant is activated it returns
 * the variant name and never changes again for the lifetime of the
 * component.
 *
 * @param abTestName - The experiment name as registered via `initABTesting`
 * @param timeoutMs  - Maximum time (ms) to wait for Matomo (default: 5 000)
 * @returns The variant name or `null`
 *
 * @example
 * ```tsx
 * const variant = useABTestVariant("homepage-hero");
 *
 * if (variant === "new-hero") {
 *   return <NewHeroSection />;
 * }
 * return <OriginalHeroSection />;
 * ```
 */
export function useABTestVariant(
  abTestName: ABTestName,
  timeoutMs = 5000,
): ABTestVariant | null {
  const [variant, setVariant] = useState<ABTestVariant | null>(null);

  const readVariant = useCallback((): ABTestVariant | null => {
    if (typeof window === "undefined") return null;
    const state = window.__MATOMO_AB_TEST__?.[abTestName];
    if (!state || !state.isReady) return null;
    return state.variant;
  }, [abTestName]);

  useEffect(() => {
    // Try immediately
    const initial = readVariant();
    if (initial) {
      setVariant(initial);
      return;
    }

    // Poll every 100ms
    const interval = setInterval(() => {
      const current = readVariant();
      if (current) {
        setVariant(current);
        clearInterval(interval);
      }
    }, 100);

    // Give up after timeout
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, timeoutMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [abTestName, timeoutMs, readVariant]);

  return variant;
}

// ---------------------------------------------------------------------------
// Snapshot-based hook (React 18+ – useSyncExternalStore)
// ---------------------------------------------------------------------------

/**
 * React 18+ hook that subscribes to the A/B test store synchronously.
 *
 * Unlike `useABTestVariant` this does **not** use polling; instead it
 * re-renders only when the store is written to. It relies on
 * `useSyncExternalStore` and a tiny pub/sub layer.
 *
 * Falls back to `null` on the server (SSR-safe).
 *
 * @param abTestName - The experiment name
 */
export function useABTestVariantSync(
  abTestName: ABTestName,
): ABTestVariant | null {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      // We check on an interval since Matomo writes to window directly
      const id = setInterval(() => {
        const state = window.__MATOMO_AB_TEST__?.[abTestName];
        if (state?.isReady) {
          onStoreChange();
          clearInterval(id);
        }
      }, 100);
      return () => clearInterval(id);
    },
    [abTestName],
  );

  const getSnapshot = useCallback((): ABTestVariant | null => {
    if (typeof window === "undefined") return null;
    const state = window.__MATOMO_AB_TEST__?.[abTestName];
    return state?.isReady ? (state.variant ?? null) : null;
  }, [abTestName]);

  const getServerSnapshot = useCallback((): ABTestVariant | null => null, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ---------------------------------------------------------------------------
// Utility: read full state (non-hook)
// ---------------------------------------------------------------------------

/**
 * Read the full A/B test state object for a given test name.
 *
 * @param testName - Experiment name
 * @returns The state object or `null` if not found
 */
export function readABTestState(
  testName: ABTestName,
): MatomoABTestState | null {
  if (typeof window === "undefined") return null;
  return window.__MATOMO_AB_TEST__?.[testName] ?? null;
}
