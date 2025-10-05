// Export types for external use
export type { InitSettings, Dimensions, HeatmapConfig } from "./types";

// Export push function for custom event tracking
export { push } from "./tracker";

// Export sendEvent helper for type-safe event tracking
export { sendEvent } from "./events";

// Export router-specific initialization functions
export { initAppRouter } from "./init-app-router";
export { initPagesRouter } from "./init-pages-router";
