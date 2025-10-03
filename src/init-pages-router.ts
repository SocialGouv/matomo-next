import { default as Router } from "next/router";
import type { InitSettings } from "./types";
import { isExcludedUrl, createSanitizer, startsWith } from "./utils";
import {
  push,
  loadMatomoScript,
  configureMatomoTracker,
  configureHeartBeatTimer,
} from "./tracker";
import { loadHeatmapSessionRecording } from "./heatmap";

/**
 * Initialize Matomo for Next.js Pages Router
 * Uses Next.js Router events for page tracking
 */
export const initPagesRouter = (settings: InitSettings): void => {
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
    enableHeatmapSessionRecording = false,
    enableHeartBeatTimer = false,
    heartBeatTimerInterval,
    heatmapConfig = {},
  } = settings;

  window._paq = window._paq ?? [];

  const sanitizer = createSanitizer(trustedPolicyName);

  let previousPath = "";

  // Order is important -_- so campaign are detected
  const excludedUrl =
    typeof window !== "undefined" &&
    isExcludedUrl(window.location.pathname, excludeUrlsPatterns);

  if (onInitialization) {
    onInitialization();
  }

  if (excludedUrl) {
    if (typeof window !== "undefined" && logExcludedTracks) {
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
  previousPath = location.pathname;

  const defaultOnRouteChangeStart = (path: string): void => {
    if (isExcludedUrl(path, excludeUrlsPatterns)) return;

    // We use only the part of the url without the querystring to ensure piwik is happy
    // It seems that piwik doesn't track well page with querystring
    let [pathname] = path.split("?");
    pathname = pathname.replace(/#.*/, "");

    if (previousPath) {
      push(["setReferrerUrl", `${previousPath}`]);
    }
    push(["setCustomUrl", pathname]);
    push(["deleteCustomVariables", "page"]);
    previousPath = pathname;

    if (onRouteChangeStart) {
      onRouteChangeStart(path);
    }
  };

  Router.events.on("routeChangeStart", defaultOnRouteChangeStart);

  const defaultOnRouteChangeComplete = (path: string): void => {
    if (isExcludedUrl(path, excludeUrlsPatterns)) {
      return;
    }

    // In order to ensure that the page title had been updated,
    // we delayed pushing the tracking to the next tick.
    setTimeout(() => {
      const { q } = Router.query;
      push(["setDocumentTitle", document.title]);
      if (startsWith(path, "/recherche") || startsWith(path, "/search")) {
        push(["trackSiteSearch", q ?? ""]);
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
