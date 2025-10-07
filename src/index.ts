// Export types for external use
export type { InitSettings, Dimensions, HeatmapConfig } from "./types";

// Export push function for custom event tracking
export { push } from "./tracker";

// Export sendEvent helper for type-safe event tracking
export { sendEvent } from "./events";

// Export router-specific initialization functions
export { initAppRouter } from "./init-app-router";
export { initPagesRouter } from "./init-pages-router";

// Import for deprecated init function
import type { InitSettings } from "./types";
import { initAppRouter } from "./init-app-router";
import { initPagesRouter } from "./init-pages-router";

/**
 * @deprecated Use `initPagesRouter` for Pages Router or `initAppRouter` for App Router instead.
 * This function automatically detects the router type based on the provided settings.
 *
 * - For App Router: Use `initAppRouter` with `pathname` and optionally `searchParams`
 * - For Pages Router: Use `initPagesRouter` (no pathname/searchParams needed)
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
 * initPagesRouter({ url: 'https://matomo.example.com', siteId: '1' });
 * initAppRouter({ url: 'https://matomo.example.com', siteId: '1', pathname: '/page', searchParams });
 */
export const init = (settings: InitSettings): void => {
  // Emit deprecation warning
  if (settings.debug !== false) {
    console.warn(
      "matomo-next: The `init` function is deprecated. " +
        "Please use `initPagesRouter` for Pages Router or `initAppRouter` for App Router instead.",
    );
  }

  // Auto-detect router type based on settings
  // If pathname or searchParams is provided, assume App Router
  const isAppRouter =
    settings.pathname !== undefined || settings.searchParams !== undefined;

  if (isAppRouter) {
    initAppRouter(settings);
  } else {
    initPagesRouter(settings);
  }
};
