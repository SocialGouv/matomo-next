import { default as Router } from "next/router";

const isExcludedUrl = (url: string, patterns: RegExp[]): boolean => {
  let excluded = false;
  patterns.forEach((pattern) => {
    if (pattern.exec(url)) {
      excluded = true;
    }
  });
  return excluded;
};

type InitSettings = {
  url: string;
  siteId: string;
  jsTrackerFile?: string;
  phpTrackerFile?: string;
  excludeUrlsPatterns?: RegExp[];
};
// initialize the tracker
export function init({
  url,
  siteId,
  jsTrackerFile = "matomo.js",
  phpTrackerFile = "matomo.php",
  excludeUrlsPatterns = [],
}: InitSettings): void {
  window._paq = window._paq || [];
  if (!url) {
    console.warn("Matomo disabled, please provide matomo url");
    return;
  }
  let previousPath = "";
  // order is important -_- so campaign are detected
  const excludedUrl =
    typeof window !== "undefined" &&
    isExcludedUrl(window.location.pathname, excludeUrlsPatterns);

  if (excludedUrl) {
    if (typeof window !== "undefined") {
      console.log(`matomo: exclude track ${window.location.pathname}`);
    }
  } else {
    push(["trackPageView"]);
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

  const scriptElement = document.createElement("script");
  const refElement = document.getElementsByTagName("script")[0];
  scriptElement.type = "text/javascript";
  scriptElement.async = true;
  scriptElement.defer = true;
  scriptElement.src = `${url}/${jsTrackerFile}`;
  refElement.parentNode.insertBefore(scriptElement, refElement);
  previousPath = location.pathname;

  Router.events.on("routeChangeComplete", (path: string): void => {
    const excludedUrl = isExcludedUrl(path, excludeUrlsPatterns);
    if (excludedUrl) {
      console.log(`matomo: exclude track ${path}`);
      return;
    }
    // We use only the part of the url without the querystring to ensure piwik is happy
    // It seems that piwik doesn't track well page with querystring
    const [pathname] = path.split("?");

    // In order to ensure that the page title had been updated,
    // we delayed pushing the tracking to the next tick.
    setTimeout(() => {
      const { q } = Router.query;
      if (previousPath) {
        push(["setReferrerUrl", `${previousPath}`]);
      }
      push(["setCustomUrl", pathname]);
      push(["setDocumentTitle", document.title]);
      push(["deleteCustomVariables", "page"]);
      push(["setGenerationTimeMs", 0]);
      if (/^\/recherche/.test(pathname) || /^\/search/.test(pathname)) {
        push(["trackSiteSearch", q]);
      } else {
        push(["trackPageView"]);
      }
      previousPath = pathname;
    }, 0);
  });
}

// to push custom events
export function push(args: (string | string[] | number | number[])[]): void {
  window._paq.push(args);
}

export default init;
