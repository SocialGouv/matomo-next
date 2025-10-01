import { default as Router } from "next/router";

interface HTMLTrustedScriptElement extends Omit<HTMLScriptElement, "src"> {
  src: TrustedScriptURL | string;
}

const isExcludedUrl = (url: string, patterns: RegExp[]): boolean => {
  let excluded = false;
  patterns.forEach((pattern) => {
    if (pattern.exec(url) !== null) {
      excluded = true;
    }
  });
  return excluded;
};

interface InitSettings {
  url: string;
  siteId: string;
  jsTrackerFile?: string;
  phpTrackerFile?: string;
  excludeUrlsPatterns?: RegExp[];
  disableCookies?: boolean;
  onRouteChangeStart?: (path: string) => void;
  onRouteChangeComplete?: (path: string) => void;
  onInitialization?: () => void;
  onScriptLoadingError?: () => void;
  nonce?: string;
  trustedPolicyName?: string;
  logExcludedTracks?: boolean;
  pathname?: string;
  enableHeatmapSessionRecording?: boolean;
  enableHeartBeatTimer?: boolean;
  heartBeatTimerInterval?: number;
  heatmapConfig?: {
    captureKeystrokes?: boolean;
    captureVisibleContentOnly?: boolean;
    debug?: boolean;
  };
}

interface Dimensions {
  dimension1?: string;
  dimension2?: string;
  dimension3?: string;
  dimension4?: string;
  dimension5?: string;
  dimension6?: string;
  dimension7?: string;
  dimension8?: string;
  dimension9?: string;
  dimension10?: string;
}

// to push custom events
export function push(
  args: (
    | Dimensions
    | number[]
    | string[]
    | number
    | string
    | null
    | undefined
  )[],
): void {
  if (!window._paq) {
    window._paq = [];
  }
  window._paq.push(args);
}

// Internal state for tracking initial page load in App Router
let isInitialPageview = true;
let previousPathname = "";
let matomoInitialized = false;
let matomoConfig: Partial<InitSettings> = {};

/**
 * Load and configure Heatmap & Session Recording plugin
 * @param url - Matomo instance URL
 * @param config - Heatmap configuration options
 * @param nonce - Optional nonce for CSP
 * @param onScriptLoadingError - Optional callback for script loading errors
 */
const loadHeatmapSessionRecording = (
  url: string,
  config: {
    captureKeystrokes?: boolean;
    captureVisibleContentOnly?: boolean;
    debug?: boolean;
  } = {},
  nonce?: string,
  onScriptLoadingError?: () => void,
): void => {
  const script = document.createElement("script");
  script.src = `${url}/plugins/HeatmapSessionRecording/tracker.min.js`;
  script.async = true;

  if (nonce) {
    script.setAttribute("nonce", nonce);
  }

  script.onload = () => {
    if (config.debug) {
      console.log("HeatmapSessionRecording tracker.min.js loaded");
      push(["HeatmapSessionRecording::debug", "true"]);
    }

    // Configure keystrokes capture (disabled by default)
    const captureKeystrokes = config.captureKeystrokes ?? false;
    push([
      "HeatmapSessionRecording.setKeystrokes",
      captureKeystrokes.toString(),
    ]);

    if (config.debug) {
      console.log(`Keystrokes ${captureKeystrokes ? "enabled" : "disabled"}`);
    }

    // Configure visible content capture (full page by default)
    const captureVisibleOnly = config.captureVisibleContentOnly ?? false;
    push([
      "HeatmapSessionRecording.setCaptureVisibleContentOnly",
      captureVisibleOnly.toString(),
    ]);

    if (config.debug) {
      console.log(
        `Capture ${
          captureVisibleOnly ? "visible content only" : "full page"
        } enabled`,
      );
    }

    // Wait for page load before enabling
    const handleLoad = () => {
      if (config.debug) {
        console.log("Activating Matomo Heatmap & Session Recording");
      }
      push(["HeatmapSessionRecording::enable"]);
      if (config.debug) {
        console.log(
          "HeatmapSessionRecording enabled at",
          new Date().toISOString(),
        );
      }
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }
  };

  script.onerror = () => {
    console.error("Failed to load HeatmapSessionRecording tracker.min.js");
    if (onScriptLoadingError) {
      onScriptLoadingError();
    }
  };

  document.head.appendChild(script);
};

const startsWith = (str: string, needle: string) => {
  // eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
  return str.substring(0, needle.length) === needle;
};

const trustedPolicyHooks: TrustedTypePolicyOptions = {
  createScript: (s) => s,
  createScriptURL: (s) => s,
};

