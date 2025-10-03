import type { InitSettings, MatomoState } from "./types";
import { isExcludedUrl, createSanitizer, startsWith } from "./utils";
import {
  push,
  loadMatomoScript,
  configureMatomoTracker,
  configureHeartBeatTimer,
} from "./tracker";
import { loadHeatmapSessionRecording } from "./heatmap";

/**
 * Initialize Matomo for Next.js App Router
 * Uses pathname and searchParams from the component
 */
export const initAppRouter = (
  settings: InitSettings,
  state: MatomoState,
): void => {
  const {
    url,
    siteId,
    jsTrackerFile = "matomo.js",
    phpTrackerFile = "matomo.php",
    excludeUrlsPatterns = [],
    disableCookies = false,
    onRouteChangeStart,
    onRouteChangeComplete,
    onInitialization,
    onScriptLoadingError,
    nonce,
    trustedPolicyName = "matomo-next",
    logExcludedTracks = false,
    pathname = "",
    searchParams,
    searchKeyword = "q",
    searchRoutes = ["/recherche", "/search"],
    enableHeatmapSessionRecording = false,
    enableHeartBeatTimer = false,
    heartBeatTimerInterval,
    heatmapConfig = {},
  } = settings;

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

    configureMatomoTracker(url, siteId, phpTrackerFile, disableCookies);
    loadMatomoScript(
      url,
      jsTrackerFile,
      sanitizer,
      nonce,
      onScriptLoadingError,
    );

    // Enable Heatmap & Session Recording if requested
    if (enableHeatmapSessionRecording) {
      loadHeatmapSessionRecording(
        url,
        heatmapConfig,
        nonce,
        onScriptLoadingError,
      );
    }

    // Enable HeartBeat Timer if requested
    configureHeartBeatTimer(enableHeartBeatTimer, heartBeatTimerInterval);

    if (onInitialization) {
      onInitialization();
    }
  }

  // Track pageview with App Router logic
  const excludedUrl = isExcludedUrl(currentUrl, excludeUrlsPatterns);

  if (excludedUrl) {
    if (logExcludedTracks) {
      console.log(`matomo: exclude track ${currentUrl}`);
    }
    state.previousUrl = currentUrl;
    return;
  }

  if (state.isInitialPageview) {
    state.isInitialPageview = false;
    state.previousUrl = currentUrl;
    push(["trackPageView"]);
  } else if (currentUrl !== state.previousUrl) {
    // We use only the part of the url without the querystring to ensure piwik is happy
    // It seems that piwik doesn't track well page with querystring
    let cleanPathname = currentUrl.split("?")[0];
    cleanPathname = cleanPathname.replace(/#.*/, "");

    if (state.previousUrl) {
      push(["setReferrerUrl", state.previousUrl]);
    }
    push(["setCustomUrl", cleanPathname]);
    push(["deleteCustomVariables", "page"]);

    if (onRouteChangeStart) {
      onRouteChangeStart(currentUrl);
    }

    // In order to ensure that the page title had been updated,
    // we delayed pushing the tracking to the next tick.
    setTimeout(() => {
      push(["setDocumentTitle", document.title]);
      // Check if current route is a search route
      const isSearchRoute = searchRoutes.some((route) =>
        startsWith(currentUrl, route),
      );

      if (isSearchRoute) {
        // Extract search query from searchParams using configurable keyword
        const q = searchParams?.get(searchKeyword) || "";
        push(["trackSiteSearch", q]);
      } else {
        push(["trackPageView"]);
      }

      if (onRouteChangeComplete) {
        onRouteChangeComplete(currentUrl);
      }
    }, 0);

    state.previousUrl = currentUrl;
  }
};
