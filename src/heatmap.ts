import type { HeatmapConfig } from "./types";
import { push } from "./tracker";
import { safePush } from "./utils";

/**
 * Load and configure Heatmap & Session Recording plugin
 * @param url - Matomo instance URL
 * @param config - Heatmap configuration options
 * @param nonce - Optional nonce for CSP
 * @param onScriptLoadingError - Optional callback for script loading errors
 * @param debug - Enable debug logging
 */
export const loadHeatmapSessionRecording = (
  url: string,
  config: HeatmapConfig = {},
  nonce?: string,
  onScriptLoadingError?: () => void,
  debug = false,
): void => {
  const script = document.createElement("script");
  script.src = `${url}/plugins/HeatmapSessionRecording/tracker.min.js`;
  script.async = true;

  if (nonce) {
    script.setAttribute("nonce", nonce);
  }

  script.onload = () => {
    if (debug) {
      console.log("HeatmapSessionRecording tracker.min.js loaded");
      safePush(push, ["HeatmapSessionRecording::enableDebugMode"], debug);
    }

    // Configure keystrokes capture (disabled by default since v3.2.0)
    const captureKeystrokes = config.captureKeystrokes ?? false;
    if (!captureKeystrokes) {
      safePush(
        push,
        ["HeatmapSessionRecording::disableCaptureKeystrokes"],
        debug,
      );
      if (debug) {
        console.log("Keystrokes capture disabled");
      }
    } else if (debug) {
      console.log("Keystrokes capture enabled");
    }

    // Configure mouse/touch movement recording (enabled by default)
    const recordMovements = config.recordMovements ?? true;
    if (!recordMovements) {
      safePush(
        push,
        ["HeatmapSessionRecording::disableRecordMovements"],
        debug,
      );
      if (debug) {
        console.log("Mouse/touch movement recording disabled");
      }
    } else if (debug) {
      console.log("Mouse/touch movement recording enabled");
    }

    // Configure maximum capture time (default: 10 minutes)
    if (config.maxCaptureTime !== undefined) {
      safePush(
        push,
        ["HeatmapSessionRecording::setMaxCaptureTime", config.maxCaptureTime],
        debug,
      );
      if (debug) {
        console.log(`Max capture time set to ${config.maxCaptureTime} seconds`);
      }
    }

    // Disable automatic detection of new page views if requested
    if (config.disableAutoDetectNewPageView) {
      safePush(
        push,
        ["HeatmapSessionRecording::disableAutoDetectNewPageView"],
        debug,
      );
      if (debug) {
        console.log("Automatic page view detection disabled");
      }
    }

    // Set custom trigger function if provided
    if (config.trigger) {
      safePush(
        push,
        ["HeatmapSessionRecording::setTrigger", config.trigger],
        debug,
      );
      if (debug) {
        console.log("Custom trigger function configured");
      }
    }

    // Add manual configuration if provided
    if (config.addConfig) {
      safePush(
        push,
        ["HeatmapSessionRecording::addConfig", config.addConfig],
        debug,
      );
      if (debug) {
        console.log("Manual configuration added:", config.addConfig);
      }
    }

    // Wait for page load before enabling
    const handleLoad = () => {
      if (debug) {
        console.log("Activating Matomo Heatmap & Session Recording");
      }
      safePush(push, ["HeatmapSessionRecording::enable"], debug);
      if (debug) {
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
    if (debug) {
      console.error("Failed to load HeatmapSessionRecording tracker.min.js");
    }
    if (onScriptLoadingError) {
      onScriptLoadingError();
    }
  };

  document.head.appendChild(script);
};
