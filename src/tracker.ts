import type { PushArgs, HTMLTrustedScriptElement } from "./types";

/**
 * Push custom events to Matomo tracker
 */
export function push(args: PushArgs): void {
  if (!window._paq) {
    window._paq = [];
  }
  window._paq.push(args);
}

/**
 * Load the Matomo tracker script
 */
export const loadMatomoScript = (
  url: string,
  jsTrackerFile: string,
  sanitizer: any,
  nonce?: string,
  onScriptLoadingError?: () => void,
): void => {
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
};

/**
 * Configure basic Matomo settings
 */
export const configureMatomoTracker = (
  url: string,
  siteId: string,
  phpTrackerFile: string,
  disableCookies: boolean,
): void => {
  if (disableCookies) {
    push(["disableCookies"]);
  }

  push(["enableLinkTracking"]);
  push(["setTrackerUrl", `${url}/${phpTrackerFile}`]);
  push(["setSiteId", siteId]);
};

/**
 * Enable HeartBeat Timer if requested
 */
export const configureHeartBeatTimer = (
  enableHeartBeatTimer: boolean,
  heartBeatTimerInterval?: number,
): void => {
  if (enableHeartBeatTimer) {
    if (heartBeatTimerInterval !== undefined) {
      push(["enableHeartBeatTimer", heartBeatTimerInterval]);
    } else {
      push(["enableHeartBeatTimer"]);
    }
  }
};