// initialize the tracker
export function init({
  url,
  siteId,
  jsTrackerFile = "matomo.js",
  phpTrackerFile = "matomo.php",
  excludeUrlsPatterns = [],
  disableCookies = false,
  onRouteChangeStart = undefined,
  onRouteChangeComplete = undefined,
  onInitialization = undefined,
  onScriptLoadingError = undefined,
  nonce,
  trustedPolicyName = "matomo-next",
  logExcludedTracks = false,
  pathname = undefined,
  enableHeatmapSessionRecording = false,
  enableHeartBeatTimer = false,
  heartBeatTimerInterval = undefined,
  heatmapConfig = {},
}: InitSettings): void {
  window._paq = window._paq !== null ? window._paq : [];
  if (!url) {
    console.warn("Matomo disabled, please provide matomo url");
    return;
  }

  // App Router mode: when pathname is provided
  if (pathname !== undefined) {
    // Initialize Matomo script on first call
    if (!matomoInitialized) {
      matomoInitialized = true;
      matomoConfig = {
        url,
        siteId,
        jsTrackerFile,
        phpTrackerFile,
        excludeUrlsPatterns,
        disableCookies,
        nonce,
        trustedPolicyName,
      };

      const sanitizer =
        window.trustedTypes?.createPolicy(
          trustedPolicyName,
          trustedPolicyHooks,
        ) ?? trustedPolicyHooks;

      if (disableCookies) {
        push(["disableCookies"]);
      }

      push(["enableLinkTracking"]);
      push(["setTrackerUrl", `${url}/${phpTrackerFile}`]);
      push(["setSiteId", siteId]);

      const scriptElement: HTMLTrustedScriptElement =
        document.createElement("script");
      const refElement = document.getElementsByTagName("script")[0];
      if (nonce) {
        scriptElement.setAttribute("nonce", nonce);
      }
      scriptElement.type = "text/javascript";
      scriptElement.async = true;
      scriptElement.defer = true;
      const fullUrl = `${url}/${jsTrackerFile}`;
      scriptElement.src = sanitizer.createScriptURL?.(fullUrl) ?? fullUrl;
      if (onScriptLoadingError) {
        scriptElement.onerror = () => {
          onScriptLoadingError();
        };
      }
      if (refElement.parentNode) {
        refElement.parentNode.insertBefore(scriptElement, refElement);
      }

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
      if (enableHeartBeatTimer) {
        if (heartBeatTimerInterval !== undefined) {
          push(["enableHeartBeatTimer", heartBeatTimerInterval]);
        } else {
          push(["enableHeartBeatTimer"]);
        }
      }

      if (onInitialization) onInitialization();
    }

    // Track pageview with App Router logic
    if (isInitialPageview) {
      isInitialPageview = false;
      previousPathname = pathname;
      push(["trackPageView"]);
    } else if (pathname !== previousPathname) {
      previousPathname = pathname;
      push(["setCustomUrl", pathname]);
      push(["trackPageView"]);
    }
    return;
  }

  // Pages Router mode: traditional initialization
  const sanitizer =
    window.trustedTypes?.createPolicy(trustedPolicyName, trustedPolicyHooks) ??
    trustedPolicyHooks;

  let previousPath = "";
  // order is important -_- so campaign are detected
  const excludedUrl =
    typeof window !== "undefined" &&
    isExcludedUrl(window.location.pathname, excludeUrlsPatterns);

  if (onInitialization) onInitialization();

  if (excludedUrl) {
    if (typeof window !== "undefined" && logExcludedTracks) {
      console.log(`matomo: exclude track ${window.location.pathname}`);
    }
  } else {
    push(["trackPageView"]);
  }

  if (disableCookies) {
    push(["disableCookies"]);
  }

  push(["enableLinkTracking"]);
  push(["setTrackerUrl", `${url}/${phpTrackerFile}`]);
  push(["setSiteId", siteId]);

  /**
   * for initial loading we use the location.pathname
   * as the first url visited.
   * Once user navigate across the site,
   * we rely on Router.pathname
   */

  const scriptElement: HTMLTrustedScriptElement =
    document.createElement("script");
  const refElement = document.getElementsByTagName("script")[0];
  if (nonce) {
    scriptElement.setAttribute("nonce", nonce);
  }
  scriptElement.type = "text/javascript";
  scriptElement.async = true;
  scriptElement.defer = true;
  const fullUrl = `${url}/${jsTrackerFile}`;
  scriptElement.src = sanitizer.createScriptURL?.(fullUrl) ?? fullUrl;
  if (onScriptLoadingError) {
    scriptElement.onerror = () => {
      onScriptLoadingError();
    };
  }
  if (refElement.parentNode) {
    refElement.parentNode.insertBefore(scriptElement, refElement);
  }

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
  if (enableHeartBeatTimer) {
    if (heartBeatTimerInterval !== undefined) {
      push(["enableHeartBeatTimer", heartBeatTimerInterval]);
    } else {
      push(["enableHeartBeatTimer"]);
    }
  }

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

    if (onRouteChangeStart) onRouteChangeStart(path);
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

    if (onRouteChangeComplete) onRouteChangeComplete(path);
  };

  Router.events.on("routeChangeComplete", defaultOnRouteChangeComplete);
}

export default init;
