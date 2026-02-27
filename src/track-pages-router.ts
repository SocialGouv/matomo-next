import { default as Router } from "next/router";
import type { InitSettings } from "./types";
import { matchesAnyPattern, createSanitizer, cleanUrlPath } from "./utils";
import {
  push,
  loadMatomoScript,
  configureMatomoTracker,
  configureHeartBeatTimer,
} from "./tracker";
import { loadHeatmapSessionRecording } from "./heatmap";
import { initABTesting } from "./ab-testing";

/**
 * Track page views with Matomo for Next.js Pages Router
 * This function should be called in a useEffect hook that runs on mount.
 * It sets up tracking for route changes using Next.js Router events.
 */
export const trackPagesRouter = (settings: InitSettings): void => {
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
    debug = false,
    searchKeyword = "q",
    searchRoutes = ["/recherche", "/search"],
    enableHeatmapSessionRecording = false,
    enableHeartBeatTimer = false,
    heartBeatTimerInterval,
    heatmapConfig = {},
    cleanUrl = false,
    abTests,
  } = settings;

  if (!url) {
    if (debug) {
      console.warn("Matomo disabled, please provide matomo url");
    }
    return;
  }

  window._paq = window._paq ?? [];

  const sanitizer = createSanitizer(trustedPolicyName);

  let previousPath = "";

  // Order is important -_- so campaign are detected
  const excludedUrl =
    typeof window !== "undefined" &&
    matchesAnyPattern(window.location.pathname, excludeUrlsPatterns);

  if (onInitialization) {
    onInitialization();
  }

  // Auto-init A/B testing if abTests is provided
  if (abTests && abTests.length > 0) {
    const currentPathname =
      typeof window !== "undefined" ? window.location.pathname : "";
    initABTesting({
      enabled: true,
      pathname: currentPathname,
      excludeUrlsPatterns,
      tests: abTests,
    });
  }

  if (excludedUrl) {
    if (typeof window !== "undefined" && debug) {
      console.log(`matomo: exclude track ${window.location.pathname}`);
    }
  } else {
    push(["trackPageView"]);
  }

  configureMatomoTracker(url, siteId, phpTrackerFile, disableCookies);
  loadMatomoScript(url, jsTrackerFile, sanitizer, nonce, onScriptLoadingError);

  // Enable Heatmap & Session Recording if requested
  if (enableHeatmapSessionRecording) {
    loadHeatmapSessionRecording(
      url,
      heatmapConfig,
      nonce,
      onScriptLoadingError,
      debug,
    );
  }

  // Enable HeartBeat Timer if requested
  configureHeartBeatTimer(enableHeartBeatTimer, heartBeatTimerInterval);

  /**
   * For initial loading we use the location.pathname
   * as the first url visited.
   * Once user navigate across the site,
   * we rely on Router.pathname
   */
  previousPath = typeof window !== "undefined" ? window.location.pathname : "";

  const defaultOnRouteChangeStart = (path: string): void => {
    if (matchesAnyPattern(path, excludeUrlsPatterns)) return;

    // Check if current route is a search route
    const isSearchRoute = searchRoutes.some((route) => path.startsWith(route));

    // Clean URL if cleanUrl option is enabled, but keep query params for search routes
    // to preserve search parameters for trackSiteSearch
    const urlToTrack = cleanUrl && !isSearchRoute ? cleanUrlPath(path) : path;

    if (previousPath) {
      push(["setReferrerUrl", `${previousPath}`]);
    }
    push(["setCustomUrl", urlToTrack]);
    push(["deleteCustomVariables", "page"]);
    previousPath = urlToTrack;

    if (onRouteChangeStart) {
      onRouteChangeStart(path);
    }
  };

  Router.events.on("routeChangeStart", defaultOnRouteChangeStart);

  const defaultOnRouteChangeComplete = (path: string): void => {
    if (matchesAnyPattern(path, excludeUrlsPatterns)) {
      return;
    }

    // In order to ensure that the page title had been updated,
    // we delayed pushing the tracking to the next tick.
    setTimeout(() => {
      const queryValue = Router.query[searchKeyword];
      const searchQuery = typeof queryValue === "string" ? queryValue : "";
      push(["setDocumentTitle", document.title]);

      // Check if current route is a search route
      const isSearchRoute = searchRoutes.some((route) =>
        path.startsWith(route),
      );

      if (isSearchRoute) {
        push(["trackSiteSearch", searchQuery]);
      } else {
        push(["trackPageView"]);
      }
    }, 0);

    if (onRouteChangeComplete) {
      onRouteChangeComplete(path);
    }
  };

  Router.events.on("routeChangeComplete", defaultOnRouteChangeComplete);
};
