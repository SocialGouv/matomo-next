import type { InitSettings, MatomoState } from "./types";
import { initAppRouter } from "./init-app-router";
import { initPagesRouter } from "./init-pages-router";

// Export types for external use
export type { InitSettings, Dimensions, HeatmapConfig } from "./types";

// Export push function for custom event tracking
export { push } from "./tracker";

// Export sendEvent helper for type-safe event tracking
export { sendEvent } from "./events";

// Internal state for tracking initial page load in App Router
const state: MatomoState = {
  isInitialPageview: true,
  previousUrl: "",
  matomoInitialized: false,
};

/**
 * Initialize Matomo tracker
 * Supports both Next.js App Router and Pages Router
 *
 * @param settings - Configuration settings for Matomo
 *
 * App Router mode: Set isAppRouter to true and provide pathname (and optionally searchParams)
 * Pages Router mode: Set isAppRouter to false or omit it
 */
export function init(settings: InitSettings): void {
  const { url, isAppRouter, pathname } = settings;

  if (!url) {
    console.warn("Matomo disabled, please provide matomo url");
    return;
  }

  // App Router mode: when isAppRouter is true OR pathname is provided (backward compatibility)
  if (
    isAppRouter === true ||
    (isAppRouter === undefined && pathname !== undefined)
  ) {
    initAppRouter(settings, state);
    return;
  }

  // Pages Router mode: traditional initialization
  initPagesRouter(settings);
}

export default init;
