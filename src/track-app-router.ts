import type { InitSettings, MatomoState } from "./types";
import { matchesAnyPattern, createSanitizer, cleanUrlPath } from "./utils";
import { getProxyPath, getProxyUrl } from "./server-proxy";
import {
  push,
  loadMatomoScript,
  configureMatomoTracker,
  configureHeartBeatTimer,
} from "./tracker";
import { loadHeatmapSessionRecording } from "./heatmap";
import { initABTesting } from "./ab-testing";

// Internal state for tracking initial page load in App Router
const state: MatomoState = {
  isInitialPageview: true,
  previousUrl: "",
  matomoInitialized: false,
};

/**
 * Track page views with Matomo for Next.js App Router
 * This function should be called in a useEffect hook with pathname and searchParams as dependencies.
 * It will automatically track route changes when these values change.
 */
export const trackAppRouter = (settings: InitSettings): void => {
  const {
    url,
    useProxy = true,
    siteId,
    jsTrackerFile,
    phpTrackerFile,
    excludeUrlsPatterns = [],
    disableCookies = false,
    onRouteChangeStart,
    onRouteChangeComplete,
    onInitialization,
    onScriptLoadingError,
    nonce,
    trustedPolicyName = "matomo-next",
    debug = false,
    pathname = "",
    searchParams,
    searchKeyword = "q",
    searchRoutes = ["/recherche", "/search"],
    enableHeatmapSessionRecording = false,
    enableHeartBeatTimer = false,
    heartBeatTimerInterval,
    heatmapConfig = {},
    cleanUrl = false,
    abTests,
  } = settings;

  // Prefer the proxy *path* (relative URL) so we don't have to embed the current
  // domain anywhere — the browser will resolve it against the current origin.
  const proxyBaseUrl = useProxy ? getProxyPath() ?? getProxyUrl() : null;
  const resolvedUrl = proxyBaseUrl ?? url;

  const resolvedJsTrackerFile =
    jsTrackerFile ??
    (useProxy
      ? process.env.NEXT_PUBLIC_MATOMO_PROXY_JS_TRACKER_FILE
      : undefined) ??
    "matomo.js";
  const resolvedPhpTrackerFile =
    phpTrackerFile ??
    (useProxy
      ? process.env.NEXT_PUBLIC_MATOMO_PROXY_PHP_TRACKER_FILE
      : undefined) ??
    "matomo.php";

  if (!resolvedUrl) {
    if (debug) {
      console.warn(
        "Matomo disabled, please provide `url` or configure the server-side proxy via withMatomoProxy().",
      );
    }
    return;
  }

  window._paq = window._paq ?? [];

  // Convert searchParams to string
  const searchParamsString = searchParams?.toString() || "";

  // Build full URL with search params
  const currentUrl = searchParamsString
    ? `${pathname}?${searchParamsString}`
    : pathname;

  // Initialize Matomo script on first call
  if (!state.matomoInitialized) {
    state.matomoInitialized = true;

    const sanitizer = createSanitizer(trustedPolicyName);

    configureMatomoTracker(
      resolvedUrl,
      siteId,
      resolvedPhpTrackerFile,
      disableCookies,
    );
    loadMatomoScript(
      resolvedUrl,
      resolvedJsTrackerFile,
      sanitizer,
      nonce,
      onScriptLoadingError,
    );

    // Enable Heatmap & Session Recording if requested
    if (enableHeatmapSessionRecording) {
      loadHeatmapSessionRecording(
        resolvedUrl,
        heatmapConfig,
        nonce,
        onScriptLoadingError,
        debug,
      );
    }

    // Enable HeartBeat Timer if requested
    configureHeartBeatTimer(enableHeartBeatTimer, heartBeatTimerInterval);

    if (onInitialization) {
      onInitialization();
    }

    // Auto-init A/B testing if abTests is provided
    if (abTests && abTests.length > 0) {
      initABTesting({
        enabled: true,
        pathname: pathname,
        excludeUrlsPatterns,
        tests: abTests,
      });
    }
  }

  // Track pageview with App Router logic
  const excludedUrl = matchesAnyPattern(currentUrl, excludeUrlsPatterns);

  if (excludedUrl) {
    if (debug) {
      console.log(`matomo: exclude track ${currentUrl}`);
    }
    state.previousUrl = currentUrl;
    return;
  }

  // Helper function to track page or search
  const trackPageOrSearch = (): void => {
    // Check if current route is a search route
    const isSearchRoute = searchRoutes.some((route) =>
      currentUrl.startsWith(route),
    );

    push(["setDocumentTitle", document.title]);

    if (isSearchRoute) {
      // Extract search query from searchParams using configurable keyword
      const q = searchParams?.get(searchKeyword) || "";
      push(["trackSiteSearch", q]);
    } else {
      push(["trackPageView"]);
    }
  };

  if (state.isInitialPageview) {
    state.isInitialPageview = false;
    state.previousUrl = currentUrl;
    trackPageOrSearch();
  } else if (currentUrl !== state.previousUrl) {
    // Check if current route is a search route
    const isSearchRoute = searchRoutes.some((route) =>
      currentUrl.startsWith(route),
    );

    // Clean URL if cleanUrl option is enabled, but keep query params for search routes
    // to preserve search parameters for trackSiteSearch
    const urlToTrack =
      cleanUrl && !isSearchRoute ? cleanUrlPath(currentUrl) : currentUrl;

    if (state.previousUrl) {
      const isPreviousSearchRoute = searchRoutes.some((route) =>
        state.previousUrl.startsWith(route),
      );
      push([
        "setReferrerUrl",
        cleanUrl && !isPreviousSearchRoute
          ? cleanUrlPath(state.previousUrl)
          : state.previousUrl,
      ]);
    }
    push(["setCustomUrl", urlToTrack]);
    push(["deleteCustomVariables", "page"]);

    if (onRouteChangeStart) {
      onRouteChangeStart(currentUrl);
    }

    // In order to ensure that the page title had been updated,
    // we delayed pushing the tracking to the next tick.
    setTimeout(() => {
      trackPageOrSearch();

      if (onRouteChangeComplete) {
        onRouteChangeComplete(currentUrl);
      }
    }, 0);

    state.previousUrl = currentUrl;
  }
};
