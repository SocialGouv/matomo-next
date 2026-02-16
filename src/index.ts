// Export types for external use
export type { InitSettings, HeatmapConfig } from "./types";

// Export push function for custom event tracking
export { push } from "./tracker";

// Export sendEvent helper for type-safe event tracking
export { sendEvent } from "./events";

// Export router-specific tracking functions
export { trackAppRouter } from "./track-app-router";
export { trackPagesRouter } from "./track-pages-router";

// Export deprecated function names for backwards compatibility
export { trackAppRouter as initAppRouter } from "./track-app-router";
export { trackPagesRouter as initPagesRouter } from "./track-pages-router";

// Export A/B testing
export {
  initABTesting,
  getABTestState,
} from "./ab-testing";
export type {
  ABTestName,
  ABTestVariant,
  ABTestVariation,
  ABTestDefinition,
  MatomoABTestState,
  InitABTestingParams,
} from "./ab-testing";

// Export A/B testing React hooks
export { useABTestVariant, useABTestVariantSync, readABTestState } from "./use-ab-test";

// Export server-side proxy utilities
export {
  withMatomoProxy,
  getProxyUrl,
  getProxyPath,
  generateProxyPath,
} from "./server-proxy";
export type { MatomoProxyOptions } from "./server-proxy";

// Import for deprecated init function
import type { InitSettings } from "./types";
import { trackAppRouter } from "./track-app-router";
import { trackPagesRouter } from "./track-pages-router";

/**
 * @deprecated Use `trackPagesRouter` (or `initPagesRouter` alias) for Pages Router or `trackAppRouter` (or `initAppRouter` alias) for App Router instead.
 * This function automatically detects the router type based on the provided settings.
 *
 * - For App Router: Use `trackAppRouter` with `pathname` and optionally `searchParams`
 * - For Pages Router: Use `trackPagesRouter` (no pathname/searchParams needed)
 *
 * @param settings - Matomo initialization settings
 *
 * @example
 * // Pages Router (deprecated usage)
 * init({ url: 'https://matomo.example.com', siteId: '1' });
 *
 * // App Router (deprecated usage)
 * init({ url: 'https://matomo.example.com', siteId: '1', pathname: '/page', searchParams });
 *
 * // Recommended: Use specific functions instead
 * trackPagesRouter({ url: 'https://matomo.example.com', siteId: '1' });
 * trackAppRouter({ url: 'https://matomo.example.com', siteId: '1', pathname: '/page', searchParams });
 */
export const init = (settings: InitSettings): void => {
  // Emit deprecation warning
  if (settings.debug !== false) {
    console.warn(
      "matomo-next: The `init` function is deprecated. " +
        "Please use `trackPagesRouter` for Pages Router or `trackAppRouter` for App Router instead.",
    );
  }

  // Auto-detect router type based on settings
  // If pathname or searchParams is provided, assume App Router
  const isAppRouter =
    settings.pathname !== undefined || settings.searchParams !== undefined;

  if (isAppRouter) {
    trackAppRouter(settings);
  } else {
    trackPagesRouter(settings);
  }
};
