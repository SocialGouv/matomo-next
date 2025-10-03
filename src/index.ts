import type { InitSettings, MatomoState } from "./types";
import { initAppRouter } from "./init-app-router";
import { initPagesRouter } from "./init-pages-router";

// Export types for external use
export type { InitSettings, Dimensions, HeatmapConfig } from "./types";

// Export push function for custom event tracking
export { push } from "./tracker";

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
 * App Router mode: Provide pathname (and optionally searchParams)
 * Pages Router mode: Do not provide pathname
 */
export function init(settings: InitSettings): void {
  const { url, pathname } = settings;

  if (!url) {
    console.warn("Matomo disabled, please provide matomo url");
    return;
  }

  // App Router mode: when pathname is provided
  if (pathname !== undefined) {
    initAppRouter(settings, state);
    return;
  }

  // Pages Router mode: traditional initialization
  initPagesRouter(settings);
}

export default init;
