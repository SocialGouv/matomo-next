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
  nonce?: string;
  trustedPolicyName?: string;
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
  )[]
): void {
  if (!window._paq) {
    window._paq = [];
  }
  window._paq.push(args);
}

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
  nonce,
  trustedPolicyName = "matomo-next",
}: InitSettings): void {
  window._paq = window._paq !== null ? window._paq : [];
  if (!url) {
    console.warn("Matomo disabled, please provide matomo url");
    return;
  }

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
    if (typeof window !== "undefined") {
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
  if (refElement.parentNode) {
    refElement.parentNode.insertBefore(scriptElement, refElement);
  }
  previousPath = location.pathname;

  const defaultOnRouteChangeStart = (path: string): void => {
    if (isExcludedUrl(path, excludeUrlsPatterns)) return;

    // We use only the part of the url without the querystring to ensure piwik is happy
    // It seems that piwik doesn't track well page with querystring
    const [pathname] = path.split("?");

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
