/**
 * Matomo A/B Testing integration for @socialgouv/matomo-next
 *
 * Provides typed support for creating and managing A/B tests via
 * Matomo's AbTesting plugin (https://plugins.matomo.org/AbTesting).
 *
 * @module ab-testing
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Unique experiment name as configured in Matomo */
export type ABTestName = string;

/** Variant name (e.g. "original", "variant-a", "variant-b") */
export type ABTestVariant = string;

/** A single variation in an A/B test */
export interface ABTestVariation {
  /** Display name / identifier of this variation */
  name: ABTestVariant;
}

/** Full definition of a single A/B test experiment */
export interface ABTestDefinition {
  /** Matomo experiment name (must match Matomo dashboard) */
  name: ABTestName;
  /** Percentage of visitors included in the experiment (0–100) */
  percentage: number;
  /** Available variations (including control/"original") */
  variations: ABTestVariation[];
  /** ISO 8601 start date (optional scheduling) */
  startDateTime?: string;
  /** ISO 8601 end date (optional scheduling) */
  endDateTime?: string;
  /**
   * Custom participation trigger.
   * Return `true` to include the current visitor in the experiment.
   * Defaults to `() => true` (all visitors).
   */
  trigger?: () => boolean;
}

// ---------------------------------------------------------------------------
// Internal state stored on `window`
// ---------------------------------------------------------------------------

/** Runtime state for a single experiment */
export interface MatomoABTestState {
  abTest: ABTestName;
  variant: ABTestVariant | null;
  isReady: boolean;
}

declare global {
  interface Window {
    /**
     * Runtime store for activated Matomo A/B tests.
     * Keyed by test name to support multiple concurrent experiments.
     */
    __MATOMO_AB_TEST__?: Record<string, MatomoABTestState>;
  }
}

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/** Parameters accepted by {@link initABTesting} */
export interface InitABTestingParams {
  /** Master switch – when `false` the function is a no-op */
  enabled: boolean;
  /** Current page pathname (e.g. from Next.js `usePathname()`) */
  pathname: string;
  /** URL patterns to exclude from experiments */
  excludeUrlsPatterns?: RegExp[];
  /** List of experiments to register */
  tests: ABTestDefinition[];
}

/**
 * Register one or more Matomo A/B tests.
 *
 * Call this inside `onInitialization` of `trackAppRouter` / `trackPagesRouter`.
 *
 * @example
 * ```ts
 * trackAppRouter({
 *   url: MATOMO_URL,
 *   siteId: MATOMO_SITE_ID,
 *   pathname,
 *   searchParams,
 *   onInitialization: () => {
 *     initABTesting({
 *       enabled: true,
 *       pathname: pathname ?? "",
 *       tests: [
 *         {
 *           name: "homepage-hero",
 *           percentage: 100,
 *           variations: [{ name: "original" }, { name: "new-hero" }],
 *         },
 *       ],
 *     });
 *   },
 * });
 * ```
 */
export function initABTesting({
  enabled,
  pathname,
  excludeUrlsPatterns,
  tests,
}: InitABTestingParams): void {
  if (!enabled) return;

  // Grab the Matomo command queue
  if (typeof window === "undefined") return;
  const paq = window._paq;
  if (!paq) return;

  // Check URL exclusions
  if (
    !pathname ||
    (excludeUrlsPatterns &&
      excludeUrlsPatterns.length > 0 &&
      excludeUrlsPatterns.some((p) => p.test(pathname)))
  ) {
    return;
  }

  if (!tests || tests.length === 0) return;

  // Ensure global store
  window.__MATOMO_AB_TEST__ = window.__MATOMO_AB_TEST__ ?? {};

  for (const test of tests) {
    // Create placeholder entry so `useABTestVariant` can detect it immediately
    if (!window.__MATOMO_AB_TEST__[test.name]) {
      window.__MATOMO_AB_TEST__[test.name] = {
        abTest: test.name,
        variant: null,
        isReady: false,
      };
    }

    const onVariantActivated = (variant: ABTestVariant): void => {
      window.__MATOMO_AB_TEST__ = window.__MATOMO_AB_TEST__ ?? {};
      window.__MATOMO_AB_TEST__[test.name] = {
        abTest: test.name,
        variant,
        isReady: true,
      };
    };

    // Build the Matomo AbTesting::create config object
    const abTestConfig: Record<string, unknown> = {
      name: test.name,
      percentage: test.percentage,
      includedTargets: [
        { attribute: "url", inverted: "0", type: "any", value: "" },
      ],
      excludedTargets: [],
      variations: test.variations.map((v) => ({
        name: v.name,
        activate: () => {
          onVariantActivated(v.name);
        },
      })),
      trigger: test.trigger ?? (() => true),
    };

    if (test.startDateTime) abTestConfig.startDateTime = test.startDateTime;
    if (test.endDateTime) abTestConfig.endDateTime = test.endDateTime;

    paq.push(["AbTesting::create", abTestConfig]);
  }
}

/**
 * Read the current state of a specific A/B test.
 *
 * Useful outside of React (e.g. in server components or plain functions).
 * Inside React prefer `useABTestVariant()`.
 */
export function getABTestState(
  testName: ABTestName,
): MatomoABTestState | null {
  if (typeof window === "undefined") return null;
  return window.__MATOMO_AB_TEST__?.[testName] ?? null;
}
