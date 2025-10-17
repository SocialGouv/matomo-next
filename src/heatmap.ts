import type { HeatmapConfig } from "./types";
import { push } from "./tracker";

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
      push(["HeatmapSessionRecording::debug", "true"]);
    }

    // Configure keystrokes capture (disabled by default)
    const captureKeystrokes = config.captureKeystrokes ?? false;
    push([
      "HeatmapSessionRecording.setKeystrokes",
      captureKeystrokes.toString(),
    ]);

    if (debug) {
      console.log(`Keystrokes ${captureKeystrokes ? "enabled" : "disabled"}`);
    }

    // Configure visible content capture (full page by default)
    const captureVisibleOnly = config.captureVisibleContentOnly ?? false;
    push([
      "HeatmapSessionRecording.setCaptureVisibleContentOnly",
      captureVisibleOnly.toString(),
    ]);

    if (debug) {
      console.log(
        `Capture ${
          captureVisibleOnly ? "visible content only" : "full page"
        } enabled`,
      );
    }

    // Wait for page load before enabling
    const handleLoad = () => {
      if (debug) {
        console.log("Activating Matomo Heatmap & Session Recording");
      }
      push(["HeatmapSessionRecording::enable"]);
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
